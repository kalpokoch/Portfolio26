interface MetricChipProps {
  label: string;
}

export default function MetricChip({ label }: MetricChipProps) {
  return (
    <span className="inline-flex items-center rounded-full border border-[#3FD0C9]/30 bg-[#3FD0C9]/10 px-3 py-1 font-mono text-xs tracking-wide text-[#3FD0C9]">
      {label}
    </span>
  );
}
