// ==========================================
// AragoniteAI Pricing — Provider cost + 15%
// Every model follows the same formula.
// ==========================================
// MARKUP: 15%
// FREE_CREDITS: $0.001 per new user

export const MARKUP = 1.15; // 15% markup
export const FREE_CREDITS = 1.0; // $1.00 free credits on signup (~500-1000 DeepSeek messages)

export interface ModelPricing {
  id: string;
  name: string;
  provider: string;
  costPerMIn: number;
  costPerMOut: number;
  pricePerMIn: number;
  pricePerMOut: number;
  contextWindow: number;
  features: string[];
  bedrock?: boolean; // covered by AWS credits
  comingSoon?: boolean;
}

const BASE: Record<string, { name: string; provider: string; in: number; out: number; ctx: number; features: string[]; bedrock?: boolean; comingSoon?: boolean }> = {
  "deepseek-chat": {
    name: "DeepSeek V3",
    provider: "deepseek",
    in: 0.14,
    out: 0.28,
    ctx: 128000,
    features: ["chat", "streaming"],
  },
  "deepseek-reasoner": {
    name: "DeepSeek R1",
    provider: "deepseek",
    in: 0.55,
    out: 2.19,
    ctx: 128000,
    features: ["chat", "🧠 reasoning", "streaming"],
  },
  "deepseek-v4-pro": {
    name: "DeepSeek V4 Pro",
    provider: "deepseek",
    in: 0.435,
    out: 0.87,
    ctx: 1000000,
    features: ["chat", "1M ctx", "🧠 reasoning", "streaming"],
  },
  "deepseek-v4-flash": {
    name: "DeepSeek V4 Flash",
    provider: "deepseek",
    in: 0.15,
    out: 0.40,
    ctx: 1000000,
    features: ["chat", "1M ctx", "speed", "streaming"],
  },
  "claude-opus-4-8": {
    name: "Claude Opus 4.8",
    provider: "anthropic",
    in: 15.0,
    out: 75.0,
    ctx: 200000,
    features: ["chat", "🧠 thinking", "vision", "best"],
    bedrock: true,
  },
  "claude-sonnet-4-6": {
    name: "Claude Sonnet 4.6",
    provider: "anthropic",
    in: 3.0,
    out: 15.0,
    ctx: 200000,
    features: ["chat", "🧠 thinking", "vision"],
    bedrock: true,
  },
  "claude-haiku-4-5": {
    name: "Claude Haiku 4.5",
    provider: "anthropic",
    in: 0.8,
    out: 4.0,
    ctx: 200000,
    features: ["chat", "🧠 thinking", "vision"],
    bedrock: true,
  },
  "llama-4-maverick": {
    name: "Llama 4 Maverick",
    provider: "meta",
    in: 0.20,
    out: 0.60,
    ctx: 1000000,
    features: ["chat", "1M context", "streaming"],
    bedrock: true,
  },
  "llama-3.1-70b": {
    name: "Llama 3.1 70B",
    provider: "meta",
    in: 0.59,
    out: 0.79,
    ctx: 128000,
    features: ["chat", "streaming"],
    bedrock: true,
  },
  "mistral-large": {
    name: "Mistral Large",
    provider: "mistral",
    in: 2.0,
    out: 6.0,
    ctx: 128000,
    features: ["chat", "streaming", "multilingual"],
    bedrock: true,
  },
};

export const MODELS: ModelPricing[] = Object.entries(BASE).map(([id, m]) => ({
  id,
  name: m.name,
  provider: m.provider,
  costPerMIn: m.in,
  costPerMOut: m.out,
  pricePerMIn: +(m.in * MARKUP).toFixed(4),
  pricePerMOut: +(m.out * MARKUP).toFixed(4),
  contextWindow: m.ctx,
  features: m.features,
  bedrock: m.bedrock,
  comingSoon: m.comingSoon,
}));

// Lookup helpers
const modelMap = new Map(MODELS.map((m) => [m.id, m]));

export function getModelPricing(modelId: string): ModelPricing {
  return modelMap.get(modelId) || modelMap.get("deepseek-chat")!;
}

export function calculateCost(modelId: string, tokensIn: number, tokensOut: number): number {
  const m = getModelPricing(modelId);
  return +(tokensIn / 1_000_000 * m.costPerMIn + tokensOut / 1_000_000 * m.costPerMOut).toFixed(8);
}

export function calculateUserPrice(modelId: string, tokensIn: number, tokensOut: number): number {
  const m = getModelPricing(modelId);
  return +(tokensIn / 1_000_000 * m.pricePerMIn + tokensOut / 1_000_000 * m.pricePerMOut).toFixed(8);
}

export function formatPrice(costPerM: number): string {
  if (costPerM >= 3) return `$${costPerM.toFixed(2)}`;
  return `$${costPerM.toFixed(2)}`;
}
