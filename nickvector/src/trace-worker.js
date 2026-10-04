import { traceImage } from './trace.js'

self.onmessage = event => {
  try {
    const { image, settings } = event.data
    self.postMessage({ result: traceImage(image, settings) })
  } catch (error) {
    self.postMessage({ error: error.message || 'Tracing failed.' })
  }
}