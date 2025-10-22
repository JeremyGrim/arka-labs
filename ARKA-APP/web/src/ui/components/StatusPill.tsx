import React from 'react'
export default function StatusPill({status}:{status?:string}) {
  const color = status==='completed' || status==='ok' ? '#0a0' 
              : status==='paused' || status==='gated' ? '#e6a700'
              : status==='failed' ? '#c00'
              : '#666'
  return <span style={{border:`1px solid ${color}`, color, padding:'2px 6px', borderRadius:12, fontSize:12}}>{status||'unknown'}</span>
}
