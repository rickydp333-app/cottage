import { useRef, useState } from 'react'
import './App.css'

const fileToDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = () => resolve(reader.result)
  reader.onerror = reject
  reader.readAsDataURL(file)
})

function App() {
  const [image, setImage] = useState(null)
  const [result, setResult] = useState(null)
  const [category, setCategory] = useState('Auto-detect')
  const [condition, setCondition] = useState('Good')
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef(null)

  const handleFile = (file) => {
    if (!file) return
    setImage({ name: file.name, url: URL.createObjectURL(file) })
    setResult(null)
  }

  const runEstimate = async () => {
    if (!image) return
    setLoading(true)
    setError('')
    setCopied(false)
    try {
      const response = await fetch('/wiw/api.php', { method: 'POST', body: JSON.stringify({ image: await fileToDataUrl(inputRef.current.files[0]), category, condition }), headers: { 'Content-Type': 'application/json' } })
      if (!response.ok) throw new Error('Live appraisal is not configured yet.')
      const liveResult = await response.json()
      const confidence = Number(liveResult.confidence)
      setResult({ ...liveResult, confidence: confidence > 0 && confidence <= 1 ? confidence * 100 : confidence })
    } catch (requestError) {
      setError(requestError.message)
      setResult(null)
    } finally { setLoading(false) }
  }
  const copyListing = async () => {
    if (!result) return
    await navigator.clipboard?.writeText(`${result.title}\n\n${result.condition}. Priced at $${result.suggested}. Message for details.`)
    setCopied(true)
  }

  return (
    <main className="app-shell">
      <nav className="top-nav">
        <a className="wordmark" href="/">what's it <em>worth?</em></a>
        <div className="nav-links"><span>My appraisals</span><button type="button" className="ghost-button">How it works</button></div>
      </nav>

      <header className="intro">
        <div className="intro-copy"><p className="kicker">The resale desk for real life</p><h1>Find the number<br /><i>before</i> you list.</h1><p className="intro-text">Snap a photo of almost anything. Get a grounded price range, a quick-sale number, and a listing price that makes sense.</p></div>
        <div className="stamp"><strong>WORTH</strong><span>ESTIMATED<br />IN SECONDS</span></div>
      </header>

      <section className="workspace">
        <div className="upload-panel">
          <div className="panel-heading"><span className="step">01</span><div><h2>Show me the item</h2><p>One clear photo works best.</p></div></div>
          <input ref={inputRef} type="file" accept="image/*" hidden onChange={(event) => handleFile(event.target.files[0])} />
          <button type="button" className={`dropzone ${image ? 'has-image' : ''}`} onClick={() => inputRef.current?.click()} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); handleFile(event.dataTransfer.files[0]) }}>
            {image ? <img src={image.url} alt="Uploaded item" /> : <><span className="upload-mark">+</span><strong>Drop a photo here</strong><span>or click to browse your camera roll</span></>}
          </button>
          {image && <p className="file-name">{image.name}<button type="button" onClick={() => { setImage(null); setResult(null) }}>Remove</button></p>}
          <div className="controls"><label>Category<select value={category} onChange={(event) => setCategory(event.target.value)}><option>Auto-detect</option><option>Tool</option><option>Appliance</option><option>Electronics</option><option>Furniture</option><option>Collectible</option><option>Sporting equipment</option></select></label><label>Condition<select value={condition} onChange={(event) => setCondition(event.target.value)}><option>Like new</option><option>Good</option><option>Fair</option><option>For parts</option></select></label></div>
          <button type="button" className="estimate-button" disabled={!image || loading} onClick={runEstimate}>{loading ? 'Reading the item…' : "Estimate what it's worth"} <span>→</span></button>
          <p className="privacy-note">{error || 'Photos are sent securely only when you request a live appraisal.'}</p>
        </div>

        <div className={`result-panel ${result ? 'is-ready' : ''}`}>
          {!result ? <div className="empty-result"><div className="target-icon">◎</div><p className="kicker">Your appraisal</p><h2>Waiting for<br /><i>something interesting.</i></h2><p>We’ll identify the object, account for its condition, and turn the guesswork into a useful selling number.</p></div> : <div className="result-content"><div className="result-top"><div><p className="kicker">Your appraisal</p><h2>{result.title}</h2><span className="category-label">{result.category} · {result.condition}</span></div><div className="confidence"><strong>{result.confidence}%</strong><span>confidence</span></div></div><div className="price-grid"><div><span>New price</span><strong>${result.newPrice}</strong></div><div><span>Typical used</span><strong>${result.usedLow}–${result.usedHigh}</strong></div><div className="quick"><span>Quick-sale price</span><strong>${result.quickSale}</strong></div><div className="suggested"><span>Suggested listing</span><strong>${result.suggested}</strong></div></div><div className="result-note"><strong>Why this number?</strong><p>{result.note}</p></div><button type="button" className="listing-button" onClick={copyListing}>{copied ? 'Listing draft copied' : 'Copy listing draft'} <span>↗</span></button></div>}
        </div>
      </section>
      <footer><span>Built for the things collecting dust in your garage.</span><span>Demo mode · estimates are directional, not guarantees.</span></footer>
    </main>
  )
}

export default App
