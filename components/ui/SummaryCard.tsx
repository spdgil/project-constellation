import {
  type ColourFamily,
  COLOUR_CLASSES,
} from "@/lib/colour-system";

export interface SummaryCardProps {
  label: string;
  value: string;
  sub: string;
  colour: ColourFamily;
}

export function SummaryCard({ label, value, sub, colour }: SummaryCardProps) {
  const c = COLOUR_CLASSES[colour];
  return (
    <div
      className={`bg-white border border-[#E8E6E3] border-l-[3px] ${c.borderLeft} px-4 py-3 space-y-0.5`}
    >
      <p className="text-[10px] uppercase tracking-wider text-[#6B6B6B] font-medium">
        {label}
      </p>
      <p className={`text-xl font-heading font-normal ${c.text}`}>{value}</p>
      <p className="text-[11px] text-[#9A9A9A]">{sub}</p>
    </div>
  );
}
