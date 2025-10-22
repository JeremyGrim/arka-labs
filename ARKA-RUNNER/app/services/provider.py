# app/services/provider.py
import requests, json
from typing import Dict, Any
from app.utils.config import provider_map

class ProviderError(RuntimeError): pass

def invoke(provider: str, operation: str, model: str|None, budget_tokens: int|None, temperature: float|None, 
           input: Dict[str,Any], metadata: Dict[str,Any]|None=None) -> Dict[str,Any]:
    adapters = provider_map()
    if provider not in adapters:
        raise ProviderError(f"provider adapter non configuré: {provider}")
    url = adapters[provider].rstrip('/') + "/invoke"
    payload = {
        "provider": provider, "operation": operation, "model": model,
        "budget_tokens": budget_tokens, "temperature": temperature,
        "input": input, "metadata": metadata or {}
    }
    r = requests.post(url, json=payload, timeout=60)
    if r.status_code >= 400:
        raise ProviderError(f"adapter {provider} HTTP {r.status_code}: {r.text[:200]}")
    try:
        return r.json()
    except Exception as e:
        raise ProviderError(f"adapter {provider} réponse JSON invalide: {e}")
