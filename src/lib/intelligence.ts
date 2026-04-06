// lib/intelligence.ts
// ─────────────────────────────────────────────────
// All Anthropic API calls for the app.
// Calls go through a Supabase Edge Function proxy
// so the Anthropic API key never lives in the bundle.
// ─────────────────────────────────────────────────
 
import { supabase } from "./supabase";
 
const MODEL = "claude-sonnet-4-20250514";
 
/* ══════════════════════════════════════════════════
   Shared helpers
   ══════════════════════════════════════════════════ */
 
async function callClaude(
  system: string,
  userMessage: string,
  maxTokens = 1024
): Promise<string> {
  const { data, error } = await supabase.functions.invoke("claude-proxy", {
    body: {
      model: MODEL,
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: userMessage }],
    },
  });
 
  if (error) {
    // Extract the real message if available
    const msg = (error as any)?.context?.json?.error
      ?? (error as any)?.message
      ?? String(error);
    throw new Error(`Claude proxy error: ${msg}`);
  }
 
  const text = (data.content as any[])
    .filter((b: any) => b.type === "text")
    .map((b: any) => b.text)
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

/* ══════════════════════════════════════════════════
   3. Daily Content (Garden / Explore Screen)
   ══════════════════════════════════════════════════ */

/* ── Types ─────────────────────────────────────── */

export interface DailyHadith {
  arabic: string;
  english: string;
  source: string;        // e.g. "Sahih Bukhari 6137"
  explanation: string;   // thorough, simple explanation
  application: string;   // how to apply in daily life
}

export interface DailyVerseEntry {
  arabic: string;
  translation: string;
  reference: string;     // e.g. "Surah Al-Baqarah 2:152-153"
}

export interface DailyVerse {
  theme: string;         // e.g. "Patience in Hardship"
  verses: DailyVerseEntry[];
  explanation: string;
}

export interface DailyStory {
  title: string;
  category: string;      // e.g. "Story from the Quran", "From the Seerah", "Sunnah of the Prophet ﷺ"
  narrative: string;     // the full story, 5-8 sentences
  source?: string;       // e.g. "Surah Al-Kahf 18:60-82"
  lesson: string;        // the core lesson
  application: string;   // how to apply today
}

export interface DailyDua {
  arabic: string;
  transliteration: string;
  translation: string;
  source?: string;       // e.g. "Sahih Muslim", "Quran 3:8"
  benefits: string;      // what this du'a does for us
  bestTime: string;      // when to say it
  sincerity: string;     // how saying it with sincerity helps
}

/* ── System prompts (kept for direct API fallback) ── */

const DAILY_HADITH_SYSTEM = `You are a knowledgeable Islamic scholar. Provide a hadith of the day.

Choose an authentic hadith (from Sahih Bukhari, Sahih Muslim, or other widely accepted collections). Vary your selection — don't always pick the most famous ones.

Respond ONLY with valid JSON — no markdown, no backticks, no preamble:
{
  "arabic": "The full Arabic text of the hadith",
  "english": "The English translation",
  "source": "The exact source with book and number (e.g. Sahih Bukhari 6137)",
  "explanation": "A thorough yet simple-to-understand explanation of the hadith (4-6 sentences). Break down key words or phrases, explain context, and convey the deeper meaning.",
  "application": "How we can apply this hadith in our daily lives (3-4 sentences). Be practical and specific."
}`;

const DAILY_VERSE_SYSTEM = `You are a knowledgeable Islamic scholar. Provide a Quranic selection of the day.

Choose 1-3 consecutive or thematically linked verses that together explore a meaningful theme. Vary your selection widely.

Respond ONLY with valid JSON — no markdown, no backticks, no preamble:
{
  "theme": "A short theme title (e.g. 'Patience in Adversity', 'The Mercy of Allah', 'Gratitude')",
  "verses": [
    {
      "arabic": "The Arabic text of the verse",
      "translation": "The English translation",
      "reference": "Surah Name verse:number (e.g. Surah Al-Baqarah 2:152)"
    }
  ],
  "explanation": "A thorough yet simple-to-understand explanation of these verses (5-7 sentences). Explain the context of revelation if relevant, break down the meaning, and highlight the theme."
}`;

