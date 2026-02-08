import Link from "next/link";

interface StrategySectorLinksEditorProps {
  linkedSectorIds: string[];
  sectorNameById: Map<string, string>;
  moveSectorLink: (sectorId: string, direction: "up" | "down") => void;
  removeSectorLink: (sectorId: string) => void;
  sectorsLoading: boolean;
  availableSectors: { id: string; name: string }[];
  unlinkedSectors: { id: string; name: string }[];
  sectorPickerId: string;
  addSectorLink: (sectorId: string) => void;
  labelClass: string;
}

export function StrategySectorLinksEditor({
  linkedSectorIds,
  sectorNameById,
  moveSectorLink,
  removeSectorLink,
  sectorsLoading,
  availableSectors,
  unlinkedSectors,
  sectorPickerId,
  addSectorLink,
  labelClass,
}: StrategySectorLinksEditorProps) {
  return (
    <section
      className="bg-white border border-[#E8E6E3] p-5 space-y-4"
      data-testid="sector-links-editor"
    >
      <h2 className="font-heading text-lg font-normal text-[#2C2C2C]">
        Linked Sector Opportunities
      </h2>
      <p className="text-xs text-[#6B6B6B] leading-relaxed">
        Link this strategy to sector opportunities. The order determines
        priority. Linked sectors appear on the published strategy detail page.
      </p>

      {/* Current links */}
      {linkedSectorIds.length > 0 ? (
        <ul
          className="space-y-2 list-none p-0 m-0"
          data-testid="linked-sectors-list"
        >
          {linkedSectorIds.map((sid, idx) => (
            <li
              key={sid}
              className="flex items-center gap-2 bg-[#FAF9F7] border border-[#E8E6E3] px-3 py-2"
            >
              <span className="text-[10px] uppercase tracking-wider text-[#6B6B6B] font-medium w-5 shrink-0 text-center">
                {idx + 1}
              </span>
              <Link
                href={`/sectors/${sid}`}
                className="text-sm text-[#7A6B5A] underline underline-offset-2 hover:text-[#5A4B3A] transition duration-300 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A6B5A] focus-visible:ring-offset-2 min-w-0 truncate"
              >
                {sectorNameById.get(sid) ?? sid}
              </Link>
              <div className="ml-auto flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => moveSectorLink(sid, "up")}
                  disabled={idx === 0}
                  aria-label={`Move ${sectorNameById.get(sid) ?? sid} up`}
                  className="px-1.5 py-0.5 text-xs text-[#6B6B6B] hover:text-[#2C2C2C] disabled:opacity-30 disabled:cursor-not-allowed transition"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => moveSectorLink(sid, "down")}
                  disabled={idx === linkedSectorIds.length - 1}
                  aria-label={`Move ${sectorNameById.get(sid) ?? sid} down`}
                  className="px-1.5 py-0.5 text-xs text-[#6B6B6B] hover:text-[#2C2C2C] disabled:opacity-30 disabled:cursor-not-allowed transition"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => removeSectorLink(sid)}
                  aria-label={`Remove ${sectorNameById.get(sid) ?? sid}`}
                  className="px-1.5 py-0.5 text-xs text-red-500 hover:text-red-700 transition"
                  data-testid={`remove-sector-${sid}`}
                >
                  ✕
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-[#9A9A9A] italic">
          No sector opportunities linked yet.
        </p>
      )}

      {/* Add sector selector */}
      {!sectorsLoading && unlinkedSectors.length > 0 && (
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label htmlFor={sectorPickerId} className={labelClass}>
              Add sector opportunity
            </label>
            <select
              id={sectorPickerId}
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) {
                  addSectorLink(e.target.value);
                  e.target.value = "";
                }
              }}
              className="mt-1 w-full h-9 px-2 border border-[#E8E6E3] bg-white text-[#2C2C2C] text-sm focus:border-[#7A6B5A] focus:ring-1 focus:ring-[#7A6B5A] focus:outline-none transition duration-300 ease-out"
              data-testid="add-sector-select"
            >
              <option value="" disabled>
                Select a sector opportunity…
              </option>
              {unlinkedSectors.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={() => addSectorLink(unlinkedSectors[0]!.id)}
            className="h-9 px-3 border border-[#E8E6E3] bg-[#FAF9F7] text-xs text-[#6B6B6B] hover:border-[#C8C4BF] hover:bg-white transition duration-300 ease-out"
          >
            Add
          </button>
        </div>
      )}

      {sectorsLoading && (
        <p className="text-xs text-[#9A9A9A]">Loading sector opportunities…</p>
      )}

      {!sectorsLoading && availableSectors.length === 0 && (
        <p className="text-xs text-[#9A9A9A] italic">
          No sector opportunities available in the system.
        </p>
      )}
    </section>
  );
}
