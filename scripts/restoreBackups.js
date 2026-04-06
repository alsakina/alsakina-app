#!/usr/bin/env node
// scripts/restoreBackups.js — run this first to undo broken changes
// node scripts/restoreBackups.js
const fs = require("fs");
const path = require("path");
const FILES = [
  "src/screens/HomeScreen.tsx","src/screens/JournalScreen.tsx",
  "src/screens/JournalEntryScreen.tsx","src/screens/ExploreScreen.tsx",
  "src/screens/DailyContentScreen.tsx","src/screens/LearnScreen.tsx",
  "src/screens/NameDetailScreen.tsx","src/screens/DhikrScreen.tsx",
  "src/screens/WeeklyInsightsScreen.tsx","src/screens/AuthScreen.tsx",
  "src/screens/PaywallScreen.tsx","src/screens/SettingsScreen.tsx",
  "src/components/ScreenHeader.tsx",
];
let n = 0;
for (const rel of FILES) {
  const fp = path.resolve(process.cwd(), rel);
  const bak = fp + ".bak";
  if (fs.existsSync(bak)) { fs.copyFileSync(bak, fp); fs.unlinkSync(bak); console.log("✅  Restored: " + rel); n++; }
  else console.log("–   No backup: " + rel);
}
console.log("\nRestored " + n + " file(s).");