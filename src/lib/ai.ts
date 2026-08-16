// Adapter AI untuk saran harga pasar.
// Mendukung endpoint OpenAI-compatible: OpenAI, gateway lain, atau Ollama lokal
// (cukup set AI_BASE_URL ke http://<host>:11434/v1).

export type AiPriceSuggestion = {
  code: string;
  suggestedPrice: number;
  rangeLow: number;
  rangeHigh: number;
  reasoning: string;
};

export type AiComponentInput = {
  code: string;
  nameId: string;
  nameEn: string;
  category: string;
  unit: string;
  price: number;
};

export function isAiConfigured(): boolean {
  return Boolean(process.env.AI_API_KEY && process.env.AI_MODEL);
}

function buildPrompt(components: AiComponentInput[]): string {
  const list = components
    .map(
      (c) =>
        `- ${c.code} | ${c.nameEn} (${c.nameId}) | kategori: ${c.category} | satuan: ${c.unit} | harga saat ini: Rp ${c.price.toLocaleString("id-ID")}`
    )
    .join("\n");

  return `Kamu adalah analis harga pasar komponen campervan, motorhome, food truck, dan sistem PLTS (tenaga surya) di Indonesia.

Berikut daftar komponen dengan harga saat ini. Berikan ESTIMASI HARGA PASAR TERKINI dalam Rupiah (IDR) untuk masing-masing komponen, berdasarkan pengetahuanmu tentang harga pasar Indonesia tahun 2025/2026.

${list}

Balas HANYA dengan JSON array, tanpa teks lain, tanpa markdown, format persis:
[
  {
    "code": "<kode komponen>",
    "suggestedPrice": <angka harga pasar dalam IDR>,
    "rangeLow": <harga terendah estimasi>,
    "rangeHigh": <harga tertinggi estimasi>,
    "reasoning": "<1-2 kalimat singkat alasan, dalam Bahasa Indonesia>"
  }
]

PENTING:
- "code" harus persis sama dengan kode di daftar.
- Sertakan SEMUA komponen dari daftar.
- Jika tidak yakin, beri estimasi rentang yang wajar dan tandai di reasoning bahwa perlu verifikasi manual.`;
}

function extractJsonArray(text: string): unknown {
  const cleaned = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  const start = cleaned.indexOf("[");
  const end = cleaned.lastIndexOf("]");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("JSON array tidak ditemukan di respons AI");
  }
  return JSON.parse(cleaned.slice(start, end + 1));
}

async function callChat(
  messages: { role: string; content: string }[],
  jsonMode: boolean
): Promise<string> {
  const baseUrl = (process.env.AI_BASE_URL ?? "https://api.openai.com/v1").replace(
    /\/$/,
    ""
  );
  const body: Record<string, unknown> = {
    model: process.env.AI_MODEL,
    messages,
    temperature: 0.3,
    max_tokens: 4000,
  };
  if (jsonMode) {
    body.response_format = { type: "json_object" };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 90_000);

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.AI_API_KEY}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`AI API ${res.status}: ${errText.slice(0, 300)}`);
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== "string" || !content.trim()) {
      throw new Error("Respons AI kosong");
    }
    return content;
  } finally {
    clearTimeout(timer);
  }
}

/** Minta saran harga pasar dari AI untuk daftar komponen. */
export async function suggestMarketPrices(
  components: AiComponentInput[]
): Promise<AiPriceSuggestion[]> {
  if (components.length === 0) return [];
  const prompt = buildPrompt(components);

  let raw: string;
  try {
    raw = await callChat(
      [
        { role: "system", content: "Kamu adalah analis harga pasar Indonesia yang teliti. Selalu balas hanya dengan JSON." },
        { role: "user", content: prompt },
      ],
      true
    );
  } catch {
    // Beberapa model (mis. Ollama) tidak mendukung response_format — coba tanpa JSON mode
    raw = await callChat(
      [
        { role: "system", content: "Kamu adalah analis harga pasar Indonesia yang teliti. Balas hanya dengan JSON array." },
        { role: "user", content: prompt },
      ],
      false
    );
  }

  const parsed = extractJsonArray(raw);
  if (!Array.isArray(parsed)) {
    throw new Error("AI tidak mengembalikan array JSON");
  }

  const validCodes = new Set(components.map((c) => c.code));
  const suggestions: AiPriceSuggestion[] = [];

  for (const item of parsed) {
    const rec = item as Partial<AiPriceSuggestion>;
    if (!rec || typeof rec.code !== "string" || !validCodes.has(rec.code)) continue;
    const suggested = Number(rec.suggestedPrice);
    if (!Number.isFinite(suggested) || suggested <= 0) continue;
    suggestions.push({
      code: rec.code,
      suggestedPrice: Math.round(suggested),
      rangeLow: Math.round(Number(rec.rangeLow) || suggested * 0.85),
      rangeHigh: Math.round(Number(rec.rangeHigh) || suggested * 1.15),
      reasoning: typeof rec.reasoning === "string" ? rec.reasoning.slice(0, 500) : "",
    });
  }

  return suggestions;
}
