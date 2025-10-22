import React, { useEffect, useState } from 'react'

const API = (path: string, q: Record<string,string|undefined> = {}) => {
  const base = (import.meta as any).env.VITE_API_URL || "http://localhost:8080/api";
  const qs = Object.entries(q).filter(([,v]) => v).map(([k,v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join('&')
  return fetch(`${base}${path}${qs ? ('?'+qs): ''}`).then(r => r.json())
}

export default function App() {
  const [health, setHealth] = useState<any>(null)
  const [catalog, setCatalog] = useState<any>({items:[]})

  useEffect(() => {
    API('/healthz').then(setHealth).catch(console.error)
    API('/catalog', { facet: 'flow' }).then(setCatalog).catch(console.error)
  }, [])

  return (
    <div style={{ fontFamily: 'Inter, system-ui, Arial', padding: 24 }}>
      <h1>ARKA‑APP</h1>
      <section>
        <h2>Health</h2>
        <pre>{JSON.stringify(health, null, 2)}</pre>
      </section>
      <section>
        <h2>Flows (via ARKA_ROUTING)</h2>
        <pre style={{ maxHeight: 320, overflow: 'auto', background: '#111', color: '#0f0', padding: 12 }}>
          {JSON.stringify(catalog, null, 2)}
        </pre>
      </section>
    </div>
  )
}
