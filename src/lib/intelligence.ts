export interface SpiritualGuidance {
  nameArabic: string;
  nameTransliterated: string;
  nameMeaning: string;
  message: string;
}

export async function fetchSpiritualGuidance(
  userInput: string
): Promise<SpiritualGuidance> {
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // TODO: Replace with Supabase Edge Function call
  return {
    nameArabic: "ٱلسَّلَامُ",
    nameTransliterated: "As-Salam",
    nameMeaning: "The Source of Peace",
    message:
      "When the heart feels heavy, remember that the One who created you " +
      "is As-Salam — the very Source of Peace. He did not place you in this " +
      "moment to leave you without comfort. Sit with this Name. Breathe it in. " +
      "Peace is not something you must chase — it is already being sent to you.",
  };
}
