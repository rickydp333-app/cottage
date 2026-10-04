import './studio.css'
import { createIcons, Upload, Download, ScanLine, Layers, Crop, RotateCcw, Trash2, Eye, EyeOff, Plus, X, ZoomIn, ZoomOut, Maximize, Check, SlidersHorizontal, ArrowUp, ArrowDown, ShieldCheck } from 'lucide'
import { DEFAULTS, makeSvg, escapeXml } from './trace.js'
import { demoArtwork } from './demo.js'

const icons = { Upload, Download, ScanLine, Layers, Crop, RotateCcw, Trash2, Eye, EyeOff, Plus, X, ZoomIn, ZoomOut, Maximize, Check, SlidersHorizontal, ArrowUp, ArrowDown, ShieldCheck }
const icon = name => `<i data-lucide="${name}" aria-hidden="true"></i>`
const $ = selector => document.querySelector(selector)
const state = { layers: [], selected: null, settings: { ...DEFAULTS }, busy: false, worker: null, cancelled: false, crop: null, zoom: 1, view: 'compare' }
let nextId = 1
let toastTimer

$('#app').innerHTML = `
  <header class="app-header">
    <div class="brand"><span class="brand-mark">nv.</span><div><h1>NickVector</h1><span class="brand-sub">ARTWORK STUDIO</span></div></div>
    <span class="privacy">${icon('shield-check')} Local processing</span>
    <div class="header-actions"><button id="import" class="button secondary" aria-label="Import artwork">${icon('upload')}<span>Import artwork</span></button><button id="export" class="button primary" aria-label="Export SVG" disabled>${icon('download')}<span>Export SVG</span></button></div>
    <input id="file-input" type="file" accept="image/png,image/jpeg,image/webp" multiple hidden>
  </header>
  <main class="workspace">
    <aside class="sidebar" aria-label="Artwork and trace settings">
      <section class="layers-section"><div class="section-heading"><h2>${icon('layers')} Layers <span id="layer-count" class="count">0</span></h2><button id="add-layer" class="icon-button" title="Import layers" aria-label="Import layers">${icon('plus')}</button></div><div id="layer-list"></div></section>
      <section class="settings-section"><div class="section-heading"><h2>${icon('sliders-horizontal')} Trace settings</h2><button id="reset-settings" class="icon-button" title="Reset trace settings" aria-label="Reset trace settings">${icon('rotate-ccw')}</button></div>
        <div class="segmented mode-control" role="group" aria-label="Tracing mode"><button data-mode="color" class="active" aria-pressed="true">Color</button><button data-mode="stencil" aria-pressed="false">Stencil</button></div>
        <label class="field">Preset<select id="preset"><option value="balanced">Balanced</option><option value="linework">Fine linework</option><option value="flat">Flat color</option><option value="detailed">Detailed color</option><option value="custom">Custom</option></select></label>
        <label class="slider-field" id="colors-field"><span>Colors<output id="colors-value">12</output></span><input id="colors" type="range" min="2" max="32" step="1" value="12"></label>
        <label class="slider-field" id="threshold-field" hidden><span>Ink threshold<output id="threshold-value">125</output></span><input id="threshold" type="range" min="20" max="240" step="1" value="125"></label>
        <label class="slider-field"><span>Curve smoothing<output id="smoothing-value">1</output></span><input id="smoothing" type="range" min="0.2" max="4" step="0.2" value="1"></label>
        <label class="slider-field"><span>Speckle removal<output id="speckles-value">8</output></span><input id="speckles" type="range" min="0" max="40" step="1" value="8"></label>
        <label class="checkbox-field"><input id="remove-white" type="checkbox"><span>Remove near-white</span></label>
        <label class="slider-field" id="white-field" hidden><span>White cutoff<output id="whiteCutoff-value">245</output></span><input id="whiteCutoff" type="range" min="200" max="255" value="245"></label>
        <label class="field">Trace resolution<select id="resolution"><option value="800">Quick / 800 px</option><option value="1200" selected>Standard / 1200 px</option><option value="1800">High / 1800 px</option></select></label>
        <div class="trace-actions"><button id="trace" class="button primary">${icon('scan-line')}<span>Vectorize artwork</span></button><button id="cancel" class="button secondary" hidden>${icon('x')} Cancel</button></div>
        <p id="trace-status" class="trace-status" role="status" aria-live="polite">Ready</p>
      </section>
      <section class="export-section"><h2>Output size</h2><label class="field size-field">Width <div><input id="width-mm" type="number" min="1" max="2000" step="1" value="100" inputmode="decimal"><span>mm</span></div></label><div class="size-summary"><span id="size-summary">100 x 125 mm</span><span>SVG</span></div></section>
    </aside>
    <section class="editor" aria-label="Artwork previews">
      <div class="editor-toolbar"><div class="segmented view-control" role="group" aria-label="Preview view"><button data-view="compare" class="active" aria-pressed="true">Compare</button><button data-view="source" aria-pressed="false">Original</button><button data-view="vector" aria-pressed="false">Vector</button></div><div class="canvas-actions"><button id="crop-start" class="icon-button" title="Crop artwork" aria-label="Crop artwork">${icon('crop')}</button><button id="crop-reset" class="icon-button" title="Reset crop" aria-label="Reset crop" disabled>${icon('rotate-ccw')}</button><span class="divider"></span><button id="zoom-out" class="icon-button" title="Zoom out" aria-label="Zoom out">${icon('zoom-out')}</button><output id="zoom-value">100%</output><button id="zoom-in" class="icon-button" title="Zoom in" aria-label="Zoom in">${icon('zoom-in')}</button><button id="zoom-fit" class="icon-button" title="Fit artwork" aria-label="Fit artwork">${icon('maximize')}</button></div></div>
      <div id="crop-bar" class="crop-bar" hidden><strong>Crop</strong><button id="crop-apply" class="button primary">${icon('check')} Apply</button><button id="crop-cancel" class="icon-button" title="Cancel crop" aria-label="Cancel crop">${icon('x')}</button></div>
      <div id="preview-grid" class="preview-grid compare">
        <section class="preview source-preview"><div class="preview-heading"><h2>Original</h2><span id="source-dimensions">PNG</span></div><div class="art-viewport" id="source-viewport"><div class="art-holder" id="source-holder"><canvas id="source-canvas" aria-label="Original artwork"></canvas><div id="crop-overlay" hidden><div id="crop-selection"></div></div></div></div><div class="preview-footer"><span id="source-name">No artwork</span><span>RASTER</span></div></section>
        <section class="preview vector-preview"><div class="preview-heading"><h2>Vector</h2><span id="vector-badge" class="vector-badge">READY TO TRACE</span></div><div class="art-viewport" id="vector-viewport"><div class="art-holder" id="vector-holder"><div id="vector-art" aria-label="Vector artwork"></div></div><div id="vector-empty"><span class="empty-mark">${icon('scan-line')}</span><strong id="empty-title">Ready to trace</strong></div></div><div class="preview-footer"><span id="vector-stats">No paths yet</span><span>EDITABLE SVG</span></div></section>
      </div>
      <div class="palette-bar"><div class="palette-title"><h2>Palette</h2><span id="palette-count">0 colors</span></div><div id="palette" class="palette"></div><fieldset class="backdrop-control"><legend class="sr-only">Preview background</legend><label title="White background"><input type="radio" name="backdrop" value="paper" checked aria-label="White background"><span class="backdrop-swatch paper"></span></label><label title="Transparency background"><input type="radio" name="backdrop" value="checker" aria-label="Transparency background"><span class="backdrop-swatch checker"></span></label><label title="Dark background"><input type="radio" name="backdrop" value="dark" aria-label="Dark background"><span class="backdrop-swatch dark"></span></label></fieldset></div>
      <footer class="editor-footer"><span id="document-status">Untitled artwork</span><button id="load-demo">Load sample</button></footer>
    </section>
  </main>
  <div id="toast" class="toast" role="alert" hidden></div>
  <div id="drop-overlay" hidden>${icon('upload')}<strong>Drop artwork</strong></div>
`

