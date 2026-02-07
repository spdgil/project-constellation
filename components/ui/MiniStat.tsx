/**
 * Compact stat display — label above value.
 * Extracted from duplicated definitions in LgaList and DealsSearch.
 */

export interface MiniStatProps {
  label: string;
  value: string;
}

export function MiniStat({ label, value }: MiniStatProps) {
  return (
    <div className="text-center">
      <p className="text-[10px] uppercase tracking-wider text-[#9A9A9A] font-medium">
        {label}
      </p>
      <p className="text-sm font-medium text-[#2C2C2C] mt-0.5">{value}</p>
    </div>
  );
}
