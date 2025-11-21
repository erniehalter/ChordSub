
import React, { useState, useEffect, useMemo } from 'react';
import { Music, Info, AlertCircle, MousePointerClick, Eye, EyeOff } from 'lucide-react';
import { analyzeChord } from './services/logic';
import { AppConfig, AnalysisResult, ChordMatch } from './types';
import { CANONICAL_ROOTS } from './constants';
import { FONT_SIZES, LAYOUT_SIZES } from './theme';

const DEFAULT_CONFIG: AppConfig = {
  highlightExtensions: true,
  hideIfMelodyNotInChord: true, // Default: Hide Mismatch Enabled
  hideIfMelodyNotInScale: false,
  largeChordFont: true, 
  consolidateResults: true, // Default: Consolidate Enabled
};

// Updated ChordChip to use FONT_SIZES from theme.ts
const ChordChip: React.FC<{ data: ChordMatch; showBadges: boolean; compact?: boolean }> = ({ data, showBadges, compact = false }) => {
  return (
    <div className={`flex flex-col items-center justify-center rounded-lg border transition-all w-full ${
        data.isFullMatch 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-gray-900/40 border-gray-800/50 text-gray-400'
    } ${compact ? `${LAYOUT_SIZES.CHORD_HEIGHT_COMPACT} px-2 py-1.5` : `${LAYOUT_SIZES.CHORD_HEIGHT_MAIN} px-3 py-2`}`}>
       <span className={`font-mono font-medium leading-tight text-center ${data.isFullMatch ? 'text-gray-200' : 'text-gray-500'} ${compact ? FONT_SIZES.CHORD_COMPACT : FONT_SIZES.CHORD_MAIN}`}>
         {data.symbol}
       </span>
       {data.labelSuffix && (
           <span className={`${FONT_SIZES.LABEL_SUFFIX} text-gray-500 mt-0.5 font-medium tracking-tight text-center`}>
               {data.labelSuffix}
           </span>
       )}
       {showBadges && (data.matchingNotes.length > 0 || data.missingNotes.length > 0) && (
           <div className="flex gap-1 mt-1.5 flex-wrap justify-center">
              {data.matchingNotes.map(n => (
                  <span key={n} className={`${FONT_SIZES.BADGE} font-bold text-green-400 bg-green-900/20 px-1 rounded border border-green-900/30`}>{n}</span>
              ))}
              {data.missingNotes.map(n => (
                  <span key={n} className={`${FONT_SIZES.BADGE} text-gray-600 decoration-gray-600 line-through decoration-1 opacity-60`}>{n}</span>
              ))}
           </div>
       )}
    </div>
  );
};

