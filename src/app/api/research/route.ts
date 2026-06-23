import { NextRequest, NextResponse } from "next/server";

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  content?: string;
}

interface GitHubInfo {
  type: "github";
  name: string;
  description: string;
  techStack: string[];
  files: string[];
  readme: string;
  url: string;
}

interface ResearchData {
  steps: string[];
  github?: GitHubInfo;
  directUrls: { url: string; title: string; content: string }[];
  searchResults: SearchResult[];
  fetchedPages: { url: string; title: string; content: string }[];
}

function extractUrls(text: string): string[] {
  const regex = /https?:\/\/[^\s\]\)>"]+/g;
  return [...new Set(text.match(regex) || [])];
}

function isGitHubUrl(url: string): { owner: string; repo: string } | null {
  const match = url.match(/github\.com\/([^\/]+)\/([^\/\s?#]+)/);
  return match ? { owner: match[1], repo: match[2].replace(/\.git$/, "") } : null;
}

function stripHtml(html: string, maxLen = 10000): string {
  let text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "")
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
    .replace(/<svg[^>]*>[\s\S]*?<\/svg>/gi, "")
    .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length > maxLen) text = text.slice(0, maxLen) + "... [truncated]";
  return text;
}

function extractTitle(html: string): string {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match ? match[1].trim() : "Untitled";
}

async function fetchPage(url: string, retries = 1): Promise<{ title: string; content: string } | null> {
  const userAgents = [
    "Mozilla/5.0 (compatible; AragoniteAI/1.0; +https://aragoniteai.dev)",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  ];

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 12000);
      const ua = userAgents[attempt % userAgents.length];
      const res = await fetch(url, {
        signal: ctrl.signal,
        headers: {
          "User-Agent": ua,
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
        },
      });
      clearTimeout(t);

      if (!res.ok) continue;
      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("text/html") && !contentType.includes("application/xhtml")) continue;

      const html = await res.text();
      const content = stripHtml(html);
      if (content.length < 150) continue; // too short = paywall or JS-only page
      return { title: extractTitle(html), content };
    } catch {
      continue;
    }
  }
  return null;
}

async function fetchGitHubRepo(owner: string, repo: string): Promise<GitHubInfo | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);

    // Fetch repo page for overview
    const pageRes = await fetch(`https://github.com/${owner}/${repo}`, {
      signal: ctrl.signal,
      headers: { "User-Agent": "AragoniteAI-Research/1.0" },
    });
    clearTimeout(t);
    if (!pageRes.ok) return null;

    const html = await pageRes.text();

    // Extract description
    const descMatch = html.match(/<p[^>]*class="[^"]*f4[^"]*"[^>]*>([^<]+)<\/p>/);
    const description = descMatch ? descMatch[1].trim() : "";

    // Extract file list from the page
    const fileMatches = html.matchAll(/title="([^"]+)"[^>]*aria-label="([^"]+)"/g);
    const files: string[] = [];
    for (const m of fileMatches) {
      if (!m[1].includes("..")) files.push(m[1]);
    }
    const uniqueFiles = [...new Set(files)].slice(0, 30);

    // Try to fetch README raw
    let readme = "";
    try {
      const rawRes = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/main/README.md`);
      if (rawRes.ok) readme = await rawRes.text();
      else {
        const masterRes = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/master/README.md`);
        if (masterRes.ok) readme = await masterRes.text();
      }
    } catch {}

    // Try to fetch package.json for tech stack
    let techStack: string[] = [];
    try {
      const pkgRes = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/main/package.json`);
      if (pkgRes.ok) {
        const pkg = await pkgRes.json();
        const deps = { ...pkg.dependencies, ...pkg.devDependencies };
        techStack = Object.keys(deps || {}).slice(0, 20);
      }
    } catch {}

    // Try requirements.txt or Cargo.toml
    if (techStack.length === 0) {
      try {
        const reqRes = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/main/requirements.txt`);
        if (reqRes.ok) {
          const txt = await reqRes.text();
          techStack = txt.split("\n").filter((l) => l.trim() && !l.startsWith("#")).slice(0, 15);
        }
      } catch {}
    }

    return {
      type: "github",
      name: `${owner}/${repo}`,
      description,
      techStack,
      files: uniqueFiles,
      readme: readme.slice(0, 5000), // first 5000 chars of README
      url: `https://github.com/${owner}/${repo}`,
    };
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  const deep = req.nextUrl.searchParams.get("deep") !== "false";

  if (!q) return NextResponse.json({ error: "Missing q param" }, { status: 400 });

  const apiKey = process.env.SERPER_API_KEY;
  const data: ResearchData = { steps: [], directUrls: [], searchResults: [], fetchedPages: [] };
  const steps: string[] = [];

  try {
    // 1. Check for GitHub URLs
    const urls = extractUrls(q);
    for (const url of urls) {
      const gh = isGitHubUrl(url);
      if (gh) {
        steps.push(`reading repo: ${gh.owner}/${gh.repo}...`);
        const ghInfo = await fetchGitHubRepo(gh.owner, gh.repo);
        if (ghInfo) {
          data.github = ghInfo;
          steps.push(`repo read ✓ (${ghInfo.files.length} files, README ${ghInfo.readme.length} chars)`);
        } else {
          steps.push(`repo fetch failed — will use search results`);
        }
      }
    }

    // 2. Fetch any non-GitHub URLs directly
    const nonGitHubUrls = urls.filter((u) => !isGitHubUrl(u));
    if (nonGitHubUrls.length > 0) {
      steps.push(`fetching ${nonGitHubUrls.length} linked page(s)...`);
      const directFetches = await Promise.all(
        nonGitHubUrls.slice(0, 3).map(async (url) => {
          const page = await fetchPage(url, 1);
          return page ? { url, title: page.title, content: page.content } : null;
        })
      );
      data.directUrls = directFetches.filter(Boolean) as ResearchData["directUrls"];
      steps.push(`${data.directUrls.length} page(s) fetched ✓`);
    }

    // 3. Web search
    if (apiKey && apiKey !== "your-serper-key-here") {
      steps.push(`searching web for context...`);
      const searchRes = await fetch("https://google.serper.dev/search", {
        method: "POST",
        headers: { "X-API-KEY": apiKey, "Content-Type": "application/json" },
        body: JSON.stringify({ q, num: 8 }),
      });
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        data.searchResults = (searchData.organic || []).map(
          (r: { title: string; link: string; snippet: string }) => ({
            title: r.title, url: r.link, snippet: r.snippet,
          })
        );
        steps.push(`${data.searchResults.length} results found ✓`);
      }
    }

    // 4. Deep research — fetch top pages
    if (deep && data.searchResults.length > 0) {
      steps.push(`reading top ${Math.min(5, data.searchResults.length)} sources (full page)...`);
      const top = data.searchResults.slice(0, 5);
      const pages = await Promise.all(
        top.map(async (r) => {
          const page = await fetchPage(r.url, 1);
          return page ? { url: r.url, title: page.title, content: page.content } : null;
        })
      );
      data.fetchedPages = pages.filter(Boolean) as ResearchData["fetchedPages"];
      steps.push(`${data.fetchedPages.length} sources read ✓`);
    }

    steps.push(`research complete — ${data.github ? "repo analyzed" : ""} ${data.fetchedPages.length} sources deep-read`);
    data.steps = steps;

    return NextResponse.json(data);
  } catch (error) {
    console.error("Research error:", error);
    data.steps = [...steps, "partial failure — using available data"];
    return NextResponse.json(data, { status: 200 });
  }
}
