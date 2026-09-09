-- Additive migration for the verified Akantackle project only.
begin;
alter table akantackle.categories add column parent_slug text references akantackle.categories(slug) on delete restrict;
alter table akantackle.hero_images add column layout jsonb;
create unique index hero_one_logo on akantackle.hero_images(kind) where kind = 'logo';
create index categories_parent on akantackle.categories(parent_slug);
create index products_catalog_order on akantackle.products(category, sort_order, created_at desc, id);

create function akantackle.validate_catalog_parent() returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if new.parent_slug is not null then
    if new.parent_slug = new.slug or not exists(select 1 from akantackle.categories where slug = new.parent_slug and parent_slug is null) then
      raise exception 'Choose a main catalog as the parent';
    end if;
    if exists(select 1 from akantackle.categories where parent_slug = new.slug) then
      raise exception 'A catalog with children must remain a main catalog';
    end if;
  end if;
  return new;
end $$;
create trigger validate_catalog_parent before insert or update on akantackle.categories for each row execute function akantackle.validate_catalog_parent();

-- Normalize image ownership while retaining image_url as the legacy cover field.
create table akantackle.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references akantackle.products(id) on delete cascade,
  image_url text not null,
  sort_order integer not null check (sort_order between 0 and 9),
  unique(product_id, sort_order)
);
alter table akantackle.product_images enable row level security;
grant select on akantackle.product_images to anon;
grant select, insert, update, delete on akantackle.product_images to authenticated;
create policy product_images_public_read on akantackle.product_images for select to anon, authenticated using (
  exists(select 1 from akantackle.products p where p.id = product_id and p.review_status = 'approved' and p.status in ('active', 'out_of_stock') and p.category is not null)
);
create policy product_images_admin_all on akantackle.product_images for all to authenticated
using (exists(select 1 from akantackle.admins where user_id = (select auth.uid())))
with check (exists(select 1 from akantackle.admins where user_id = (select auth.uid())));
insert into akantackle.product_images(product_id, image_url, sort_order)
select id, image_url, 0 from akantackle.products where image_url is not null;
create function akantackle.sync_cover_image() returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if new.image_url is not null then
    insert into akantackle.product_images(product_id, image_url, sort_order) values(new.id, new.image_url, 0)
    on conflict(product_id, sort_order) do update set image_url = excluded.image_url;
  else
    delete from akantackle.product_images where product_id = new.id and sort_order = 0;
  end if;
  return new;
end $$;
create trigger sync_cover_image after insert or update of image_url on akantackle.products for each row execute function akantackle.sync_cover_image();

create function akantackle.catalog_counts() returns table(category text, total bigint)
language sql stable security invoker set search_path = '' as $$
  select p.category, count(*) from akantackle.products p
  where p.review_status = 'approved' and p.status in ('active', 'out_of_stock') and p.category is not null group by p.category;
$$;

-- One transaction serializes ordering within a main catalog, including its children.
create function akantackle.move_product(p_id uuid, p_before uuid, p_catalog text, p_after boolean default false) returns void
language plpgsql security invoker set search_path = '' as $$
declare root_slug text; scope_slugs text[]; ids uuid[]; position integer;
begin
  if not exists(select 1 from akantackle.admins where user_id = (select auth.uid())) then raise exception 'Admin access required'; end if;
  select coalesce(parent_slug, slug) into root_slug from akantackle.categories where slug = p_catalog;
  if root_slug is null then raise exception 'Select a catalog first'; end if;
  perform pg_advisory_xact_lock(hashtext('akantackle-order-' || root_slug));
  select array_agg(slug) into scope_slugs from akantackle.categories where slug = p_catalog or parent_slug = p_catalog;
  if not exists(select 1 from akantackle.products where id = p_id and category = any(scope_slugs)) or
    (p_before is not null and not exists(select 1 from akantackle.products where id = p_before and category = any(scope_slugs))) then
    raise exception 'Both products must belong to the selected catalog';
  end if;
  if p_id = p_before then return; end if;
  select array_agg(p.id order by p.sort_order, p.created_at desc, p.id) into ids from akantackle.products p
  where p.category in (select slug from akantackle.categories where slug = root_slug or parent_slug = root_slug) and p.id <> p_id;
  ids := coalesce(ids, '{}'::uuid[]);
  position := array_position(ids, p_before);
  if p_after and position is not null then position := position + 1; end if;
  if position > coalesce(array_length(ids,1),0) then position := null; end if;
  if position is null then ids := array_append(ids, p_id);
  else ids := ids[1:position-1] || array[p_id] || ids[position:array_length(ids,1)]; end if;
  update akantackle.products p set sort_order = ordered.rank::integer * 100, updated_at = now()
  from unnest(ids) with ordinality ordered(id, rank) where p.id = ordered.id;
end $$;
revoke all on function akantackle.validate_catalog_parent(), akantackle.sync_cover_image(), akantackle.move_product(uuid, uuid, text, boolean), akantackle.catalog_counts() from public, anon, authenticated;
grant execute on function akantackle.move_product(uuid, uuid, text, boolean) to authenticated;
grant execute on function akantackle.catalog_counts() to anon, authenticated;
notify pgrst, 'reload schema';
commit;
