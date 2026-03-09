// scripts/generateNameDetails.ts
// ─────────────────────────────────────────────────
// Generates detail pages for all 99 Names of Allah.
//
// ✅ Saves after EVERY name (no more lost progress)
// ✅ Skips names already generated (safe to re-run)
//
// Usage:
//   $env:ANTHROPIC_API_KEY="sk-ant-xxx"; npx tsx scripts/generateNameDetails.ts
//
// To force-regenerate a specific name, delete its
// entry from src/lib/nameDetailsData.ts and re-run.
// ─────────────────────────────────────────────────

import * as fs from "fs";
import * as path from "path";

const API_URL = "https://api.anthropic.com/v1/messages";
const API_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = "claude-sonnet-4-20250514";
const OUT_PATH = path.resolve(__dirname, "../src/lib/nameDetailsData.ts");

if (!API_KEY) {
  console.error("❌ Set ANTHROPIC_API_KEY environment variable");
  process.exit(1);
}

/* ── Names list ────────────────────────────────── */

const NAMES = [
  { id: 1, arabic: "ٱلرَّحْمَـٰنُ", transliteration: "Ar-Rahman", meaning: "The Most Gracious" },
  { id: 2, arabic: "ٱلرَّحِيمُ", transliteration: "Ar-Rahim", meaning: "The Most Merciful" },
  { id: 3, arabic: "ٱلْمَلِكُ", transliteration: "Al-Malik", meaning: "The King" },
  { id: 4, arabic: "ٱلْقُدُّوسُ", transliteration: "Al-Quddus", meaning: "The Most Holy" },
  { id: 5, arabic: "ٱلسَّلَامُ", transliteration: "As-Salam", meaning: "The Source of Peace" },
  { id: 6, arabic: "ٱلْمُؤْمِنُ", transliteration: "Al-Mu'min", meaning: "The Granter of Security" },
  { id: 7, arabic: "ٱلْمُهَيْمِنُ", transliteration: "Al-Muhaymin", meaning: "The Guardian" },
  { id: 8, arabic: "ٱلْعَزِيزُ", transliteration: "Al-Aziz", meaning: "The Almighty" },
  { id: 9, arabic: "ٱلْجَبَّارُ", transliteration: "Al-Jabbar", meaning: "The Compeller" },
  { id: 10, arabic: "ٱلْمُتَكَبِّرُ", transliteration: "Al-Mutakabbir", meaning: "The Supreme" },
  { id: 11, arabic: "ٱلْخَالِقُ", transliteration: "Al-Khaliq", meaning: "The Creator" },
  { id: 12, arabic: "ٱلْبَارِئُ", transliteration: "Al-Bari", meaning: "The Originator" },
  { id: 13, arabic: "ٱلْمُصَوِّرُ", transliteration: "Al-Musawwir", meaning: "The Fashioner" },
  { id: 14, arabic: "ٱلْغَفَّارُ", transliteration: "Al-Ghaffar", meaning: "The Ever-Forgiving" },
  { id: 15, arabic: "ٱلْقَهَّارُ", transliteration: "Al-Qahhar", meaning: "The Subduer" },
  { id: 16, arabic: "ٱلْوَهَّابُ", transliteration: "Al-Wahhab", meaning: "The Bestower" },
  { id: 17, arabic: "ٱلرَّزَّاقُ", transliteration: "Ar-Razzaq", meaning: "The Provider" },
  { id: 18, arabic: "ٱلْفَتَّاحُ", transliteration: "Al-Fattah", meaning: "The Opener" },
  { id: 19, arabic: "ٱلْعَلِيمُ", transliteration: "Al-Alim", meaning: "The All-Knowing" },
  { id: 20, arabic: "ٱلْقَابِضُ", transliteration: "Al-Qabid", meaning: "The Withholder" },
  { id: 21, arabic: "ٱلْبَاسِطُ", transliteration: "Al-Basit", meaning: "The Extender" },
  { id: 22, arabic: "ٱلْخَافِضُ", transliteration: "Al-Khafid", meaning: "The Humbler" },
  { id: 23, arabic: "ٱلرَّافِعُ", transliteration: "Ar-Rafi", meaning: "The Exalter" },
  { id: 24, arabic: "ٱلْمُعِزُّ", transliteration: "Al-Mu'izz", meaning: "The Honourer" },
  { id: 25, arabic: "ٱلْمُذِلُّ", transliteration: "Al-Mudhill", meaning: "The Humiliator" },
  { id: 26, arabic: "ٱلسَّمِيعُ", transliteration: "As-Sami", meaning: "The All-Hearing" },
  { id: 27, arabic: "ٱلْبَصِيرُ", transliteration: "Al-Basir", meaning: "The All-Seeing" },
  { id: 28, arabic: "ٱلْحَكَمُ", transliteration: "Al-Hakam", meaning: "The Judge" },
  { id: 29, arabic: "ٱلْعَدْلُ", transliteration: "Al-Adl", meaning: "The Just" },
  { id: 30, arabic: "ٱللَّطِيفُ", transliteration: "Al-Latif", meaning: "The Subtle One" },
  { id: 31, arabic: "ٱلْخَبِيرُ", transliteration: "Al-Khabir", meaning: "The All-Aware" },
  { id: 32, arabic: "ٱلْحَلِيمُ", transliteration: "Al-Halim", meaning: "The Forbearing" },
  { id: 33, arabic: "ٱلْعَظِيمُ", transliteration: "Al-Azim", meaning: "The Magnificent" },
  { id: 34, arabic: "ٱلْغَفُورُ", transliteration: "Al-Ghafur", meaning: "The All-Forgiving" },
  { id: 35, arabic: "ٱلشَّكُورُ", transliteration: "Ash-Shakur", meaning: "The Appreciative" },
  { id: 36, arabic: "ٱلْعَلِيُّ", transliteration: "Al-Ali", meaning: "The Most High" },
  { id: 37, arabic: "ٱلْكَبِيرُ", transliteration: "Al-Kabir", meaning: "The Greatest" },
  { id: 38, arabic: "ٱلْحَفِيظُ", transliteration: "Al-Hafiz", meaning: "The Preserver" },
  { id: 39, arabic: "ٱلْمُقِيتُ", transliteration: "Al-Muqit", meaning: "The Sustainer" },
  { id: 40, arabic: "ٱلْحَسِيبُ", transliteration: "Al-Hasib", meaning: "The Reckoner" },
  { id: 41, arabic: "ٱلْجَلِيلُ", transliteration: "Al-Jalil", meaning: "The Majestic" },
  { id: 42, arabic: "ٱلْكَرِيمُ", transliteration: "Al-Karim", meaning: "The Most Generous" },
  { id: 43, arabic: "ٱلرَّقِيبُ", transliteration: "Ar-Raqib", meaning: "The Watchful" },
  { id: 44, arabic: "ٱلْمُجِيبُ", transliteration: "Al-Mujib", meaning: "The Responsive" },
  { id: 45, arabic: "ٱلْوَاسِعُ", transliteration: "Al-Wasi", meaning: "The Vast" },
  { id: 46, arabic: "ٱلْحَكِيمُ", transliteration: "Al-Hakim", meaning: "The All-Wise" },
  { id: 47, arabic: "ٱلْوَدُودُ", transliteration: "Al-Wadud", meaning: "The Most Loving" },
  { id: 48, arabic: "ٱلْمَجِيدُ", transliteration: "Al-Majid", meaning: "The Glorious" },
  { id: 49, arabic: "ٱلْبَاعِثُ", transliteration: "Al-Ba'ith", meaning: "The Resurrector" },
  { id: 50, arabic: "ٱلشَّهِيدُ", transliteration: "Ash-Shahid", meaning: "The Witness" },
  { id: 51, arabic: "ٱلْحَقُّ", transliteration: "Al-Haqq", meaning: "The Truth" },
  { id: 52, arabic: "ٱلْوَكِيلُ", transliteration: "Al-Wakil", meaning: "The Trustee" },
  { id: 53, arabic: "ٱلْقَوِيُّ", transliteration: "Al-Qawi", meaning: "The Most Strong" },
  { id: 54, arabic: "ٱلْمَتِينُ", transliteration: "Al-Matin", meaning: "The Firm" },
  { id: 55, arabic: "ٱلْوَلِيُّ", transliteration: "Al-Wali", meaning: "The Protecting Friend" },
  { id: 56, arabic: "ٱلْحَمِيدُ", transliteration: "Al-Hamid", meaning: "The Praiseworthy" },
  { id: 57, arabic: "ٱلْمُحْصِيُ", transliteration: "Al-Muhsi", meaning: "The Accounter" },
  { id: 58, arabic: "ٱلْمُبْدِئُ", transliteration: "Al-Mubdi", meaning: "The Originator" },
  { id: 59, arabic: "ٱلْمُعِيدُ", transliteration: "Al-Mu'id", meaning: "The Restorer" },
  { id: 60, arabic: "ٱلْمُحْيِيُ", transliteration: "Al-Muhyi", meaning: "The Giver of Life" },
  { id: 61, arabic: "ٱلْمُمِيتُ", transliteration: "Al-Mumit", meaning: "The Bringer of Death" },
  { id: 62, arabic: "ٱلْحَيُّ", transliteration: "Al-Hayy", meaning: "The Ever-Living" },
  { id: 63, arabic: "ٱلْقَيُّومُ", transliteration: "Al-Qayyum", meaning: "The Self-Subsisting" },
  { id: 64, arabic: "ٱلْوَاجِدُ", transliteration: "Al-Wajid", meaning: "The Perceiver" },
  { id: 65, arabic: "ٱلْمَاجِدُ", transliteration: "Al-Majid", meaning: "The Noble" },
  { id: 66, arabic: "ٱلْوَاحِدُ", transliteration: "Al-Wahid", meaning: "The One" },
  { id: 67, arabic: "ٱلْأَحَدُ", transliteration: "Al-Ahad", meaning: "The Unique" },
  { id: 68, arabic: "ٱلصَّمَدُ", transliteration: "As-Samad", meaning: "The Eternal Refuge" },
  { id: 69, arabic: "ٱلْقَادِرُ", transliteration: "Al-Qadir", meaning: "The All-Powerful" },
  { id: 70, arabic: "ٱلْمُقْتَدِرُ", transliteration: "Al-Muqtadir", meaning: "The Determiner" },
  { id: 71, arabic: "ٱلْمُقَدِّمُ", transliteration: "Al-Muqaddim", meaning: "The Expediter" },
  { id: 72, arabic: "ٱلْمُؤَخِّرُ", transliteration: "Al-Mu'akhkhir", meaning: "The Delayer" },
  { id: 73, arabic: "ٱلْأَوَّلُ", transliteration: "Al-Awwal", meaning: "The First" },
  { id: 74, arabic: "ٱلْآخِرُ", transliteration: "Al-Akhir", meaning: "The Last" },
  { id: 75, arabic: "ٱلظَّاهِرُ", transliteration: "Az-Zahir", meaning: "The Manifest" },
  { id: 76, arabic: "ٱلْبَاطِنُ", transliteration: "Al-Batin", meaning: "The Hidden" },
  { id: 77, arabic: "ٱلْوَالِي", transliteration: "Al-Wali", meaning: "The Governor" },
  { id: 78, arabic: "ٱلْمُتَعَالِي", transliteration: "Al-Muta'ali", meaning: "The Most Exalted" },
  { id: 79, arabic: "ٱلْبَرُّ", transliteration: "Al-Barr", meaning: "The Source of Goodness" },
  { id: 80, arabic: "ٱلتَّوَّابُ", transliteration: "At-Tawwab", meaning: "The Ever-Accepting of Repentance" },
  { id: 81, arabic: "ٱلْمُنْتَقِمُ", transliteration: "Al-Muntaqim", meaning: "The Avenger" },
  { id: 82, arabic: "ٱلْعَفُوُّ", transliteration: "Al-Afuw", meaning: "The Pardoner" },
  { id: 83, arabic: "ٱلرَّءُوفُ", transliteration: "Ar-Ra'uf", meaning: "The Most Kind" },
  { id: 84, arabic: "مَالِكُ ٱلْمُلْكِ", transliteration: "Malik-ul-Mulk", meaning: "Owner of All Sovereignty" },
  { id: 85, arabic: "ذُو ٱلْجَلَالِ وَٱلْإِكْرَامِ", transliteration: "Dhul-Jalali-wal-Ikram", meaning: "Lord of Majesty and Generosity" },
  { id: 86, arabic: "ٱلْمُقْسِطُ", transliteration: "Al-Muqsit", meaning: "The Equitable" },
  { id: 87, arabic: "ٱلْجَامِعُ", transliteration: "Al-Jami", meaning: "The Gatherer" },
  { id: 88, arabic: "ٱلْغَنِيُّ", transliteration: "Al-Ghani", meaning: "The Self-Sufficient" },
  { id: 89, arabic: "ٱلْمُغْنِي", transliteration: "Al-Mughni", meaning: "The Enricher" },
  { id: 90, arabic: "ٱلْمَانِعُ", transliteration: "Al-Mani", meaning: "The Preventer" },
  { id: 91, arabic: "ٱلضَّارُّ", transliteration: "Ad-Darr", meaning: "The Distresser" },
  { id: 92, arabic: "ٱلنَّافِعُ", transliteration: "An-Nafi", meaning: "The Propitious" },
  { id: 93, arabic: "ٱلنُّورُ", transliteration: "An-Nur", meaning: "The Light" },
  { id: 94, arabic: "ٱلْهَادِي", transliteration: "Al-Hadi", meaning: "The Guide" },
  { id: 95, arabic: "ٱلْبَدِيعُ", transliteration: "Al-Badi", meaning: "The Incomparable" },
  { id: 96, arabic: "ٱلْبَاقِي", transliteration: "Al-Baqi", meaning: "The Everlasting" },
  { id: 97, arabic: "ٱلْوَارِثُ", transliteration: "Al-Warith", meaning: "The Inheritor" },
  { id: 98, arabic: "ٱلرَّشِيدُ", transliteration: "Ar-Rashid", meaning: "The Guide to the Right Path" },
  { id: 99, arabic: "ٱلصَّبُورُ", transliteration: "As-Sabur", meaning: "The Patient" },
];

