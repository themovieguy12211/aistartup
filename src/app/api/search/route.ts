import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  if (!q) return NextResponse.json({ error: "Missing q param" }, { status: 400 });

  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Search not configured" }, { status: 503 });

  try {
    const res = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "X-API-KEY": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ q, num: 8 }),
    });

    if (!res.ok) throw new Error(`Serper: ${res.status}`);

    const data = await res.json();

    // Return simplified results
    const results = (data.organic || []).map((r: { title: string; link: string; snippet: string }) => ({
      title: r.title,
      url: r.link,
      snippet: r.snippet,
    }));

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
