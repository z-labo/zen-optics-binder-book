(function () {
  'use strict';

  // Language code  ->  display label + URL folder used on this site
  // Note: the Korean notebooks live in the `kr/` folder but use the `ko`
  // language code internally (`data-lang="ko"`), so we keep both separate.
  const LANGS = [
    { code: 'ja', label: '日本語', folder: 'ja',  fileSuffix: 'ja' },
    { code: 'en', label: 'English', folder: 'en', fileSuffix: 'en' },
    { code: 'ko', label: '한국어',   folder: 'kr', fileSuffix: 'kr' },
  ];
  const DEFAULT_LANG = 'en';
  const STORAGE_KEY = 'zen-book-lang';

  function normalizeLang(lang) {
    return LANGS.some(function (l) { return l.code === lang; }) ? lang : DEFAULT_LANG;
  }

  // Detect which language the current page belongs to, based on URL path.
  function detectCurrentLang() {
    var path = window.location.pathname;
    for (var i = 0; i < LANGS.length; i++) {
      var l = LANGS[i];
      // match /<folder>/  segment in the URL
      if (path.indexOf('/' + l.folder + '/') !== -1) return l.code;
    }
    return null;
  }

  // Build the URL of the equivalent page in another language.
  // Pages are named like  <folder>/PIM_<fileSuffix>.html
  function urlForLang(targetCode) {
    var target = LANGS.find(function (l) { return l.code === targetCode; });
    if (!target) return null;

    var path = window.location.pathname;

    // Try to swap an existing  /<folder>/<basename>_<suffix>.html  segment.
    for (var i = 0; i < LANGS.length; i++) {
      var src = LANGS[i];
      var re = new RegExp('/' + src.folder + '/([^/]+?)_' + src.fileSuffix + '(\\.html)?$');
      var m = path.match(re);
      if (m) {
        var newPath = path.replace(re, '/' + target.folder + '/' + m[1] + '_' + target.fileSuffix + (m[2] || ''));
        return newPath + window.location.search + window.location.hash;
      }
    }

    // Fallback: when we're on intro / index, send the user to that language's
    // first chapter (PIM).
    var base = path.replace(/[^/]*$/, ''); // strip current filename
    return base + target.folder + '/PIM_' + target.fileSuffix + '.html';
  }

  function showOnlyCurrentLangBlocks(currentCode) {
    // Only manipulate blocks if more than one language block is present.
    // Each chapter page in this book contains exactly one language, so
    // normally there is nothing to hide. We still keep this in case a
    // page mixes multiple [data-lang] blocks in the future.
    var blocks = document.querySelectorAll('.lang-block[data-lang]');
    if (blocks.length <= 1) {
      blocks.forEach(function (el) { el.hidden = false; });
      return;
    }
    blocks.forEach(function (el) {
      el.hidden = el.getAttribute('data-lang') !== currentCode;
    });
  }

  function setActiveButton(currentCode) {
    document.querySelectorAll('.zen-lang-btn').forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.langCode === currentCode);
    });
  }

  function createSwitcher(currentCode) {
    if (document.getElementById('zen-lang-switcher')) return;

    var wrapper = document.createElement('div');
    wrapper.id = 'zen-lang-switcher';

    LANGS.forEach(function (l) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = l.label;
      btn.dataset.langCode = l.code;
      btn.className = 'zen-lang-btn';
      if (l.code === currentCode) btn.classList.add('active');

      btn.addEventListener('click', function () {
        localStorage.setItem(STORAGE_KEY, l.code);
        if (l.code === currentCode) {
          // already on this language
          setActiveButton(l.code);
          showOnlyCurrentLangBlocks(l.code);
          return;
        }
        var url = urlForLang(l.code);
        if (url) {
          window.location.href = url;
        }
      });
      wrapper.appendChild(btn);
    });

    // Prefer the article header toolbar; otherwise fall back to top of content.
    var mount = document.querySelector('.article-header-buttons');
    if (mount) {
      mount.prepend(wrapper);
    } else {
      var content = document.querySelector('.bd-content') || document.body;
      content.insertBefore(wrapper, content.firstChild);
    }
  }


  function removeHiddenNavigationItems() {
    var hiddenTargets = ['/ja/PIM_ja', '/kr/PIM_kr', 'ja/PIM_ja.html', 'kr/PIM_kr.html'];
    document.querySelectorAll('.bd-sidebar-primary a, nav a').forEach(function (link) {
      var href = link.getAttribute('href') || '';
      var shouldHide = hiddenTargets.some(function (target) { return href.indexOf(target) !== -1; });
      if (!shouldHide) return;

      var item = link.closest('li') || link;
      item.hidden = true;
      item.style.display = 'none';
    });
  }

  function removePrevNextNavigation() {
    var selectors = [
      '.prev-next-area',
      '.prev-next-footer',
      '.footer-prev-next',
      '.article-footer-prev-next',
      'nav.prev-next',
      'nav[aria-label="Page navigation"]'
    ];
    selectors.forEach(function (selector) {
      document.querySelectorAll(selector).forEach(function (el) { el.remove(); });
    });
  }

  function init() {
    var pageLang = detectCurrentLang();
    var savedLang = normalizeLang(localStorage.getItem(STORAGE_KEY) || DEFAULT_LANG);

    // If we're on a chapter page, "current language" is the page's language,
    // not whatever was saved. The saved language only matters when the user
    // navigates between language equivalents (handled by button clicks).
    var currentCode = pageLang || savedLang;

    removeHiddenNavigationItems();
    removePrevNextNavigation();
    createSwitcher(currentCode);
    setActiveButton(currentCode);
    showOnlyCurrentLangBlocks(currentCode);

    // If we're on the intro/index page and the user previously picked a
    // different language, auto-redirect them to their preferred chapter.
    if (!pageLang) {
      // Only redirect once per visit to avoid loops.
      var REDIRECT_KEY = 'zen-book-intro-redirected';
      if (savedLang && savedLang !== DEFAULT_LANG && !sessionStorage.getItem(REDIRECT_KEY)) {
        sessionStorage.setItem(REDIRECT_KEY, '1');
        var url = urlForLang(savedLang);
        if (url) window.location.replace(url);
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
