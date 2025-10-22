import React, {useEffect, useMemo, useState} from 'react'
import { api } from '../../api'
import StatusPill from '../components/StatusPill'
import KV from '../components/KV'

function useQuery() {
  return new URLSearchParams(window.location.search)
}

export default function SessionView() {
  const q = useQuery()
  const id = q.get('id') || ''
  const [sess, setSess] = useState<any>(null)
  const [steps, setSteps] = useState<any[]>([])
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!id) return
    const h = setInterval(()=> setTick(t => t+1), 3000)
    return ()=> clearInterval(h)
  }, [id])

  useEffect(() => {
    if (!id) return
    api('/orch/session/'+id).then(setSess).catch(console.error)
    api('/orch/session/'+id+'/steps').then(j => setSteps(j.items||[])).catch(console.error)
  }, [id, tick])

  const gated = useMemo(() => steps.find(s => s.status==='gated'), [steps])

  if (!id) return <div>Provide a session id via <code>?id=&lt;uuid&gt;</code></div>
  return (
    <div>
      <h2>Session</h2>
      <div style={{display:'flex', gap:24, alignItems:'center'}}>
        <div><b>ID</b> {id}</div>
        <div><b>Status</b> <StatusPill status={sess?.status} /></div>
        <div><b>Index</b> {sess?.current_index}</div>
      </div>

      <h3 style={{marginTop:16}}>Steps</h3>
      <table style={{borderCollapse:'collapse', width:'100%'}}>
        <thead>
          <tr><th style={{textAlign:'left'}}>#</th><th>name</th><th>role</th><th>gate</th><th>status</th><th>actions</th></tr>
        </thead>
        <tbody>
          {steps.map((s:any)=>(
            <tr key={s.id}>
              <td>{s.idx}</td>
              <td>{s.name}</td>
              <td>{s.role}</td>
              <td>{s.gate||''}</td>
              <td><StatusPill status={s.status}/></td>
              <td>
              {s.status==='gated' && (
                <>
                  <button onClick={async()=>{ await api('/orch/step/'+s.id+'/approve', {method:'POST'}); setTick(t=>t+1) }}>Approve</button>
                  <button onClick={async()=>{ await api('/orch/step/'+s.id+'/reject', {method:'POST'}); setTick(t=>t+1) }} style={{marginLeft:8}}>Reject</button>
                </>
              )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3 style={{marginTop:16}}>Raw</h3>
      <KV obj={{session:sess, steps}}/>
    </div>
  )
}
