# adapter_interface/provider_adapter.py
from __future__ import annotations
from typing import Protocol, TypedDict, List, Optional, Dict, Any

class InvokeInput(TypedDict, total=False):
    messages: List[Dict[str, Any]]
    system: str
    tools: List[Dict[str, Any]]

class InvokeRequest(TypedDict, total=False):
    provider: str
    operation: str   # 'chat' | 'embed' | 'vision' | 'audio'
    model: str
    budget_tokens: int
    temperature: float
    input: InvokeInput
    metadata: Dict[str, Any]

class Usage(TypedDict, total=False):
    input_tokens: int
    output_tokens: int
    cost: float

class InvokeOutput(TypedDict, total=False):
    messages: List[Dict[str, Any]]
    text: str
    tool_calls: List[Dict[str, Any]]

class InvokeResponse(TypedDict, total=False):
    output: InvokeOutput
    usage: Usage
    provider: str
    model: str

class ProviderAdapter(Protocol):
    def name(self) -> str: ...
    def healthz(self) -> bool: ...
    def invoke(self, req: InvokeRequest) -> InvokeResponse: ...
