import { parseStat } from "../lib/parse-stat";

/** Renders a tag as an oversized numeral + small label when it parses as a stat, otherwise as plain meta text. */
export default function Stat({ tag }: { tag: string }) {
  const parsed = parseStat(tag);
  if (!parsed) {
    return <p className="type-meta whitespace-nowrap">{tag}</p>;
  }
  return (
    <div>
      <p className="type-stat-value">{parsed.value}</p>
      <p className="type-stat-label">{parsed.label}</p>
    </div>
  );
}
