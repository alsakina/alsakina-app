// scripts/backfillDailyContent.ts
// ─────────────────────────────────────────────────
// Generates daily content for past dates and inserts
// into the Supabase daily_content table.
//
// ✅ Skips dates/types that already exist
// ✅ Safe to re-run
//
// Usage (PowerShell):
//   $env:ANTHROPIC_API_KEY="sk-ant-xxx"; $env:SUPABASE_URL="https://xxx.supabase.co"; $env:SUPABASE_SERVICE_ROLE_KEY="eyJ..."; npx tsx scripts/backfillDailyContent.ts
//
// You can find SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in:
//   Supabase Dashboard → Settings → API
// ─────────────────────────────────────────────────

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const MODEL = "claude-sonnet-4-20250514";

if (!ANTHROPIC_API_KEY) {
  console.error("❌ Missing ANTHROPIC_API_KEY");
  process.exit(1);
}
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  console.error("   Find these in Supabase Dashboard → Settings → API");
  process.exit(1);
}

/* ── Config ────────────────────────────────────── */

// How many days back to fill (not including today)
const DAYS_BACK = 6;

// Also generate for today?
const INCLUDE_TODAY = true;

const CONTENT_TYPES = ["hadith", "verse", "story", "dua"] as const;

/* ── Dates to fill ─────────────────────────────── */

function getDatesToFill(): string[] {
  const dates: string[] = [];
  const start = INCLUDE_TODAY ? 0 : 1;
  for (let i = start; i <= DAYS_BACK; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split("T")[0]);
  }
  return dates.reverse(); // oldest first
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/* ── Claude helper ─────────────────────────────── */

async function callClaude(
  system: string,
  userMessage: string,
  maxTokens = 1536
): Promise<any> {
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
    const err = await response.text();
    throw new Error(`API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  const text = (data as any).content
    .filter((b: any) => b.type === "text")
    .map((b: any) => b.text)
    .join("");

  return JSON.parse(text.replace(/```json|```/g, "").trim());
}

/* ── Supabase helpers ──────────────────────────── */

async function supabaseSelect(date: string): Promise<string[]> {
  const url = `${SUPABASE_URL}/rest/v1/daily_content?date=eq.${date}&select=type`;
  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY!,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
  });
  if (!res.ok) return [];
  const rows: any[] = await res.json();
  return rows.map((r) => r.type);
}

async function supabaseInsert(
  date: string,
  type: string,
  content: any
): Promise<void> {
  const url = `${SUPABASE_URL}/rest/v1/daily_content`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_SERVICE_ROLE_KEY!,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ date, type, content }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Supabase insert error: ${err}`);
  }
}

/* ── System prompts ────────────────────────────── */

const PROMPTS: Record<string, { system: string; maxTokens: number }> = {
  hadith: {
    system: `You are a knowledgeable Islamic scholar. Provide a hadith of the day.

Choose an authentic hadith (from Sahih Bukhari, Sahih Muslim, or other widely accepted collections). Vary your selection — don't always pick the most famous ones.

Respond ONLY with valid JSON — no markdown, no backticks, no preamble:
{
  "arabic": "The full Arabic text of the hadith",
  "english": "The English translation",
  "source": "The exact source with book and number (e.g. Sahih Bukhari 6137)",
  "explanation": "A thorough yet simple-to-understand explanation of the hadith (4-6 sentences).",
  "application": "How we can apply this hadith in our daily lives (3-4 sentences)."
}`,
    maxTokens: 1536,
  },
  verse: {
    system: `You are a knowledgeable Islamic scholar. Provide a Quranic selection of the day.

Choose 1-3 consecutive or thematically linked verses that together explore a meaningful theme. Vary your selection widely.

Respond ONLY with valid JSON — no markdown, no backticks, no preamble:
{
  "theme": "A short theme title",
  "verses": [
    {
      "arabic": "The Arabic text of the verse",
      "translation": "The English translation",
      "reference": "Surah Name verse:number"
    }
  ],
  "explanation": "A thorough yet simple-to-understand explanation (5-7 sentences)."
}`,
    maxTokens: 1536,
  },
  story: {
    system: `You are a knowledgeable Islamic scholar and storyteller. Provide a story/narration of the day.

This can be a story from the Quran, a narration from the Seerah, a Sunnah practice, or a narration about the Companions. Vary your selection. Tell lesser-known stories too.

Respond ONLY with valid JSON — no markdown, no backticks, no preamble:
{
  "title": "A descriptive title",
  "category": "Story from the Quran | From the Seerah | Sunnah of the Prophet ﷺ | From the Companions",
  "narrative": "The full story (6-10 sentences).",
  "source": "The source reference",
  "lesson": "The core lesson (3-4 sentences).",
  "application": "How this applies today (3-4 sentences)."
}`,
    maxTokens: 2048,
  },
  dua: {
    system: `You are a knowledgeable Islamic scholar. Provide a du'a of the day.

Choose from authentic du'as — from the Quran, the Sunnah, or the Prophet ﷺ. Vary your selection.

Respond ONLY with valid JSON — no markdown, no backticks, no preamble:
{
  "arabic": "The full Arabic text",
  "transliteration": "A clear transliteration",
  "translation": "The English meaning",
  "source": "Where this du'a comes from",
  "benefits": "Spiritual and practical benefits (3-4 sentences).",
  "bestTime": "When to say this du'a (2-3 sentences).",
  "sincerity": "How sincerity transforms this du'a (2-3 sentences)."
}`,
    maxTokens: 1536,
  },
};