const DAILY_STORY_SYSTEM = `You are a knowledgeable Islamic scholar and storyteller. Provide a story/narration of the day.

This can be:
- A story from the Quran (prophets, peoples, parables)
- A narration from the life of Prophet Muhammad ﷺ (Seerah)
- A Sunnah practice of the Prophet ﷺ with its backstory
- A narration from widely accepted scholars about the Companions

Vary your selection. Tell lesser-known stories too, not just the most famous ones.

Respond ONLY with valid JSON — no markdown, no backticks, no preamble:
{
  "title": "A descriptive title for the story",
  "category": "Story from the Quran | From the Seerah | Sunnah of the Prophet ﷺ | From the Companions",
  "narrative": "The full story told engagingly and clearly (6-10 sentences). Set the scene, tell what happened, and convey emotion.",
  "source": "The source reference if applicable (e.g. Surah Al-Kahf 18:60-82, Sahih Bukhari, etc.)",
  "lesson": "The core lesson and wisdom from this story (3-4 sentences).",
  "application": "How this story applies to our lives today (3-4 sentences). Be practical and relatable."
}`;

const DAILY_DUA_SYSTEM = `You are a knowledgeable Islamic scholar. Provide a du'a (supplication) of the day.

Choose from authentic du'as — from the Quran, from the Sunnah, or well-known du'as from the Prophet ﷺ. Vary your selection.

Respond ONLY with valid JSON — no markdown, no backticks, no preamble:
{
  "arabic": "The full Arabic text of the du'a",
  "transliteration": "A clear transliteration for non-Arabic speakers",
  "translation": "The English meaning",
  "source": "Where this du'a comes from (e.g. Sahih Muslim 2654, Quran 3:8, Fortress of the Muslim)",
  "benefits": "What are the spiritual and practical benefits of this du'a (3-4 sentences). What does it protect from or bring?",
  "bestTime": "When is the best time or situation to say this du'a (2-3 sentences). Be specific — morning, before sleep, during hardship, etc.",
  "sincerity": "How saying this du'a with true sincerity and understanding transforms it from mere words into a conversation with Allah (2-3 sentences)."
}`;

const SYSTEM_PROMPTS: Record<string, string> = {
  hadith: DAILY_HADITH_SYSTEM,
  verse: DAILY_VERSE_SYSTEM,
  story: DAILY_STORY_SYSTEM,
  dua: DAILY_DUA_SYSTEM,
};

const USER_PROMPTS: Record<string, string> = {
  hadith: `Give me a hadith of the day for ${new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}.`,
  verse: `Give me Quranic verse(s) of the day for ${new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}.`,
  story: `Give me a story/narration of the day for ${new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}.`,
  dua: `Give me a du'a of the day for ${new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}.`,
};

/* ── Direct API call (fallback if Supabase has no data) ── */

async function fetchDailyContentFromAPI(
  type: "hadith" | "verse" | "story" | "dua"
): Promise<DailyHadith | DailyVerse | DailyStory | DailyDua> {
  const system = SYSTEM_PROMPTS[type];
  const userMsg = USER_PROMPTS[type];
  const maxTokens = type === "story" ? 2048 : 1536;

  const raw = await callClaude(system, userMsg, maxTokens);
  const parsed = JSON.parse(raw);

  return parsed;
}

/* ── Main fetch: tries Supabase first, falls back to direct API ── */

export async function fetchDailyContent(
  type: "hadith" | "verse" | "story" | "dua",
  date?: string
): Promise<DailyHadith | DailyVerse | DailyStory | DailyDua> {
  if (!date) {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    date = `${y}-${m}-${day}`;
  }
  const targetDate = date;

  // 1. Try Supabase first
  try {
    const { data, error } = await supabase
      .from("daily_content")
      .select("content")
      .eq("date", targetDate)
      .eq("type", type)
      .single();

    if (!error && data?.content) {
      console.log(`Daily ${type}: loaded from Supabase`);
      return data.content;
    }
  } catch (err) {
    console.warn(`Supabase fetch failed for ${type}, falling back to API:`, err);
  }

  // 2. Fall back to direct API call
  console.log(`Daily ${type}: fetching from Anthropic API`);
  return fetchDailyContentFromAPI(type);
}

/* ── Check which types are available for a date (for Garden screen dots) ── */

export async function fetchAvailableDailyTypes(
  date: string
): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from("daily_content")
      .select("type")
      .eq("date", date);

    if (error || !data) return [];
    return data.map((row: any) => row.type);
  } catch {
    return [];
  }
}

/* ══════════════════════════════════════════════════
   4. AI Journal Prompts (Premium)
   ══════════════════════════════════════════════════ */

export interface JournalPrompt {
  prompt: string;       // the question or topic
  context: string;      // brief note on why this was suggested (1 sentence)
}

