import ImageTracer from 'imagetracerjs'

export const DEFAULTS = { mode: 'color', colors: 12, smoothing: 1, speckles: 8, threshold: 125, removeWhite: false, whiteCutoff: 245 }

export function preparePixels(image, settings) {
  const data = new Uint8ClampedArray(image.data)
  for (let offset = 0; offset < data.length; offset += 4) {
    const alpha = data[offset + 3] / 255
    const red = Math.round(data[offset] * alpha + 255 * (1 - alpha))
    const green = Math.round(data[offset + 1] * alpha + 255 * (1 - alpha))
    const blue = Math.round(data[offset + 2] * alpha + 255 * (1 - alpha))
    const empty = alpha < 0.125 || (settings.removeWhite && Math.min(red, green, blue) >= settings.whiteCutoff)
    const ink = !empty && (settings.mode !== 'stencil' || red * 0.2126 + green * 0.7152 + blue * 0.0722 < settings.threshold)
    data[offset] = ink && settings.mode === 'color' ? red : 0
    data[offset + 1] = ink && settings.mode === 'color' ? green : 0
    data[offset + 2] = ink && settings.mode === 'color' ? blue : 0
    data[offset + 3] = ink ? 255 : 0
  }
  return { width: image.width, height: image.height, data }
}

function paletteFor(image, count) {
  const bins = new Map()
  let transparent = false
  for (let offset = 0; offset < image.data.length; offset += 4) {
    if (!image.data[offset + 3]) { transparent = true; continue }
    const red = image.data[offset], green = image.data[offset + 1], blue = image.data[offset + 2]
    const key = (red >> 5) * 64 + (green >> 5) * 8 + (blue >> 5)
    const bin = bins.get(key) || { r: 0, g: 0, b: 0, count: 0 }
    bin.r += red; bin.g += green; bin.b += blue; bin.count++
    bins.set(key, bin)
  }
  const candidates = [...bins.values()].map(bin => ({ r: Math.round(bin.r / bin.count), g: Math.round(bin.g / bin.count), b: Math.round(bin.b / bin.count), a: 255, count: bin.count }))
  candidates.sort((left, right) => right.count - left.count)
  const selected = candidates.length ? [candidates.shift()] : []
  while (selected.length < count && candidates.length) {
    let bestIndex = 0, bestScore = -1
    candidates.forEach((candidate, index) => {
      const distance = Math.min(...selected.map(color => (color.r - candidate.r) ** 2 + (color.g - candidate.g) ** 2 + (color.b - candidate.b) ** 2))
      const score = distance * Math.sqrt(candidate.count)
      if (score > bestScore) { bestScore = score; bestIndex = index }
    })
    selected.push(candidates.splice(bestIndex, 1)[0])
  }
  const palette = selected.map(({ r, g, b, a }) => ({ r, g, b, a }))
  if (transparent || !palette.length) palette.push({ r: 0, g: 0, b: 0, a: 0 })
  return palette
}

export function escapeXml(value) {
  return String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[character])
}

export function traceImage(image, overrides = {}) {
  const settings = { ...DEFAULTS, ...overrides }
  const prepared = preparePixels(image, settings)
  const options = ImageTracer.checkoptions({
    pal: paletteFor(prepared, settings.mode === 'stencil' ? 1 : settings.colors),
    colorquantcycles: 1, mincolorratio: 0, layering: 0,
    ltres: settings.smoothing, qtres: settings.smoothing,
    pathomit: settings.speckles, rightangleenhance: false,
    strokewidth: 0, roundcoords: 2, viewbox: true,
  })
  const traced = ImageTracer.imagedataToTracedata(prepared, options)
  let pathCount = 0
  const groups = []
  traced.layers.forEach((layer, layerIndex) => {
    const color = traced.palette[layerIndex]
    if (!color.a) return
    const paths = layer.map((path, pathIndex) => {
      if (path.isholepath) return ''
      pathCount++
      return ImageTracer.svgpathstring(traced, layerIndex, pathIndex, options)
    }).join('')
    if (!paths) return
    const hex = '#' + [color.r, color.g, color.b].map(channel => channel.toString(16).padStart(2, '0')).join('')
    groups.push({ color: hex, paths })
  })
  return { width: image.width, height: image.height, groups, pathCount }
}

export function makeSvg(layers, width, height, widthMm = 0) {
  const size = widthMm > 0 ? `width="${widthMm}mm" height="${+(widthMm * height / width).toFixed(3)}mm"` : `width="${width}" height="${height}"`
  const content = layers.map((layer, layerIndex) => {
    const groups = layer.result.groups.map((group, colorIndex) => `<g id="layer-${layerIndex + 1}-color-${colorIndex + 1}" inkscape:label="${group.color}"><title>${group.color}</title>${group.paths}</g>`).join('')
    return `<g id="layer-${layerIndex + 1}" inkscape:groupmode="layer" inkscape:label="${escapeXml(layer.name)}"><title>${escapeXml(layer.name)}</title>${groups}</g>`
  }).join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" viewBox="0 0 ${width} ${height}" ${size}><title>NickVector artwork</title>${content}</svg>`
}