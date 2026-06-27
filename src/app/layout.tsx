import type { Metadata } from "next";
import "bootstrap/dist/css/bootstrap.min.css";
import "./globals.css";
import SessionProvider from "@/components/SessionProvider";

export const metadata: Metadata = {
  title: "DagrAI — Claude & Every Model, One API",
  description:
    "Access Claude Opus, Sonnet, Haiku — plus DeepSeek, Llama, Mistral — through a single API at the lowest price. Pay only for what you use.",
  keywords: ["Claude API", "Anthropic API", "AI API", "LLM API", "model aggregation", "DeepSeek", "AI proxy"],
  openGraph: {
    title: "DagrAI — Claude & Every Model, One API",
    description: "Access Claude, DeepSeek, Llama, Mistral and more through one unified API at the lowest price.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-bs-theme="dark">
      <body className="d-flex flex-column min-vh-100">
        <SessionProvider>
          {children}
        </SessionProvider>
        <footer className="footer py-4 mt-auto">
          <div className="container">
            <div className="row align-items-center">
              <div className="col-md-6 text-center text-md-start">
                <span className="fw-semibold" style={{ color: "var(--text-primary)" }}>
                  DagrAI
                </span>{" "}
                &copy; {new Date().getFullYear()} — One API, Every Model.
              </div>
              <div className="col-md-6 text-center text-md-end mt-2 mt-md-0" style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
                <a href="/docs" className="text-decoration-none me-3" style={{ color: "var(--text-muted)" }}>
                  Docs
                </a>
                <a href="/pricing" className="text-decoration-none me-3" style={{ color: "var(--text-muted)" }}>
                  Pricing
                </a>
                <a href="#" className="text-decoration-none" style={{ color: "var(--text-muted)" }}>
                  Status
                </a>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
