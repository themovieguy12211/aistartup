// Smart query classifier — decides if a message needs web search or deep research.
// Saves Serper costs and prevents "hi" from triggering a full research session.

export function shouldSearchWeb(query: string): boolean {
  const q = query.trim();
  if (q.length < 4) return false;
  if (q.length > 500) return true; // long queries often need research

  // Always search: URLs, code repos, specific domains
  if (/https?:\/\//.test(q)) return true;
  if (/github\.com\/\w+\/\w+/.test(q)) return true;

  // Always search: time-sensitive or factual queries
  if (/\b(today|current|latest|recent|news|202[4-9]|202[4-9])\b/i.test(q)) return true;
  if (/\b(who|what|where|when|why|how|is there|are there|does|do)\b/i.test(q)) return true;
  if (/\b(price|cost|stock|market|funding|raised|acquired|launched|released|announced)\b/i.test(q)) return true;

  // Never search: greetings, small talk, meta
  const noSearch = [
    /^(hi|hey|hello|yo|sup|heyy|hii|hiya)[\s!.,]*$/i,
    /^(good\s?(morning|afternoon|evening|night))[\s!.,]*$/i,
    /^(thanks|thank you|ok|okay|bye|goodbye|see ya|cya)[\s!.,]*$/i,
    /^(how are you|what'?s up|whats up|how's it going)[\s!.,?]*$/i,
    /^(who are you|what are you|what can you do|help)[\s!.,?]*$/i,
    /^(what model|which model|who made you|are you|you are)[\s!.,?]*$/i,
  ];
  for (const pattern of noSearch) {
    if (pattern.test(q)) return false;
  }

  // Code-related: check for code indicators, don't search
  const codeIndicators = [
    /```[\s\S]*```/,
    /\b(function|def |class |import |const |let |var |export |npm |pip |git |docker|curl)\b/,
    /\b(debug|fix|refactor|write|code|implement|build|create)\s+(a |the |an )?(function|script|app|api|component|server|endpoint|route)/i,
    /\b(error|bug|issue|broken|failing|not working|crash)\b/i,
    /\.[a-z]{2,4}\b.*\.(js|ts|py|rb|go|rs|java|cpp|c|html|css|sql)/,
  ];
  for (const pattern of codeIndicators) {
    if (pattern.test(q)) return false;
  }

  // Medium-length questions with question marks → probably needs search
  if (q.includes("?") && q.length > 30) return true;

  // Default: skip search for conversation, enable for longer queries
  return q.length > 100;
}

export function shouldDeepResearch(query: string): boolean {
  const q = query.trim();
  if (!shouldSearchWeb(q)) return false;

  // Deep research for complex multi-step queries
  if (/\b(compare|versus|vs\.?|difference between|pros and cons|best|top \d+|rank|review)\b/i.test(q)) return true;
  if (/\b(analy[sz]e|research|investigate|find|check if|verify|fact.check|is it true|confirm)\b/i.test(q)) return true;
  if (/\b(startup|company|trademark|domain|available|taken|exist)\b/i.test(q)) return true;
  if (q.length > 200) return true;

  return false;
}
