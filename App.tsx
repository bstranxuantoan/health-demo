
import React, { useState, useCallback, useMemo, useEffect } from "react";
import { analyzeScript } from "./services/geminiService";
import type { RequiredSection } from './types';
import { REQUIRED_SECTIONS } from './constants';
import { YouTubeIcon, WandIcon, Spinner } from './components/Icons';
import { AnalysisResultDisplay, SkeletonLoader } from './components/UI';
import { parseSections } from './utils/parser';

function buildPrompt(userScript: string): string {
  const header =
`You are a senior YouTube strategist for the US market.

TASK: Transform the input video script into a COMPLETE YouTube package in **American English** for a US audience. Optimize for SEO, retention, clarity, and shareability.
AUDIENCE & TONE:
- Audience: infer precisely from the script; write with empathy and respect (no lecturing).
- Voice: punchy, clear, helpful peer.
GOALS:
- Choose ONE primary objective based on the script: [educate | entertain | persuade].
- Produce a 3-layer HOOK: Thumbnail text (3–5 words), SEO Title (<=70 chars, primary keyword near start), and first-3-second spoken hook.
STRUCTURE & CRAFT RULES:
- Intro: pain → promise.
- Body: 3–5 beats; each beat = story → insight → 1-sentence fix.
- Objection flip + implementation plan.
- Pattern interrupt cues every 20–30s.
- US English only.
SEO RULES:
- First 2 description lines must include primary keywords + a human hook.
- 12–20 tags mixing short & long-tail.
- Chapters must be timestamped (mm:ss) and match content order.
- Provide Metadata JSON with fields: title, description, tags (array), defaultLanguage='en', defaultAudioLanguage='en-US', categoryId='27'.`;

  const format =
`\nOUTPUT FORMAT (exactly these Markdown sections, in this order; each starts with "### "):
${REQUIRED_SECTIONS.map(s => `### ${s}`).join("\n")}

INPUT SCRIPT:
<<<
${userScript}
>>>`;

  return header + format;
}

function App() {
  const [rawScript, setRawScript] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const s = localStorage.getItem("yco_script_en");
    const r = localStorage.getItem("yco_result_en");
    if (s) setRawScript(s); if (r) setResult(r);
  }, []);

  useEffect(() => { 
    localStorage.setItem("yco_script_en", rawScript); 
  }, [rawScript]);

  useEffect(() => { 
    if (result) localStorage.setItem("yco_result_en", result); 
  }, [result]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault(); 
    if (!rawScript.trim() || isLoading) return;
    
    setIsLoading(true); 
    setResult(null); 
    setError(null);
    
    try {
      const prompt = buildPrompt(rawScript);
      const out = await analyzeScript(prompt);
      if (out.startsWith('Error:')) {
        throw new Error(out);
      }
      setResult(out);
    } catch (e: any) {
      setError(e?.message || "An unexpected error occurred.");
      setResult(null);
    } finally { 
      setIsLoading(false); 
    }
  }, [rawScript, isLoading]);

  const clearAll = useCallback(() => {
    setRawScript(""); 
    setResult(null); 
    setError(null);
    localStorage.removeItem("yco_script_en"); 
    localStorage.removeItem("yco_result_en");
  }, []);

  const checklist = useMemo(() => {
    if (!result) return [];
    const found = parseSections(result).map(s => s.title.trim().toLowerCase());
    return REQUIRED_SECTIONS.map(name => ({ name, ok: found.includes(name.toLowerCase()) }));
  }, [result]);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans">
      <header className="p-4 border-b border-gray-700/50 sticky top-0 bg-gray-900/80 backdrop-blur-md z-10">
        <div className="container mx-auto flex items-center justify-center gap-3">
          <YouTubeIcon />
          <h1 className="text-2xl font-bold tracking-tight text-white">YouTube Content Optimizer (US)</h1>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          <div className="flex flex-col h-[calc(100vh-120px)]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-cyan-300">Video Script (Input in English)</h2>
              <button onClick={clearAll} className="text-xs px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-md hover:bg-gray-700">Clear</button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col flex-grow" aria-label="Script form">
              <label htmlFor="script" className="sr-only">Video script</label>
              <textarea
                id="script"
                value={rawScript}
                onChange={(e) => setRawScript(e.target.value)}
                placeholder={"Paste your English script here… (e.g., people-pleasing, boundaries, self-respect)"}
                className="w-full flex-grow bg-gray-800 border border-gray-700 rounded-lg p-4 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-300 resize-none"
                disabled={isLoading}
              />

              <button
                type="submit"
                disabled={isLoading || !rawScript.trim()}
                className="mt-4 w-full flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-cyan-500"
              >
                {isLoading ? (<><Spinner className="h-5 w-5" /> Optimizing…</>) : (<><WandIcon /> Optimize for YouTube SEO (US)</>)}
              </button>
            </form>

            <div className="mt-4 bg-gray-800/40 border border-gray-700 rounded-lg p-4 overflow-y-auto">
              <h3 className="text-sm font-semibold text-gray-200 mb-2">Required sections</h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {REQUIRED_SECTIONS.map(name => {
                  const item = checklist.find(c => c.name === name);
                  const ok = item?.ok ?? (result !== null);
                  return (
                    <li key={name} className="flex items-center gap-2">
                      <span className={`inline-block h-2.5 w-2.5 rounded-full transition-colors ${result === null ? 'bg-gray-600' : ok ? 'bg-green-400' : 'bg-red-400'}`} />
                      <span className={result === null ? "text-gray-500" : "text-gray-300"}>{name}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          <div className="h-[calc(100vh-120px)] overflow-y-auto pr-2 custom-scrollbar">
            <h2 className="text-xl font-semibold text-cyan-300 mb-4 sticky top-0 bg-gray-900 py-1">SEO Output (American English)</h2>

            {isLoading && <SkeletonLoader />}

            {error && (
              <div className="bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg" role="alert">
                <h3 className="font-bold mb-2">Error</h3>
                <p>{error}</p>
              </div>
            )}

            {result && <AnalysisResultDisplay result={result} />}

            {!isLoading && !error && !result && (
              <div className="flex items-center justify-center h-full text-center text-gray-500 bg-gray-800/30 rounded-lg border-2 border-dashed border-gray-700 p-4">
                <p>Your optimized YouTube SEO pack will appear here.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
