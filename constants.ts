export const CANONICAL_ROOTS: Record<string, string> = {
  "C#": "Db",
  "D#": "Eb",
  "F#": "Gb",
  "G#": "Ab",
  "A#": "Bb",
  "E#": "F",
  "B#": "C",
};

export const NOTES_STEP_DOWN: Record<string, string> = {
  "C": "B", "Db": "C", "D": "Db", "Eb": "D", "E": "Eb", "F": "E",
  "Gb": "F", "G": "Gb", "Ab": "G", "A": "Ab", "Bb": "A", "B": "Bb",
};

export const NOTE_SORT_MAP: Record<string, number> = {
  "C": 0, "Db": 1, "D": 2, "Eb": 3, "E": 4, "F": 5, 
  "Gb": 6, "G": 7, "Ab": 8, "A": 9, "Bb": 10, "B": 11
};

export const CHROMATIC_SCALE = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];

export const BH_SCALE_INTERVALS: Record<string, number[]> = {
  "DiminishedScale": [0, 2, 3, 5, 6, 8, 9, 11],
  "Major6Dim": [0, 2, 4, 5, 7, 8, 9, 11],
  "Minor6Dim": [0, 2, 3, 5, 7, 8, 9, 11],
  "Dominant7Dim": [0, 2, 4, 5, 7, 8, 10, 11],
  "Dominant7b5Dim": [0, 2, 4, 6, 7, 8, 10, 11],
};

export const SEMITONE_TO_FUNCTION: Record<number, string> = {
  0: "Root", 1: "b9", 2: "9", 3: "#9", 4: "3", 5: "11",
  6: "#11", 7: "5", 8: "b13", 9: "13", 10: "b7",
};

export const DIM_FAMILIES = [
  {
      dims: ["Ddim", "Fdim", "Abdim", "Bdim"],
      strict_dominants: {
          basic: ["Db7", "E7", "G7", "Bb7"],
          "7b9": ["Db7(b9)", "E7(b9)", "G7(b9)", "Bb7(b9)"],
          "7s9": ["Db7(#9)", "E7(#9)", "G7(#9)", "Bb7(#9)"],
          "7b5": ["Db7(b5)", "E7(b5)", "G7(b5)", "Bb7(b5)"],
          "13b9": ["Db13(b9)", "E13(b9)", "G13(b9)", "Bb13(b9)"],
      },
      altered_dominants: {
          "7alt": ["Db7alt", "E7alt", "G7alt", "Bb7alt"],
      },
      m6s: ["Dm6", "Fm6", "Abm6", "Bm6"],
  },
  {
      dims: ["Dbdim", "Edim", "Gdim", "Bbdim"],
      strict_dominants: {
          basic: ["C7", "Eb7", "Gb7", "A7"],
          "7b9": ["C7(b9)", "Eb7(b9)", "Gb7(b9)", "A7(b9)"],
          "7s9": ["C7(#9)", "Eb7(#9)", "Gb7(#9)", "A7(#9)"],
          "7b5": ["C7(b5)", "Eb7(b5)", "Gb7(b5)", "A7(b5)"],
          "13b9": ["C13(b9)", "Eb13(b9)", "Gb13(b9)", "A13(b9)"],
      },
      altered_dominants: {
          "7alt": ["C7alt", "Eb7alt", "Gb7alt", "A7alt"],
      },
      m6s: ["Dbm6", "Em6", "Gm6", "Bbm6"],
  },
  {
      dims: ["Cdim", "Ebdim", "Gbdim", "Adim"],
      strict_dominants: {
          basic: ["B7", "D7", "F7", "Ab7"],
          "7b9": ["B7(b9)", "D7(b9)", "F7(b9)", "Ab7(b9)"],
          "7s9": ["B7(#9)", "D7(#9)", "F7(#9)", "Ab7(#9)"],
          "7b5": ["B7(b5)", "D7(b5)", "F7(b5)", "Ab7(b5)"],
          "13b9": ["B13(b9)", "D13(b9)", "F13(b9)", "Ab13(b9)"],
      },
      altered_dominants: {
          "7alt": ["B7alt", "D7alt", "F7alt", "Ab7alt"],
      },
      m6s: ["Cm6", "Ebm6", "Gbm6", "Am6"],
  },
];