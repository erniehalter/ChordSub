
// This file controls the font sizes and layout dimensions for the app.
// You can edit these values to adjust the appearance.

export const FONT_SIZES = {
  // The main chord display in the cards (Standard view)
  // Options: "text-base" (16px), "text-lg" (18px), "text-xl" (20px), "text-2xl" (24px)
  // Or specific: "text-[18px]"
  CHORD_MAIN: "text-lg", 

  // The extensions and list items (Compact view) - Previously "text-xs"
  // Increased to ~15px (approx 20% larger than 12px)
  CHORD_COMPACT: "text-[15px]",

  // Secondary text (like "aka Dm7b5")
  LABEL_SUFFIX: "text-[10px]",
  
  // Badges (Scale Tones, Missing Notes)
  BADGE: "text-[9px]",
  
  // Section Headers
  SECTION_TITLE: "text-xs",
  SUBSECTION_TITLE: "text-sm",
};

export const LAYOUT_SIZES = {
  // Height of the chord containers
  CHORD_HEIGHT_MAIN: "min-h-[4.5rem]",
  CHORD_HEIGHT_COMPACT: "min-h-[3.5rem]", // Increased slightly to fit larger font
};
