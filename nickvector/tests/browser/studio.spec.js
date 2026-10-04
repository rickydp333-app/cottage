import { test, expect } from '@playwright/test'
import { readFile } from 'node:fs/promises'

test.beforeEach(async ({ page }) => {
  await page.goto(process.env.NICKVECTOR_URL || '/')
  await expect(page.locator('#export')).toBeEnabled()
})

async function fixture(page, color = '#d04035', size = 160) {
  const data = await page.evaluate(({ color, size }) => {
    const canvas = document.createElement('canvas')
    canvas.width = size; canvas.height = 200
    const context = canvas.getContext('2d')
    context.fillStyle = color
    context.fillRect(30, 30, 90, 140)
    context.clearRect(55, 65, 35, 60)
    return canvas.toDataURL().split(',')[1]
  }, { color, size })
  return Buffer.from(data, 'base64')
}

test('sample renders real ink and vector pixels without layout overflow', async ({ page }, testInfo) => {
  const metrics = await page.evaluate(async () => {
    const source = document.querySelector('#source-canvas')
    const sourceData = source.getContext('2d').getImageData(0, 0, source.width, source.height).data
    let sourceInk = 0
    for (let offset = 0; offset < sourceData.length; offset += 4) if (Math.min(sourceData[offset], sourceData[offset + 1], sourceData[offset + 2]) < 220) sourceInk++
    const svg = document.querySelector('#vector-art svg')
    const image = new Image()
    image.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(svg))
    await image.decode()
    const canvas = document.createElement('canvas')
    canvas.width = source.width; canvas.height = source.height
    const context = canvas.getContext('2d')
    context.fillStyle = '#fff'; context.fillRect(0, 0, canvas.width, canvas.height)
    context.drawImage(image, 0, 0, canvas.width, canvas.height)
    const vectorData = context.getImageData(0, 0, canvas.width, canvas.height).data
    let vectorInk = 0
    for (let offset = 0; offset < vectorData.length; offset += 4) if (Math.min(vectorData[offset], vectorData[offset + 1], vectorData[offset + 2]) < 220) vectorInk++
    const viewport = document.querySelector('#source-viewport').getBoundingClientRect()
    const artwork = source.getBoundingClientRect()
    return { sourceInk: sourceInk / (source.width * source.height), vectorInk: vectorInk / (source.width * source.height), overflow: document.documentElement.scrollWidth > innerWidth, paths: svg.querySelectorAll('path').length, framed: artwork.top >= viewport.top - 1 && artwork.bottom <= viewport.bottom + 1 && artwork.left >= viewport.left - 1 && artwork.right <= viewport.right + 1 }
  })
  expect(metrics.sourceInk).toBeGreaterThan(0.08)
  expect(metrics.vectorInk).toBeGreaterThan(0.08)
  expect(Math.abs(metrics.sourceInk - metrics.vectorInk)).toBeLessThan(0.04)
  expect(metrics.paths).toBeGreaterThan(20)
  expect(metrics.overflow).toBe(false)
  expect(metrics.framed).toBe(true)
  await page.screenshot({ path: testInfo.outputPath('workspace.png'), fullPage: true })
})

test('imports named layers and downloads a valid editable SVG', async ({ page }) => {
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  const image = await fixture(page)
  await page.locator('#file-input').setInputFiles([
    { name: 'Outline & detail.png', mimeType: 'image/png', buffer: image },
    { name: 'Color.png', mimeType: 'image/png', buffer: image },
  ])
  await expect(page.locator('#layer-count')).toHaveText('2')
  await expect(page.locator('#export')).toBeDisabled()
  await page.locator('#trace').click()
  await expect(page.locator('#export')).toBeEnabled()
  await page.locator('#width-mm').fill('150')
  const downloadPromise = page.waitForEvent('download')
  await page.locator('#export').click()
  const download = await downloadPromise
  const text = await readFile(await download.path(), 'utf8')
  expect(text).not.toMatch(/<image|data:image/)
  const parsed = await page.evaluate(text => {
    const document = new DOMParser().parseFromString(text, 'image/svg+xml')
    return { valid: !document.querySelector('parsererror'), width: document.documentElement.getAttribute('width'), layers: [...document.querySelectorAll('svg > g > title')].map(title => title.textContent), paths: document.querySelectorAll('path').length }
  }, text)
  expect(parsed.valid).toBe(true)
  expect(parsed.width).toBe('150mm')
  expect(parsed.layers).toEqual(['Outline & detail', 'Color'])
  expect(parsed.paths).toBeGreaterThan(0)
  expect(errors).toEqual([])
})

