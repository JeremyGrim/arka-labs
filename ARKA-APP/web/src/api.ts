export const API_BASE = (import.meta as any).env.VITE_API_URL || "http://localhost:8080/api"

export async function api(path: string, opts: RequestInit = {}) {
  const r = await fetch(API_BASE + path, { headers: {'Content-Type': 'application/json'}, ...opts })
  if (!r.ok) throw new Error(await r.text())
  const ct = r.headers.get('content-type') || ''
  return ct.includes('application/json') ? await r.json() : await r.text()
}

export async function getCatalogFlows(grep?: string) {
  const qs = grep ? `?facet=flow&grep=${encodeURIComponent(grep)}` : `?facet=flow`
  return api('/catalog' + qs)
}
