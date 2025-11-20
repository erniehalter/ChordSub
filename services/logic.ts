
import { Note, Chord } from 'tonal';
import { 
  CANONICAL_ROOTS, 
  NOTE_SORT_MAP, 
  BH_SCALE_INTERVALS, 
  CHROMATIC_SCALE, 
  DIM_FAMILIES,
  NOTES_STEP_DOWN
} from '../constants';
import { AnalysisResult, ScaleNote, AppConfig, FamilyGroup, ChordMatch, RelatedMinor6Match } from '../types';

// --- Helper Functions ---

const normalizeInputSymbol = (symbol: string): string => {
  let s = symbol.trim();
  if (!s) return "";
  s = s.replace(/♭/g, "b").replace(/♯/g, "#").replace(/–/g, "-");
  s = s.charAt(0).toUpperCase() + s.slice(1);
  s = s.replace("min", "m");
  return s;
};

const normalizeDimSymbol = (symbol: string): string => {
  return symbol.replace("°7", "dim").replace("°", "dim").replace("dim7", "dim");
};

const getRootFromString = (s: string): string => {
  if (!s) return "";
  if (s.length > 1 && (s[1] === 'b' || s[1] === '#')) return s.slice(0, 2);
  return s[0];
};

const getCanonicalSymbol = (symbol: string, suffix: string): string => {
  let root = symbol.substring(0, symbol.length - suffix.length);
  root = CANONICAL_ROOTS[root] || root;
  return root + suffix;
};

// --- Logic Ports ---

const getBhScaleNotes = (root: string, scaleType: string): string[] => {
  if (!BH_SCALE_INTERVALS[scaleType]) return [];
  
  let normRoot = root.charAt(0).toUpperCase() + root.slice(1);
  const canon = CANONICAL_ROOTS[normRoot] || normRoot;
  const rootIdx = NOTE_SORT_MAP[canon] || 0;
  
  const intervals = BH_SCALE_INTERVALS[scaleType];
  
  return intervals.map(interval => {
    const noteIdx = (rootIdx + interval) % 12;
    return CHROMATIC_SCALE[noteIdx];
  });
};

const identifyBorrowedNotes = (
  root: string, 
  scaleType: string, 
  melodyNotes: string[]
): Record<string, string> => {
  const scale = getBhScaleNotes(root, scaleType);
  const result: Record<string, string> = {};
  const chordIndices = [0, 2, 4, 6];
  const dimIndices = [1, 3, 5, 7];
  
  melodyNotes.forEach(note => {
     // Clean and canonicalize note
    let nClean = note.replace("♭", "b").replace("♯", "#");
    nClean = nClean.charAt(0).toUpperCase() + nClean.slice(1);
    const normNote = CANONICAL_ROOTS[nClean] || nClean;

    if (!scale.includes(normNote)) {
      result[note] = "Not in scale";
      return;
    }

    const idx = scale.indexOf(normNote);
    if (chordIndices.includes(idx)) {
      result[note] = "Chord Tone";
    } else if (dimIndices.includes(idx)) {
      result[note] = "Borrowed Tone";
    }
  });
  
  return result;
};

const getChordNotesSet = (chordSymbol: string): Set<string> => {
    // Use Tonal for robust chord parsing
    try {
      // Fix formatting for Tonal: C7(b9) -> C7b9
      const cleanSymbol = chordSymbol.replace(/\((.*?)\)/g, "$1");
      
      const notes = Chord.get(cleanSymbol).notes;
      if (notes && notes.length > 0) {
         const canonicalNotes = notes.map(n => {
             const simplified = Note.simplify(n); 
             return CANONICAL_ROOTS[simplified] || simplified;
         });
         return new Set(canonicalNotes);
      }
      return new Set();
    } catch (e) {
      return new Set();
    }
};

const createChordMatch = (
  symbol: string, 
  melodyNotesSet: Set<string>, 
  config: AppConfig,
  forceInclude: boolean = false
): ChordMatch | null => {
    const chordNotes = getChordNotesSet(symbol);
    const matchingNotes: string[] = [];
    const missingNotes: string[] = [];

    if (melodyNotesSet.size > 0) {
        melodyNotesSet.forEach(m => {
            if (chordNotes.has(m)) matchingNotes.push(m);
            else missingNotes.push(m);
        });
    }

    const isFullMatch = melodyNotesSet.size > 0 
        ? matchingNotes.length === melodyNotesSet.size 
        : true;

    if (!forceInclude && config.hideIfMelodyNotInChord && melodyNotesSet.size > 0 && !isFullMatch) {
        return null;
    }

    return {
        symbol,
        matchingNotes,
        missingNotes,
        isFullMatch
    };
};