function refreshIcons() { createIcons({ icons, attrs: { 'stroke-width': 1.7 } }) }
function toast(message) {
  clearTimeout(toastTimer)
  $('#toast').textContent = message
  $('#toast').hidden = false
  toastTimer = setTimeout(() => { $('#toast').hidden = true }, 7000)
}
function selectedLayer() { return state.layers.find(layer => layer.id === state.selected) }
function documentSize() {
  const layer = state.layers[0]
  return layer ? { width: layer.crop?.width || layer.canvas.width, height: layer.crop?.height || layer.canvas.height } : { width: 800, height: 1000 }
}
function invalidate() {
  state.layers.forEach(layer => { layer.result = null })
  $('#trace-status').textContent = 'Settings changed'
  render()
}
function effectiveLayers() {
  return state.layers.filter(layer => layer.visible && layer.result).map(layer => ({ ...layer, result: { ...layer.result, groups: layer.result.groups.filter(group => !group.hidden) } }))
}
function currentSvg(widthMm = 0) {
  const { width, height } = documentSize()
  return makeSvg(effectiveLayers(), width, height, widthMm)
}
function setBusy(busy) {
  state.busy = busy
  $('.settings-section').querySelectorAll('input, select, button').forEach(control => { control.disabled = busy })
  $('#cancel').disabled = false
  $('#cancel').hidden = !busy
  $('#trace').hidden = busy
  $('#import').disabled = busy
  $('#add-layer').disabled = busy
  $('#load-demo').disabled = busy
  render()
}
function renderLayers() {
  $('#layer-count').textContent = state.layers.length
  $('#layer-list').innerHTML = state.layers.map((layer, index) => `<div class="layer-row ${layer.id === state.selected ? 'selected' : ''}"><button class="layer-select" data-select="${layer.id}" ${state.busy ? 'disabled' : ''}><img src="${layer.thumbnail}" alt=""><span><strong>${escapeXml(layer.name)}</strong><small>${layer.result ? `${layer.result.pathCount} paths` : 'Untraced'}</small></span></button><button class="icon-button" data-visible="${layer.id}" aria-label="${layer.visible ? 'Hide' : 'Show'} ${escapeXml(layer.name)}" title="${layer.visible ? 'Hide' : 'Show'} layer" ${state.busy ? 'disabled' : ''}>${icon(layer.visible ? 'eye' : 'eye-off')}</button><button class="icon-button" data-remove="${layer.id}" title="Remove layer" aria-label="Remove ${escapeXml(layer.name)}" ${state.busy ? 'disabled' : ''}>${icon('trash-2')}</button><div class="layer-order"><button class="icon-button" data-order="${layer.id}" data-direction="-1" title="Move earlier" aria-label="Move ${escapeXml(layer.name)} earlier" ${index === 0 || state.busy ? 'disabled' : ''}>${icon('arrow-up')}</button><button class="icon-button" data-order="${layer.id}" data-direction="1" title="Move later" aria-label="Move ${escapeXml(layer.name)} later" ${index === state.layers.length - 1 || state.busy ? 'disabled' : ''}>${icon('arrow-down')}</button></div></div>`).join('') || '<div class="no-layers">No layers</div>'
}
function render() {
  renderLayers()
  const layer = selectedLayer()
  const { width, height } = documentSize()
  const canvas = $('#source-canvas')
  canvas.width = width; canvas.height = height
  const context = canvas.getContext('2d')
  if (layer) {
    const crop = layer.crop || { x: 0, y: 0, width: layer.canvas.width, height: layer.canvas.height }
    context.drawImage(layer.canvas, crop.x, crop.y, crop.width, crop.height, 0, 0, width, height)
  }
  $('#source-name').textContent = layer?.name || 'No artwork'
  $('#source-dimensions').textContent = layer ? `${Math.round(width)} x ${Math.round(height)} px` : 'PNG / JPG / WEBP'
  $('#source-holder').style.aspectRatio = `${width} / ${height}`
  $('#vector-holder').style.aspectRatio = `${width} / ${height}`
  $('#vector-art').innerHTML = currentSvg()
  const effective = effectiveLayers()
  const pathCount = effective.reduce((sum, item) => sum + item.result.groups.reduce((count, group) => count + (group.paths.match(/<path /g)?.length || 0), 0), 0)
  const complete = state.layers.filter(item => item.visible).every(item => item.result)
  $('#export').disabled = state.busy || !pathCount || !complete || !!state.crop
  $('#vector-empty').hidden = pathCount > 0
  $('#empty-title').textContent = state.busy ? 'Tracing artwork...' : state.layers.some(item => item.result) ? 'No visible paths' : 'Ready to trace'
  $('#vector-badge').textContent = state.busy ? 'TRACING' : pathCount ? 'VECTOR PATHS' : 'READY TO TRACE'
  $('#vector-stats').textContent = pathCount ? `${pathCount.toLocaleString()} paths / ${effective.length} ${effective.length === 1 ? 'layer' : 'layers'}` : 'No paths yet'
  $('#document-status').textContent = state.layers.length ? `${state.layers.length} ${state.layers.length === 1 ? 'layer' : 'layers'} / ${complete && pathCount ? 'Vector ready' : 'Untraced changes'}` : 'No artwork'
  $('#crop-reset').disabled = state.busy || !layer?.crop
  $('#crop-start').disabled = state.busy || !layer
  $('#trace').disabled = state.busy || !state.layers.length || !!state.crop
  const groups = layer?.result?.groups || []
  $('#palette-count').textContent = `${groups.length} colors`
  $('#palette').innerHTML = groups.map((group, index) => `<div class="palette-item ${group.hidden ? 'muted' : ''}"><label class="color-chip" style="background:${group.color}" title="Edit ${group.color}"><input type="color" value="${group.color}" data-color="${index}" aria-label="Edit color ${group.color}" ${state.busy ? 'disabled' : ''}></label><label title="Include ${group.color}"><input type="checkbox" data-color-visible="${index}" ${group.hidden ? '' : 'checked'} aria-label="Include color ${group.color}" ${state.busy ? 'disabled' : ''}></label></div>`).join('')
  updateSize()
  fitPreviews()
  refreshIcons()
}
function updateSize() {
  const { width, height } = documentSize()
  const mm = Number($('#width-mm').value)
  $('#size-summary').textContent = mm > 0 ? `${mm} x ${+(mm * height / width).toFixed(1)} mm` : 'Set output width'
}
function syncSettings() {
  for (const key of ['colors', 'smoothing', 'speckles', 'threshold', 'whiteCutoff']) {
    $(`#${key}`).value = state.settings[key]
    $(`#${key}-value`).value = state.settings[key]
  }
  $('#remove-white').checked = state.settings.removeWhite
  $('#white-field').hidden = !state.settings.removeWhite
  $('#colors-field').hidden = state.settings.mode !== 'color'
  $('#threshold-field').hidden = state.settings.mode !== 'stencil'
  document.querySelectorAll('[data-mode]').forEach(button => { const active = button.dataset.mode === state.settings.mode; button.classList.toggle('active', active); button.setAttribute('aria-pressed', active) })
}
function addCanvas(canvas, name, demo = false) {
  const thumb = document.createElement('canvas')
  thumb.width = 64; thumb.height = 80
  thumb.getContext('2d').drawImage(canvas, 0, 0, 64, 80)
  const existingCrop = state.layers[0]?.crop
  const layer = { id: nextId++, name, canvas, thumbnail: thumb.toDataURL(), visible: true, result: null, crop: existingCrop ? { ...existingCrop } : null, demo }
  state.layers.push(layer)
  state.selected = layer.id
}
async function importFiles(files) {
  if (state.busy) return
  cancelCrop()
  const incoming = [...files]
  if (!incoming.length) return
  const existingCount = state.layers.length === 1 && state.layers[0].demo ? 0 : state.layers.length
  if (existingCount + incoming.length > 12) { toast('A document can contain up to 12 layers.'); return }
  setBusy(true)
  const messages = []
  try {
    for (const file of incoming) {
      if (!/\.(png|jpe?g|webp)$/i.test(file.name) || file.size > 20 * 1024 * 1024) { messages.push(`${file.name}: use PNG, JPG, or WebP under 20 MB.`); continue }
      const url = URL.createObjectURL(file)
      try {
        const image = new globalThis.Image()
        image.src = url
        await image.decode()
        if (image.naturalWidth * image.naturalHeight > 24000000 || Math.max(image.naturalWidth, image.naturalHeight) > 10000) throw new Error('Image exceeds the 24 megapixel / 10,000 px limit.')
        if (state.layers.length === 1 && state.layers[0].demo) state.layers = []
        const first = state.layers[0]
        if (first && (first.canvas.width !== image.naturalWidth || first.canvas.height !== image.naturalHeight)) throw new Error('Layer dimensions must match the current document. Remove existing layers to start a different size.')
        const canvas = document.createElement('canvas')
        canvas.width = image.naturalWidth; canvas.height = image.naturalHeight
        canvas.getContext('2d').drawImage(image, 0, 0)
        addCanvas(canvas, file.name.replace(/\.[^.]+$/, ''))
      } catch (error) { messages.push(`${file.name}: ${error.message}`) }
      finally { URL.revokeObjectURL(url) }
    }
    $('#trace-status').textContent = 'Ready'
  } finally { setBusy(false); $('#file-input').value = '' }
  if (messages.length) toast(messages.join(' '))
}
function runWorker(image) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./trace-worker.js', import.meta.url), { type: 'module' })
    state.worker = worker
    state.rejectWorker = reject
    worker.onmessage = event => {
      worker.terminate(); state.worker = null; state.rejectWorker = null
      if (event.data.error) reject(new Error(event.data.error))
      else resolve(event.data.result)
    }
    worker.onerror = event => { worker.terminate(); state.worker = null; state.rejectWorker = null; reject(new Error(event.message || 'The trace worker failed.')) }
    worker.postMessage({ image, settings: state.settings }, [image.data.buffer])
  })
}
async function vectorize() {
  if (state.busy || !state.layers.length || state.crop) return
  setBusy(true)
  state.cancelled = false
  const started = performance.now()
  try {
    for (let index = 0; index < state.layers.length; index++) {
      const layer = state.layers[index]
      $('#trace-status').textContent = `Tracing ${index + 1} of ${state.layers.length}`
      const { width, height } = documentSize()
      const limit = Number($('#resolution').value)
      const ratio = Math.min(1, limit / Math.max(width, height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(width * ratio)); canvas.height = Math.max(1, Math.round(height * ratio))
      const context = canvas.getContext('2d', { willReadFrequently: true })
      const crop = layer.crop || { x: 0, y: 0, width: layer.canvas.width, height: layer.canvas.height }
      context.drawImage(layer.canvas, crop.x, crop.y, crop.width, crop.height, 0, 0, canvas.width, canvas.height)
      const image = context.getImageData(0, 0, canvas.width, canvas.height)
      const result = await runWorker(image)
      const scaleX = width / canvas.width, scaleY = height / canvas.height
      result.groups.forEach(group => { group.paths = `<g transform="scale(${scaleX} ${scaleY})">${group.paths}</g>` })
      layer.result = result
      render()
    }
    const count = state.layers.reduce((sum, layer) => sum + (layer.result?.pathCount || 0), 0)
    $('#trace-status').textContent = `${count.toLocaleString()} paths / ${((performance.now() - started) / 1000).toFixed(1)}s`
    if (!count) toast('No ink found. Adjust the threshold, white cutoff, or speckle removal.')
  } catch (error) {
    $('#trace-status').textContent = state.cancelled ? 'Trace cancelled' : 'Trace failed'
    if (!state.cancelled) toast(error.message)
  } finally { setBusy(false) }
}
function cancelTrace() {
  if (!state.worker) return
  state.cancelled = true
  state.worker.terminate()
  state.worker = null
  state.rejectWorker?.(new Error('Cancelled'))
  state.rejectWorker = null
}
function exportSvg() {
  if ($('#export').disabled) return
  const mm = Number($('#width-mm').value)
  if (!Number.isFinite(mm) || mm < 1 || mm > 2000) { toast('Set an output width between 1 and 2000 mm.'); $('#width-mm').focus(); return }
  const blob = new Blob([currentSvg(mm)], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${(state.layers[0]?.name || 'artwork').replace(/[^a-z0-9_-]/gi, '-')}-${state.settings.mode}.svg`
  anchor.click()
  setTimeout(() => URL.revokeObjectURL(url), 60000)
  toast('SVG exported')
}
function changeView(view) {
  state.view = view
  $('#preview-grid').className = `preview-grid ${view}`
  document.querySelectorAll('[data-view]').forEach(button => { const active = button.dataset.view === view; button.classList.toggle('active', active); button.setAttribute('aria-pressed', active) })
  fitPreviews()
}
function fitPreviews() {
  const { width, height } = documentSize()
  for (const name of ['source', 'vector']) {
    const viewport = $(`#${name}-viewport`)
    if (!viewport.clientWidth || !viewport.clientHeight) continue
    const size = Math.min(viewport.clientWidth, viewport.clientHeight * width / height) * state.zoom
    Object.assign($(`#${name}-holder`).style, { width: `${Math.floor(size)}px`, height: `${Math.floor(size * height / width)}px` })
  }
}
function setZoom(value) {
  state.zoom = Math.max(0.5, Math.min(3, value))
  fitPreviews()
  $('#zoom-value').value = `${Math.round(state.zoom * 100)}%`
}
function startCrop() {
  const layer = selectedLayer()
  if (!layer || state.busy) return
  changeView('source'); setZoom(1)
  state.crop = { x: 0.1, y: 0.1, width: 0.8, height: 0.8 }
  $('#crop-overlay').hidden = false
  $('#crop-bar').hidden = false
  renderCrop()
  render()
}
function renderCrop() {
  if (!state.crop) return
  const { x, y, width, height } = state.crop
  Object.assign($('#crop-selection').style, { left: `${x * 100}%`, top: `${y * 100}%`, width: `${width * 100}%`, height: `${height * 100}%` })
}
function cancelCrop() {
  state.crop = null
  $('#crop-overlay').hidden = true
  $('#crop-bar').hidden = true
}
function applyCrop() {
  const layer = selectedLayer()
  if (!layer || !state.crop) return
  const previous = layer.crop || { x: 0, y: 0, width: layer.canvas.width, height: layer.canvas.height }
  const crop = state.crop
  if (crop.width < 0.01 || crop.height < 0.01) { toast('Select a larger crop area.'); return }
  const bounds = { x: previous.x + crop.x * previous.width, y: previous.y + crop.y * previous.height, width: crop.width * previous.width, height: crop.height * previous.height }
  state.layers.forEach(item => { item.crop = { ...bounds }; item.result = null })
  cancelCrop(); render(); changeView('compare')
  $('#trace-status').textContent = 'Crop changed'
}

$('#import').onclick = $('#add-layer').onclick = () => $('#file-input').click()
$('#file-input').onchange = event => importFiles(event.target.files)
$('#trace').onclick = vectorize
$('#cancel').onclick = cancelTrace
$('#export').onclick = exportSvg
$('#width-mm').oninput = updateSize
$('#resolution').onchange = invalidate
$('#reset-settings').onclick = () => { state.settings = { ...DEFAULTS }; $('#preset').value = 'balanced'; syncSettings(); invalidate() }
document.querySelectorAll('[data-mode]').forEach(button => { button.onclick = () => { state.settings.mode = button.dataset.mode; $('#preset').value = 'custom'; syncSettings(); invalidate() } })
for (const key of ['colors', 'smoothing', 'speckles', 'threshold', 'whiteCutoff']) {
  $(`#${key}`).oninput = event => { state.settings[key] = Number(event.target.value); $(`#${key}-value`).value = event.target.value; $('#preset').value = 'custom'; invalidate() }
}
$('#remove-white').onchange = event => { state.settings.removeWhite = event.target.checked; syncSettings(); invalidate() }
$('#preset').onchange = event => {
  const presets = { balanced: { ...DEFAULTS }, linework: { ...DEFAULTS, mode: 'stencil', smoothing: 0.4, speckles: 2 }, flat: { ...DEFAULTS, colors: 6, smoothing: 1.8, speckles: 12 }, detailed: { ...DEFAULTS, colors: 24, smoothing: 0.4, speckles: 2 } }
  if (presets[event.target.value]) { state.settings = presets[event.target.value]; syncSettings(); invalidate() }
}
$('#layer-list').onclick = event => {
  if (state.busy) return
  const button = event.target.closest('button')
  if (!button) return
  cancelCrop()
  if (button.dataset.select) state.selected = Number(button.dataset.select)
  if (button.dataset.visible) { const layer = state.layers.find(item => item.id === Number(button.dataset.visible)); layer.visible = !layer.visible }
  if (button.dataset.remove) { state.layers = state.layers.filter(item => item.id !== Number(button.dataset.remove)); if (!selectedLayer()) state.selected = state.layers.at(-1)?.id || null }
  if (button.dataset.order) {
    const index = state.layers.findIndex(item => item.id === Number(button.dataset.order))
    const target = index + Number(button.dataset.direction)
    if (target >= 0 && target < state.layers.length) [state.layers[index], state.layers[target]] = [state.layers[target], state.layers[index]]
  }
  render()
}
$('#palette').onchange = event => {
  const layer = selectedLayer()
  if (!layer?.result || state.busy) return
  if (event.target.dataset.colorVisible !== undefined) layer.result.groups[Number(event.target.dataset.colorVisible)].hidden = !event.target.checked
  if (event.target.dataset.color !== undefined) {
    const group = layer.result.groups[Number(event.target.dataset.color)]
    const parsed = new DOMParser().parseFromString(`<svg xmlns="http://www.w3.org/2000/svg">${group.paths}</svg>`, 'image/svg+xml')
    parsed.querySelectorAll('path').forEach(path => { path.setAttribute('fill', event.target.value); path.setAttribute('stroke', event.target.value) })
    group.paths = [...parsed.documentElement.children].map(child => new XMLSerializer().serializeToString(child)).join('')
    group.color = event.target.value
  }
  render()
}
document.querySelectorAll('[data-view]').forEach(button => { button.onclick = () => { cancelCrop(); changeView(button.dataset.view); render() } })
document.querySelectorAll('[name="backdrop"]').forEach(input => { input.onchange = () => { $('#preview-grid').dataset.backdrop = input.value } })
$('#zoom-in').onclick = () => setZoom(state.zoom + 0.25)
$('#zoom-out').onclick = () => setZoom(state.zoom - 0.25)
$('#zoom-fit').onclick = () => setZoom(1)
$('#crop-start').onclick = startCrop
$('#crop-apply').onclick = applyCrop
$('#crop-cancel').onclick = () => { cancelCrop(); render(); changeView('compare') }
$('#crop-reset').onclick = () => { state.layers.forEach(layer => { layer.crop = null; layer.result = null }); cancelCrop(); render(); $('#trace-status').textContent = 'Crop reset' }
let cropDrag = null
$('#crop-overlay').onpointerdown = event => {
  const bounds = event.currentTarget.getBoundingClientRect()
  const point = { x: Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width)), y: Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height)) }
  cropDrag = { point, bounds }
  event.currentTarget.setPointerCapture(event.pointerId)
  state.crop = { ...point, width: 0, height: 0 }
  renderCrop()
}
$('#crop-overlay').onpointermove = event => {
  if (!cropDrag) return
  const { point, bounds } = cropDrag
  const endX = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width)), endY = Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height))
  state.crop = { x: Math.min(point.x, endX), y: Math.min(point.y, endY), width: Math.abs(endX - point.x), height: Math.abs(endY - point.y) }
  renderCrop()
}
$('#crop-overlay').onpointerup = $('#crop-overlay').onpointercancel = () => { cropDrag = null }
let dragDepth = 0
document.addEventListener('dragenter', event => { if ([...event.dataTransfer.types].includes('Files')) { event.preventDefault(); dragDepth++; $('#drop-overlay').hidden = false } })
document.addEventListener('dragover', event => { event.preventDefault() })
document.addEventListener('dragleave', () => { if (--dragDepth <= 0) { dragDepth = 0; $('#drop-overlay').hidden = true } })
document.addEventListener('drop', event => { event.preventDefault(); dragDepth = 0; $('#drop-overlay').hidden = true; importFiles(event.dataTransfer.files) })
document.addEventListener('keydown', event => { if (event.key === 'Escape' && state.crop) { cancelCrop(); render() } })
globalThis.addEventListener('beforeunload', event => {
  if (!state.layers.some(layer => !layer.demo)) return
  event.preventDefault()
  event.returnValue = ''
})
async function loadDemo() {
  if (state.busy) return
  if (state.layers.some(layer => !layer.demo) && !confirm('Replace current artwork with the sample?')) return
  cancelCrop(); state.layers = []
  addCanvas(demoArtwork(), 'Rose & dagger', true)
  render()
  await vectorize()
}
$('#load-demo').onclick = loadDemo
const previewObserver = new ResizeObserver(fitPreviews)
previewObserver.observe($('#source-viewport'))
previewObserver.observe($('#vector-viewport'))
syncSettings()
refreshIcons()
loadDemo()