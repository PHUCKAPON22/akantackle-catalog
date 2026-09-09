-- Reviewed snapshot of the recovery schema already present on 2026-09-09.
-- For fresh Akantackle projects only. Mark this baseline applied when adopting CLI migrations on the existing project.
begin;
create schema akantackle;
grant usage on schema akantackle to anon, authenticated;
create table akantackle.admins(user_id uuid primary key references auth.users(id) on delete cascade);
create table akantackle.categories(slug text primary key, name_th text not null, name_en text not null, sort_order integer not null default 0);
create table akantackle.products(
 id uuid primary key default gen_random_uuid(), name text not null,
 category text references akantackle.categories(slug) on delete restrict, image_url text,
 sort_order integer not null default 0,
 review_status text not null default 'pending' check(review_status in ('pending','approved')),
 status text not null default 'active' check(status in ('active','out_of_stock','discontinued','hidden')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table akantackle.hero_images(id uuid primary key default gen_random_uuid(), image_url text not null, kind text not null check(kind in ('logo','floating')), sort_order integer not null default 0, created_at timestamptz not null default now());
create index on akantackle.products(category);
create index on akantackle.products(sort_order,created_at desc);
alter table akantackle.admins enable row level security;
alter table akantackle.categories enable row level security;
alter table akantackle.products enable row level security;
alter table akantackle.hero_images enable row level security;
grant select on akantackle.categories,akantackle.products,akantackle.hero_images to anon;
grant select,insert,update,delete on akantackle.categories,akantackle.products,akantackle.hero_images to authenticated;
grant select on akantackle.admins to authenticated;
create policy admins_read_self on akantackle.admins for select to authenticated using(user_id = (select auth.uid()));
create policy categories_public_read on akantackle.categories for select to anon,authenticated using(true);
create policy hero_public_read on akantackle.hero_images for select to anon,authenticated using(true);
create policy products_public_read on akantackle.products for select to anon,authenticated using(review_status='approved' and status in ('active','out_of_stock') and category is not null);
create policy categories_admin_all on akantackle.categories for all to authenticated using(exists(select 1 from akantackle.admins where user_id=(select auth.uid()))) with check(exists(select 1 from akantackle.admins where user_id=(select auth.uid())));
create policy products_admin_all on akantackle.products for all to authenticated using(exists(select 1 from akantackle.admins where user_id=(select auth.uid()))) with check(exists(select 1 from akantackle.admins where user_id=(select auth.uid())));
create policy hero_admin_all on akantackle.hero_images for all to authenticated using(exists(select 1 from akantackle.admins where user_id=(select auth.uid()))) with check(exists(select 1 from akantackle.admins where user_id=(select auth.uid())));
insert into akantackle.categories values ('rods','Rods','Rods',1),('reels','Reels','Reels',2),('lures','Lures','Lures',3),('fishing-line','Fishing Line','Fishing Line',4),('accessories','Accessories','Accessories',5);
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('akantackle-products','akantackle-products',true,20971520,array['image/jpeg','image/png','image/webp','image/heic','image/heif']);
create policy akantackle_storage_admin on storage.objects for all to authenticated using(bucket_id='akantackle-products' and exists(select 1 from akantackle.admins where user_id=(select auth.uid()))) with check(bucket_id='akantackle-products' and exists(select 1 from akantackle.admins where user_id=(select auth.uid())));
commit;
-- Configure Data API to expose akantackle separately; never disable RLS or grant broad role access.