/* ── System prompt ─────────────────────────────── */

const SYSTEM_PROMPT = `You are an Islamic scholar providing rich, accurate educational content about the 99 Names of Allah.

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

/* ── API helper ────────────────────────────────── */

async function callClaude(userMessage: string): Promise<string> {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`API error ${response.status}: ${errBody}`);
  }

  const data = await response.json();
  const text = (data as any).content
    .filter((block: any) => block.type === "text")
    .map((block: any) => block.text)
    .join("");

  return text.replace(/```json|```/g, "").trim();
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/* ── File read/write helpers ───────────────────── */

function writeDataFile(results: Record<number, any>) {
  const fileContent = `// lib/nameDetailsData.ts
// ─────────────────────────────────────────────────
// AUTO-GENERATED — do not edit manually.
// Run \`scripts/generateNameDetails.ts\` to regenerate.
// ─────────────────────────────────────────────────

import { NameDetail } from "./intelligence";

export const NAME_DETAILS: Record<number, NameDetail> = ${JSON.stringify(results, null, 2)};
`;
  fs.writeFileSync(OUT_PATH, fileContent, "utf-8");
}

function loadExistingData(): Record<number, any> {
  try {
    if (!fs.existsSync(OUT_PATH)) return {};

    const content = fs.readFileSync(OUT_PATH, "utf-8");

    // Extract the JSON object from the file
    const match = content.match(
      /export const NAME_DETAILS[^=]*=\s*([\s\S]+);?\s*$/
    );
    if (!match) return {};

    // Trim trailing semicolon if present
    const jsonStr = match[1].replace(/;\s*$/, "").trim();
    return JSON.parse(jsonStr);
  } catch (err) {
    console.warn("⚠️  Could not parse existing data file, starting fresh.");
    return {};
  }
}

/* ── Main ──────────────────────────────────────── */

async function main() {
  console.log("🕌 Generating details for the 99 Names of Allah...\n");

  // Load any previously generated data
  const results = loadExistingData();
  const existingCount = Object.keys(results).length;

  if (existingCount > 0) {
    console.log(`📂 Found ${existingCount} existing names — will skip them.\n`);
  }

  let generated = 0;
  let skipped = 0;
  let failed = 0;

  for (const name of NAMES) {
    const label = `${name.id}. ${name.transliteration} (${name.arabic})`;

    // Skip if already generated
    if (results[name.id]) {
      skipped++;
      continue;
    }

    process.stdout.write(`  ${label} ... `);

    try {
      const prompt = `Tell me about the Name of Allah: ${name.transliteration} (${name.arabic}) — "${name.meaning}"`;
      const raw = await callClaude(prompt);
      const parsed = JSON.parse(raw);

      results[name.id] = {
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

      generated++;
      console.log("✅");

      // 💾 Save after EVERY successful name
      writeDataFile(results);
    } catch (err: any) {
      failed++;
      console.log(`❌ ${err.message.slice(0, 80)}`);
    }

    // Wait between requests to stay within rate limits
    await sleep(1500);
  }

  // Final save
  writeDataFile(results);

  console.log(
    `\n📊 Done: ${generated} generated, ${skipped} skipped (already existed), ${failed} failed.`
  );
  console.log(`✅ Written to ${OUT_PATH}`);

  if (failed > 0) {
    console.log(
      `\n⚠️  ${failed} names failed. Just re-run the script — it will only retry the missing ones.`
    );
  }
}

main().catch(console.error);