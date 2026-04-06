#!/usr/bin/env node
// scripts/verifyDarkMode.js
// node scripts/verifyDarkMode.js
const fs = require("fs"), path = require("path");
const FILES = [
  "src/screens/HomeScreen.tsx","src/screens/JournalScreen.tsx",
  "src/screens/JournalEntryScreen.tsx","src/screens/ExploreScreen.tsx",
  "src/screens/DailyContentScreen.tsx","src/screens/LearnScreen.tsx",
  "src/screens/NameDetailScreen.tsx","src/screens/DhikrScreen.tsx",
  "src/screens/WeeklyInsightsScreen.tsx","src/screens/AuthScreen.tsx",
  "src/screens/PaywallScreen.tsx","src/screens/SettingsScreen.tsx",
  "src/components/ScreenHeader.tsx",
];
const FORBIDDEN = [
  { p: /\bColors\.(cream|charcoal|sage|white)\b/, l: "Colors.x ref still present" },
  { p: /from ["']\.\.\/lib\/theme["']/,           l: "old theme import (screen)" },
  { p: /from ["']\.\.\/\.\.\/lib\/theme["']/,     l: "old theme import (component)" },
  { p: /backgroundColor:\s*["']white["']/,        l: "hardcoded 'white' backgroundColor" },
  { p: /"#FDFBF7"/,                               l: "hardcoded #FDFBF7" },
  { p: /"#4A4A4A"/,                               l: "hardcoded #4A4A4A" },
];
const REQUIRED = [
  { p: /useColors/,                  l: "useColors import" },
  { p: /let _C = LightColors/,       l: "let _C = LightColors" },
  { p: /const C = useColors\(\)/,    l: "const C = useColors()" },
  { p: /_C = C;/,                    l: "_C = C; sync line" },
];
let ok = true;
for (const rel of FILES) {
  const fp = path.resolve(process.cwd(), rel);
  if (!fs.existsSync(fp)) { console.warn("⚠️  Not found: "+rel); continue; }
  const src = fs.readFileSync(fp,"utf8");
  const issues = [
    ...FORBIDDEN.filter(({p})=>p.test(src)).map(({l})=>"  ✗ "+l),
    ...REQUIRED.filter(({p})=>!p.test(src)).map(({l})=>"  ✗ Missing: "+l),
  ];
  if (!issues.length) console.log("✅  "+rel);
  else { console.log("❌  "+rel); issues.forEach(i=>console.log(i)); ok=false; }
}
console.log(ok?"\n✅  All screens verified!":"\n⚠️  Issues found — restore .bak files if needed.");