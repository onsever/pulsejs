/* Pulse.js Docs — Sidebar Navigation */
(function () {
  const pages = [
    ['index.html', 'Getting Started'],
    ['attributes.html', 'The 8 Attributes'],
    ['request-syntax.html', 'p-request Syntax'],
    ['triggers.html', 'p-trigger Deep Dive'],
    ['modifiers.html', 'Modifier Reference'],
    ['server-integration.html', 'Server Integration'],
    ['configuration.html', 'Configuration'],
    ['examples.html', 'Examples'],
    ['events.html', 'Events & Lifecycle'],
    ['advanced.html', 'Advanced Topics'],
    ['api-reference.html', 'API Reference'],
  ];

  const current = location.pathname.split('/').pop() || 'index.html';

  // Build sidebar nav links
  const nav = document.querySelector('.sidebar nav');
  if (nav) {
    pages.forEach(function (p) {
      const a = document.createElement('a');
      a.href = p[0];
      a.textContent = p[1];
      if (p[0] === current) a.classList.add('active');
      nav.appendChild(a);
    });
  }

  // Mobile toggle
  var toggle = document.querySelector('.menu-toggle');
  var sidebar = document.querySelector('.sidebar');
  if (toggle && sidebar) {
    toggle.addEventListener('click', function () {
      sidebar.classList.toggle('open');
    });
    // Close on link click (mobile)
    sidebar.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') sidebar.classList.remove('open');
    });
  }

  // Prev/Next
  var idx = pages.findIndex(function (p) { return p[0] === current; });
  var pn = document.querySelector('.page-nav');
  if (pn) {
    if (idx > 0) {
      pn.querySelector('.prev').href = pages[idx - 1][0];
      pn.querySelector('.prev').textContent = '\u2190 ' + pages[idx - 1][1];
    } else {
      var prev = pn.querySelector('.prev');
      if (prev) prev.style.visibility = 'hidden';
    }
    if (idx < pages.length - 1) {
      pn.querySelector('.next').href = pages[idx + 1][0];
      pn.querySelector('.next').textContent = pages[idx + 1][1] + ' \u2192';
    } else {
      var next = pn.querySelector('.next');
      if (next) next.style.visibility = 'hidden';
    }
  }
})();
