/* Pulse.js Docs — Sidebar Navigation + TOC + Scroll Spy */
(function () {
  var pages = [
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

  var current = location.pathname.split('/').pop() || 'index.html';

  // Build sidebar nav links
  var nav = document.querySelector('.sidebar nav');
  if (nav) {
    pages.forEach(function (p) {
      var a = document.createElement('a');
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

  // ── Table of Contents ──
  var headings = document.querySelectorAll('.content h2[id], .content h3[id]');
  if (headings.length >= 3) {
    var toc = document.createElement('div');
    toc.className = 'toc';
    toc.innerHTML = '<div class="toc-title">On This Page</div>';
    var rootOl = document.createElement('ol');
    var currentH2Li = null;
    var currentSubOl = null;

    headings.forEach(function (h) {
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.href = '#' + h.id;
      a.textContent = h.textContent;
      a.setAttribute('data-toc-id', h.id);
      li.appendChild(a);

      if (h.tagName === 'H2') {
        rootOl.appendChild(li);
        currentH2Li = li;
        currentSubOl = null;
      } else if (h.tagName === 'H3' && currentH2Li) {
        if (!currentSubOl) {
          currentSubOl = document.createElement('ol');
          currentH2Li.appendChild(currentSubOl);
        }
        currentSubOl.appendChild(li);
      } else {
        rootOl.appendChild(li);
      }
    });

    toc.appendChild(rootOl);

    // Insert after hero or first h1
    var hero = document.querySelector('.content .hero');
    var h1 = document.querySelector('.content h1');
    var insertAfter = hero || h1;
    if (insertAfter && insertAfter.nextSibling) {
      // Skip the <p> right after h1 if no hero
      var ref = insertAfter.nextElementSibling;
      if (!hero && ref && ref.tagName === 'P') {
        ref = ref.nextElementSibling;
      }
      if (ref) {
        insertAfter.parentNode.insertBefore(toc, ref);
      } else {
        insertAfter.parentNode.appendChild(toc);
      }
    }

    // ── Scroll Spy ──
    var tocLinks = toc.querySelectorAll('a[data-toc-id]');
    var headingEls = Array.prototype.slice.call(headings);

    function updateScrollSpy() {
      var scrollY = window.scrollY || window.pageYOffset;
      var activeId = null;
      for (var i = headingEls.length - 1; i >= 0; i--) {
        if (headingEls[i].offsetTop <= scrollY + 100) {
          activeId = headingEls[i].id;
          break;
        }
      }
      tocLinks.forEach(function (link) {
        if (link.getAttribute('data-toc-id') === activeId) {
          link.classList.add('toc-active');
        } else {
          link.classList.remove('toc-active');
        }
      });
    }

    var scrollTimer;
    window.addEventListener('scroll', function () {
      if (scrollTimer) cancelAnimationFrame(scrollTimer);
      scrollTimer = requestAnimationFrame(updateScrollSpy);
    }, { passive: true });
    updateScrollSpy();
  }
})();
