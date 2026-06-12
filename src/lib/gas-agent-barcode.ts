export const GAS_AGENT_BARCODE_PREFIX = "gas-agent:";

export function gasAgentBarcodeValue(agentId: string): string {
  return `${GAS_AGENT_BARCODE_PREFIX}${agentId}`;
}

export function parseGasAgentBarcodeValue(value: string): string {
  const trimmed = value.trim();

  if (trimmed.startsWith(GAS_AGENT_BARCODE_PREFIX)) {
    return trimmed.slice(GAS_AGENT_BARCODE_PREFIX.length).trim();
  }

  try {
    const url = new URL(trimmed);
    const fromQuery = url.searchParams.get("gasAgentId") ?? url.searchParams.get("agent");
    if (fromQuery) return fromQuery.trim();
  } catch {
    // The scanner usually returns a plain Code 128 payload, not a URL.
  }

  return trimmed;
}