test('stencil settings invalidate exports and retrace black-only paths', async ({ page }) => {
  await page.locator('[data-mode="stencil"]').click()
  await expect(page.locator('#export')).toBeDisabled()
  await expect(page.locator('#threshold-field')).toBeVisible()
  await page.locator('#trace').click()
  await expect(page.locator('#export')).toBeEnabled()
  const fills = await page.locator('#vector-art path').evaluateAll(paths => [...new Set(paths.map(path => path.getAttribute('fill')))])
  expect(fills).toEqual(['rgb(0,0,0)'])
  await expect(page.locator('#palette-count')).toHaveText('1 colors')
})

test('crop changes dimensions, disables stale exports, and resets', async ({ page }) => {
  await page.locator('#crop-start').click()
  await expect(page.locator('#crop-overlay')).toBeVisible()
  await expect(page.locator('#export')).toBeDisabled()
  await page.locator('#crop-apply').click()
  await expect(page.locator('#source-dimensions')).toHaveText('640 x 800 px')
  await expect(page.locator('#export')).toBeDisabled()
  await page.locator('#trace').click()
  await expect(page.locator('#export')).toBeEnabled()
  await page.locator('#crop-reset').click()
  await expect(page.locator('#source-dimensions')).toHaveText('800 x 1000 px')
  await expect(page.locator('#export')).toBeDisabled()
})

test('palette recoloring and visibility update actual paths', async ({ page }) => {
  await page.locator('[data-color="0"]').fill('#2277aa')
  await page.locator('[data-color="0"]').dispatchEvent('change')
  await expect(page.locator('#layer-1-color-1 path').first()).toHaveAttribute('fill', '#2277aa')
  const before = await page.locator('#vector-art path').count()
  await page.locator('[data-color-visible="0"]').uncheck()
  expect(await page.locator('#vector-art path').count()).toBeLessThan(before)
  await page.locator('[data-color-visible="0"]').check()
  expect(await page.locator('#vector-art path').count()).toBe(before)
  await page.locator('[data-visible]').click()
  await expect(page.locator('#export')).toBeDisabled()
})

test('rejects mismatched layer sizes and invalid files without losing artwork', async ({ page }) => {
  const image = await fixture(page)
  await page.locator('#file-input').setInputFiles({ name: 'Layer.png', mimeType: 'image/png', buffer: image })
  await expect(page.locator('#source-name')).toHaveText('Layer')
  const mismatch = await fixture(page, '#222222', 240)
  await page.locator('#file-input').setInputFiles({ name: 'Mismatch.png', mimeType: 'image/png', buffer: mismatch })
  await expect(page.locator('#toast')).toContainText('dimensions must match')
  await expect(page.locator('#layer-count')).toHaveText('1')
  await page.locator('#file-input').setInputFiles({ name: 'Invalid.png', mimeType: 'image/png', buffer: Buffer.from('not an image') })
  await expect(page.locator('#layer-count')).toHaveText('1')
  await expect(page.locator('#source-name')).toHaveText('Layer')
})

test('cancel stops tracing and keeps the interface usable', async ({ page }) => {
  await page.locator('#resolution').selectOption('1800')
  await page.locator('#trace').click()
  await page.locator('#cancel').click()
  await expect(page.locator('#trace-status')).toHaveText('Trace cancelled')
  await expect(page.locator('#trace')).toBeEnabled()
  await expect(page.locator('#import')).toBeEnabled()
})

test('drawn crops preserve alignment when another layer is imported', async ({ page }) => {
  const image = await fixture(page)
  await page.locator('#file-input').setInputFiles({ name: 'First.png', mimeType: 'image/png', buffer: image })
  await expect(page.locator('#source-name')).toHaveText('First')
  await page.locator('#crop-start').click()
  const bounds = await page.locator('#crop-overlay').boundingBox()
  await page.mouse.move(bounds.x + bounds.width * 0.25, bounds.y + bounds.height * 0.25)
  await page.mouse.down()
  await page.mouse.move(bounds.x + bounds.width * 0.75, bounds.y + bounds.height * 0.75, { steps: 5 })
  await page.mouse.up()
  await page.locator('#crop-apply').click()
  await expect(page.locator('#source-dimensions')).toHaveText('80 x 100 px')
  const cropped = await page.locator('#source-canvas').evaluate(canvas => canvas.toDataURL())
  await page.locator('#file-input').setInputFiles({ name: 'Second.png', mimeType: 'image/png', buffer: image })
  await expect(page.locator('#source-name')).toHaveText('Second')
  expect(await page.locator('#source-canvas').evaluate(canvas => canvas.toDataURL())).toBe(cropped)
  await page.locator('#trace').click()
  await expect(page.locator('#export')).toBeEnabled()
  await expect(page.locator('#vector-art svg > g')).toHaveCount(2)
})