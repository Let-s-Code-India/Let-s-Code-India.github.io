(function () {
  const sidebar = document.querySelector('#sidebar');
  const menuToggle = document.querySelector('#menu-toggle');
  if (!sidebar || !menuToggle) return;

  const MOBILE_NAV = window.matchMedia('(max-width: 900px)');
  let sidebarReturnFocus = null;

  function setSidebarOpen(open, restoreFocus = false) {
    sidebar.classList.toggle('open', open);
    sidebar.inert = MOBILE_NAV.matches && !open;
    sidebar.setAttribute('aria-hidden', String(MOBILE_NAV.matches && !open));
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    if (open) {
      sidebarReturnFocus = document.activeElement;
      window.requestAnimationFrame(() => sidebar.querySelector('nav a')?.focus({ preventScroll: true }));
    } else if (restoreFocus) {
      (sidebarReturnFocus || menuToggle).focus();
    }
  }

  function updateSidebarForViewport() {
    sidebar.classList.remove('open');
    sidebar.inert = MOBILE_NAV.matches;
    sidebar.setAttribute('aria-hidden', String(MOBILE_NAV.matches));
    menuToggle.setAttribute('aria-expanded', 'false');
  }

  menuToggle.addEventListener('click', () => setSidebarOpen(menuToggle.getAttribute('aria-expanded') !== 'true'));
  sidebar.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setSidebarOpen(false, true)));
  document.addEventListener('keydown', (event) => {
    if (!MOBILE_NAV.matches || menuToggle.getAttribute('aria-expanded') !== 'true') return;
    if (event.key === 'Escape') {
      setSidebarOpen(false, true);
      menuToggle.focus();
      return;
    }
    if (event.key !== 'Tab') return;
    const focusable = [...sidebar.querySelectorAll('a[href], button:not([disabled])')]
      .filter((element) => element.getClientRects().length > 0);
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
  MOBILE_NAV.addEventListener('change', updateSidebarForViewport);
  updateSidebarForViewport();
})();