interface SectionHeaderProps {
    title: string;
    subtitle?: string;
    colorClass: string;
    isExpanded: boolean;
    isSolo: boolean;
    onToggle: () => void;
    onSolo: () => void;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ title, subtitle, colorClass, isExpanded, isSolo, onToggle, onSolo }) => (
    <div className={`flex items-center justify-between mb-3 select-none group rounded-lg px-2 -mx-2 transition-all duration-200 ${!isExpanded ? 'bg-gray-900/40 py-2 border border-gray-800/50' : 'py-0'}`}>
        <h3 className={`${FONT_SIZES.SECTION_TITLE} font-bold text-gray-400 uppercase tracking-wider flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 cursor-pointer hover:text-gray-200 transition-colors flex-1`} onClick={onToggle}>
            <div className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${isExpanded ? colorClass : 'bg-gray-700 scale-75'}`}></span>
                <span className={`transition-opacity duration-200 ${!isExpanded ? 'opacity-60' : 'opacity-100'}`}>{title}</span>
            </div>
            {subtitle && isExpanded && (
                <span className="text-[10px] text-gray-600 font-normal lowercase tracking-normal border-l border-gray-700 pl-2 ml-0 block sm:inline mt-0.5 sm:mt-0">
                    ({subtitle})
                </span>
            )}
            {!isExpanded && <span className="text-[9px] font-normal text-gray-500 border border-gray-800 bg-gray-900/50 px-1.5 rounded sm:ml-2 w-fit">Hidden</span>}
        </h3>
        <div className="flex items-center gap-2 self-start sm:self-center">
            <button 
                onClick={(e) => { e.stopPropagation(); onSolo(); }}
                className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border transition-all duration-200 ${
                    isSolo 
                    ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300 shadow-[0_0_10px_rgba(99,102,241,0.15)]' 
                    : 'bg-gray-800 border-gray-700 text-gray-500 hover:text-gray-300 hover:border-gray-600 opacity-60 group-hover:opacity-100'
                }`}
                title={isSolo ? "Show all sections" : "Show only this section"}
            >
                {isSolo ? 'Un-solo' : 'Solo'}
            </button>
            <button 
                onClick={(e) => { e.stopPropagation(); onToggle(); }}
                className={`p-1 rounded transition-colors ${
                    isExpanded 
                    ? 'text-gray-600 hover:text-gray-300 hover:bg-gray-800' 
                    : 'text-indigo-400 bg-indigo-900/20 border border-indigo-500/20'
                }`}
                title={isExpanded ? "Collapse" : "Expand"}
            >
                {isExpanded ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            </button>
        </div>
    </div>
);

interface SubSectionHeaderProps {
    title: string;
    titleColor?: string;
    isCollapsed: boolean;
    isSolo: boolean;
    onToggle: () => void;
    onSolo: () => void;
}

