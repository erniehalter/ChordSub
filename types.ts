
export interface AppConfig {
  highlightExtensions: boolean;
  hideIfMelodyNotInChord: boolean;
  hideIfMelodyNotInScale: boolean;
  largeChordFont: boolean;
  consolidateResults: boolean;
}

export interface ScaleNote {
  note: string;
  role: string; // "Chord Tone", "Borrowed Tone", "Not in scale", etc.
  isMelody: boolean;
}

export interface ChordMatch {
  symbol: string;
  matchingNotes: string[];
  missingNotes: string[];
  isFullMatch: boolean;
  labelSuffix?: string; // For consolidated synonyms e.g. "(Dm7)"
}

export interface RelatedMinor6Match {
  chord: ChordMatch;
  scale: ScaleNote[];
  derivedChords: ChordMatch[];
}

export interface AnalysisResult {
  displayChord: string;
  scaleRoot: string | null;
  scaleType: string | null;
  scaleNotes: ScaleNote[];
  systemInfo: {
    on: string;
    off: string;
  } | null;
  melodyAnalysis: ScaleNote[];
  families: FamilyGroup[];
  relatedMinor6ths: RelatedMinor6Match[];
  major6Raise2: FamilyGroup[];
  major6Lower2: FamilyGroup[];
  upperStructureTriads: {
    major: ChordMatch[];
    minor: ChordMatch[];
  };
  error?: string;
  info?: string;
}

export interface FamilyGroup {
  root: string;
  chords: ChordMatch[];
}

export type NoteRole = 'Chord Tone' | 'Borrowed Tone' | 'Passing Tone' | 'Not in scale' | '';