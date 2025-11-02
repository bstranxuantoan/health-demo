
import React, { useCallback, useMemo } from 'react';
import type { Section } from '../types';
import { parseSections } from '../utils/parser';

const CopyButton: React.FC<{ text: string; label?: string }> = ({ text, label = "Copy" }) => {
  const [copied, setCopied] = React.useState(false);
  const handleCopy = useCallback(async () => {
    try { 
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }, [text]);
  return (
    <button onClick={handleCopy} className="px-2.5 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 rounded-md border border-gray-600 transition-colors">
      {copied ? 'Copied!' : label}
    </button>
  );
};

const SectionCard: React.FC<{ section: Section }> = ({ section }) => {
  const isTitle = section.title.toLowerCase() === "title";
  const titleLength = isTitle ? section.content.trim().length : 0;
  const titleWarn = isTitle && titleLength > 70;

  const isMeta = section.title.toLowerCase() === "metadata json";
  let metaError: string | null = null;
  if (isMeta) {
    try {
      // Clean up potential markdown code fences
      const cleanContent = section.content.replace(/```json\n?|\n?```/g, '').trim();
      const jsonStart = cleanContent.indexOf("{");
      const jsonEnd = cleanContent.lastIndexOf("}");
      if (jsonStart === -1 || jsonEnd === -1) throw new Error("Could not find JSON object.");
      
      const raw = cleanContent.slice(jsonStart, jsonEnd + 1);
      const data = JSON.parse(raw);
      const required = ["title", "description", "tags", "defaultLanguage", "defaultAudioLanguage", "categoryId"];
      required.forEach(k => { if (!(k in data)) throw new Error(`Missing field: ${k}`); });
      if (data.defaultAudioLanguage !== "en-US") throw new Error("defaultAudioLanguage must be 'en-US'");
      if (data.defaultLanguage !== "en") throw new Error("defaultLanguage must be 'en'");
    } catch (e: any) {
      metaError = e?.message || "Invalid JSON";
    }
  }

  return (
    <div className="bg-gray-800/50 p-6 rounded-xl shadow-lg border border-gray-700 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-cyan-300">{section.title}</h3>
        <div className="flex gap-2">
          <CopyButton text={`${section.content}`} />
        </div>
      </div>

      {isTitle && (
        <div className="text-xs text-gray-400 mb-2">
          Title length: <span className={titleWarn ? "text-red-400 font-bold" : "text-gray-300"}>{titleLength}</span> / 70 {titleWarn && "(trim recommended)"}
        </div>
      )}

      {isMeta && metaError && (
        <div className="text-xs text-red-300 mb-2">Metadata JSON check: {metaError}</div>
      )}

      <div className="text-gray-300 whitespace-pre-wrap font-sans text-sm leading-relaxed">{section.content}</div>
    </div>
  );
};

export const AnalysisResultDisplay: React.FC<{ result: string }> = ({ result }) => {
  const sections = useMemo(() => parseSections(result), [result]);

  const downloadMd = useCallback(() => {
    const blob = new Blob([result], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = url; a.download = "youtube-seo-pack.md"; a.click(); URL.revokeObjectURL(url);
  }, [result]);

  const extractMetadataJson = useCallback(() => {
    const meta = sections.find(s => s.title.toLowerCase() === "metadata json");
    if (!meta) return null;
    try {
        const cleanContent = meta.content.replace(/```json\n?|\n?```/g, '').trim();
        const start = cleanContent.indexOf("{");
        const end = cleanContent.lastIndexOf("}");
        if (start === -1 || end === -1) return null;
        return JSON.stringify(JSON.parse(cleanContent.slice(start, end + 1)), null, 2);
    } catch { 
        return null; 
    }
  }, [sections]);

  const downloadJson = useCallback(() => {
    const raw = extractMetadataJson(); if (!raw) return;
    const blob = new Blob([raw], { type: "application/json" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = url; a.download = "metadata.json"; a.click(); URL.revokeObjectURL(url);
  }, [extractMetadataJson]);

  return (
    <div className="space-y-6">
      <div className="flex gap-2 justify-end">
        <CopyButton text={result} label="Copy All as Markdown" />
        <button onClick={downloadMd} className="px-2.5 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 rounded-md border border-gray-600">Download .md</button>
        <button onClick={downloadJson} disabled={!extractMetadataJson()} className="px-2.5 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 rounded-md border border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed">Download metadata.json</button>
      </div>
      {sections.map((s, i) => <SectionCard key={`${s.title}-${i}`} section={s} />)}
    </div>
  );
};

export const SkeletonLoader: React.FC = () => (
  <div className="space-y-6 animate-pulse">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
        <div className="h-5 bg-gray-700 rounded-md w-1/3 mb-4" />
        <div className="space-y-2">
          <div className="h-4 bg-gray-700 rounded-md w-full" />
          <div className="h-4 bg-gray-700 rounded-md w-5/6" />
          <div className="h-4 bg-gray-700 rounded-md w-3/4" />
        </div>
      </div>
    ))}
  </div>
);
