(() => {
  const de = document.documentElement.lang === 'de';
  const menu = document.querySelector('.menu');
  const drawer = document.querySelector('.drawer');
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  function setMenu(open, restoreFocus = false) {
    if (!menu || !drawer) return;
    menu.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-label', de ? (open ? 'Menü schließen' : 'Menü öffnen') : (open ? 'Close menu' : 'Open menu'));
    drawer.hidden = !open;
    if (restoreFocus) menu.focus();
  }
  menu?.addEventListener('click', () => setMenu(menu.getAttribute('aria-expanded') !== 'true'));
  drawer?.addEventListener('click', event => { if (event.target.closest('a')) setMenu(false); });
  document.addEventListener('click', event => {
    if (menu && drawer && !menu.contains(event.target) && !drawer.contains(event.target)) setMenu(false);
  });
  window.matchMedia('(min-width: 921px)').addEventListener('change', event => { if (event.matches) setMenu(false); });

  const stages = [...document.querySelectorAll('[data-stage]')];
  stages.forEach(button => button.addEventListener('click', () => {
    stages.forEach(stage => {
      const selected = stage === button;
      stage.setAttribute('aria-pressed', String(selected));
      document.getElementById(stage.getAttribute('aria-controls')).hidden = !selected;
    });
  }));

  const filters = [...document.querySelectorAll('[data-filter]')];
  const projects = [...document.querySelectorAll('.proj-grid > [data-category]')];
  if (filters.length) {
    const status = document.createElement('p');
    status.className = 'filter-status';
    status.setAttribute('role', 'status');
    document.querySelector('.project-filters').after(status);
    const updateCount = () => {
      const count = projects.filter(project => project.hasAttribute('data-project-card') && !project.hidden).length;
      status.textContent = de ? `${count} Projekte` : `${count} projects`;
    };
    filters.forEach(button => button.addEventListener('click', () => {
      filters.forEach(filter => filter.setAttribute('aria-pressed', String(filter === button)));
      projects.forEach(project => { project.hidden = button.dataset.filter !== 'all' && project.dataset.category !== button.dataset.filter; });
      updateCount();
    }));
    updateCount();
  }

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu?.getAttribute('aria-expanded') === 'true') setMenu(false, true);
  });

  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const motionButtons = [...document.querySelectorAll('[data-motion-toggle]')];
  let paused = motionQuery.matches;
  const updateMotion = () => {
    document.documentElement.classList.toggle('motion-paused', paused);
    motionButtons.forEach(button => {
      button.setAttribute('aria-pressed', String(paused));
      button.textContent = motionQuery.matches ? (de ? 'Reduzierte Bewegung' : 'Reduced motion') : (de ? (paused ? 'Animation abspielen' : 'Animation pausieren') : (paused ? 'Play animation' : 'Pause animation'));
      button.disabled = motionQuery.matches;
    });
  };
  motionButtons.forEach(button => button.addEventListener('click', () => { paused = !paused; updateMotion(); }));
  motionQuery.addEventListener('change', () => { paused = motionQuery.matches; updateMotion(); });
  updateMotion();
  // Animate only graphics that are on screen. Content is always visible.
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => entry.target.classList.toggle('is-visible', entry.isIntersecting));
    }, { threshold: 0.15 });
    document.querySelectorAll('.connected-graph, .signal-board').forEach(graph => observer.observe(graph));
  }
})();