// List of chord qualities to check for derived chords
const DERIVED_CHORD_SUFFIXES = [
    '6', 
    'm6',
    'mM7',
    // Basic 7ths prioritized before Sus/Aug
    '9',
    'maj7', 
    '7', 
    'm7', 
    'm7b5', 
    // Sus
    '7sus4', 
    'sus4', 
    'sus2',
    // Aug
    '7#5',
    'aug',
    // Triads
    '', // Major Triad
    'm', // Minor Triad
    '°', // Diminished Triad
];

// Sorting Weights for Final Output
// Lower number = earlier in list
const CHORD_ORDER_WEIGHT: Record<string, number> = {
    '6': 1,    // Major 6 first
    'm6': 2,   // Minor 6
    'mM7': 2.5, // Minor Major 7
    'dim': 3, '°': 3, // Diminished
    
    // Basic 7ths
    'maj7': 4, 
    '9': 4.5, // 9ths
    '7': 5, 
    'm7': 6, 
    'm7b5': 7, 

    // Sus
    '7sus4': 10, 'sus4': 11, 'sus2': 12, 
    
    // Aug
    '7#5': 20, 'aug': 21, 
    
    // Triads (Last)
    '': 90, 
    'm': 91, 
};

const getChordWeight = (symbol: string): number => {
    // Handle Slash Chords relative to their base
    const isSlash = symbol.includes('/');
    const searchSymbol = isSlash ? symbol.split('/')[0] : symbol;
    let weight = 100;

    // Match longest suffix first
    const suffixes = Object.keys(CHORD_ORDER_WEIGHT).sort((a,b) => b.length - a.length);
    for (const s of suffixes) {
        if (searchSymbol.endsWith(s)) {
             if (s === '') {
                // Heuristic for Major Triad
                if (/[0-9]/.test(searchSymbol) || searchSymbol.includes('sus') || searchSymbol.includes('aug') || searchSymbol.includes('m') || searchSymbol.includes('°') || searchSymbol.includes('dim')) {
                    continue;
                }
            }
            weight = CHORD_ORDER_WEIGHT[s];
            break;
        }
    }
    
    // If it's a slash chord, add a small offset to place it immediately after its parent type
    return isSlash ? weight + 0.1 : weight;
};

// Helper to get all roots from a dim family
const getDimRoots = (familyData: any): string[] => {
    return familyData.dims.map((d: string) => getRootFromString(d));
};

// Helper to generate Major 6th families
const generateMajor6Family = (
    roots: string[], 
    offsetSemitones: number, 
    melodyNotesSet: Set<string>, 
    config: AppConfig
): FamilyGroup[] => {
    const groups: FamilyGroup[] = [];

    roots.forEach(root => {
        // Calculate target root
        const rootIdx = NOTE_SORT_MAP[CANONICAL_ROOTS[root] || root];
        if (rootIdx === undefined) return;
        
        let targetIdx = (rootIdx + offsetSemitones) % 12;
        if (targetIdx < 0) targetIdx += 12;
        const targetRoot = CHROMATIC_SCALE[targetIdx];

        // Chords to check: 6, maj7, m7 (relative minor)
        // Relative minor root is targetRoot - 3 semitones (or +9)
        let relMinIdx = (targetIdx + 9) % 12;
        const relMinRoot = CHROMATIC_SCALE[relMinIdx];

        const chordsToCheck = [
            { root: targetRoot, suffix: '6', label: '' },
            { root: targetRoot, suffix: 'maj7', label: '' },
            // Add relative minor 7 as it functions as a 6th chord inversion
            { root: relMinRoot, suffix: 'm7', label: `(rel II of ${targetRoot})` }
        ];

        const foundChords: ChordMatch[] = [];

        chordsToCheck.forEach(item => {
            const symbol = item.root + item.suffix;
            const match = createChordMatch(symbol, melodyNotesSet, config);
            if (match) {
                if (item.label) match.labelSuffix = item.label;
                foundChords.push(match);
            }
        });

        if (foundChords.length > 0) {
            groups.push({
                root: targetRoot,
                chords: foundChords
            });
        }
    });

    return groups;
};

