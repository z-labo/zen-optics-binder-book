(function () {
  const LANGS = [
    { code: 'ja', label: '日本語' },
    { code: 'en', label: 'English' },
    { code: 'ko', label: '한국어' },
  ];
  const DEFAULT_LANG = 'ja';
  const STORAGE_KEY = 'zen-book-lang';

  function normalizeLang(lang) {
    return LANGS.some((l) => l.code === lang) ? lang : DEFAULT_LANG;
  }

  function applyLanguage(lang) {
    const normalized = normalizeLang(lang);
    document.querySelectorAll('[data-lang]').forEach((el) => {
      const isSelected = el.getAttribute('data-lang') === normalized;
      el.style.display = isSelected ? '' : 'none';
      el.setAttribute('aria-hidden', isSelected ? 'false' : 'true');
    });
    localStorage.setItem(STORAGE_KEY, normalized);

    const select = document.querySelector('#language-switcher select');
    if (select && select.value !== normalized) {
      select.value = normalized;
    }
  }

  function createSwitcher() {
    if (document.getElementById('language-switcher')) return;

    const searchBtn = document.querySelector('.search-button__button') || document.querySelector('button.search-button-field');
    const headerButtons = document.querySelector('.article-header-buttons') || document.querySelector('.navbar-btn-group');
    const mountPoint = headerButtons || searchBtn?.parentElement;
    if (!mountPoint) return;

    const wrapper = document.createElement('div');
    wrapper.id = 'language-switcher';
    wrapper.style.display = 'inline-flex';
    wrapper.style.alignItems = 'center';
    wrapper.style.marginRight = '8px';

    const select = document.createElement('select');
    select.setAttribute('aria-label', 'Language selector');
    select.className = 'form-select form-select-sm';
    select.style.width = '110px';

    LANGS.forEach((l) => {
      const opt = document.createElement('option');
      opt.value = l.code;
      opt.textContent = l.label;
      select.appendChild(opt);
    });

    const saved = normalizeLang(localStorage.getItem(STORAGE_KEY));
    select.value = saved;
    applyLanguage(saved);

    select.addEventListener('change', (e) => applyLanguage(e.target.value));
    wrapper.appendChild(select);

    if (headerButtons) {
      headerButtons.prepend(wrapper);
    } else {
      mountPoint.insertBefore(wrapper, mountPoint.firstChild);
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    createSwitcher();
    const saved = normalizeLang(localStorage.getItem(STORAGE_KEY));
    applyLanguage(saved);
  });
})();
