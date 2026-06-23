import { NextResponse } from "next/server";
import { MODELS } from "@/lib/pricing";

export async function GET() {
  const data = MODELS.map((m) => ({
    id: m.id,
    object: "model",
    owned_by: m.provider,
    pricing: {
      input: m.pricePerMIn,
      output: m.pricePerMOut,
    },
    context_window: m.contextWindow,
    features: m.features,
  }));

  return NextResponse.json({
    object: "list",
    data,
  });
}