const SubSectionHeader: React.FC<SubSectionHeaderProps> = ({ title, titleColor = "text-gray-200", isCollapsed, isSolo, onToggle, onSolo }) => (
    <div className={`flex items-center justify-between border-b border-gray-700/50 pb-2 mb-2 ${isCollapsed ? 'border-transparent mb-0' : ''}`}>
         <div className="flex items-center gap-2 overflow-hidden" onClick={onToggle} role="button">
            <span className={`${FONT_SIZES.SUBSECTION_TITLE} font-bold truncate transition-colors ${isCollapsed ? 'text-gray-500' : titleColor}`}>{title}</span>
            {isCollapsed && <span className="text-[9px] font-normal text-gray-600 border border-gray-800 bg-gray-900/50 px-1.5 rounded">Hidden</span>}
         </div>
         <div className="flex items-center gap-1 shrink-0">
             <button 
                onClick={(e) => { e.stopPropagation(); onSolo(); }}
                className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border transition-all duration-200 ${
                    isSolo 
                    ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300' 
                    : 'bg-transparent border-transparent text-gray-600 hover:text-gray-400 hover:bg-gray-800'
                }`}
                title={isSolo ? "Show all in group" : "Solo this item"}
            >
                {isSolo ? 'Un-solo' : 'Solo'}
            </button>
            <button 
                onClick={(e) => { e.stopPropagation(); onToggle(); }}
                className={`p-1 rounded transition-colors ${
                    isCollapsed 
                    ? 'text-gray-500 hover:text-gray-300 hover:bg-gray-800' 
                    : 'text-gray-600 hover:text-gray-300'
                }`}
                title={isCollapsed ? "Expand" : "Collapse"}
            >
                {isCollapsed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            </button>
         </div>
    </div>
);

export default function App() {
  const [chordInput, setChordInput] = useState('');
  const [melodyInput, setMelodyInput] = useState('');
  const [config] = useState<AppConfig>(DEFAULT_CONFIG);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  
  const [expandedSections, setExpandedSections] = useState({
      scale: true,
      families: true,
      triads: true,
      minor6: true,
      major6Raise: true,
      major6Lower: true
  });

  // Track hidden sub-items (e.g., specific families or m6 scales) by ID
  const [hiddenSubIds, setHiddenSubIds] = useState<Set<string>>(new Set());

  // Determine if a specific section is currently the ONLY one expanded (Soloed)
  const activeSoloKey = useMemo(() => {
    const keys = Object.keys(expandedSections) as Array<keyof typeof expandedSections>;
    const activeKeys = keys.filter(k => expandedSections[k]);
    return activeKeys.length === 1 ? activeKeys[0] : null;
  }, [expandedSections]);

  useEffect(() => {
    const timeOutId = setTimeout(() => {
        if (chordInput) {
            const res = analyzeChord(chordInput, melodyInput, config);
            setResult(res);
        } else {
            setResult(null);
        }
    }, 75); 

    return () => clearTimeout(timeOutId);
  }, [chordInput, melodyInput, config]);

  const toggleSection = (key: keyof typeof expandedSections) => {
      setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const soloSection = (key: keyof typeof expandedSections) => {
      if (activeSoloKey === key) {
          // If currently soloed, "Un-solo" (Show All)
          setExpandedSections({
              scale: true,
              families: true,
              triads: true,
              minor6: true,
              major6Raise: true,
              major6Lower: true
          });
      } else {
          // Solo this section
          setExpandedSections({
              scale: key === 'scale',
              families: key === 'families',
              triads: key === 'triads',
              minor6: key === 'minor6',
              major6Raise: key === 'major6Raise',
              major6Lower: key === 'major6Lower'
          });
      }
  };

  const toggleSubItem = (id: string) => {
      setHiddenSubIds(prev => {
          const newSet = new Set(prev);
          if (newSet.has(id)) newSet.delete(id);
          else newSet.add(id);
          return newSet;
      });
  };

  const handleSubSolo = (targetId: string, groupIds: string[]) => {
      setHiddenSubIds(prev => {
          const newSet = new Set(prev);
          const otherIds = groupIds.filter(id => id !== targetId);
          
          // Check if already soloed (all others hidden, target visible)
          const isAlreadySolo = otherIds.every(id => newSet.has(id)) && !newSet.has(targetId);

          if (isAlreadySolo) {
              // Un-solo: Show all in this group
              groupIds.forEach(id => newSet.delete(id));
          } else {
              // Solo: Hide others, show target
              otherIds.forEach(id => newSet.add(id));
              newSet.delete(targetId);
          }
          return newSet;
      });
  };

  const checkSubSolo = (targetId: string, groupIds: string[]) => {
      const otherIds = groupIds.filter(id => id !== targetId);
      // Returns true if this item is the ONLY one visible in the group
      return otherIds.every(id => hiddenSubIds.has(id)) && !hiddenSubIds.has(targetId);
  };

  const handleScaleNoteClick = (note: string) => {
    const normalize = (n: string) => {
       let s = n.trim().replace(/♭/g, "b").replace(/♯/g, "#");
       if(s.length > 0) s = s.charAt(0).toUpperCase() + s.slice(1);
       return CANONICAL_ROOTS[s] || s;
    };

    const target = normalize(note);
    const tokens = melodyInput.trim().split(/\s+/).filter(t => t);
    const exists = tokens.some(t => normalize(t) === target);
    
    let newTokens;
    if (exists) {
        // Remove if present
        newTokens = tokens.filter(t => normalize(t) !== target);
    } else {
        // Add if absent
        newTokens = [...tokens, note];
    }
    setMelodyInput(newTokens.join(" "));
  };

  const melodyTokens = melodyInput.trim().split(/\s+/).filter(t => t);
  const showMelodyBadges = melodyTokens.length > 1;

  // Compute group IDs for sub-solo logic
  const familyIds = result ? result.families.map(f => `fam-${f.root}`) : [];
  const minor6Ids = result ? result.relatedMinor6ths.map(m => `m6-${m.chord.symbol}`) : [];
  const major6RaiseIds = result ? result.major6Raise2.map(m => `m6r-${m.root}`) : [];
  const major6LowerIds = result ? result.major6Lower2.map(m => `m6l-${m.root}`) : [];

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-3 md:p-4 font-sans selection:bg-indigo-500 selection:text-white">
      <div className="max-w-6xl mx-auto space-y-4">
        
        {/* Header */}
        <header className="flex items-center justify-between border-b border-gray-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600/20 rounded-lg border border-indigo-500/30">
                <Music className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
                Chord Sub App for Harmony Nerds (v 1.09)
              </h1>
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">Diminished 6th Scale System</p>
            </div>
          </div>
        </header>

        {/* Input Panel */}
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 shadow-xl">
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                        Chord (Diminished)
                    </label>
                    <input
                        type="text"
                        value={chordInput}
                        onChange={(e) => setChordInput(e.target.value)}
                        placeholder="e.g., Cdim, F°7"
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-base font-mono text-white placeholder-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                    />
                </div>
                <div className="flex-1">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                        Melody Note(s)
                    </label>
                    <input
                        type="text"
                        value={melodyInput}
                        onChange={(e) => setMelodyInput(e.target.value)}
                        placeholder="e.g., C Eb G"
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-base font-mono text-white placeholder-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                    />
                </div>
            </div>
        </div>

        {/* Main Results Area */}
        <div className="space-y-4">
            {!result ? (
              <div className="flex flex-col items-center justify-center text-gray-600 bg-gray-900/30 rounded-xl border border-dashed border-gray-800 py-16">
                 <Info className="w-10 h-10 mb-3 opacity-20" />
                 <p className="text-sm">Enter a diminished chord to begin analysis.</p>
              </div>
            ) : result.error ? (
               <div className="bg-red-950/20 border border-red-900/30 p-5 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                  <div>
                    <h3 className="text-red-400 font-bold mb-1 text-sm">Analysis Error</h3>
                    <p className="text-red-200/70 text-xs">{result.error}</p>
                  </div>
               </div>
            ) : (
              <>
                {/* Scale & System Display - Full Width */}
                <section className="bg-gray-900 rounded-xl overflow-hidden border border-gray-800 shadow-xl transition-all duration-300">
                    <div className={`p-4 border-b border-gray-800 bg-gradient-to-r from-gray-900 to-gray-850 transition-colors ${!expandedSections.scale ? 'bg-gray-900/50' : ''}`}>
                        <div className="flex flex-wrap items-center justify-between gap-4">
                           <div className="flex-1 min-w-[200px]">
                                <div className="flex items-center gap-3">
                                    <h2 className={`text-2xl font-bold mb-0.5 transition-colors ${expandedSections.scale ? 'text-white' : 'text-gray-500'}`}>
                                        {result.displayChord}
                                    </h2>
                                    {/* Scale Section Controls */}
                                    <div className="flex items-center gap-2 pl-2 border-l border-gray-700/50">
                                         <button 
                                            onClick={() => soloSection('scale')}
                                            className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border transition-all duration-200 ${
                                                activeSoloKey === 'scale'
                                                ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300 shadow-[0_0_10px_rgba(99,102,241,0.15)]'
                                                : 'bg-gray-800 border-gray-700 text-gray-500 hover:text-gray-300 hover:border-gray-600'
                                            }`}
                                         >
                                            {activeSoloKey === 'scale' ? 'Un-solo' : 'Solo'}
                                         </button>
                                         <button 
                                            onClick={() => toggleSection('scale')}
                                            className={`p-1 rounded transition-colors ${expandedSections.scale ? 'text-gray-500 hover:text-white' : 'text-indigo-400 bg-indigo-900/20 border border-indigo-500/30'}`}
                                         >
                                            {expandedSections.scale ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                         </button>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <p className={`text-xs font-medium transition-colors ${expandedSections.scale ? 'text-indigo-400' : 'text-gray-600'}`}>
                                        {result.scaleRoot} Diminished Scale (Whole-Half)
                                    </p>
                                    {!expandedSections.scale && <span className="text-[9px] font-normal text-gray-500 border border-gray-800 bg-gray-900/50 px-1.5 rounded ml-2">Hidden</span>}
                                </div>
                           </div>
                           {result.systemInfo && expandedSections.scale && (
                               <div className="text-right hidden sm:block animate-in fade-in duration-500">
                                   <div className="text-[9px] text-gray-500 uppercase font-bold mb-1">System Movement</div>
                                   <div className="font-mono text-xs bg-gray-950 px-2.5 py-1 rounded border border-gray-800 inline-flex items-center gap-3">
                                       <span className="text-green-400">ON: {result.systemInfo.on}</span>
                                       <span className="text-gray-700">|</span>
                                       <span className="text-red-400">OFF: {result.systemInfo.off}</span>
                                   </div>
                               </div>
                           )}
                        </div>
                    </div>
                    
                    {/* Scale Notes Visualizer */}
                    {expandedSections.scale && (
                        <div className="p-4 bg-gray-900 animate-in slide-in-from-top-2 duration-200">
                            <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <div className="text-[10px] font-bold text-gray-500 uppercase">Scale Tones</div>
                                <div className="flex items-center gap-1 text-[9px] text-gray-500 bg-gray-800/50 px-1.5 py-0.5 rounded-full border border-gray-700/50">
                                    <MousePointerClick className="w-2.5 h-2.5" />
                                    Interactive
                                </div>
                            </div>
                            {melodyInput && (
                                <div className="text-[9px] text-yellow-400 font-medium flex items-center gap-1.5 bg-yellow-400/10 px-2 py-0.5 rounded-full border border-yellow-400/20">
                                    <span className="w-1 h-1 rounded-full bg-yellow-400"></span>
                                    Melody Match
                                </div>
                            )}
                            </div>
                            <div className="flex flex-wrap gap-2 sm:gap-3">
                                {result.scaleNotes.map((n, i) => (
                                    <button 
                                        key={i} 
                                        onClick={() => handleScaleNoteClick(n.note)}
                                        className="group flex flex-col items-center focus:outline-none"
                                    >
                                        <div className={`w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg text-sm sm:text-base font-bold border relative transition-all duration-200 cursor-pointer select-none group-hover:scale-105 group-active:scale-95 group-hover:brightness-110 ${
                                            n.role === 'Chord Tone' 
                                                ? 'bg-blue-900/20 border-blue-500/40 text-blue-200' 
                                                : n.role === 'Borrowed Tone'
                                                    ? 'bg-fuchsia-900/20 border-fuchsia-500/30 text-fuchsia-200'
                                                    : 'bg-red-900/20 border-red-500/30 text-red-200' // Out of scale style
                                        } ${n.isMelody ? 'ring-2 ring-yellow-400 ring-offset-2 ring-offset-gray-900 z-10 scale-110 shadow-[0_0_15px_rgba(250,204,21,0.25)]' : ''}`}>
                                            {n.note}
                                        </div>
                                        <span className="text-[8px] text-gray-600 mt-1 uppercase tracking-wider group-hover:text-gray-400 transition-colors">{n.role === 'Chord Tone' ? 'Chord' : n.role === 'Borrowed Tone' ? 'Scale' : 'Out'}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </section>
                
                {/* Split Layout: Families & Triads */}
                <div className={`grid grid-cols-1 gap-4 ${expandedSections.families && expandedSections.triads ? 'lg:grid-cols-2' : ''}`}>
                    
                    {/* Left Column: Dominant Families Only */}
                    <section className="flex flex-col gap-4 h-full">
                        <SectionHeader 
                            title="Dominant Families (Lower Note)"
                            subtitle="diatonic to half-whole diminished scale" 
                            colorClass="bg-indigo-500" 
                            isExpanded={expandedSections.families}
                            isSolo={activeSoloKey === 'families'}
                            onToggle={() => toggleSection('families')}
                            onSolo={() => soloSection('families')}
                        />
                        
                        {expandedSections.families && (
                            <div className="animate-in fade-in duration-300">
                                {result.families.length === 0 ? (
                                    <div className="flex items-center justify-center p-6 bg-gray-900/50 rounded-xl border border-gray-800 text-center">
                                        <div className="text-gray-500 text-xs">No dominant matches found</div>
                                    </div>
                                ) : (
                                    <div className={`grid grid-cols-1 gap-4 ${!expandedSections.triads ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2'}`}>
                                        {result.families.map((fam) => {
                                            const basicChord = fam.chords.find(c => c.symbol === `${fam.root}7`) || fam.chords[0];
                                            const extensions = fam.chords.filter(c => c.symbol !== basicChord.symbol);
                                            const cardId = `fam-${fam.root}`;
                                            const isHidden = hiddenSubIds.has(cardId);
                                            const isSoloed = checkSubSolo(cardId, familyIds);

                                            return (
                                                <div key={fam.root} className={`bg-gray-900/80 rounded-xl border border-gray-800/80 overflow-hidden transition-all duration-300 ${isHidden ? 'opacity-50 grayscale' : ''} ${isSoloed ? 'ring-1 ring-indigo-500/50 bg-gray-800/80' : ''}`}>
                                                     <div className="px-3 py-2 bg-gray-900 border-b border-gray-800/50">
                                                        <SubSectionHeader 
                                                            title={`${fam.root} Family`} 
                                                            titleColor="text-indigo-200"
                                                            isCollapsed={isHidden}
                                                            isSolo={isSoloed}
                                                            onToggle={() => toggleSubItem(cardId)}
                                                            onSolo={() => handleSubSolo(cardId, familyIds)}
                                                        />
                                                     </div>
                                                    
                                                    {!isHidden && (
                                                        <div className="p-3 space-y-4">
                                                            {/* Hero Chord */}
                                                            <ChordChip data={basicChord} showBadges={showMelodyBadges} />

                                                            {/* Extensions List */}
                                                            {extensions.length > 0 && (
                                                                <div className="space-y-1.5">
                                                                    <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Extensions</p>
                                                                    <div className="flex flex-wrap gap-2">
                                                                        {extensions.map((ext) => (
                                                                            <div key={ext.symbol} className="flex-grow basis-[120px]">
                                                                                <ChordChip data={ext} showBadges={showMelodyBadges} compact />
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </section>

                    {/* Right Column: Upper Structure Triads */}
                    <section className="flex flex-col gap-4 h-full">
                         <SectionHeader 
                            title="Upper Structure Triads" 
                            subtitle="diatonic to half-whole diminished scale"
                            colorClass="bg-teal-500" 
                            isExpanded={expandedSections.triads}
                            isSolo={activeSoloKey === 'triads'}
                            onToggle={() => toggleSection('triads')}
                            onSolo={() => soloSection('triads')}
                        />
                        {expandedSections.triads && (
                            <div className="animate-in fade-in duration-300 h-full">
                                 <div className="bg-gray-900/80 rounded-xl border border-gray-800/80 overflow-hidden p-3 h-full">
                                    <div className="space-y-4">
                                        <div>
                                            <h4 className="text-[10px] font-bold text-teal-500/70 uppercase tracking-wider mb-2 border-b border-teal-900/30 pb-1">Major Triads</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {result.upperStructureTriads.major.map(chord => (
                                                   <div key={chord.symbol} className="flex-grow basis-[80px]">
                                                        <ChordChip data={chord} showBadges={showMelodyBadges} compact />
                                                   </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="text-[10px] font-bold text-teal-500/70 uppercase tracking-wider mb-2 border-b border-teal-900/30 pb-1">Minor Triads</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {result.upperStructureTriads.minor.map(chord => (
                                                    <div key={chord.symbol} className="flex-grow basis-[80px]">
                                                        <ChordChip data={chord} showBadges={showMelodyBadges} compact />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                 </div>
                            </div>
                        )}
                    </section>
                </div>

                {/* Full Width: Related Minor 6ths */}
                <section>
                    <SectionHeader 
                        title="Related Minor 6ths"
                        subtitle="diatonic to minor 6 diminished scale" 
                        colorClass="bg-rose-500" 
                        isExpanded={expandedSections.minor6}
                        isSolo={activeSoloKey === 'minor6'}
                        onToggle={() => toggleSection('minor6')}
                        onSolo={() => soloSection('minor6')}
                    />
                    {expandedSections.minor6 && (
                        <div className="animate-in fade-in duration-300">
                             <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                                {result.relatedMinor6ths.map((item) => {
                                    const cardId = `m6-${item.chord.symbol}`;
                                    const isHidden = hiddenSubIds.has(cardId);
                                    const isSoloed = checkSubSolo(cardId, minor6Ids);
                                    
                                    return (
                                    <div key={item.chord.symbol} className={`bg-gray-900/80 rounded-xl border border-gray-800/80 overflow-hidden transition-all duration-300 ${isHidden ? 'opacity-50 grayscale' : ''} ${isSoloed ? 'ring-1 ring-indigo-500/50 bg-gray-800/80' : ''}`}>
                                        <div className="px-3 py-2 bg-gray-900 border-b border-gray-800/50">
                                             <SubSectionHeader 
                                                title={item.chord.symbol}
                                                titleColor="text-rose-200"
                                                isCollapsed={isHidden}
                                                isSolo={isSoloed}
                                                onToggle={() => toggleSubItem(cardId)}
                                                onSolo={() => handleSubSolo(cardId, minor6Ids)}
                                             />
                                             {!isHidden && (
                                                 <div className="flex flex-wrap gap-1 mt-1">
                                                    {item.scale.map((n, i) => (
                                                        <span key={i} className={`text-[9px] px-1.5 py-0.5 rounded ${n.role === 'Chord Tone' ? 'bg-rose-900/20 text-rose-300/80' : 'text-gray-600'}`}>
                                                            {n.note}
                                                        </span>
                                                    ))}
                                                </div>
                                             )}
                                        </div>
                                        
                                        {!isHidden && (
                                            <div className="p-3 space-y-3">
                                                <ChordChip data={item.chord} showBadges={showMelodyBadges} />
                                                
                                                {item.derivedChords.length > 0 && (
                                                    <div className="space-y-1.5">
                                                        <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Derived Chords</p>
                                                        <div className="flex flex-col gap-2">
                                                            {item.derivedChords.map(derived => (
                                                                <ChordChip key={derived.symbol} data={derived} showBadges={showMelodyBadges} compact />
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )})}
                             </div>
                        </div>
                    )}
                </section>

                {/* Split Layout: Major 6th Families */}
                <div className={`grid grid-cols-1 gap-4 ${expandedSections.major6Raise && expandedSections.major6Lower ? 'lg:grid-cols-2' : ''}`}>
                    
                    {/* Raise 2 (Major 6) */}
                    <section className="flex flex-col gap-4 h-full">
                        <SectionHeader 
                            title="Brotherhood (Major 6) - Raise 2 Notes"
                            subtitle="diatonic to major 6 diminished scale" 
                            colorClass="bg-amber-500" 
                            isExpanded={expandedSections.major6Raise}
                            isSolo={activeSoloKey === 'major6Raise'}
                            onToggle={() => toggleSection('major6Raise')}
                            onSolo={() => soloSection('major6Raise')}
                        />
                        {expandedSections.major6Raise && (
                            <div className="animate-in fade-in duration-300">
                                 <div className={`grid grid-cols-1 gap-4 ${!expandedSections.major6Lower ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2'}`}>
                                     {result.major6Raise2.map(fam => {
                                         const cardId = `m6r-${fam.root}`;
                                         const isHidden = hiddenSubIds.has(cardId);
                                         const isSoloed = checkSubSolo(cardId, major6RaiseIds);

                                         return (
                                            <div key={fam.root} className={`bg-gray-900/80 rounded-xl border border-gray-800/80 overflow-hidden transition-all duration-300 ${isHidden ? 'opacity-50 grayscale' : ''} ${isSoloed ? 'ring-1 ring-indigo-500/50 bg-gray-800/80' : ''}`}>
                                                <div className="px-3 py-2 bg-gray-900 border-b border-gray-800/50">
                                                    <SubSectionHeader 
                                                        title={`${fam.root}6 Family`}
                                                        titleColor="text-amber-200"
                                                        isCollapsed={isHidden}
                                                        isSolo={isSoloed}
                                                        onToggle={() => toggleSubItem(cardId)}
                                                        onSolo={() => handleSubSolo(cardId, major6RaiseIds)}
                                                    />
                                                </div>
                                                {!isHidden && (
                                                    <div className="p-3 space-y-2">
                                                        {fam.chords.map(c => (
                                                            <ChordChip key={c.symbol} data={c} showBadges={showMelodyBadges} compact />
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                     )})}
                                 </div>
                            </div>
                        )}
                    </section>

                     {/* Lower 2 (Major 6) */}
                     <section className="flex flex-col gap-4 h-full">
                        <SectionHeader 
                            title="Brotherhood (Major 6) - Lower 2 Notes" 
                            subtitle="diatonic to major 6 diminished scale"
                            colorClass="bg-emerald-500" 
                            isExpanded={expandedSections.major6Lower}
                            isSolo={activeSoloKey === 'major6Lower'}
                            onToggle={() => toggleSection('major6Lower')}
                            onSolo={() => soloSection('major6Lower')}
                        />
                        {expandedSections.major6Lower && (
                            <div className="animate-in fade-in duration-300">
                                 <div className={`grid grid-cols-1 gap-4 ${!expandedSections.major6Raise ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2'}`}>
                                     {result.major6Lower2.map(fam => {
                                         const cardId = `m6l-${fam.root}`;
                                         const isHidden = hiddenSubIds.has(cardId);
                                         const isSoloed = checkSubSolo(cardId, major6LowerIds);

                                         return (
                                            <div key={fam.root} className={`bg-gray-900/80 rounded-xl border border-gray-800/80 overflow-hidden transition-all duration-300 ${isHidden ? 'opacity-50 grayscale' : ''} ${isSoloed ? 'ring-1 ring-indigo-500/50 bg-gray-800/80' : ''}`}>
                                                <div className="px-3 py-2 bg-gray-900 border-b border-gray-800/50">
                                                    <SubSectionHeader 
                                                        title={`${fam.root}6 Family`}
                                                        titleColor="text-emerald-200"
                                                        isCollapsed={isHidden}
                                                        isSolo={isSoloed}
                                                        onToggle={() => toggleSubItem(cardId)}
                                                        onSolo={() => handleSubSolo(cardId, major6LowerIds)}
                                                    />
                                                </div>
                                                {!isHidden && (
                                                    <div className="p-3 space-y-2">
                                                        {fam.chords.map(c => (
                                                            <ChordChip key={c.symbol} data={c} showBadges={showMelodyBadges} compact />
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                     )})}
                                 </div>
                            </div>
                        )}
                    </section>
                </div>

              </>
            )}
        </div>

        {/* Footer */}
        <footer className="pt-8 pb-4 text-center text-gray-600 text-xs">
            <p>© {new Date().getFullYear()} Chord Sub App for Harmony Nerds (v 1.09). Built for Barry Harris methodology.</p>
        </footer>
      </div>
    </div>
  );
}
