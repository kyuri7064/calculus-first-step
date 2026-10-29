/* 미적분학 첫걸음 — 설정 저장·적용
   <head>에서 가장 먼저(동기) 불러와야 화면이 깜빡이지 않는다. */
(function () {
  'use strict';
  var KEY = 'calc-first-step:settings';
  var DEFAULTS = { theme: 'system', mono: false, main: 'blue', font: 'm', lang: 'ko' };
  var darkQuery = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

  function load() {
    var saved = {};
    try { saved = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { /* 저장소를 못 쓰는 환경 */ }
    var s = {};
    for (var k in DEFAULTS) s[k] = (k in saved) ? saved[k] : DEFAULTS[k];
    return s;
  }

  var state = load();

  function resolvedTheme() {
    if (state.theme === 'system') return darkQuery && darkQuery.matches ? 'dark' : 'light';
    return state.theme;
  }

  function apply() {
    var h = document.documentElement;
    h.setAttribute('data-theme', resolvedTheme());
    h.setAttribute('data-mono', state.mono ? 'on' : 'off');
    h.setAttribute('data-main', state.main);
    h.setAttribute('data-font', state.font);
    h.setAttribute('lang', state.lang);
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* 무시 */ }
  }

  function fire(changed) {
    document.dispatchEvent(new CustomEvent('settingschange', { detail: { changed: changed, settings: all() } }));
  }

  function all() {
    var copy = {};
    for (var k in state) copy[k] = state[k];
    return copy;
  }

  apply();

  if (darkQuery) {
    var onSystemChange = function () {
      if (state.theme === 'system') { apply(); fire('theme'); }
    };
    if (darkQuery.addEventListener) darkQuery.addEventListener('change', onSystemChange);
    else if (darkQuery.addListener) darkQuery.addListener(onSystemChange);
  }

  window.Settings = {
    get: function (k) { return state[k]; },
    all: all,
    set: function (k, v) {
      if (state[k] === v) return;
      state[k] = v;
      save(); apply(); fire(k);
    },
    reset: function () {
      state = all();
      for (var k in DEFAULTS) state[k] = DEFAULTS[k];
      save(); apply(); fire('all');
    }
  };
})();
