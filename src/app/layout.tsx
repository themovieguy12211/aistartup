import type { Metadata } from "next";
import "bootstrap/dist/css/bootstrap.min.css";
import "./globals.css";
import SessionProvider from "@/components/SessionProvider";

export const metadata: Metadata = {
  title: "SonixAI — One API for Every Model",
  description:
    "Access DeepSeek, Claude, Llama, Mistral, and more through a single API — at the lowest possible price. Pay only for what you use.",
  keywords: ["AI API", "LLM API", "model aggregation", "DeepSeek", "Claude", "AI proxy"],
  openGraph: {
    title: "SonixAI — One API for Every Model",
    description: "Access every major AI model through one unified API at the lowest price.",
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
                <span className="fw-bold" style={{ color: "var(--brand-purple)" }}>
                  SonixAI
                </span>{" "}
                &copy; {new Date().getFullYear()} — One API, Every Model.
              </div>
              <div className="col-md-6 text-center text-md-end mt-2 mt-md-0">
                <a href="/docs" className="text-decoration-none me-3" style={{ color: "rgba(255,255,255,0.4)" }}>
                  Docs
                </a>
                <a href="/pricing" className="text-decoration-none me-3" style={{ color: "rgba(255,255,255,0.4)" }}>
                  Pricing
                </a>
                <a href="#" className="text-decoration-none" style={{ color: "rgba(255,255,255,0.4)" }}>
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
