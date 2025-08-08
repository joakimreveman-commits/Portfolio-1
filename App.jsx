import React, { useEffect, useMemo, useState } from 'react'

// --- Demo data: replace with live API calls ---
const initialSymbols = ['BP-TR', 'PLTR', 'TMUS', 'A0MM0S', 'A1C5E7', 'A1KWPQ', 'A113FD']
const seed = { 'BP-TR': 4.9, PLTR: 159.2, TMUS: 210.1, A0MM0S: 64.7, A1C5E7: 100.0, A1KWPQ: 56.6, A113FD: 42.6 }

function fakeQuote(base) {
  const delta = (Math.random() - 0.5) * 0.8 // ~±0.4%
  const price = +(base * (1 + delta / 100)).toFixed(2)
  const change = +(price - base).toFixed(2)
  const pct = +((change / base) * 100).toFixed(2)
  return { price, change, pct }
}

function useLiveQuotes(symbols, intervalMs = 4000) {
  const [quotes, setQuotes] = useState({})
  useEffect(() => {
    let on = true
    const tick = () => {
      const next = {}
      symbols.forEach(s => {
        const base = seed[s] ?? 100
        next[s] = fakeQuote(base)
      })
      if (on) setQuotes(next)
    }
    tick()
    const id = setInterval(tick, intervalMs)
    return () => { on = false; clearInterval(id) }
  }, [symbols, intervalMs])
  return quotes
}

function sentiment(h) {
  const t = h.toLowerCase()
  if (/(beats|surge|record|profit|upgrade|approval|partnership)/.test(t)) return 'positive'
  if (/(miss|cut|fine|probe|downgrade|lawsuit|recall|halt)/.test(t)) return 'negative'
  return 'neutral'
}

const demoNews = [
  { id:'n1', sym:'PLTR', head:'Palantir signs EU partnership to expand AI solutions', url:'#', ts: new Date().toISOString(), src:'DemoWire' },
  { id:'n2', sym:'TMUS', head:'T‑Mobile unveils new 5G enterprise features; analysts see upside', url:'#', ts: new Date().toISOString(), src:'DemoNews' },
  { id:'n3', sym:'BP-TR', head:'BP outlines low‑carbon roadmap; refining margins in focus', url:'#', ts: new Date().toISOString(), src:'EnergyDaily' },
]

export default function App() {
  const [symbols, setSymbols] = useState(initialSymbols)
  const [addSym, setAddSym] = useState('')
  const quotes = useLiveQuotes(symbols)
  const [alerts, setAlerts] = useState([{ symbol:'PLTR', pct:2 }, { symbol:'BP-TR', pct:-1 }])

  const news = useMemo(() => demoNews.filter(n => symbols.includes(n.sym)), [symbols])

  const triggers = useMemo(() => {
    const out = []
    alerts.forEach(a => {
      const q = quotes[a.symbol]
      if (!q) return
      if ((a.pct >= 0 && q.pct >= a.pct) || (a.pct < 0 && q.pct <= a.pct)) out.push({ ...a, now:q.price, move:q.pct })
    })
    return out
  }, [alerts, quotes])

  const add = () => {
    const s = addSym.trim().toUpperCase()
    if (!s) return
    if (!symbols.includes(s)) setSymbols([...symbols, s])
    setAddSym('')
  }

  const del = (s) => setSymbols(symbols.filter(x => x !== s))

  return (
    <div className="container">
      <h1 className="h">Autonomous‑Only Investment Dashboard</h1>
      <div className="grid">
        <div className="card">
          <div className="row" style={{justifyContent:'space-between'}}>
            <h2 className="h">Your Watchlist</h2>
            <span className="badge">demo data</span>
          </div>

          <div className="row" style={{marginBottom:12}}>
            <input className="input" placeholder="Add ticker/ISIN (e.g., BP-TR, PLTR, A0MM0S)" value={addSym} onChange={e=>setAddSym(e.target.value)} />
            <button className="btn" onClick={add}>Add</button>
          </div>

          <table className="table">
            <thead>
              <tr><th>Symbol</th><th>Last</th><th>Δ</th><th>Move</th><th></th></tr>
            </thead>
            <tbody>
              {symbols.map(s => {
                const q = quotes[s]
                const cls = q && q.pct < 0 ? 'pct-neg' : 'pct-pos'
                return (
                  <tr key={s}>
                    <td><span className="kpi">{s}</span></td>
                    <td>{q ? q.price : '–'}</td>
                    <td>{q ? q.change : '–'}</td>
                    <td className={q ? (q.pct<0?'pct-neg':'pct-pos') : ''}>{q ? (q.pct>0?'+':'')+q.pct+'%' : '–'}</td>
                    <td><span className="small del" onClick={()=>del(s)}>remove</span></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h2 className="h">Alerts</h2>
          <div className="chips">
            {alerts.map((a,i)=>(<span key={i} className="chip">{a.symbol} {a.pct>0?'+':''}{a.pct}%</span>))}
          </div>
          <div className="footer">Triggered now:</div>
          <div style={{display:'grid', gap:8, marginTop:8}}>
            {triggers.length===0 && <div className="small">No alerts triggered</div>}
            {triggers.map((t,i)=>(
              <div key={i} className="alert">
                <div><b>{t.symbol}</b> moved {t.move>0?'+':''}{t.move}% to {t.now}</div>
                <button className="btn" onClick={()=>{}}>OK</button>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{gridColumn:'1 / -1'}}>
          <div className="row" style={{justifyContent:'space-between'}}>
            <h2 className="h">Curated News</h2>
            <span className="badge">tickers only</span>
          </div>
          <div style={{display:'grid', gap:10}}>
            {news.map(n => (
              <a key={n.id} className="link" href={n.url} target="_blank" rel="noreferrer">
                <div className="alert">
                  <div>
                    <div className="small">{new Date(n.ts).toLocaleString()} • {n.src} • {n.sym}</div>
                    <div>{n.head}</div>
                  </div>
                  <span className="badge">{sentiment(n.head)}</span>
                </div>
              </a>
            ))}
          </div>
          <div className="footer">Next: wire live APIs (quotes & news) and enable push notifications.</div>
        </div>
      </div>
    </div>
  )
}
