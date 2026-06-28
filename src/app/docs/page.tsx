"use client";

import { useState } from "react";
import { useSession } from "@/lib/use-session";
import Navbar from "@/components/Navbar";
import ChatNavbar from "@/components/ChatNavbar";
import { Container, Row, Col, Card, Badge } from "react-bootstrap";
import { MODELS } from "@/lib/pricing";

function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      style={{
        position: "absolute", top: "8px", right: "8px",
        background: "var(--bg-elevated)",
        border: "1px solid var(--border)",
        color: copied ? "#22c55e" : "var(--text-muted)",
        fontSize: "0.72rem",
        borderRadius: "4px",
        padding: "2px 8px",
        cursor: "pointer",
      }}
    >
      {copied ? "✓ Copied!" : "📋"}
    </button>
  );
}

function CodeBlock({ code, lang }: { code: string; lang?: string }) {
  return (
    <div className="position-relative mb-3" style={{
      background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: "8px", overflow: "hidden",
    }}>
      {lang && (
        <div className="px-3 py-2" style={{
          background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.05)",
          fontFamily: "'JetBrains Mono', monospace", fontSize: "0.7rem", color: "rgba(255,255,255,0.25)",
        }}>
          {lang}
        </div>
      )}
      <CopyButton code={code} />
      <pre style={{
        margin: 0, padding: "14px 44px 14px 16px", overflow: "auto",
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace", fontSize: "0.8rem",
        color: "rgba(255,255,255,0.75)", lineHeight: 1.6, whiteSpace: "pre-wrap",
      }}>
        <code>{code}</code>
      </pre>
    </div>
  );
}

const integrations = [
  {
    icon: "🖥️", title: "Claude Code", badge: "Anthropic",
    desc: "Full Claude Code CLI + VS Code support. One DagrAI key. All models — Claude, DeepSeek, Llama, Mistral.",
    lang: "~/.claude/settings.json",
    code: `{
  "env": {
    "ANTHROPIC_BASE_URL": "https://dagrai.xyz/api",
    "ANTHROPIC_AUTH_TOKEN": "sk-dagrai-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "ANTHROPIC_MODEL": "claude-sonnet-4-6",
    "ANTHROPIC_DEFAULT_OPUS_MODEL": "claude-opus-4-6",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "claude-sonnet-4-6",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "claude-haiku-4-5",
    "CLAUDE_CODE_SUBAGENT_MODEL": "deepseek-v4-flash",
    "CLAUDE_CODE_EFFORT_LEVEL": "max",
    "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1"
  }
}`,
  },
  {
    icon: "📝", title: "Cursor", badge: "OpenAI",
    desc: "Add as a custom model in Cursor settings. OpenAI-compatible endpoint.",
    lang: "Cursor Settings",
    code: `API Base URL: https://dagrai.xyz/api/v1
API Key: sk-dagrai-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Model ID: deepseek-v4-pro`,
  },
  {
    icon: "🔌", title: "Continue.dev", badge: "OpenAI",
    desc: "Open-source AI code assistant. Declare in your config.",
    lang: "~/.continue/config.json",
    code: `{
  "models": [{
    "title": "DagrAI V4 Pro",
    "provider": "openai",
    "model": "deepseek-v4-pro",
    "apiBase": "https://dagrai.xyz/api/v1",
    "apiKey": "sk-dagrai-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
  }]
}`,
  },
  {
    icon: "⚡", title: "Aider", badge: "OpenAI",
    desc: "AI pair programming. Switch models by changing --model flag. All models supported.",
    lang: "Terminal",
    code: `export OPENAI_API_BASE=https://dagrai.xyz/api/v1
export OPENAI_API_KEY=sk-dagrai-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
# Any model works — DeepSeek, Claude, Llama, Mistral
aider --model deepseek-v4-pro       # fast + 1M context
aider --model claude-sonnet-4-6     # best code generation 
aider --model deepseek-reasoner     # deep reasoning`,
  },
  {
    icon: "🐍", title: "OpenAI Python SDK", badge: "OpenAI",
    desc: "Drop-in replacement for OpenAI. Change base_url and go.",
    lang: "Python",
    code: `from openai import OpenAI

client = OpenAI(
    base_url="https://dagrai.xyz/api/v1",
    api_key="sk-dagrai-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
)

response = client.chat.completions.create(
    model="deepseek-v4-pro",
    messages=[{"role": "user", "content": "Hello!"}]
)
print(response.choices[0].message.content)`,
  },
  {
    icon: "📦", title: "OpenAI Node.js SDK", badge: "OpenAI",
    desc: "Same API, better prices. Swap the baseURL.",
    lang: "TypeScript",
    code: `import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "https://dagrai.xyz/api/v1",
  apiKey: "sk-dagrai-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
});

const response = await client.chat.completions.create({
  model: "deepseek-v4-pro",
  messages: [{ role: "user", content: "Hello!" }],
});`,
  },
  {
    icon: "▲", title: "Vercel AI SDK", badge: "OpenAI",
    desc: "The standard for Next.js AI apps. createOpenAI pointing to DagrAI.",
    lang: "TypeScript",
    code: `import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";

const dagrai = createOpenAI({
  baseURL: "https://dagrai.xyz/api/v1",
  apiKey: "sk-dagrai-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
});

const { text } = await generateText({
  model: dagrai("deepseek-v4-pro"),
  prompt: "Write a haiku about AI",
});`,
  },
];

