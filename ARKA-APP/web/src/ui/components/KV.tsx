import React from 'react'
export default function KV({obj}:{obj:any}) {
  return <pre style={{background:'#111', color:'#0f0', padding:12, borderRadius:8, maxHeight:360, overflow:'auto'}}>
    {JSON.stringify(obj, null, 2)}
  </pre>
}
