// Smart model router — picks the best model for each query type.
// Users can always override by selecting manually.

interface RouteResult {
  model: string;
  reason: string;
  systemPrompt: string;
  maxContextTokens: number;
}

const PROMPTS = {
  reasoner: `You are an AI reasoning engine. Think step by step. Break complex problems into parts. Show your work. Be precise and thorough. Use logical chains. When uncertain, acknowledge it rather than guessing.`,
  coder: `You are an expert software engineer. Write production-quality code with proper error handling, types, tests, and documentation. Think about edge cases, performance, and security. Explain your architectural decisions.`,
  fast: `You are a fast, efficient assistant. Be concise. Get straight to the point. Use bullet points when listing. Prioritize clarity over elaboration.`,
  general: `You are a helpful AI assistant. You have access to web search results and deep research capabilities. Use them to give accurate, well-cited answers. Be thorough but not verbose.`,
  creative: `You are a creative AI strategist. Think outside the box. Generate novel ideas, names, and approaches. Evaluate trade-offs. Consider second-order effects.`,
};

export function routeModel(query: string, selectedModels: string[]): RouteResult {
  const q = query.trim();
  const primary = selectedModels[0];

  // If user manually picked a specific model, respect it
  if (selectedModels.length === 1 && primary !== "deepseek-chat") {
    return getModelConfig(primary, q);
  }

  return autoRoute(q);
}

function autoRoute(q: string): RouteResult {
  // Code/development → Claude Sonnet (best coding model)
  if (/\b(code|function|debug|refactor|implement|build|create|write|fix|error|bug|script|program|app|api|component|server|endpoint|route|database|query|sql|css|html|react|next|node|python|typescript|rust|go)\b/i.test(q) && q.length > 20) {
    return { model: "claude-sonnet-4-6", reason: "code generation", systemPrompt: PROMPTS.coder, maxContextTokens: 8000 };
  }

  // Math/logic/reasoning → Claude Sonnet
  if (/\b(calculate|solve|proof|prove|logic|math|equation|why|explain|analyze|compare|versus|vs)\b/i.test(q)) {
    return { model: "claude-sonnet-4-6", reason: "reasoning/analysis", systemPrompt: PROMPTS.reasoner, maxContextTokens: 6000 };
  }

  // Creative/brainstorming → Claude Opus
  if (/\b(name|brand|create|design|idea|brainstorm|creative|strategy|marketing|pitch|startup|logo|tagline)\b/i.test(q)) {
    return { model: "claude-opus-4-6", reason: "creative generation", systemPrompt: PROMPTS.creative, maxContextTokens: 8000 };
  }

  // Short/quick questions → DeepSeek Flash (cheap + fast)
  if (q.length < 50 && !q.includes("?")) {
    return { model: "deepseek-v4-flash", reason: "quick response", systemPrompt: PROMPTS.fast, maxContextTokens: 2000 };
  }

  // Research/deep analysis → Claude Opus
  if (q.length > 100 || /\b(research|analysis|report|summary|explain|detail|thorough|comprehensive|overview)\b/i.test(q)) {
    return { model: "claude-sonnet-4-6", reason: "deep analysis", systemPrompt: PROMPTS.general, maxContextTokens: 16000 };
  }

  // Default → Claude Sonnet
  return { model: "claude-sonnet-4-6", reason: "general purpose", systemPrompt: PROMPTS.general, maxContextTokens: 6000 };
}

function getModelConfig(modelId: string, _q: string): RouteResult {
  switch (modelId) {
    case "claude-opus-4-6":
      return { model: modelId, reason: "manual (opus)", systemPrompt: PROMPTS.creative, maxContextTokens: 8000 };
    case "claude-sonnet-4-6":
      return { model: modelId, reason: "manual (sonnet)", systemPrompt: PROMPTS.general, maxContextTokens: 10000 };
    case "deepseek-reasoner":
      return { model: modelId, reason: "manual (reasoning)", systemPrompt: PROMPTS.reasoner, maxContextTokens: 4000 };
    case "deepseek-v4-pro":
      return { model: modelId, reason: "manual (pro)", systemPrompt: PROMPTS.general, maxContextTokens: 12000 };
    case "deepseek-v4-flash":
      return { model: modelId, reason: "manual (fast)", systemPrompt: PROMPTS.fast, maxContextTokens: 2000 };
    case "deepseek-chat":
      return { model: modelId, reason: "manual (legacy)", systemPrompt: PROMPTS.general, maxContextTokens: 2000 };
    default:
      return { model: modelId, reason: "manual", systemPrompt: PROMPTS.creative, maxContextTokens: 8000 };
  }
}
