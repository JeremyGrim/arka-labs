// adapter_interface/providerAdapter.ts
export type InvokeInput = {
  messages?: any[];
  system?: string;
  tools?: any[];
}

export type InvokeRequest = {
  provider: string;               // 'codex' | 'openai' | ...
  operation: 'chat'|'embed'|'vision'|'audio';
  model?: string;
  budget_tokens?: number;
  temperature?: number;
  input: InvokeInput;
  metadata?: Record<string, any>;
}

export type Usage = {
  input_tokens?: number;
  output_tokens?: number;
  cost?: number;
}

export type InvokeOutput = {
  messages?: any[];
  text?: string;
  tool_calls?: any[];
}

export type InvokeResponse = {
  output: InvokeOutput;
  usage: Usage;
  provider?: string;
  model?: string;
}

export interface ProviderAdapter {
  name(): string;
  healthz(): Promise<boolean>;
  invoke(req: InvokeRequest): Promise<InvokeResponse>;
}
