(() => {
  const menuBtn = document.querySelector(".menu");
  const drawer = document.querySelector(".drawer");
  const yearEl = document.getElementById("year");

  if (yearEl) yearEl.textContent = new Date().getFullYear();

  if (!menuBtn || !drawer) return;

  const setOpen = (open) => {
    menuBtn.setAttribute("aria-expanded", String(open));
    drawer.hidden = !open;

    // Optional: prevent background scroll when menu open (mobile)
    document.documentElement.style.overflow = open ? "hidden" : "";
  };

  setOpen(false);

  menuBtn.addEventListener("click", () => {
    const isOpen = menuBtn.getAttribute("aria-expanded") === "true";
    setOpen(!isOpen);
  });

  // Close drawer when clicking a link
  drawer.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (a) setOpen(false);
  });

  // Close when clicking outside (if drawer is open)
  document.addEventListener("click", (e) => {
    const isOpen = menuBtn.getAttribute("aria-expanded") === "true";
    if (!isOpen) return;

    const clickedInside = drawer.contains(e.target) || menuBtn.contains(e.target);
    if (!clickedInside) setOpen(false);
  });

  // Close on Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setOpen(false);
  });
})();
