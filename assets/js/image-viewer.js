/* Full-resolution image viewer. Pointer events support touch, pen and mouse. */
(() => {
  if (!document.querySelector('[data-image-viewer]')) return;
  const de = document.documentElement.lang === 'de';
  const t = (en, german) => de ? german : en;
  const viewer = document.createElement('div');
  viewer.className = 'image-viewer';
  viewer.hidden = true;
  viewer.setAttribute('role', 'dialog');
  viewer.setAttribute('aria-modal', 'true');
  viewer.setAttribute('aria-label', t('Full-size image viewer', 'Vollbild-Bildansicht'));
  viewer.innerHTML = `
    <div class="viewer-header"><div><span class="viewer-eyebrow">${t('EXPLORE THE DETAIL', 'DETAILS ENTDECKEN')}</span><p class="viewer-caption" id="viewer-caption"></p></div><button class="viewer-close" type="button" aria-label="${t('Close image', 'Bild schließen')}">×</button></div>
    <div class="viewer-stage"><img class="viewer-image" alt="" draggable="false"><p class="viewer-message" role="status"></p></div>
    <div class="viewer-bottom"><p class="viewer-help">${t('Pinch to zoom · Drag to explore · Double-tap to zoom', 'Zum Zoomen zwei Finger nutzen · Ziehen zum Verschieben · Doppeltippen zum Zoomen')}</p><div class="viewer-toolbar" role="group" aria-label="${t('Image controls', 'Bildsteuerung')}"><button type="button" data-zoom="out" aria-label="${t('Zoom out', 'Verkleinern')}">−</button><output class="viewer-scale" aria-live="polite">1×</output><button type="button" data-zoom="in" aria-label="${t('Zoom in', 'Vergrößern')}">+</button><span class="viewer-divider"></span><button type="button" data-zoom="fit">${t('Fit', 'Einpassen')}</button><a class="viewer-original" target="_blank" rel="noopener">${t('Original ↗', 'Original ↗')}</a></div></div>`;
  document.body.append(viewer);
  const stage = viewer.querySelector('.viewer-stage');
  const image = viewer.querySelector('.viewer-image');
  const closeButton = viewer.querySelector('.viewer-close');
  const caption = viewer.querySelector('.viewer-caption');
  const message = viewer.querySelector('.viewer-message');
  const scaleLabel = viewer.querySelector('.viewer-scale');
  const original = viewer.querySelector('.viewer-original');
  const zoomIn = viewer.querySelector('[data-zoom="in"]');
  const zoomOut = viewer.querySelector('[data-zoom="out"]');
  const fitButton = viewer.querySelector('[data-zoom="fit"]');
  const pointers = new Map();
  let scale = 1, x = 0, y = 0, baseWidth = 1, baseHeight = 1;
  let gesture = null, returnFocus = null, inertStates = [], scrollY = 0, savedBodyStyle = null;
  let tapStart = null, lastTap = null, wasPinch = false;
  const limitScale = value => Math.max(1, Math.min(8, value));
  const point = event => ({ x: event.clientX, y: event.clientY });
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const midpoint = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
  const relative = p => {
    const box = stage.getBoundingClientRect();
    return { x: p.x - box.left - box.width / 2, y: p.y - box.top - box.height / 2 };
  };
  function render() {
    const box = stage.getBoundingClientRect();
    const maxX = Math.max(0, (baseWidth * scale - box.width) / 2);
    const maxY = Math.max(0, (baseHeight * scale - box.height) / 2);
    x = Math.max(-maxX, Math.min(maxX, x));
    y = Math.max(-maxY, Math.min(maxY, y));
    image.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px) scale(${scale})`;
    scaleLabel.value = `${Number(scale.toFixed(1))}×`;
    zoomIn.disabled = scale >= 8;
    zoomOut.disabled = scale <= 1;
    stage.classList.toggle('is-zoomed', scale > 1);
  }
  function fit(reset = true) {
    const box = stage.getBoundingClientRect();
    if (!image.naturalWidth || !box.width || !box.height) return;
    const ratio = Math.min((box.width - 24) / image.naturalWidth, (box.height - 24) / image.naturalHeight, 1);
    baseWidth = Math.max(1, image.naturalWidth * ratio);
    baseHeight = Math.max(1, image.naturalHeight * ratio);
    image.style.width = `${baseWidth}px`;
    image.style.height = `${baseHeight}px`;
    if (reset) { scale = 1; x = 0; y = 0; }
    render();
  }
  function zoom(value, focus = { x: 0, y: 0 }) {
    const next = limitScale(value);
    const ratio = next / scale;
    x = focus.x + (x - focus.x) * ratio;
    y = focus.y + (y - focus.y) * ratio;
    scale = next;
    render();
  }
  function close() {
    if (viewer.hidden) return;
    viewer.hidden = true;
    pointers.clear(); gesture = null; lastTap = null;
    inertStates.forEach(([element, value]) => { element.inert = value; });
    inertStates = [];
    if (savedBodyStyle === null) document.body.removeAttribute('style');
    else document.body.setAttribute('style', savedBodyStyle);
    document.documentElement.classList.remove('viewer-open');
    window.scrollTo({ top: scrollY, left: 0, behavior: 'instant' });
    image.removeAttribute('src');
    returnFocus?.focus({ preventScroll: true });
  }
  function open(link) {
    returnFocus = link;
    scale = 1; x = 0; y = 0; pointers.clear(); lastTap = null; wasPinch = false;
    const source = link.querySelector('img');
    image.alt = source?.alt || '';
    caption.textContent = image.alt;
    original.href = link.href;
    message.textContent = t('Loading full-resolution image…', 'Bild in voller Auflösung wird geladen…');
    image.style.visibility = 'hidden';
    scrollY = window.scrollY;
    savedBodyStyle = document.body.getAttribute('style');
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    inertStates = [...document.body.children].filter(element => element !== viewer && element.tagName !== 'SCRIPT').map(element => [element, element.inert]);
    inertStates.forEach(([element]) => { element.inert = true; });
    document.documentElement.classList.add('viewer-open');
    viewer.hidden = false;
    render();
    image.src = link.href;
    closeButton.focus({ preventScroll: true });
  }
  image.addEventListener('load', () => {
    if (viewer.hidden) return;
    message.textContent = '';
    fit();
    image.style.visibility = 'visible';
  });
  image.addEventListener('error', () => {
    message.textContent = t('The image could not load. Try “Original” below.', 'Das Bild konnte nicht geladen werden. „Original“ unten öffnen.');
  });
  document.addEventListener('click', event => {
    const link = event.target.closest('a[data-image-viewer]');
    if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    open(link);
  });
  closeButton.addEventListener('click', close);
  zoomIn.addEventListener('click', () => zoom(scale * 1.5));
  zoomOut.addEventListener('click', () => zoom(scale / 1.5));
  fitButton.addEventListener('click', () => fit());

  function beginGesture() {
    const points = [...pointers.values()];
    if (points.length >= 2) {
      wasPinch = true;
      gesture = { type: 'pinch', distance: distance(points[0], points[1]) || 1, mid: relative(midpoint(points[0], points[1])), scale, x, y };
    } else if (points.length === 1) gesture = { type: 'pan', point: points[0], x, y };
    else gesture = null;
  }
  stage.addEventListener('pointerdown', event => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    pointers.set(event.pointerId, point(event));
    stage.setPointerCapture(event.pointerId);
    if (pointers.size === 1) { tapStart = { ...point(event), time: Date.now() }; wasPinch = false; }
    beginGesture();
  });
  stage.addEventListener('pointermove', event => {
    if (!pointers.has(event.pointerId)) return;
    pointers.set(event.pointerId, point(event));
    const points = [...pointers.values()];
    if (gesture?.type === 'pinch' && points.length >= 2) {
      const mid = relative(midpoint(points[0], points[1]));
      const next = limitScale(gesture.scale * distance(points[0], points[1]) / gesture.distance);
      x = mid.x + (gesture.x - gesture.mid.x) * next / gesture.scale;
      y = mid.y + (gesture.y - gesture.mid.y) * next / gesture.scale;
      scale = next;
    } else if (gesture?.type === 'pan') {
      x = gesture.x + event.clientX - gesture.point.x;
      y = gesture.y + event.clientY - gesture.point.y;
    }
    render();
  });
  function endPointer(event) {
    if (!pointers.has(event.pointerId)) return;
    if (event.type === 'pointerup' && !wasPinch && tapStart && Date.now() - tapStart.time < 300 && distance(tapStart, point(event)) < 12) {
      const now = Date.now();
      if (lastTap && now - lastTap.time < 350 && distance(lastTap, point(event)) < 30) {
        zoom(scale > 1 ? 1 : 2.5, relative(point(event)));
        lastTap = null;
      } else lastTap = { ...point(event), time: now };
    }
    pointers.delete(event.pointerId);
    if (stage.hasPointerCapture(event.pointerId)) stage.releasePointerCapture(event.pointerId);
    beginGesture();
  }
  stage.addEventListener('pointerup', endPointer);
  stage.addEventListener('pointercancel', endPointer);
  stage.addEventListener('lostpointercapture', endPointer);
  stage.addEventListener('wheel', event => {
    event.preventDefault();
    zoom(scale * Math.exp(-event.deltaY * .002), relative(point(event)));
  }, { passive: false });
  viewer.addEventListener('keydown', event => {
    if (event.key === 'Escape') { event.preventDefault(); close(); }
    if (event.key === '+' || event.key === '=') { event.preventDefault(); zoom(scale * 1.5); }
    if (event.key === '-') { event.preventDefault(); zoom(scale / 1.5); }
    if (event.key === '0') { event.preventDefault(); fit(); }
    if (event.key === 'Tab') {
      const controls = [...viewer.querySelectorAll('button:not(:disabled), a[href]')];
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });
  window.addEventListener('resize', () => { if (!viewer.hidden) fit(false); });
})();
