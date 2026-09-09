import test from 'node:test'
import assert from 'node:assert/strict'
import { catalogScope, catalogLabel, DEFAULT_LOGO, logoGeometry } from '../src/lib/catalog.ts'
const categories = [
  { slug: 'rods', name_en: 'Rods', name_th: 'Rods', sort_order: 1, parent_slug: null },
  { slug: 'spinning', name_en: 'Spinning', name_th: 'Spinning', sort_order: 2, parent_slug: 'rods' },
  { slug: 'reels', name_en: 'Reels', name_th: 'Reels', sort_order: 3, parent_slug: null },
]
test('main catalog includes children without leaking unrelated catalogs', () => {
  assert.deepEqual(catalogScope(categories, 'rods'), ['rods', 'spinning'])
  assert.deepEqual(catalogScope(categories, 'spinning'), ['spinning'])
  assert.deepEqual(catalogScope(categories, 'all'), [])
  assert.equal(catalogLabel(categories, 'spinning'), 'Rods / Spinning')
})
test('any logo aspect ratio fits without clipping at default zoom', () => {
  for (const [width, height] of [[10000, 1], [1, 10000], [400, 400], [900, 300]]) {
    const value = logoGeometry({ ...DEFAULT_LOGO, width, height })
    assert.equal(value.overflow, false)
    assert.ok(value.width <= 1 && value.height <= 1)
  }
})
test('logo overflow indicator detects zoom and position clipping', () => {
  assert.equal(logoGeometry({ ...DEFAULT_LOGO, scale: 1.1 }).overflow, true)
  assert.equal(logoGeometry({ ...DEFAULT_LOGO, x: 1 }).overflow, true)
  assert.equal(logoGeometry({ ...DEFAULT_LOGO, scale: 0.5, x: 20 }).overflow, false)
  assert.equal(logoGeometry({ ...DEFAULT_LOGO, scale: 0.5, x: 30 }).overflow, true)
})
