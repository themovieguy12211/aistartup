import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-helpers";
import { saveMemory } from "@/lib/memory";

const ALLOWED_KEYS = new Set([
  "Name", "Role", "Language", "Tech", "Preference",
  "Project", "Location", "Experience", "Company", "Tech stack",
]);

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const { message, reply } = await req.json();

    if (!message || typeof message !== "string" || !reply || typeof reply !== "string") {
      return NextResponse.json({ facts: [] });
    }

    const sanitizedMessage = message.slice(0, 2000).replace(/[\r\n]+/g, " ");
    const sanitizedReply = reply.slice(0, 2000).replace(/[\r\n]+/g, " ");

    const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY || ""}`,
      },
      body: JSON.stringify({
        model: "deepseek-v4-flash",
        messages: [
          {
            role: "system",
            content: `You extract factual user profile data from conversations. Return ONLY a valid JSON array of {key, value} objects. Key MUST be one of: Name, Role, Language, Tech, Preference, Project, Location, Experience, Company, Tech stack. Extract definitive statements (I am, I use, I built, I work on, I will use, I plan to). Skip vague language (thinking of, maybe, considering, might). If nothing to save, return [].`,
          },
          {
            role: "user",
            content: `User said: "${sanitizedMessage}"\nAssistant replied: "${sanitizedReply}"`,
          },
        ],
        temperature: 0,
        max_tokens: 300,
      }),
    });

    if (!res.ok) return NextResponse.json({ facts: [] });

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || "[]";
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return NextResponse.json({ facts: [] });

    let parsed: unknown[];
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      return NextResponse.json({ facts: [] });
    }

    if (!Array.isArray(parsed)) return NextResponse.json({ facts: [] });

    const facts: { key: string; value: string }[] = [];
    for (const f of parsed) {
      if (
        f && typeof f === "object" &&
        "key" in f && "value" in f &&
        typeof (f as { key: unknown }).key === "string" &&
        typeof (f as { value: unknown }).value === "string" &&
        ALLOWED_KEYS.has((f as { key: string }).key) &&
        (f as { value: string }).value.length <= 200
      ) {
        const fact = { key: (f as { key: string }).key, value: (f as { value: string }).value };
        facts.push(fact);
        await saveMemory(user.id as string, fact.key, fact.value);
      }
    }

    return NextResponse.json({ facts });
  } catch (e) {
    if ((e as Error).message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ facts: [] });
  }
}
