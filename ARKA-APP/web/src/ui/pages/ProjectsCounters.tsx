import React, {useEffect, useState} from 'react'
import { api } from '../../api'
import StatusPill from '../components/StatusPill'
import KV from '../components/KV'

export default function ProjectsCounters() {
  const [items, setItems] = useState<any[]>([])
  useEffect(() => {
    api('/projects/counters').then(j => setItems(j.items||[])).catch(console.error)
  }, [])
  return (
    <div>
      <h2>Projects</h2>
      <table style={{borderCollapse:'collapse', width:'100%'}}>
        <thead><tr><th>key</th><th>title</th><th>threads</th><th>messages</th><th>last activity</th></tr></thead>
        <tbody>
          {items.map((p:any)=>(
            <tr key={p.project_id}>
              <td>{p.project_key}</td>
              <td>{p.title}</td>
              <td>{p.threads_count}</td>
              <td>{p.messages_count}</td>
              <td>{p.last_activity||''}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h3>Raw</h3>
      <KV obj={{items}}/>
    </div>
  )
}
