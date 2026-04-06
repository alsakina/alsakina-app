#!/usr/bin/env node
// scripts/applyDarkMode.js  (v3)
// Run from your project root:
//   node scripts/restoreBackups.js   ← undo previous broken run first
//   node scripts/applyDarkMode.js    ← then apply this
//
// Key fix: "last import line" is now found by scanning for lines that
// match a complete import statement end (end with ; or from "...";)
// accounting for multi-line imports.

const fs   = require("fs");
const path = require("path");

const FILES = [
  "src/screens/HomeScreen.tsx",
  "src/screens/JournalScreen.tsx",
  "src/screens/JournalEntryScreen.tsx",
  "src/screens/ExploreScreen.tsx",
  "src/screens/DailyContentScreen.tsx",
  "src/screens/LearnScreen.tsx",
  "src/screens/NameDetailScreen.tsx",
  "src/screens/DhikrScreen.tsx",
  "src/screens/WeeklyInsightsScreen.tsx",
  "src/screens/AuthScreen.tsx",
  "src/screens/PaywallScreen.tsx",
  "src/screens/SettingsScreen.tsx",
  "src/components/ScreenHeader.tsx",
];

const COLOR_RULES = [
  [/Colors\.cream\b/g,              "_C.background"],
  [/Colors\.charcoalMuted\b/g,      "_C.textMuted"],
  [/Colors\.charcoalLight\b/g,      "_C.textLight"],
  [/Colors\.charcoal\b/g,           "_C.text"],
  [/Colors\.sageLight\b/g,          "_C.sageLight"],
  [/Colors\.sageDark\b/g,           "_C.sageDark"],
  [/Colors\.sage\b/g,               "_C.sage"],
  [/Colors\.white\b/g,              "_C.white"],
  [/"#FDFBF7"/g,                    "_C.background"],
  [/backgroundColor:\s*["']white["']/g,    "backgroundColor: _C.surface"],
  [/backgroundColor:\s*["']#FFFFFF["']/g,  "backgroundColor: _C.surface"],
  [/backgroundColor:\s*["']#fff["']/g,     "backgroundColor: _C.surface"],
  [/"rgba\(135,169,107,0\.08\)"/g,  "_C.sageFaint"],
  [/"rgba\(135,169,107,0\.06\)"/g,  "_C.sageFaint"],
  [/"rgba\(135,169,107,0\.10\)"/g,  "_C.sageFaint"],
  [/"rgba\(135,169,107,0\.12\)"/g,  "_C.border"],
  [/"rgba\(135,169,107,0\.15\)"/g,  "_C.sageFaintMid"],
  [/"rgba\(135,169,107,0\.20\)"/g,  "_C.borderStrong"],
  [/"rgba\(135,169,107,0\.2\)"/g,   "_C.borderStrong"],
  [/"#4A4A4A"/g,                    "_C.text"],
  [/"#6E6E6E"/g,                    "_C.textLight"],
  [/"#9A9A9A"/g,                    "_C.textMuted"],
  [/"rgba\(180,68,68,0\.08\)"/g,    "_C.errorFaint"],
];

// ── Find the index of the last line that is part of an import block ──────────
// We track whether we're inside a multi-line import (brace depth > 0).
// A line is "inside an import" if an `import` keyword opened before it
// and the closing `from "..."` hasn't appeared yet.
function findLastImportLineIndex(lines) {
  let lastIdx = -1;
  let inImport = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (inImport) {
      // We're inside a multi-line import — look for the closing `from "..."`
      if (/from\s+["'][^"']+["'];?\s*$/.test(line)) {
        lastIdx = i;
        inImport = false;
      }
      continue;
    }

    // Single-line import: import Foo from "bar"; or import "bar";
    if (/^import\s/.test(line)) {
      if (/from\s+["'][^"']+["'];?\s*$/.test(line) || /^import\s+["']/.test(line)) {
        // complete on this line
        lastIdx = i;
      } else {
        // multi-line — starts here, ends later
        inImport = true;
      }
    }
  }
  return lastIdx;
}

function patchFile(source, relPath) {
  const isComponent = relPath.includes("components/");
  const prefix = isComponent ? "../.." : "..";

  // 1. Swap Colors import → useColors + LightColors
  source = source.replace(
    /import\s*\{\s*Colors\s*\}\s*from\s*["'][^"']+["'];?\r?\n/g,
    `import { useColors, LightColors } from "${prefix}/lib/ThemeContext";\n`
  );

  // 2. Apply colour replacements
  for (const [search, replace] of COLOR_RULES) {
    source = source.replace(search, replace);
  }

  // 3. Insert `let _C = LightColors;` on its own line, AFTER the entire import block
  if (!source.includes("let _C =")) {
    const lines = source.split("\n");
    const lastImport = findLastImportLineIndex(lines);
    if (lastImport >= 0) {
      lines.splice(
        lastImport + 1,
        0,
        "",
        "// Module-level colour ref — kept in sync by the screen on every render",
        "let _C = LightColors;"
      );
      source = lines.join("\n");
    }
  }

  // 4. Inject `const C = useColors(); _C = C;` as first two lines of export default function
  if (!source.includes("const C = useColors()")) {
    source = source.replace(
      /(export\s+default\s+function\s+\w+[\s\S]*?\)\s*\{)/,
      "$1\n  const C = useColors();\n  _C = C;"
    );
  }

  return source;
}

let patched = 0, skipped = 0;

for (const relPath of FILES) {
  const fp = path.resolve(process.cwd(), relPath);
  if (!fs.existsSync(fp)) { console.warn("⚠️  Not found: " + relPath); continue; }

  let source = fs.readFileSync(fp, "utf8");
  if (source.includes("useColors")) { console.log("✓  Already migrated: " + relPath); skipped++; continue; }

  fs.writeFileSync(fp + ".bak", source);
  source = patchFile(source, relPath);
  fs.writeFileSync(fp, source);
  console.log("✅  Patched: " + relPath);
  patched++;
}

console.log("\nDone. " + patched + " patched, " + skipped + " already migrated.");
console.log("Run: node scripts/verifyDarkMode.js");