(() => {
  const menuBtn = document.querySelector(".menu");
  const drawer = document.querySelector(".drawer");
  const yearEl = document.getElementById("year");

  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const setMenuOpen = (open) => {
    if (!menuBtn || !drawer) return;
    menuBtn.setAttribute("aria-expanded", String(open));
    drawer.hidden = !open;
    document.documentElement.style.overflow = open ? "hidden" : "";
  };

  if (menuBtn && drawer) {
    setMenuOpen(false);

    menuBtn.addEventListener("click", () => {
      const isOpen = menuBtn.getAttribute("aria-expanded") === "true";
      setMenuOpen(!isOpen);
    });

    drawer.addEventListener("click", (e) => {
      if (e.target.closest("a")) setMenuOpen(false);
    });

    document.addEventListener("click", (e) => {
      const isOpen = menuBtn.getAttribute("aria-expanded") === "true";
      if (!isOpen) return;
      const clickedInside = drawer.contains(e.target) || menuBtn.contains(e.target);
      if (!clickedInside) setMenuOpen(false);
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setMenuOpen(false);
  });

  // Open portfolio images in a large, keyboard-accessible lightbox.
  const images = [...document.querySelectorAll("main img:not([data-no-lightbox])")];
  if (!images.length) return;

  const lightbox = document.createElement("div");
  lightbox.className = "lightbox";
  lightbox.hidden = true;
  lightbox.setAttribute("role", "dialog");
  lightbox.setAttribute("aria-modal", "true");
  lightbox.setAttribute("aria-label", "Image preview");
  lightbox.innerHTML = `
    <button class="lightbox__close" type="button" aria-label="Close image preview">×</button>
    <figure class="lightbox__figure">
      <img class="lightbox__image" alt="" />
      <figcaption class="lightbox__caption"></figcaption>
    </figure>`;
  document.body.appendChild(lightbox);

  const lightboxImage = lightbox.querySelector(".lightbox__image");
  const lightboxCaption = lightbox.querySelector(".lightbox__caption");
  const closeButton = lightbox.querySelector(".lightbox__close");
  let lastFocusedImage = null;

  const closeLightbox = () => {
    lightbox.hidden = true;
    document.documentElement.classList.remove("lightbox-open");
    lightboxImage.removeAttribute("src");
    if (lastFocusedImage) lastFocusedImage.focus();
  };

  const openLightbox = (image) => {
    lastFocusedImage = image;
    lightboxImage.src = image.currentSrc || image.src;
    lightboxImage.alt = image.alt || "Enlarged portfolio image";
    lightboxCaption.textContent = image.alt || "";
    lightbox.hidden = false;
    document.documentElement.classList.add("lightbox-open");
    closeButton.focus();
  };

  images.forEach((image) => {
    image.classList.add("zoomable-image");
    image.setAttribute("tabindex", "0");
    image.setAttribute("role", "button");
    image.setAttribute("aria-label", `${image.alt || "Image"}. Open larger view`);
    image.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      openLightbox(image);
    });
    image.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openLightbox(image);
      }
    });
  });

  closeButton.addEventListener("click", closeLightbox);
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) closeLightbox();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      setMenuOpen(false);
      if (!lightbox.hidden) closeLightbox();
    }
  });
})();
