
import type { Section } from '../types';

export function parseSections(result: string): Section[] {
  if (!result.trim()) return [];
  const text = result.replace(/\r\n?/g, "\n");
  const parts = text.split(/\n(?=###\s)/g);
  const sections: Section[] = [];
  parts.forEach((chunk, idx) => {
    if (chunk.startsWith("### ")) {
      const nl = chunk.indexOf("\n");
      const title = chunk.substring(4, nl > -1 ? nl : chunk.length).trim();
      const content = nl > -1 ? chunk.substring(nl + 1).trim() : "";
      sections.push({ title: title || `Section ${idx + 1}`, content });
    } else {
      // This handles any text that might appear before the first "###" heading
      if (chunk.trim()) {
        sections.push({ title: "Overview", content: chunk.trim() });
      }
    }
  });
  return sections.filter(s => s.title || s.content);
}