export default function DocsPage() {
  const { data: session } = useSession();
  const [tab, setTab] = useState<"quickstart" | "integrations" | "reference" | "pricing">("quickstart");

  const tabs = [
    { id: "quickstart" as const, label: "Quick Start", icon: "⚡" },
    { id: "integrations" as const, label: "Integrations", icon: "🔌" },
    { id: "reference" as const, label: "API Reference", icon: "📡" },
    { id: "pricing" as const, label: "Pricing", icon: "💰" },
  ];

  return (
    <>
      {session ? <ChatNavbar credits={null} onCreditsChange={() => {}} /> : <Navbar />}
      <main className="py-5">
        <Container style={{ maxWidth: "960px" }}>
          {/* Header */}
          <div className="text-center mb-4">
            <h1 className="display-5 fw-bold mb-1">API Documentation</h1>
            <p style={{ color: "rgba(255,255,255,0.5)", maxWidth: "550px", margin: "0 auto" }}>
              One endpoint. Every model. OpenAI + Anthropic compatible.
            </p>
          </div>

          {/* Tabs */}
          <div className="d-flex justify-content-center gap-1 mb-4">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  background: tab === t.id ? "rgba(139,92,246,0.15)" : "rgba(255,255,255,0.03)",
                  border: tab === t.id ? "1px solid rgba(139,92,246,0.3)" : "1px solid rgba(255,255,255,0.08)",
                  color: tab === t.id ? "#e4e4e7" : "rgba(255,255,255,0.4)",
                  padding: "8px 18px", borderRadius: "6px",
                  cursor: "pointer", fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "0.82rem", transition: "all 0.15s",
                }}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {/* Tab: Quick Start */}
          {tab === "quickstart" && (
          <>

          {/* Quick Start */}
          <Card className="mb-4" style={{ border: "1px solid rgba(34,197,94,0.15)" }}>
            <Card.Header style={{ background: "rgba(34,197,94,0.06)", borderBottom: "1px solid rgba(34,197,94,0.1)" }}>
              <span className="fw-bold" style={{ color: "#22c55e" }}>⚡ Quick Start</span>
            </Card.Header>
            <Card.Body>
              <div className="mb-3">
                <Badge bg="secondary" className="mb-2">1</Badge>{" "}
                <span className="fw-semibold">Get an API key</span>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.9rem", marginTop: "4px" }}>
                  Sign up at dagrai.xyz → Dashboard → API Keys → Create. Copy your key (shown once).
                </p>
              </div>
              <div className="mb-3">
                <Badge bg="secondary" className="mb-2">2</Badge>{" "}
                <span className="fw-semibold">Make a request</span>
              </div>
              <CodeBlock
                lang="bash"
                code={`curl https://dagrai.xyz/api/v1/chat/completions \\
  -H "Authorization: Bearer sk-dagrai-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "deepseek-v4-pro",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'`}
              />
              <div>
                <Badge bg="secondary" className="mb-2">3</Badge>{" "}
                <span className="fw-semibold">Response</span>
              </div>
              <CodeBlock
                lang="json"
                code={`{
  "choices": [{
    "message": {
      "role": "assistant",
      "content": "Hello! How can I help you today?"
    }
  }],
  "usage": { "prompt_tokens": 10, "completion_tokens": 8, "total_tokens": 18 },
  "dagrai": {
    "model": "deepseek-v4-pro",
    "provider": "deepseek",
    "cost": "$0.000012",
    "credits_remaining": 0.9998,
    "latency_ms": 187
  }
}`}
              />
            </Card.Body>
          </Card>

          </>
          )}

          {/* Tab: Integrations */}
          {tab === "integrations" && (
          <>
          <div className="p-3 mb-4 rounded" style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.15)", fontSize: "0.85rem", color: "rgba(255,255,255,0.6)" }}>
            <strong style={{ color: "var(--brand-purple)" }}>Available models — swap any ID in the examples below:</strong><br/>
            <div className="mt-2" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.8rem", lineHeight: "2" }}>
              <code style={{ color: "#22c55e" }}>deepseek-v4-pro</code> · <code style={{ color: "#22c55e" }}>deepseek-v4-flash</code> · <code style={{ color: "#22c55e" }}>deepseek-reasoner</code> · <code style={{ color: "#22c55e" }}>deepseek-chat</code><br/>
              <code style={{ color: "#8b5cf6" }}>claude-opus-4-6</code> ⚡ · <code style={{ color: "#8b5cf6" }}>claude-sonnet-4-6</code> ⚡ · <code style={{ color: "#8b5cf6" }}>claude-haiku-4-5</code> ⚡<br/>
              <code style={{ color: "#eab308" }}>llama-4-maverick</code> ⚡ · <code style={{ color: "#eab308" }}>llama-3.1-70b</code> ⚡ · <code style={{ color: "#eab308" }}>mistral-large</code> ⚡
            </div>
            <div className="mt-2" style={{ fontSize: "0.78rem" }}></div>
          </div>
          <h3 className="fw-bold mb-3">🔌 Integrations</h3>
          <Row>
            {integrations.map((item) => (
              <Col md={6} key={item.title} className="mb-3">
                <Card className="h-100" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
                  <Card.Body className="d-flex flex-column">
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <span className="fs-4">{item.icon}</span>
                      <h6 className="fw-bold mb-0">{item.title}</h6>
                      <Badge bg="secondary" style={{ fontSize: "0.65rem" }}>{item.badge}</Badge>
                    </div>
                    <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.85rem", flexGrow: 1 }}>
                      {item.desc}
                    </p>
                    <CodeBlock code={item.code} lang={item.lang} />
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>

          </>
          )}

          {/* Tab: API Reference */}
          {tab === "reference" && (
          <>
          <h3 className="fw-bold mb-3">📡 Endpoints</h3>
          <Row className="mb-4">
            {[
              { method: "POST", path: "/v1/chat/completions", color: "#22c55e", desc: "Chat completion. OpenAI-compatible. Supports streaming (SSE) and function calling." },
              { method: "POST", path: "/v1/messages", color: "#8b5cf6", desc: "Messages endpoint. Anthropic-compatible. Works with Claude Code, Anthropic SDK." },
              { method: "GET", path: "/v1/models", color: "#3b82f6", desc: "List all available models with pricing and context windows." },
            ].map((ep) => (
              <Col md={4} key={ep.path} className="mb-2">
                <div className="p-3 rounded" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", height: "100%" }}>
                  <Badge style={{ background: ep.color, border: "none", fontSize: "0.7rem", marginBottom: "6px" }}>
                    {ep.method}
                  </Badge>
                  <code style={{ display: "block", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.85rem", color: "#e4e4e7", margin: "4px 0" }}>
                    {ep.path}
                  </code>
                  <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.8rem", margin: 0 }}>
                    {ep.desc}
                  </p>
                </div>
              </Col>
            ))}
          </Row>

          {/* Model Pricing */}
          </>
          )}

          {/* Tab: Pricing */}
          {tab === "pricing" && (
          <>
          <h3 className="fw-bold mb-3">💰 Models & Pricing</h3>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.9rem" }}>
            All prices = provider cost + 15%. If you find a cheaper aggregator, we&apos;ll match it.
          </p>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Model ID</th>
                  <th>Context</th>
                  <th>Input / 1M tok</th>
                  <th>Output / 1M tok</th>
                  <th>Features</th>
                </tr>
              </thead>
              <tbody>
                {MODELS.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <code style={{ fontFamily: "'JetBrains Mono', monospace", color: "#e4e4e7" }}>{m.id}</code>
                      {m.comingSoon && <Badge bg="secondary" style={{ fontSize: "0.6rem", marginLeft: "6px" }}>Soon</Badge>}
                    </td>
                    <td>{(m.contextWindow / 1000).toFixed(0)}k{m.contextWindow >= 1000000 ? " (1M)" : ""}</td>
                    <td style={{ color: "#22c55e" }}>${m.pricePerMIn.toFixed(2)}</td>
                    <td style={{ color: "#22c55e" }}>${m.pricePerMOut.toFixed(2)}</td>
                    <td>
                      {m.features.map((f) => (
                        <Badge key={f} bg="secondary" style={{ fontSize: "0.6rem", marginRight: "3px", background: "rgba(255,255,255,0.08)" }}>
                          {f}
                        </Badge>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ color: "rgba(255,255,255,0.2)", fontSize: "0.75rem", textAlign: "center" }}>
            Provider costs may fluctuate. We always pass savings to you. Pay only for what you use — no monthly minimum.
          </p>
          </>
          )}
        </Container>
      </main>
    </>
  );
}
