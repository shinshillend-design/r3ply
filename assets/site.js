/* R3PLY - site behaviour. No dependencies. */
(function () {
  'use strict';

  var doc = document.documentElement;
  var reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  var finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  window.R3PLY_READY = true;

  /* Opened straight from disk (file://): folder links need an explicit index.html. */
  if (location.protocol === 'file:') {
    $$('a[href$="/"]').forEach(function (a) {
      var href = a.getAttribute('href');
      if (!/^(https?:|#|mailto:)/.test(href)) a.setAttribute('href', href + 'index.html');
    });
  }

  /* ---------- Nav: scrolled state, mobile sheet, active link ---------- */
  var nav = $('#nav');
  var burger = $('#burger');
  var sheet = $('#nav-sheet');

  function onScroll() {
    if (nav) nav.classList.toggle('is-scrolled', window.scrollY > 24);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  function setSheet(open) {
    if (!burger || !sheet) return;
    sheet.hidden = !open;
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    nav.classList.toggle('is-open', open);
  }
  if (burger && sheet) {
    burger.addEventListener('click', function () { setSheet(sheet.hidden); });
    sheet.addEventListener('click', function (e) { if (e.target.closest('a')) setSheet(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !sheet.hidden) { setSheet(false); burger.focus(); }
    });
    matchMedia('(min-width: 961px)').addEventListener('change', function (e) { if (e.matches) setSheet(false); });
  }

  var navLinks = $$('.nav-links a[href^="#"]');
  if (navLinks.length && 'IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (link) {
          link.classList.toggle('is-active', link.getAttribute('href') === '#' + entry.target.id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    navLinks.forEach(function (link) {
      var target = document.getElementById(link.getAttribute('href').slice(1));
      if (target) spy.observe(target);
    });
  }

  /* ---------- Scroll reveal ---------- */
  var reveals = $$('.reveal');
  if (reduceMotion.matches || !('IntersectionObserver' in window)) {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var revealObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        revealObs.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });
    reveals.forEach(function (el) { revealObs.observe(el); });
  }

  /* ---------- Hero: cursor spotlight on the dot grid ---------- */
  var hero = $('.hero');
  var heroBg = $('.hero-bg');
  if (hero && heroBg) {
    hero.addEventListener('pointermove', function (e) {
      if (!finePointer.matches || reduceMotion.matches || e.pointerType === 'touch') return;
      var rect = hero.getBoundingClientRect();
      heroBg.style.setProperty('--mx', (e.clientX - rect.left) + 'px');
      heroBg.style.setProperty('--my', (e.clientY - rect.top) + 'px');
      heroBg.style.setProperty('--spot', '1');
    }, { passive: true });
    hero.addEventListener('pointerleave', function () { heroBg.style.setProperty('--spot', '0'); });
  }

  /* ---------- Hero: print the statement receipt ---------- */
  var printer = $('#printer');
  if (printer) {
    var paper = $('.receipt-wrap', printer);
    var finishPrint = function () {
      printer.classList.remove('is-printing');
      printer.classList.add('is-done');
    };
    if (reduceMotion.matches || !paper) {
      finishPrint();
    } else {
      paper.addEventListener('animationend', finishPrint, { once: true });
      setTimeout(function () { printer.classList.add('is-printing'); }, 350);
      setTimeout(finishPrint, 3600); /* safety net if the animation never fires */
    }
  }

  /* ---------- Proof explorer: one case at a time, with tracking-window views ---------- */
  var tabs = $$('.case-tab');
  var cases = $$('.case');
  var tablist = $('#case-tabs');

  function setView(caseEl, view, animate) {
    $$('[data-view]', caseEl).forEach(function (el) { el.hidden = el.dataset.view !== view; });
    $$('[data-view-btn]', caseEl).forEach(function (btn) {
      btn.setAttribute('aria-pressed', btn.dataset.viewBtn === view ? 'true' : 'false');
    });
    if (animate && !reduceMotion.matches) {
      caseEl.classList.remove('is-fresh');
      void caseEl.offsetWidth; /* restart the swap animation */
      caseEl.classList.add('is-fresh');
    }
  }

  /* Screenshots for hidden windows are lazy. Fetch them once a case is opened so switching is instant. */
  function warm(caseEl) {
    $$('img[loading="lazy"]', caseEl).forEach(function (img) { img.loading = 'eager'; });
  }

  function selectCase(id, opts) {
    opts = opts || {};
    var target = document.getElementById(id);
    if (!target || cases.indexOf(target) === -1) return false;
    warm(target);
    cases.forEach(function (el) { el.classList.toggle('is-active', el === target); });
    tabs.forEach(function (tab) {
      var on = tab.getAttribute('aria-controls') === id;
      tab.setAttribute('aria-selected', on ? 'true' : 'false');
      tab.tabIndex = on ? 0 : -1;
      if (on && opts.focus) tab.focus({ preventScroll: true });
    });
    if (!reduceMotion.matches) {
      target.classList.remove('is-fresh');
      void target.offsetWidth;
      target.classList.add('is-fresh');
    }
    if (opts.hash !== false && history.replaceState) history.replaceState(null, '', '#' + id);
    if (opts.scroll === 'tabs' && tablist) {
      tablist.scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'start' });
    } else if (opts.scroll === 'panel') {
      /* On small screens the tab grid can push the case below the fold. */
      var top = target.getBoundingClientRect().top;
      if (top > window.innerHeight * 0.55 || top < 0) {
        target.scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'start' });
      }
    }
    return true;
  }

  if (tabs.length && cases.length) {
    tabs.forEach(function (tab, i) {
      tab.tabIndex = tab.getAttribute('aria-selected') === 'true' ? 0 : -1;
      tab.addEventListener('click', function (e) {
        e.preventDefault();
        selectCase(tab.getAttribute('aria-controls'), { scroll: 'panel' });
      });
      tab.addEventListener('keydown', function (e) {
        var next = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = tabs[(i + 1) % tabs.length];
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = tabs[(i - 1 + tabs.length) % tabs.length];
        else if (e.key === 'Home') next = tabs[0];
        else if (e.key === 'End') next = tabs[tabs.length - 1];
        else if (e.key === ' ') { e.preventDefault(); tab.click(); return; }
        if (!next) return;
        e.preventDefault();
        selectCase(next.getAttribute('aria-controls'), { focus: true });
      });
    });

    cases.forEach(function (caseEl) {
      $$('[data-view-btn]', caseEl).forEach(function (btn) {
        btn.addEventListener('click', function () { setView(caseEl, btn.dataset.viewBtn, true); });
      });
    });

    if (tablist && 'IntersectionObserver' in window) {
      var warmObs = new IntersectionObserver(function (entries) {
        if (!entries[0].isIntersecting) return;
        var active = $('.case.is-active');
        if (active) warm(active);
        warmObs.disconnect();
      }, { rootMargin: '300px 0px' });
      warmObs.observe(tablist);
    }

    /* Any other link to a case (hero statement lines, shared URLs) opens it in the explorer. */
    document.addEventListener('click', function (e) {
      var link = e.target.closest('a[href^="#case-"]');
      if (!link || link.classList.contains('case-tab')) return;
      if (selectCase(link.getAttribute('href').slice(1), { scroll: 'tabs' })) e.preventDefault();
    });
    var openFromHash = function () {
      if (/^#case-/.test(location.hash)) selectCase(location.hash.slice(1), { scroll: 'tabs', hash: false });
    };
    window.addEventListener('hashchange', openFromHash);
    if (/^#case-/.test(location.hash)) {
      selectCase(location.hash.slice(1), { hash: false });
      window.addEventListener('load', function () { setTimeout(openFromHash, 60); });
    }
  }

  /* ---------- Screenshot viewer ---------- */
  var lb = $('#lightbox');
  if (lb && typeof lb.showModal === 'function') {
    var lbImg = $('#lb-img');
    var lbTitle = $('#lb-title');
    var lbSub = $('#lb-sub');
    var lbStats = $('#lb-stats');
    var lbCount = $('#lb-count');
    var lbOpen = $('#lb-open');
    var lbPrev = $('[data-lb-prev]', lb);
    var lbNext = $('[data-lb-next]', lb);
    var group = [];
    var index = 0;
    var opener = null;

    var show = function (i) {
      index = (i + group.length) % group.length;
      var shot = group[index];
      var img = $('img', shot);
      var caseEl = shot.closest('.case');
      lbImg.src = img.getAttribute('src');
      lbImg.alt = img.alt;
      lbTitle.textContent = caseEl ? caseEl.dataset.case : '';
      lbSub.textContent = shot.dataset.range || '';
      lbStats.textContent = shot.dataset.stats || '';
      lbOpen.href = img.getAttribute('src');
      var many = group.length > 1;
      lbCount.textContent = many ? (index + 1) + ' / ' + group.length : '';
      lbPrev.hidden = lbNext.hidden = !many;
    };

    document.addEventListener('click', function (e) {
      var shot = e.target.closest('[data-shot]');
      if (!shot) return;
      var caseEl = shot.closest('.case');
      group = caseEl ? $$('[data-shot]', caseEl) : [shot];
      opener = shot;
      show(group.indexOf(shot));
      lb.showModal();
    });
    lbPrev.addEventListener('click', function () { show(index - 1); });
    lbNext.addEventListener('click', function () { show(index + 1); });
    $$('[data-lb-close]', lb).forEach(function (btn) {
      btn.addEventListener('click', function () { lb.close(); });
    });
    /* Click on the empty stage (not the image or a control) closes it. */
    lb.addEventListener('click', function (e) {
      if (e.target === lb || e.target.hasAttribute('data-lb-stage')) lb.close();
    });
    lb.addEventListener('keydown', function (e) {
      if (group.length < 2) return;
      if (e.key === 'ArrowLeft') { e.preventDefault(); show(index - 1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); show(index + 1); }
    });
    lb.addEventListener('close', function () {
      if (opener && opener.offsetParent !== null) opener.focus({ preventScroll: true });
      opener = null;
    });
  }

  /* ---------- Booking calendar: load on demand ---------- */
  var shell = $('[data-calendly]');
  if (shell) {
    var calObserver = null;
    var loadCalendar = function () {
      if (shell.dataset.loaded) return;
      shell.dataset.loaded = '1';
      var status = $('[data-calendly-status]', shell);
      if (status) status.textContent = 'Loading available times…';
      shell.setAttribute('aria-busy', 'true');
      var frame = document.createElement('iframe');
      frame.className = 'cal-widget';
      frame.title = 'Book a R3PLY 30-minute X audit';
      frame.src = 'https://calendly.com/shynxbt/shynxbt-reply-guy';
      frame.addEventListener('load', function () {
        shell.setAttribute('aria-busy', 'false');
        if (status) status.hidden = true;
      }, { once: true });
      shell.appendChild(frame);
      if (calObserver) calObserver.disconnect();
    };
    $$('[data-book-call]').forEach(function (link) { link.addEventListener('click', loadCalendar); });
    if ('IntersectionObserver' in window) {
      calObserver = new IntersectionObserver(function (entries) {
        if (entries.some(function (entry) { return entry.isIntersecting; })) loadCalendar();
      }, { rootMargin: '500px 0px' });
      calObserver.observe(shell);
    } else {
      loadCalendar();
    }
  }

  /* ---------- Sticky booking bar (small screens) ---------- */
  var sticky = $('#sticky');
  var start = $('#start');
  var footer = $('.footer');
  if (sticky) {
    var inStart = false;
    var syncSticky = function () {
      var footerTop = footer ? footer.getBoundingClientRect().top : Infinity;
      var visible = window.scrollY > 640 && !inStart && footerTop > window.innerHeight * 0.9;
      sticky.classList.toggle('is-visible', visible);
    };
    if (start && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        inStart = entries[0].isIntersecting;
        syncSticky();
      }, { rootMargin: '-20% 0px -20% 0px' }).observe(start);
    }
    window.addEventListener('scroll', syncSticky, { passive: true });
    syncSticky();
  }
})();
