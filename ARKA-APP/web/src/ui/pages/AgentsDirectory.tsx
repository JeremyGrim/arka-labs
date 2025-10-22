import React, {useEffect, useState} from 'react'
import { api } from '../../api'

export default function AgentsDirectory() {
  const [client, setClient] = useState('ACME')
  const [items, setItems] = useState<any[]>([])
  useEffect(() => {
    if (!client) return
    api('/agents/directory?client='+encodeURIComponent(client)).then(j => setItems(j.agents||[])).catch(console.error)
  }, [client])
  return (
    <div>
      <h2>Agents directory</h2>
      <div style={{marginBottom:12}}>
        <input value={client} onChange={e=>setClient(e.target.value.toUpperCase())} placeholder="ACME"/>
      </div>
      <table style={{borderCollapse:'collapse', width:'100%'}}>
        <thead><tr><th>agent_id</th><th>role</th><th>ref</th><th>onboarding</th></tr></thead>
        <tbody>
          {items.map((a:any)=>(
            <tr key={a.ref}>
              <td>{a.agent_id}</td>
              <td>{a.role||''}</td>
              <td>{a.ref}</td>
              <td>{a.onboarding_path}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