const JOURNAL_PROMPTS_SYSTEM = `You are a compassionate Islamic spiritual companion helping someone with their journaling practice.

Based on the user's recent journal entries and moods, generate 3 personalized journaling prompts. Each prompt should:
- Be a thoughtful, open-ended question or reflection topic
- Connect to Islamic spirituality naturally (not forced)
- Build on what the person has been experiencing lately
- Feel warm and inviting, not clinical or preachy

If no recent entries are provided, generate general Islamic reflection prompts that are seasonally or spiritually relevant.

Respond ONLY with valid JSON — no markdown, no backticks, no preamble:
{
  "prompts": [
    { "prompt": "The question or topic to reflect on", "context": "Why this was suggested — 1 short sentence" }
  ]
}`;

export async function fetchJournalPrompts(
  recentEntries: { body: string; mood: string | null; created_at: string }[]
): Promise<JournalPrompt[]> {
  let userMsg: string;

  if (recentEntries.length > 0) {
    const summaries = recentEntries
      .slice(0, 5) // max 5 recent entries
      .map((e, i) => {
        const date = new Date(e.created_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
        const moodStr = e.mood ? ` (mood: ${e.mood})` : "";
        // Truncate body to avoid sending too much
        const preview = e.body.slice(0, 150);
        return `${date}${moodStr}: ${preview}`;
      })
      .join("\n");

    userMsg = `Here are my recent journal reflections:\n\n${summaries}\n\nGenerate 3 personalized prompts for my next journal entry.`;
  } else {
    userMsg = `I haven't written any journal entries yet. Generate 3 welcoming Islamic reflection prompts to help me start my journaling practice.`;
  }

  const raw = await callClaude(JOURNAL_PROMPTS_SYSTEM, userMsg, 1024);
  const parsed = JSON.parse(raw);
  return parsed.prompts;
}

/* ══════════════════════════════════════════════════
   5. Weekly Spiritual Insights (Premium)
   ══════════════════════════════════════════════════ */

export interface WeeklyInsight {
  summary: string;          // 3-4 sentence overview of the week
  moodPattern: string;      // observation about emotional/spiritual patterns
  growth: string;           // what growth or positive signs were noticed
  quranicReflection: string; // a relevant Quran verse or Name of Allah tied to their week
  quranicReference: string;  // the reference (e.g. "Surah Ash-Sharh 94:5-6")
  suggestion: string;       // one gentle suggestion for the coming week
  duaForWeek: string;       // a short du'a relevant to their situation
}

const WEEKLY_INSIGHTS_SYSTEM = `You are a compassionate Islamic spiritual mentor providing a weekly reflection summary.

Based on the user's journal entries from the past week, provide a warm, insightful spiritual summary. You are NOT a therapist — you are a caring older sibling in faith who sees the best in them and gently encourages growth.

Your tone should be:
- Warm and personal (use "you" not "one")
- Observant but not judgmental
- Connected to Islamic spirituality naturally
- Encouraging without being dismissive of struggles

Respond ONLY with valid JSON — no markdown, no backticks, no preamble:
{
  "summary": "A 3-4 sentence overview of their spiritual week — what themes emerged, how they seem to be feeling overall.",
  "moodPattern": "An observation about their emotional/spiritual patterns this week (2-3 sentences). What shifted? What stayed constant?",
  "growth": "What positive signs of growth you noticed, even if small (2-3 sentences). Acknowledge effort and intention.",
  "quranicReflection": "A relevant Quran verse or hadith that connects to their week — explain why it's relevant in 2-3 sentences.",
  "quranicReference": "The reference (e.g. Surah Ash-Sharh 94:5-6 or Sahih Bukhari 6137)",
  "suggestion": "One gentle, practical suggestion for the coming week (2-3 sentences). Something specific they can do.",
  "duaForWeek": "A short du'a (in English) that is relevant to what they're going through."
}`;

export async function fetchWeeklyInsights(
  weekEntries: { body: string; mood: string | null; created_at: string }[]
): Promise<WeeklyInsight> {
  const summaries = weekEntries
    .map((e) => {
      const date = new Date(e.created_at).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
      const moodStr = e.mood ? ` (mood: ${e.mood})` : "";
      const preview = e.body.slice(0, 200);
      return `${date}${moodStr}: ${preview}`;
    })
    .join("\n\n");

  const userMsg = `Here are my journal entries from this past week:\n\n${summaries}\n\nPlease give me my weekly spiritual insight.`;

  const raw = await callClaude(WEEKLY_INSIGHTS_SYSTEM, userMsg, 1536);
  return JSON.parse(raw);
}