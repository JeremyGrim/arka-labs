import React, {useEffect, useMemo, useState} from 'react'
import { api, getCatalogFlows } from '../../api'

export default function LaunchFlow() {
  const [client, setClient] = useState('ACME')
  const [grep, setGrep] = useState('rgpd')
  const [flows, setFlows] = useState<any[]>([])
  const [selected, setSelected] = useState<string>('')

  useEffect(() => {
    getCatalogFlows(grep).then(j => setFlows(j.items||[])).catch(console.error)
  }, [grep])

  return (
    <div>
      <h2>Launch Flow</h2>
      <div style={{display:'grid', gridTemplateColumns:'150px 1fr', gap:12, maxWidth:720}}>
        <label>Client</label>
        <input value={client} onChange={e=>setClient(e.target.value.toUpperCase())} placeholder="ACME" />
        <label>Search flow</label>
        <input value={grep} onChange={e=>setGrep(e.target.value)} placeholder="rgpd" />
        <label>Choose</label>
        <select value={selected} onChange={e=>setSelected(e.target.value)}>
          <option value="">— Choose —</option>
          {flows.map((f, i) => (
            <option key={i} value={f.flow_ref || f.ref || (f.brick+':'+f.export)}>{(f.intent || f.name || f.export) + ' — ' + (f.flow_ref || f.ref)}</option>
          ))}
        </select>
      </div>
      <div style={{marginTop:16}}>
        <button disabled={!client || !selected} onClick={async()=>{
          try {
            const payload = { client, flow_ref: selected, options: { assign_strategy: 'auto', start_at_step: 0 } }
            const j = await api('/orch/flow', { method:'POST', body: JSON.stringify(payload) })
            alert('Session created: ' + j.id)
            window.location.href = '/session?id=' + encodeURIComponent(j.id)
          } catch (e:any) {
            alert('Error: ' + e.message)
          }
        }}>Start</button>
      </div>
      <p style={{marginTop:24, color:'#555'}}>Tip: tape “rgpd”, “spec”, “audit”… pour filtrer les flows publiés par ARKA_ROUTING.</p>
    </div>
  )
}
