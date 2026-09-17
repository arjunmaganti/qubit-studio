/** Own only disclosures this tour step opens; preserve already-open user panels. */
export function createTourDisclosures() {
  const opened = new Set<{ open: boolean }>();
  return {
    open(disclosure: { open: boolean }) {
      if (disclosure.open) return;
      opened.add(disclosure);
      disclosure.open = true;
    },
    restore() {
      for (const disclosure of [...opened].reverse()) disclosure.open = false;
      opened.clear();
    },
  };
}
