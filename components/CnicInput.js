"use client";

export const CNIC_REGEX = /^\d{5}-\d{7}-\d$/;

// Strips non-digits and re-inserts dashes as 00000-0000000-0.
export function formatCnic(raw) {
  const digits = raw.replace(/\D/g, "").slice(0, 13);
  const part1 = digits.slice(0, 5);
  const part2 = digits.slice(5, 12);
  const part3 = digits.slice(12, 13);
  return [part1, part2, part3].filter(Boolean).join("-");
}

export function CnicInput({ value, onChange, error, className, placeholder, ...rest }) {
  return (
    <input
      className={`mono ${className || ""}`}
      value={value}
      onChange={(e) => onChange(formatCnic(e.target.value))}
      placeholder={placeholder || "00000-0000000-0"}
      inputMode="numeric"
      maxLength={15}
      {...rest}
    />
  );
}