// --- Main Analysis Function ---

export const analyzeChord = (input: string, melodyInput: string, config: AppConfig): AnalysisResult => {
  const userNorm = normalizeInputSymbol(input);
  const emptyResult = { 
    displayChord: '', scaleRoot: null, scaleType: null, scaleNotes: [], 
    systemInfo: null, melodyAnalysis: [], families: [], relatedMinor6ths: [], 
    major6Raise2: [], major6Lower2: [],
    upperStructureTriads: { major: [], minor: [] },
  };

  if (!userNorm) return { ...emptyResult, info: "Enter a chord to begin." };

  // Parse Melody
  const melodyNotesList: string[] = [];
  const melodyNotesSet = new Set<string>();
  if (melodyInput.trim()) {
    melodyInput.split(/\s+/).forEach(n => {
      const norm = normalizeInputSymbol(n);
      const canon = CANONICAL_ROOTS[norm] || norm;
      if (canon) {
        melodyNotesList.push(canon);
        melodyNotesSet.add(canon);
      }
    });
  }

  const isDim = userNorm.toLowerCase().includes("dim") || userNorm.includes("°");
  
  if (!isDim) {
     return { ...emptyResult, displayChord: userNorm, error: "Currently only Diminished (dim/°7) chord analysis is fully supported." };
  }

  const displayChord = normalizeDimSymbol(userNorm).replace("dim", "°");
  const scaleRoot = getRootFromString(userNorm);
  const scaleType = "DiminishedScale";

  // Lookup Family
  const normDimForLookup = getCanonicalSymbol(normalizeDimSymbol(userNorm), "dim");
  
  let familyData = null;
  for (const fam of DIM_FAMILIES) {
     const famDimsCanonical = fam.dims.map(d => getCanonicalSymbol(normalizeDimSymbol(d), "dim"));
     if (famDimsCanonical.includes(normDimForLookup)) {
       familyData = fam;
       break;
     }
  }

  if (!familyData) {
     return { ...emptyResult, displayChord: userNorm, error: "Chord not found in Barry Harris database." };
  }

  // 1. Generate Scale
  const rawScaleNotes = getBhScaleNotes(scaleRoot, scaleType);
  const scaleNotesSet = new Set(rawScaleNotes.map(n => CANONICAL_ROOTS[n] || n));
  
  const formattedScaleNotes: ScaleNote[] = rawScaleNotes.map(n => {
      const normN = CANONICAL_ROOTS[n] || n;
      let role = "";
      
      const idx = rawScaleNotes.indexOf(n);
      if ([0,2,4,6].includes(idx)) role = "Chord Tone";
      else role = "Borrowed Tone";
      
      const isMelody = melodyNotesSet.has(normN);

      return { note: n, role, isMelody };
  });

  melodyNotesList.forEach(m => {
      const normM = CANONICAL_ROOTS[m] || m;
      if (!scaleNotesSet.has(normM)) {
           const exists = formattedScaleNotes.some(fs => CANONICAL_ROOTS[fs.note] === normM || fs.note === m);
           if (!exists) {
               formattedScaleNotes.push({
                   note: m,
                   role: "Not in scale",
                   isMelody: true
               });
           }
      }
  });

  // 2. Melody Analysis
  const melodyAnalysis: ScaleNote[] = melodyNotesList.map(n => {
     const roles = identifyBorrowedNotes(scaleRoot, scaleType, [n]);
     return { note: n, role: roles[n] || "Not in scale", isMelody: true };
  });

  // 3. System Info
  const passingRoot = NOTES_STEP_DOWN[getRootFromString(userNorm)] || "?";
  const systemInfo = {
      on: displayChord,
      off: `${passingRoot}°`
  };

  // 4. Generate Dominants (Families)
  const families: FamilyGroup[] = [];
  const suffixes = [
      { key: 'basic', label: '7' },
      { key: '7b9', label: '7(b9)' },
      { key: '7s9', label: '7(#9)' },
      { key: '7b5', label: '7(b5)' },
      { key: '13b9', label: '13(b9)' },
      { key: '7alt', label: '7alt' }
  ];

  familyData.strict_dominants.basic.forEach((basicDom) => {
      const domRoot = getRootFromString(basicDom);
      const chordsInFamily: ChordMatch[] = [];

      suffixes.forEach(suffixObj => {
          let symbol = domRoot + suffixObj.label;
          if (suffixObj.label === '7') symbol = domRoot + "7";

          const match = createChordMatch(symbol, melodyNotesSet, config);
          if (match) chordsInFamily.push(match);
      });

      if (chordsInFamily.length > 0) {
          families.push({
              root: domRoot,
              chords: chordsInFamily
          });
      }
  });

  // 5. Related Minor 6ths
  const relatedMinor6ths: RelatedMinor6Match[] = [];
  if (familyData.m6s) {
      familyData.m6s.forEach(m6Sym => {
          const m6Root = getRootFromString(m6Sym);
          const rawScale = getBhScaleNotes(m6Root, "Minor6Dim");
          const m6ScaleSet = new Set(rawScale.map(n => CANONICAL_ROOTS[n] || n));

          let isScaleValid = true;
          if (melodyNotesSet.size > 0) {
             for (const m of melodyNotesSet) {
                 if (!m6ScaleSet.has(m)) {
                     isScaleValid = false;
                     break;
                 }
             }
          }

          if (isScaleValid) {
             const match = createChordMatch(m6Sym, melodyNotesSet, config, true);
             
             if (match) {
                 const formattedScale: ScaleNote[] = rawScale.map((n, idx) => {
                     const role = [0,2,4,6].includes(idx) ? "Chord Tone" : "Borrowed Tone";
                     const normN = CANONICAL_ROOTS[n] || n;
                     const isMelody = melodyNotesSet.has(normN);
                     return { note: n, role, isMelody };
                 });

                 let derivedChords: ChordMatch[] = [];
                 
                 // Standard Generation
                 rawScale.forEach(potentialRoot => {
                    DERIVED_CHORD_SUFFIXES.forEach(suffix => {
                        const checkSymbol = potentialRoot + suffix;
                        const checkNotes = getChordNotesSet(checkSymbol);
                        
                        if (checkNotes.size > 0) {
                            let allNotesInScale = true;
                            for (const n of checkNotes) {
                                if (!m6ScaleSet.has(n)) {
                                    allNotesInScale = false;
                                    break;
                                }
                            }

                            if (allNotesInScale) {
                                const chordMatch = createChordMatch(checkSymbol, melodyNotesSet, config);
                                if (chordMatch) {
                                    derivedChords.push(chordMatch);
                                }
                            }
                        }
                    });
                 });

                 // Special Slash Chords Generation (m6/2, mM7/2, V/Root)
                 const note2 = rawScale[1]; // Major 2nd
                 const note5 = rawScale[4]; // Perfect 5th
                 const slashCandidates = [
                     `${m6Root}m6/${note2}`,
                     `${m6Root}mM7/${note2}`,
                     `${note5}/${m6Root}` // Major triad of V over Root (e.g. C/F in Fm6)
                 ];

                 slashCandidates.forEach(slashSym => {
                    const checkNotes = getChordNotesSet(slashSym);
                    if (checkNotes.size > 0) {
                        let allNotesInScale = true;
                        for (const n of checkNotes) {
                            if (!m6ScaleSet.has(n)) {
                                allNotesInScale = false;
                                break;
                            }
                        }
                        if (allNotesInScale) {
                             const match = createChordMatch(slashSym, melodyNotesSet, config);
                             if (match) derivedChords.push(match);
                        }
                    }
                 });


                 // --- CONSOLIDATION ---
                 if (config.consolidateResults) {
                     const chordMap = new Map<string, ChordMatch>();
                     derivedChords.forEach(c => chordMap.set(c.symbol, c));
                     const toRemove = new Set<string>();

                     // 1. CONSOLIDATE SYNONYMS (m7/m7b5 into 6ths)
                     derivedChords.forEach(chord => {
                         if (toRemove.has(chord.symbol)) return;
                         const isMaj6 = chord.symbol.endsWith('6') && !chord.symbol.endsWith('m6');
                         const isMin6 = chord.symbol.endsWith('m6');

                         if (isMaj6 || isMin6) {
                             const suffixLen = isMin6 ? 2 : 1;
                             const root = chord.symbol.slice(0, -suffixLen);
                             const rootIdx = NOTE_SORT_MAP[CANONICAL_ROOTS[root] || root];

                             if (rootIdx !== undefined) {
                                 let relIdx = (rootIdx - 3) % 12;
                                 if (relIdx < 0) relIdx += 12;
                                 const relRoot = CHROMATIC_SCALE[relIdx];
                                 const targetSuffix = isMaj6 ? 'm7' : 'm7b5';
                                 const targetSymbol = relRoot + targetSuffix;

                                 if (chordMap.has(targetSymbol)) {
                                     // Logic Update: Don't hide m7b5, just reference.
                                     // Hide m7 for Major6 as that is standard simplification.
                                     if (targetSuffix === 'm7b5') {
                                         const t = chordMap.get(targetSymbol);
                                         if (t) {
                                             chord.labelSuffix = `(aka ${targetSymbol})`;
                                             t.labelSuffix = `(inv. ${chord.symbol})`;
                                         }
                                     } else {
                                         chord.labelSuffix = `(${targetSymbol})`;
                                         toRemove.add(targetSymbol);
                                     }
                                 }
                             }
                         }
                     });

                     // 2. HIDE REDUNDANT TRIADS
                     derivedChords.forEach(c => {
                        const isMinorTriad = c.symbol.endsWith('m') && !c.symbol.includes('6') && !c.symbol.includes('7') && !c.symbol.includes('M7');
                        const isMajorTriad = !c.symbol.includes('m') && !c.symbol.includes('7') && !c.symbol.includes('6') && !c.symbol.includes('sus') && !c.symbol.includes('aug') && !c.symbol.includes('°') && !c.symbol.includes('/');

                        if (isMajorTriad) {
                            const root = c.symbol; 
                            const hasExtension = derivedChords.some(other => 
                                other.symbol !== root && 
                                other.symbol.startsWith(root) &&
                                (other.symbol.length > root.length && !['#', 'b'].includes(other.symbol[root.length]))
                            );
                            if (hasExtension) toRemove.add(c.symbol);
                        }

                        if (isMinorTriad) {
                            const root = c.symbol.slice(0, -1); // Remove 'm'
                            const hasExtension = derivedChords.some(other => 
                                other.symbol !== c.symbol &&
                                other.symbol.startsWith(root) &&
                                (other.symbol.includes('m7') || other.symbol.includes('m6') || other.symbol.includes('mM7'))
                            );
                            if (hasExtension) toRemove.add(c.symbol);
                        }
                     });

                     // 3. CONSOLIDATE SUS CHORDS & VALIDATE SLASH SYNONYMS
                     derivedChords.forEach(c => {
                         if (c.symbol.endsWith('7sus4')) {
                             const root = c.symbol.slice(0, -5); 
                             const sus4 = root + 'sus4';
                             const sus2 = root + 'sus2';
                             
                             // Slash Chord (Major Triad 2 semitones down)
                             let slashLabel = "";
                             const rootIdx = NOTE_SORT_MAP[CANONICAL_ROOTS[root] || root];
                             if (rootIdx !== undefined) {
                                 let targetIdx = (rootIdx - 2) % 12;
                                 if (targetIdx < 0) targetIdx += 12;
                                 const targetRoot = CHROMATIC_SCALE[targetIdx];
                                 
                                 // STRICT VALIDATION: Check target triad against scale
                                 const triadNotes = getChordNotesSet(targetRoot);
                                 let isValid = true;
                                 if (triadNotes.size > 0) {
                                     for (const n of triadNotes) {
                                         if (!m6ScaleSet.has(n)) {
                                             isValid = false;
                                             break;
                                         }
                                     }
                                 } else isValid = false;

                                 if (isValid) {
                                     slashLabel = `or ${targetRoot}/${root}`;
                                 }
                             }
                             
                             const subsets: string[] = [];
                             if (chordMap.has(sus4)) { subsets.push('sus4'); toRemove.add(sus4); }
                             if (chordMap.has(sus2)) { subsets.push('sus2'); toRemove.add(sus2); }

                             let labels = [];
                             if (slashLabel) labels.push(slashLabel);
                             if (subsets.length > 0) labels.push(`inc. ${subsets.join(', ')}`);
                             
                             if (labels.length > 0) {
                                 const existing = c.labelSuffix ? c.labelSuffix + ' ' : '';
                                 c.labelSuffix = `${existing}(${labels.join('; ')})`;
                             }
                         }
                     });

                     // 3.5 IDENTIFY SLASH CHORDS FOR 9s (e.g. Bb9 -> Fm6/Bb)
                     derivedChords.forEach(c => {
                         if (c.symbol.endsWith('9') && !c.symbol.includes('7') && !c.symbol.includes('6')) {
                             const root = c.symbol.slice(0, -1);
                             const rootIdx = NOTE_SORT_MAP[CANONICAL_ROOTS[root] || root];
                             if (rootIdx !== undefined) {
                                 let targetIdx = (rootIdx + 7) % 12;
                                 if (targetIdx < 0) targetIdx += 12;
                                 const targetRoot = CHROMATIC_SCALE[targetIdx];
                                 const m6Symbol = targetRoot + 'm6';
                                 
                                 const m6Notes = getChordNotesSet(m6Symbol);
                                 let isValid = true;
                                 for (const n of m6Notes) {
                                     if (!m6ScaleSet.has(n)) {
                                         isValid = false;
                                         break;
                                     }
                                 }
                                 
                                 if (isValid) {
                                     const existing = c.labelSuffix ? c.labelSuffix + ' ' : '';
                                     c.labelSuffix = `${existing}(or ${m6Symbol}/${root})`;
                                 }
                             }
                         }
                     });

                     derivedChords.forEach(c => {
                         if (c.symbol.endsWith('sus4') && !c.symbol.endsWith('7sus4')) {
                             if (toRemove.has(c.symbol)) return;
                             const root = c.symbol.slice(0, -4);
                             const sus2 = root + 'sus2';
                             if (chordMap.has(sus2) && !toRemove.has(sus2)) {
                                 toRemove.add(sus2);
                                 const existing = c.labelSuffix ? c.labelSuffix + ' ' : '';
                                 c.labelSuffix = `${existing}(inc. sus2)`;
                             }
                         }
                     });

                     derivedChords.forEach(c => {
                        if (c.symbol.endsWith('7#5')) {
                            const root = c.symbol.slice(0, -3);
                            const aug = root + 'aug';
                            if (chordMap.has(aug) && !toRemove.has(aug)) {
                                toRemove.add(aug);
                                 const existing = c.labelSuffix ? c.labelSuffix + ' ' : '';
                                c.labelSuffix = `${existing}(inc. aug)`;
                            }
                        }
                     });

                     derivedChords = derivedChords.filter(c => !toRemove.has(c.symbol));
                 }

                 // --- SORTING ---
                 derivedChords.sort((a, b) => {
                     const wA = getChordWeight(a.symbol);
                     const wB = getChordWeight(b.symbol);
                     
                     if (Math.floor(wA) !== Math.floor(wB)) return wA - wB;
                     if (wA !== wB) return wA - wB; // Sub-weight for slash chords

                     const getRootVal = (s: string) => {
                         const r = getRootFromString(s);
                         return NOTE_SORT_MAP[CANONICAL_ROOTS[r] || r] || 0;
                     };
                     return getRootVal(a.symbol) - getRootVal(b.symbol);
                 });

                 relatedMinor6ths.push({
                     chord: match,
                     scale: formattedScale,
                     derivedChords: derivedChords
                 });
             }
          }
      });
  }

  // 6. Upper Structure Triads
  const triadRoots = familyData.strict_dominants.basic.map(d => getRootFromString(d));
  triadRoots.sort((a,b) => (NOTE_SORT_MAP[a] || 0) - (NOTE_SORT_MAP[b] || 0));

  const processTriads = (roots: string[], quality: string): ChordMatch[] => {
      const rawSymbols = roots.map(r => r + (quality === 'minor' ? 'm' : ''));
      const results: ChordMatch[] = [];

      rawSymbols.forEach(sym => {
          const match = createChordMatch(sym, melodyNotesSet, config);
          if (match) results.push(match);
      });
      
      return results;
  };

  const upperStructureTriads = {
      major: processTriads(triadRoots, 'major'),
      minor: processTriads(triadRoots, 'minor')
  };

  // 7. New Major 6th Families
  const dimRoots = getDimRoots(familyData);
  
  // Raise 2 notes: Major 6 on same roots
  const major6Raise2 = generateMajor6Family(dimRoots, 0, melodyNotesSet, config);
  
  // Lower 2 notes: Major 6 on roots + 2 semitones (whole step up)
  const major6Lower2 = generateMajor6Family(dimRoots, 2, melodyNotesSet, config);

  return {
      displayChord,
      scaleRoot,
      scaleType,
      scaleNotes: formattedScaleNotes,
      systemInfo,
      melodyAnalysis,
      families,
      relatedMinor6ths,
      major6Raise2,
      major6Lower2,
      upperStructureTriads,
  };
};