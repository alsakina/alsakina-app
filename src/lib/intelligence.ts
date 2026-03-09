// lib/intelligence.ts
// ─────────────────────────────────────────────────
// All Anthropic API calls for the app.
// For now (single-user), calls Anthropic directly.
// When going public, swap for a backend proxy.
// ─────────────────────────────────────────────────

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_API_KEY = process.env.EXPO_PUBLIC_CLAUDE_API_KEY;
const MODEL = "claude-sonnet-4-20250514";

/* ══════════════════════════════════════════════════
   Shared helpers
   ══════════════════════════════════════════════════ */

async function callClaude(
  system: string,
  userMessage: string,
  maxTokens = 1024
): Promise<string> {
  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: userMessage }],
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Anthropic API error ${response.status}: ${errBody}`);
  }

  const data = await response.json();

  const text = data.content
    .filter((block: any) => block.type === "text")
    .map((block: any) => block.text)
    .join("");

  return text.replace(/```json|```/g, "").trim();
}

/* ══════════════════════════════════════════════════
   1. Spiritual Guidance (Home Screen)
   ══════════════════════════════════════════════════ */

export interface DivineName {
  arabic: string;
  transliteration: string;
  meaning: string;
  explanation: string;
}

export interface SpiritualGuidance {
  names: DivineName[];
  closingReflection: string;
}

const GUIDANCE_SYSTEM = `You are a knowledgeable, compassionate Islamic spiritual companion.

When a user shares what they are feeling or going through, respond with 2–4 of the 99 Names of Allah (Asma ul-Husna) that are most relevant.

For EACH Name provide:
• arabic – the Name in Arabic script
• transliteration – how it is pronounced in English letters
• meaning – a short English meaning (2-5 words)
• explanation – 2-3 warm, concise sentences explaining how this Name connects to the user's situation and how reflecting on it should bring them comfort, clarity, or hope. Speak to the heart, not the intellect. Avoid being preachy.

Also provide a closingReflection: one brief, uplifting sentence that ties the Names together for the user.

Respond ONLY with valid JSON — no markdown, no backticks, no preamble:
{
  "names": [
    { "arabic": "...", "transliteration": "...", "meaning": "...", "explanation": "..." }
  ],
  "closingReflection": "..."
}`;

export async function fetchSpiritualGuidance(
  userInput: string
): Promise<SpiritualGuidance> {
  const raw = await callClaude(GUIDANCE_SYSTEM, userInput);
  const parsed = JSON.parse(raw);

  return {
    names: parsed.names.map((n: any) => ({
      arabic: n.arabic,
      transliteration: n.transliteration,
      meaning: n.meaning,
      explanation: n.explanation,
    })),
    closingReflection: parsed.closingReflection ?? "",
  };
}

/* ══════════════════════════════════════════════════
   2. Name Detail (Learn Screen → Detail)
   ══════════════════════════════════════════════════ */

export interface QuranicVerse {
  arabic?: string;
  translation: string;
  reference: string;
}

export interface PropheticStory {
  title: string;
  narrative: string;
}

export interface Dua {
  arabic?: string;
  translation: string;
  source?: string;
}

export interface NameDetail {
  overview: string;
  quranicVerses: QuranicVerse[];
  propheticStories: PropheticStory[];
  applicationToday: string;
  dua?: Dua;
}

const DETAIL_SYSTEM = `You are an Islamic scholar providing rich, accurate educational content about the 99 Names of Allah.

When given a Name of Allah, return a detailed JSON response covering:

1. overview: 3-4 sentences explaining what this Name means, its linguistic root in Arabic, and its theological significance.

2. quranicVerses: 2-3 Quranic verses where this Name appears or where its meaning is clearly demonstrated. For each verse provide:
   - arabic (optional): the Arabic text of the key phrase or short verse
   - translation: an English translation of the verse
   - reference: the Surah name and verse number (e.g. "Surah Al-Baqarah 2:255")

3. propheticStories: 1-2 stories from the Quran or the lives of the Prophets that vividly illustrate this Name in action. Each should have:
   - title: a descriptive title
   - narrative: 3-5 sentences telling the story and connecting it to the Name

4. applicationToday: 2-3 sentences on how a Muslim can reflect on and embody this Name in their daily life today.

5. dua (optional): a du'a from the Quran or Sunnah related to this Name, with:
   - arabic (optional): the Arabic text
   - translation: English translation
   - source: where it comes from (e.g. "Sahih Muslim", "Quran 3:8")

Be accurate with Quranic references. Use warm, accessible language. Do not fabricate verses.
Provide a DIFFERENT perspective than what might already exist — explore lesser-known angles, different Quranic verses, or different prophetic stories when possible.

Respond ONLY with valid JSON — no markdown, no backticks, no preamble:
{
  "overview": "...",
  "quranicVerses": [
    { "arabic": "...", "translation": "...", "reference": "..." }
  ],
  "propheticStories": [
    { "title": "...", "narrative": "..." }
  ],
  "applicationToday": "...",
  "dua": { "arabic": "...", "translation": "...", "source": "..." }
}`;

export async function fetchNameDetail(
  transliteration: string,
  arabic: string,
  meaning: string
): Promise<NameDetail> {
  const prompt = `Tell me about the Name of Allah: ${transliteration} (${arabic}) — "${meaning}"`;
  const raw = await callClaude(DETAIL_SYSTEM, prompt, 2048);
  const parsed = JSON.parse(raw);

  return {
    overview: parsed.overview,
    quranicVerses: (parsed.quranicVerses || []).map((v: any) => ({
      arabic: v.arabic,
      translation: v.translation,
      reference: v.reference,
    })),
    propheticStories: (parsed.propheticStories || []).map((s: any) => ({
      title: s.title,
      narrative: s.narrative,
    })),
    applicationToday: parsed.applicationToday,
    dua: parsed.dua
      ? {
          arabic: parsed.dua.arabic,
          translation: parsed.dua.translation,
          source: parsed.dua.source,
        }
      : undefined,
  };
}