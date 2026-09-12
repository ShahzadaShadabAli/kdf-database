"use client";

export function PrintButton() {
  return (
    <button className="btn no-print" onClick={() => window.print()} type="button">
      Print
    </button>
  );
}
