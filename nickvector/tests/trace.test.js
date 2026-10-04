import test from 'node:test'
import assert from 'node:assert/strict'
import { traceImage, makeSvg, preparePixels, DEFAULTS } from '../src/trace.js'

function fixture() {
  const data = new Uint8ClampedArray(32 * 32 * 4)
  for (let row = 0; row < 32; row++) {
    for (let column = 0; column < 32; column++) {
      const offset = (row * 32 + column) * 4
      const inside = row > 3 && row < 28 && column > 3 && column < 28
      data.set(inside ? (column < 16 ? [200, 30, 40, 255] : [20, 20, 20, 255]) : [255, 255, 255, 255], offset)
    }
  }
  return { width: 32, height: 32, data }
}

test('color tracing produces editable paths and named groups, not a bitmap', () => {
  const result = traceImage(fixture(), { colors: 3, removeWhite: true })
  assert.equal(result.groups.length, 2)
  assert.ok(result.pathCount >= 2)
  const svg = makeSvg([{ name: 'Ink & <red>', result }], 32, 32, 100)
  assert.match(svg, /<path /)
  assert.match(svg, /Ink &amp; &lt;red&gt;/)
  assert.match(svg, /width="100mm" height="100mm"/)
  assert.doesNotMatch(svg, /<image|data:image/)
})

test('stencil threshold omits light pixels and emits only black ink', () => {
  const result = traceImage(fixture(), { mode: 'stencil', threshold: 60 })
  assert.equal(result.groups.length, 1)
  assert.equal(result.groups[0].color, '#000000')
})

test('transparent pixels stay empty and tracing is deterministic', () => {
  const image = fixture()
  image.data.fill(0, 0, 32 * 4)
  const prepared = preparePixels(image, DEFAULTS)
  assert.equal(prepared.data[3], 0)
  assert.deepEqual(traceImage(image), traceImage(image))
})

test('empty artwork produces no paths and white removal is optional', () => {
  const image = { width: 16, height: 16, data: new Uint8ClampedArray(16 * 16 * 4).fill(255) }
  assert.equal(traceImage(image, { removeWhite: true }).pathCount, 0)
  assert.ok(traceImage(image).pathCount > 0)
})