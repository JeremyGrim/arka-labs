# app/services/routing.py
import requests
from app.utils.config import ROUTING_URL

def resolve(intent: str|None=None, term: str|None=None, client: str|None=None) -> dict:
    params={}
    if intent: params["intent"]=intent
    if term: params["term"]=term
    if client: params["client"]=client
    r = requests.get(f"{ROUTING_URL}/resolve", params=params, timeout=15)
    r.raise_for_status()
    return r.json()