/* ── Sleep helper ──────────────────────────────── */

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/* ── Main ──────────────────────────────────────── */

async function main() {
  const dates = getDatesToFill();

  console.log("🕌 Backfilling daily content\n");
  console.log(`   Dates: ${dates[0]} → ${dates[dates.length - 1]}`);
  console.log(`   Types: ${CONTENT_TYPES.join(", ")}`);
  console.log(`   Total: up to ${dates.length * CONTENT_TYPES.length} items\n`);

  let generated = 0;
  let skipped = 0;
  let failed = 0;

  // Track what's been generated per type to avoid repetitions
  const previouslyGenerated: Record<string, string[]> = {
    hadith: [],
    verse: [],
    story: [],
    dua: [],
  };

  for (const date of dates) {
    console.log(`📅 ${date} (${formatDate(date)})`);

    // Check what already exists
    const existing = await supabaseSelect(date);
    const existingSet = new Set(existing);

    for (const type of CONTENT_TYPES) {
      const label = `   ${type}`;

      if (existingSet.has(type)) {
        console.log(`${label}: skipped (exists)`);
        skipped++;
        continue;
      }

      process.stdout.write(`${label}: generating... `);

      try {
        const config = PROMPTS[type];

        // Build an exclusion list so Claude avoids repeats
        const exclusionNote =
          previouslyGenerated[type].length > 0
            ? `\n\nIMPORTANT: You have already used the following on previous days. Do NOT repeat any of them. Choose something completely different:\n- ${previouslyGenerated[type].join("\n- ")}`
            : "";

        const content = await callClaude(
          config.system,
          `Give me the ${type} of the day for ${formatDate(date)}.${exclusionNote}`,
          config.maxTokens
        );

        await supabaseInsert(date, type, content);
        console.log("✅");
        generated++;

        // Track what was generated to exclude from future calls
        if (type === "hadith" && content.source) {
          previouslyGenerated.hadith.push(content.source);
        } else if (type === "verse" && content.verses) {
          const refs = content.verses.map((v: any) => v.reference).join(", ");
          previouslyGenerated.verse.push(refs);
        } else if (type === "story" && content.title) {
          previouslyGenerated.story.push(content.title);
        } else if (type === "dua" && content.transliteration) {
          previouslyGenerated.dua.push(content.transliteration.slice(0, 60));
        }
      } catch (err: any) {
        console.log(`❌ ${err.message.slice(0, 60)}`);
        failed++;
      }

      await sleep(1500);
    }

    console.log("");
  }

  console.log("─".repeat(40));
  console.log(`📊 Done: ${generated} generated, ${skipped} skipped, ${failed} failed`);

  if (failed > 0) {
    console.log("⚠️  Re-run the script to retry failed items.");
  }
}

main().catch(console.error);