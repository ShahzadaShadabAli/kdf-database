"use client";

import { useEffect, useState } from "react";
import { flushSync } from "react-dom";

export const PAGE_SIZE = 100;

// True while the browser is printing. The switch is flushed synchronously
// inside `beforeprint`, so the print layout already has every row in it.
function usePrinting() {
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    const before = () => flushSync(() => setPrinting(true));
    const after = () => setPrinting(false);
    window.addEventListener("beforeprint", before);
    window.addEventListener("afterprint", after);
    return () => {
      window.removeEventListener("beforeprint", before);
      window.removeEventListener("afterprint", after);
    };
  }, []);

  return printing;
}

// Splits a table's rows into pages of 100. The CNIC search and filters run
// over every case before this, so a match turns up whichever page it would
// have been on, and a new search starts back at page 1 (`resetKey` changes).
// A printout has every row, not just the page on screen.
export function usePagedRows(rows, resetKey) {
  const [page, setPage] = useState(1);
  const [lastResetKey, setLastResetKey] = useState(resetKey);
  const printing = usePrinting();

  if (resetKey !== lastResetKey) {
    setLastResetKey(resetKey);
    setPage(1);
  }

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  // A case leaving the list (withdrawn, deleted) can leave the last page empty.
  const current = Math.min(page, pageCount);
  const start = printing ? 0 : (current - 1) * PAGE_SIZE;
  const shown = printing ? rows : rows.slice(start, start + PAGE_SIZE);

  return { shown, start, page: current, pageCount, total: rows.length, setPage };
}

const count = (n) => n.toLocaleString("en-US");

// Prev / Next, shown above the table so there's no scrolling past 100 rows
// to reach them. Hidden when everything fits on one page.
export function Pager({ shown, start, page, pageCount, total, setPage }) {
  if (pageCount <= 1) return null;

  return (
    <div className="pager no-print">
      <span className="pager-range">
        Showing {count(start + 1)}–{count(start + shown.length)} of {count(total)}
      </span>
      <div className="pager-buttons">
        <button type="button" className="btn ghost" disabled={page === 1} onClick={() => setPage(page - 1)}>
          ‹ Prev
        </button>
        <span className="pager-page">
          Page {page} of {pageCount}
        </span>
        <button
          type="button"
          className="btn ghost"
          disabled={page === pageCount}
          onClick={() => setPage(page + 1)}
        >
          Next ›
        </button>
      </div>
    </div>
  );
}
