"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type {
  SectorOpportunity,
  SectorOpportunitySectionId,
} from "@/lib/types";
import { SECTOR_OPPORTUNITY_SECTION_NAMES } from "@/lib/types";

export interface SectorOpportunityEditProps {
  sectorOpportunity: SectorOpportunity;
}

const SECTION_IDS: SectorOpportunitySectionId[] = [
  "1", "2", "3", "4", "5", "6", "7", "8", "9", "10",
];

const labelClass =
  "text-[10px] uppercase tracking-wider text-[#6B6B6B] font-medium";

export function SectorOpportunityEdit({
  sectorOpportunity: initial,
}: SectorOpportunityEditProps) {
  const router = useRouter();

  const [name, setName] = useState(initial.name);
  const [tags, setTags] = useState(initial.tags.join(", "));
  const [sections, setSections] = useState<Record<string, string>>(
    () => ({ ...initial.sections }),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const updateSection = useCallback(
    (id: string, value: string) => {
      setSections((prev) => ({ ...prev, [id]: value }));
    },
    [],
  );

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const res = await fetch(`/api/sectors/${initial.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          tags: tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          sections,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      router.refresh();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6" data-testid="sector-edit">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href={`/sectors/${initial.id}`}
          className="text-sm text-[#7A6B5A] underline underline-offset-2 hover:text-[#5A4B3A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A6B5A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF9F7]"
        >
          ← Back to detail
        </Link>

        <div className="flex items-center gap-3">
          {saveSuccess && (
            <span className="text-xs text-green-700 font-medium">Saved</span>
          )}
          {saveError && (
            <span className="text-xs text-red-700 font-medium">{saveError}</span>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-1.5 text-sm font-medium text-white bg-[#7A6B5A] hover:bg-[#5A4B3A] disabled:opacity-50 transition duration-300 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A6B5A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF9F7]"
          >
            {isSaving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>

      {/* Name */}
      <section className="bg-white border border-[#E8E6E3] p-6 space-y-4">
        <div>
          <label className={labelClass} htmlFor="sector-name">
            Sector name
          </label>
          <input
            id="sector-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full border border-[#E8E6E3] bg-[#FAF9F7] px-3 py-2 text-sm text-[#2C2C2C] focus:outline-none focus:border-[#7A6B5A] focus:ring-1 focus:ring-[#7A6B5A]"
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="sector-tags">
            Tags (comma separated)
          </label>
          <input
            id="sector-tags"
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="mt-1 block w-full border border-[#E8E6E3] bg-[#FAF9F7] px-3 py-2 text-sm text-[#2C2C2C] focus:outline-none focus:border-[#7A6B5A] focus:ring-1 focus:ring-[#7A6B5A]"
          />
        </div>
      </section>

      {/* Sections */}
      {SECTION_IDS.map((sid) => (
        <section
          key={sid}
          className="bg-white border border-[#E8E6E3] p-6 space-y-2"
        >
          <label className={labelClass} htmlFor={`section-${sid}`}>
            {sid}. {SECTOR_OPPORTUNITY_SECTION_NAMES[sid]}
          </label>
          <textarea
            id={`section-${sid}`}
            value={sections[sid] || ""}
            onChange={(e) => updateSection(sid, e.target.value)}
            rows={8}
            className="block w-full border border-[#E8E6E3] bg-[#FAF9F7] px-3 py-2 text-sm text-[#2C2C2C] leading-relaxed focus:outline-none focus:border-[#7A6B5A] focus:ring-1 focus:ring-[#7A6B5A] resize-y"
          />
          <p className="text-[10px] text-[#6B6B6B]">
            Use a blank line to separate paragraphs.
          </p>
        </section>
      ))}

      {/* Bottom save bar */}
      <div className="sticky bottom-0 bg-[#FAF9F7] border-t border-[#E8E6E3] py-3 flex items-center justify-end gap-3 px-1">
        {saveSuccess && (
          <span className="text-xs text-green-700 font-medium">Saved</span>
        )}
        {saveError && (
          <span className="text-xs text-red-700 font-medium">{saveError}</span>
        )}
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-1.5 text-sm font-medium text-white bg-[#7A6B5A] hover:bg-[#5A4B3A] disabled:opacity-50 transition duration-300 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A6B5A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF9F7]"
        >
          {isSaving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </div>
  );
}
