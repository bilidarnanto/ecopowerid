import { NextRequest, NextResponse } from "next/server";

// POST /api/ai-render
// Body: { prompt: string }
// Uses Replicate API (FLUX.1 schnell) for fast photorealistic generation
export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const apiToken = process.env.REPLICATE_API_TOKEN;
    if (!apiToken) {
      return NextResponse.json(
        { error: "REPLICATE_API_TOKEN not configured. Add it to .env to enable AI rendering." },
        { status: 503 }
      );
    }

    // Use FLUX.1 schnell — fast, high quality, ~$0.003/image
    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
        Prefer: "wait",
      },
      body: JSON.stringify({
        version: "black-forest-labs/flux-schnell",
        input: {
          prompt,
          num_outputs: 1,
          aspect_ratio: "16:9",
          output_format: "webp",
          output_quality: 90,
          go_fast: true,
        },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Replicate API error:", err);
      return NextResponse.json(
        { error: `AI service error: ${response.status}` },
        { status: 502 }
      );
    }

    const prediction = await response.json();

    // FLUX schnell returns output as array of URLs
    const output = prediction.output;
    if (!output || !Array.isArray(output) || output.length === 0) {
      return NextResponse.json(
        { error: "No image generated" },
        { status: 500 }
      );
    }

    return NextResponse.json({ imageUrl: output[0] });
  } catch (e) {
    console.error("AI render error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
