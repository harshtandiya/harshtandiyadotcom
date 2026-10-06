// One book out at a time. Visuals live in CSS, keyed on `aria-expanded`.
export function mountShelf(root: HTMLElement) {
  const books = [...root.querySelectorAll<HTMLButtonElement>("[data-book]")];
  const open = (book: HTMLButtonElement | null) =>
    books.forEach((b) => b.setAttribute("aria-expanded", String(b === book)));

  books.forEach((book) =>
    book.addEventListener("click", (ev) => {
      ev.stopPropagation();
      open(book.ariaExpanded === "true" ? null : book);
    }),
  );

  // Document listeners outlive the page under ClientRouter; drop them on swap.
  const ac = new AbortController();
  document.addEventListener("astro:before-swap", () => ac.abort(), { once: true });
  document.addEventListener("click", () => open(null), { signal: ac.signal });
  document.addEventListener("keydown", (ev) => ev.key === "Escape" && open(null), { signal: ac.signal });

  root.dataset.mounted = "";
}

// Page scripts run once; ClientRouter swaps the DOM underneath them.
export function mountAll() {
  document.addEventListener("astro:page-load", () => {
    document.querySelectorAll<HTMLElement>("[data-shelf]:not([data-mounted])").forEach(mountShelf);
  });
}
