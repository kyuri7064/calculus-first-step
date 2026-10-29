/* 미적분학 첫걸음 — 모든 페이지 공통 동작
   - 헤더(☰ 버튼, 로고 → 홈, 상단 메뉴, 학교 로고)와 푸터를 넣는다
   - ☰ 설정 서랍: 메뉴, 테마, 흑백, 메인 색, 글자 크기, 언어
   - 언어 전환, KaTeX 수식 렌더링, 미적분 지도 그리기

   각 페이지 <body>에 data-root("" 또는 "../")와 data-page를 적는다.
   예) <body data-root="" data-page="home" data-title-ko="..." data-title-en="..."> */
(function () {
  'use strict';

  var body = document.body;
  var ROOT = body.getAttribute('data-root') || '';
  var PAGE = body.getAttribute('data-page') || '';
  var t = I18N.t;

  function lang() { return I18N.lang(); }
  function T(o) { return o && typeof o === 'object' ? (o[lang()] || o.ko) : o; }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }

  var NAV = [
    { key: 'home',  href: 'index.html',        ico: '🏠' },
    { key: 'unit1', href: 'unit1.html',        ico: 'Ⅰ' },
    { key: 'unit2', href: 'unit2.html',        ico: 'Ⅱ' },
    { key: 'unit3', href: 'unit3.html',        ico: 'Ⅲ' },
    { key: 'rigor', href: 'rigor.html',        ico: '🔍' },
    { key: 'apps',  href: 'applications.html', ico: '🏫' },
    { key: 'memo',  href: 'memo.html',         ico: '📝' },
    { key: 'ai',    href: 'ai.html',           ico: '🤖' }
  ];

  /* 로고: 첫걸음(발자국) 위에 놓인 적분 기호 */
  var LOGO_SVG =
    '<svg class="brand-mark" viewBox="0 0 40 40" aria-hidden="true" focusable="false">' +
      '<rect x="1" y="1" width="38" height="38" rx="11" fill="var(--main)"/>' +
      '<path d="M25.5 8.5c-3.2-1.2-5.6.6-6.2 4.2l-2.6 14.6c-.6 3.6-3 5.4-6.2 4.2" fill="none" stroke="var(--on-main)" stroke-width="3.2" stroke-linecap="round"/>' +
      '<circle cx="29" cy="28" r="2.4" fill="var(--on-main)"/><circle cx="32.5" cy="22.5" r="1.7" fill="var(--on-main)" opacity=".75"/>' +
    '</svg>';

  var MENU_SVG =
    '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>';

  function current(key) { return key === PAGE ? ' aria-current="page"' : ''; }

  /* ---------- 헤더 ---------- */
  function buildHeader() {
    var nav = NAV.map(function (n) {
      return '<li><a href="' + ROOT + n.href + '"' + current(n.key) + ' data-i18n="' +
        (n.key === 'home' ? 'nav.home' : 'navShort.' + n.key) + '"></a></li>';
    }).join('');

    var html =
      '<a class="skip-link" href="#main" data-i18n="skip"></a>' +
      '<header class="site-header">' +
        '<div class="header-inner">' +
          '<button class="icon-btn menu-btn" type="button" aria-controls="drawer" aria-expanded="false" data-i18n-attr="aria-label:menuOpen">' + MENU_SVG + '</button>' +
          '<a class="brand" href="' + ROOT + 'index.html" data-i18n-attr="aria-label:homeLink">' + LOGO_SVG +
            '<span class="brand-name" data-i18n="siteName"></span></a>' +
          '<nav class="top-nav" data-i18n-attr="aria-label:mainNav"><ul>' + nav + '</ul></nav>' +
          '<div class="school-logo-slot">' +
            '<img class="school-logo" src="' + ROOT + 'images/school-logo.png" data-i18n-attr="alt:schoolLogoAlt" alt="">' +
          '</div>' +
        '</div>' +
      '</header>';
    body.insertAdjacentHTML('afterbegin', html);

    // 로고 파일이 아직 없으면 자리 표시로 바꾼다
    var img = body.querySelector('.school-logo');
    function fallback() {
      var span = document.createElement('span');
      span.className = 'school-logo-placeholder';
      span.setAttribute('data-i18n', 'schoolLogoPlaceholder');
      span.textContent = t('schoolLogoPlaceholder');
      img.replaceWith(span);
    }
    img.addEventListener('error', fallback);
    if (img.complete && img.naturalWidth === 0) fallback();
  }

  /* ---------- 설정 서랍 ---------- */
  function radioGroup(name, options, labelKeyPrefix) {
    return '<div class="seg">' + options.map(function (v) {
      var text = labelKeyPrefix
        ? '<span data-i18n="' + labelKeyPrefix + v + '"></span>'
        : '<span>' + (v === 'ko' ? '한국어' : 'English') + '</span>';
      return '<label><input type="radio" name="' + name + '" value="' + v + '">' + text + '</label>';
    }).join('') + '</div>';
  }

  function buildDrawer() {
    var nav = NAV.map(function (n) {
      return '<li><a href="' + ROOT + n.href + '"' + current(n.key) + (n.key === 'memo' ? ' class="nav-memo"' : '') + '>' +
        '<span class="nav-ico" aria-hidden="true">' + n.ico + '</span><span data-i18n="nav.' + n.key + '"></span></a></li>';
    }).join('');

    var swatches = ['blue', 'purple', 'teal', 'navy', 'magenta'].map(function (c) {
      return '<label><input type="radio" name="set-main" value="' + c + '">' +
        '<span><i class="sw-' + c + '" aria-hidden="true"></i><b data-i18n="main.' + c + '"></b></span></label>';
    }).join('');

    var html =
      '<div class="drawer-overlay"></div>' +
      '<aside id="drawer" class="drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-title" inert>' +
        '<div class="drawer-head">' +
          '<h2 id="drawer-title" data-i18n="menuTitle"></h2>' +
          '<button class="icon-btn drawer-close" type="button" data-i18n-attr="aria-label:menuClose"><span aria-hidden="true">✕</span></button>' +
        '</div>' +
        '<nav data-i18n-attr="aria-label:mainNav"><ul class="drawer-nav">' + nav + '</ul></nav>' +
        '<section class="drawer-section" aria-labelledby="settings-title">' +
          '<h3 id="settings-title" data-i18n="settings"></h3>' +
          '<fieldset class="setting"><legend data-i18n="theme"></legend>' + radioGroup('set-theme', ['light', 'dark', 'system'], 'theme.') + '</fieldset>' +
          '<div class="switch-row">' +
            '<label for="set-mono" class="setting-label" style="margin:0"><span data-i18n="mono"></span><small data-i18n="monoDesc"></small></label>' +
            '<input id="set-mono" class="switch" type="checkbox" role="switch">' +
          '</div>' +
          '<fieldset class="setting" id="set-main-group" aria-describedby="set-main-note"><legend data-i18n="main"></legend><div class="swatches">' + swatches + '</div>' +
            '<p class="drawer-note" id="set-main-note" data-i18n="mainOffInMono" hidden></p></fieldset>' +
          '<fieldset class="setting"><legend data-i18n="font"></legend>' + radioGroup('set-font', ['m', 'l', 'xl'], 'font.') + '</fieldset>' +
          '<fieldset class="setting"><legend data-i18n="lang"></legend>' + radioGroup('set-lang', ['ko', 'en']) + '</fieldset>' +
          '<button class="btn btn-outline btn-block drawer-reset" type="button" data-i18n="reset"></button>' +
          '<p class="drawer-note" data-i18n="settingsNote"></p>' +
          '<div class="account-box" id="account-box" aria-live="polite"></div>' +
        '</section>' +
      '</aside>' +
      // 프로필(로그인) 창
      '<dialog id="profile-dialog" class="profile-dialog" aria-labelledby="profile-title">' +
        '<div class="drawer-head">' +
          '<h2 id="profile-title" data-i18n="profileTitle"></h2>' +
          '<button class="icon-btn" type="button" data-profile-close data-i18n-attr="aria-label:menuClose"><span aria-hidden="true">✕</span></button>' +
        '</div>' +
        '<p class="drawer-note" data-i18n="profileNote"></p>' +
        '<h3 class="profile-h" data-i18n="profileChoose"></h3>' +
        '<ul class="profile-list" id="profile-list"></ul>' +
        '<form id="profile-form" novalidate>' +
          '<h3 class="profile-h"><label for="profile-name" data-i18n="profileNew"></label></h3>' +
          '<input class="field" id="profile-name" type="text" maxlength="20" autocomplete="off" data-i18n-attr="placeholder:profileNamePh">' +
          '<label class="check-row" id="profile-bring-row" hidden><input type="checkbox" id="profile-bring" checked><span data-i18n="profileBring"></span></label>' +
          '<p class="drawer-note profile-err" id="profile-err" role="alert"></p>' +
          '<button class="btn btn-primary btn-block" type="submit" data-i18n="profileCreate"></button>' +
        '</form>' +
      '</dialog>';
    body.insertAdjacentHTML('beforeend', html);

    var drawer = document.getElementById('drawer');
    var overlay = body.querySelector('.drawer-overlay');
    var menuBtn = body.querySelector('.menu-btn');
    var closeBtn = drawer.querySelector('.drawer-close');

    function open() {
      drawer.removeAttribute('inert');
      body.classList.add('drawer-open');
      menuBtn.setAttribute('aria-expanded', 'true');
      // visibility가 바뀐 다음 프레임에 포커스를 옮겨야 한다
      setTimeout(function () { closeBtn.focus(); }, 30);
    }
    function close() {
      body.classList.remove('drawer-open');
      drawer.setAttribute('inert', '');
      menuBtn.setAttribute('aria-expanded', 'false');
      menuBtn.focus();
    }
    menuBtn.addEventListener('click', open);
    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', close);
    document.addEventListener('keydown', function (e) {
      if (!body.classList.contains('drawer-open')) return;
      if (e.key === 'Escape') { close(); return; }
      if (e.key === 'Tab') {   // 서랍 안에서만 포커스가 돌게
        var f = drawer.querySelectorAll('a, button, input');
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });

    // 설정값 ↔ 컨트롤
    function sync() {
      var s = Settings.all();
      drawer.querySelector('input[name="set-theme"][value="' + s.theme + '"]').checked = true;
      drawer.querySelector('input[name="set-main"][value="' + s.main + '"]').checked = true;
      drawer.querySelector('input[name="set-font"][value="' + s.font + '"]').checked = true;
      drawer.querySelector('input[name="set-lang"][value="' + s.lang + '"]').checked = true;
      document.getElementById('set-mono').checked = !!s.mono;
      // 흑백 모드에서는 색이 보이지 않으므로 메인 색 선택을 끈다 (고른 색은 그대로 기억)
      document.getElementById('set-main-group').disabled = !!s.mono;
      document.getElementById('set-main-note').hidden = !s.mono;
    }
    sync();
    document.addEventListener('settingschange', function (e) { if (e.detail.changed === 'mono' || e.detail.changed === 'all') sync(); });
    drawer.addEventListener('change', function (e) {
      var el = e.target;
      if (el.name === 'set-theme') Settings.set('theme', el.value);
      else if (el.name === 'set-main') Settings.set('main', el.value);
      else if (el.name === 'set-font') Settings.set('font', el.value);
      else if (el.name === 'set-lang') Settings.set('lang', el.value);
      else if (el.id === 'set-mono') Settings.set('mono', el.checked);
    });
    drawer.querySelector('.drawer-reset').addEventListener('click', function () { Settings.reset(); sync(); });

    setupAccount(close);
  }

  /* ---------- 로그인 / 로그아웃 (이 기기용 프로필) ---------- */
  function setupAccount(closeDrawer) {
    if (!window.Profiles) return;
    var box = document.getElementById('account-box');
    var dlg = document.getElementById('profile-dialog');
    var listEl = document.getElementById('profile-list');
    var form = document.getElementById('profile-form');
    var nameIn = document.getElementById('profile-name');
    var err = document.getElementById('profile-err');

    function renderBox() {
      var p = Profiles.current();
      box.textContent = '';
      var who = document.createElement('p');
      who.className = 'account-who';
      who.textContent = p ? t('accountIn', { name: p.name }) : t('accountGuest');
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn btn-block ' + (p ? 'btn-outline' : 'btn-primary');
      btn.textContent = p ? t('logout') : t('loginSignup');
      btn.addEventListener('click', function () {
        if (Profiles.current()) Profiles.logout();
        else { closeDrawer(); openDialog(); }
      });
      box.appendChild(who);
      box.appendChild(btn);
    }

    function renderList() {
      var cur = Profiles.current();
      var all = Profiles.list();
      listEl.textContent = '';
      if (!all.length) {
        var li0 = document.createElement('li');
        li0.className = 'drawer-note';
        li0.textContent = t('profileNone');
        listEl.appendChild(li0);
      }
      all.forEach(function (p) {
        var li = document.createElement('li');
        var pick = document.createElement('button');
        pick.type = 'button';
        pick.className = 'profile-pick';
        pick.textContent = '👤 ' + p.name + (cur && cur.id === p.id ? ' · ' + t('profileNow') : '');
        pick.addEventListener('click', function () { Profiles.login(p.id); dlg.close(); });
        var del = document.createElement('button');
        del.type = 'button';
        del.className = 'icon-btn profile-del';
        del.setAttribute('aria-label', t('profileDelete', { name: p.name }));
        del.textContent = '🗑';
        del.addEventListener('click', function () {
          if (window.confirm(t('profileDeleteConfirm', { name: p.name }))) { Profiles.removeProfile(p.id); renderList(); }
        });
        li.appendChild(pick);
        li.appendChild(del);
        listEl.appendChild(li);
      });
    }

    function openDialog() {
      err.textContent = '';
      nameIn.value = '';
      document.getElementById('profile-bring-row').hidden = !Profiles.guestHasData();
      renderList();
      if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
      nameIn.focus();
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var bring = !document.getElementById('profile-bring-row').hidden && document.getElementById('profile-bring').checked;
      var r = Profiles.create(nameIn.value, bring);
      if (r.error) { err.textContent = t(r.error); nameIn.focus(); return; }
      dlg.close();
    });
    dlg.querySelector('[data-profile-close]').addEventListener('click', function () { dlg.close(); });
    dlg.addEventListener('close', function () { document.querySelector('.menu-btn').focus(); });

    renderBox();
    document.addEventListener('profilechange', renderBox);
    document.addEventListener('settingschange', function (e) {
      if (e.detail.changed === 'lang' || e.detail.changed === 'all') { renderBox(); if (dlg.open) renderList(); }
    });
    openProfileDialog = openDialog;   // 메모장·AI 페이지의 [로그인] 버튼에서 Site.openProfile()로 사용
  }
  var openProfileDialog = function () {};

  /* ---------- 푸터 ---------- */
  function buildFooter() {
    body.insertAdjacentHTML('beforeend',
      '<footer class="site-footer"><div class="container">' +
        '<p><strong data-i18n="siteName"></strong> · <span data-i18n="footerMade"></span></p>' +
        '<p data-i18n="footerRef"></p>' +
      '</div></footer>');
    // 푸터는 main 뒤, 서랍보다 앞에 오도록
    var footer = body.querySelector('.site-footer');
    var main = document.getElementById('main');
    if (main) main.after(footer);
  }

  /* ---------- 미적분 지도 (홈) ---------- */
  function renderMap(el) {
    var C = window.CURRICULUM;
    var html = '';
    C.forEach(function (u, i) {
      var chapters = u.chapters.map(function (ch) {
        return '<li><a href="' + ROOT + C.chapterHref(ch.id) + '"><span class="ch-num">' + ch.id + '</span>' + esc(T(ch.title)) + '</a></li>';
      }).join('');
      html +=
        '<li class="map-stop">' +
          '<a class="map-node" href="' + ROOT + u.href + '">' +
            '<span class="map-num" aria-hidden="true">' + u.num + '</span>' +
            '<span class="map-title">' + u.num + '. ' + esc(T(u.title)) + '</span>' +
            '<span class="map-title-en">' + esc(lang() === 'en' ? u.title.ko : u.title.en) + '</span>' +
            '<span class="map-go">' + t('mapGo') + '</span>' +
          '</a>' +
          '<ul class="map-chapters">' + chapters + '</ul>' +
        '</li>';
      if (i === 0) {
        // Ⅰ과 Ⅱ 사이 갈림길 → 엄밀한 정의 놀이터
        html +=
          '<li class="map-fork">' +
            '<span class="fork-mark" aria-hidden="true"><span>🔍</span></span>' +
            '<a class="signpost" href="' + ROOT + 'rigor.html">' + t('forkTitle') + ' →<small>' + t('forkSub') + '</small></a>' +
          '</li>';
      }
    });
    el.innerHTML = html;
  }

  function other(o) { return lang() === 'en' ? o.ko : o.en; }   // 반대 언어 제목 (부제용)
  var CIRCLED = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧'];

  function crumbs(items) {   // items: [{label, href}] 마지막은 현재 페이지
    return '<nav class="breadcrumb" aria-label="' + t('breadcrumb') + '"><ol>' + items.map(function (it, i) {
      return i === items.length - 1
        ? '<li><span aria-current="page">' + esc(it.label) + '</span></li>'
        : '<li><a href="' + it.href + '">' + esc(it.label) + '</a></li>';
    }).join('') + '</ol></nav>';
  }

  /* ---------- 단원 페이지 (unit1~3.html) ---------- */
  function renderUnit() {
    var C = window.CURRICULUM;
    var u = C[+body.getAttribute('data-unit') - 1];
    if (!u) return;

    var head = document.querySelector('[data-render="unit-head"]');
    if (head) {
      head.innerHTML =
        crumbs([{ label: t('nav.home'), href: ROOT + 'index.html' }, { label: u.num + '. ' + T(u.title) }]) +
        '<span class="chip chip-main">' + (lang() === 'en' ? t('unitWord') + ' ' + u.num : u.num + ' ' + t('unitWord')) +
          ' · ' + t('chapterCount', { n: u.chapters.length }) + '</span>' +
        '<h1 style="margin-top:10px">' + u.num + '. ' + esc(T(u.title)) + '</h1>' +
        '<p class="title-en">' + esc(other(u.title)) + '</p>';
    }

    var grid = document.querySelector('[data-render="unit-chapters"]');
    if (grid) {
      grid.innerHTML = u.chapters.map(function (ch) {
        var items = ch.sections.map(function (s) {
          // ✓ 완성(직관 그림까지) · 📘 핵심 정리(그림 준비 중)
          return '<li' + (s.ready ? ' class="is-ready"' : '') + '><span class="st" aria-hidden="true">' + (s.ready ? '✓' : '📘') + '</span>' +
            '<span>' + esc(T(s)) + '<span class="sr-only"> (' + t(s.ready ? 'ready' : 'core') + ')</span></span></li>';
        }).join('');
        return '<a class="card chapter-card" href="' + ROOT + C.chapterHref(ch.id) + '">' +
          '<div class="chapter-card-head"><span class="ch-badge">' + ch.id + '</span></div>' +
          '<h3>' + esc(T(ch.title)) + '</h3>' +
          '<p class="title-en">' + esc(other(ch.title)) + '</p>' +
          '<p class="intro">' + esc(T(ch.intro)) + '</p>' +
          '<ul class="mini-sections">' + items + '</ul>' +
          '<span class="go">' + t('enterChapter') + '</span>' +
        '</a>';
      }).join('');
    }

    var nav = document.querySelector('[data-render="unit-nav"]');
    if (nav) {
      var prev = C[u.id - 2], next = C[u.id];
      nav.innerHTML =
        (prev ? '<a class="btn btn-outline" href="' + ROOT + prev.href + '">' + t('prevUnit') + ' <span class="sr-only">' + esc(T(prev.title)) + '</span></a>'
              : '<a class="btn btn-outline" href="' + ROOT + 'index.html">' + t('toHome') + '</a>') +
        (next ? '<a class="btn btn-primary" href="' + ROOT + next.href + '">' + t('nextUnit') + ' <span class="sr-only">' + esc(T(next.title)) + '</span></a>'
              : '<a class="btn btn-outline" href="' + ROOT + 'index.html#map">' + t('toHome') + '</a>');
    }
    document.title = u.num + '. ' + T(u.title) + ' · ' + t('siteName');
  }

  /* ---------- 중단원 페이지 (chapters/chXX.html) ----------
     완성된 소단원은 HTML에 <section id="s05-1">…</section> 로 직접 쓰고,
     없는 소단원은 여기서 "준비 중" 카드로 만든다. */
  var currentSection = null;
  var STATE = {
    full: { ico: '✓',  key: 'ready',      cls: 'badge-ready' },
    core: { ico: '📘', key: 'core',       cls: 'badge-core' },
    soon: { ico: '🔒', key: 'comingSoon', cls: 'badge-soon' }
  };

  function renderChapter() {
    var C = window.CURRICULUM;
    var found = C.findChapter(body.getAttribute('data-chapter'));
    if (!found) return;
    var u = found.unit, ch = found.chapter;
    var wrap = document.getElementById('sections');

    // 1) 소단원 카드
    var info = ch.sections.map(function (s, i) {
      var id = C.sectionId(ch.id, i);
      var el = document.getElementById(id);
      var written = el && !el.hasAttribute('data-gen');
      if (!el) {
        el = document.createElement('section');
        el.id = id;
        el.setAttribute('data-gen', '');
        el.className = 'card concept is-soon';
      }
      if (written) el.classList.add('card', 'concept');
      var old = el.querySelector(':scope > .concept-head');
      if (old) old.remove();

      // 상태: full(직관 그림까지 완성) · core(핵심 정리만, data-status="core") · soon(아직 없음)
      var state = !written ? 'soon' : (el.getAttribute('data-status') === 'core' ? 'core' : 'full');
      var badges = '<span class="chip ' + STATE[state].cls + '">' + STATE[state].ico + ' ' + t(STATE[state].key) + '</span>' +
        (s.rigor ? '<span class="chip badge-rigor">🔍 ' + t('rigorBadge') + '</span>' : '');
      var headHtml =
        '<div class="concept-head">' +
          '<div class="concept-title"><span class="concept-num" aria-hidden="true">' + CIRCLED[i] + '</span><div>' +
            '<h2><span class="sr-only">' + (i + 1) + '. </span>' + esc(T(s)) + '</h2>' +
            '<p class="title-en">' + esc(other(s)) + '</p>' +
            '<div class="badges">' + badges + '</div>' +
          '</div></div>' +
          '<div class="link-row">' +
            '<a class="btn btn-outline btn-sm" href="' + ROOT + 'memo.html?tag=' + id + '">' + t('memoHere') + '</a>' +
            '<a class="btn btn-outline btn-sm" href="' + ROOT + 'ai.html?topic=' + id + '">🤖 ' + t('nav.ai') + '</a>' +
          '</div>' +
        '</div>';

      if (written) {
        el.insertAdjacentHTML('afterbegin', headHtml);
      } else {
        el.innerHTML = headHtml +
          '<p class="soon-body">' + t('comingSoonText') + '</p>' +
          (s.rigor ? '<div class="soon-links"><a class="btn btn-outline btn-sm" href="' + ROOT + 'rigor.html#' + s.rigor + '">' + t('rigorLink') + '</a></div>' : '');
      }
      wrap.appendChild(el);   // 교과서 순서대로 정렬
      return { id: id, s: s, i: i, written: state === 'full', state: state, el: el };
    });

    // 2) 경로 표시
    var crumb = document.querySelector('[data-render="chapter-crumb"]');
    if (crumb) crumb.innerHTML = crumbs([
      { label: t('nav.home'), href: ROOT + 'index.html' },
      { label: u.num + '. ' + T(u.title), href: ROOT + u.href },
      { label: ch.id + ' ' + T(ch.title) }
    ]);

    // 3) 제목 + 목차 버튼 (스크롤해도 위에 붙어 있음)
    var bar = document.querySelector('[data-render="chapter-bar"]');
    if (bar) {
      var items = info.map(function (x) {
        return '<li><a href="#' + x.id + '" data-sec="' + x.id + '">' +
          '<span class="toc-num" aria-hidden="true">' + CIRCLED[x.i] + '</span>' +
          '<span class="toc-title">' + esc(T(x.s)) + '</span>' +
          '<span class="toc-state">' + STATE[x.state].ico + ' ' + t(STATE[x.state].key) + '</span>' +
        '</a></li>';
      }).join('');
      bar.innerHTML =
        '<div class="container chapter-bar-inner">' +
          '<h1><span class="ch-num">' + ch.id + '</span><span>' + esc(T(ch.title)) + '</span></h1>' +
          '<div class="toc-wrap">' +
            '<button class="toc-btn" type="button" aria-expanded="false" aria-controls="toc-panel" aria-label="' + t('tocOpen') + '">' +
              '<span aria-hidden="true">☰</span><span>' + t('toc') + '</span><span class="caret" aria-hidden="true">▾</span></button>' +
            '<div class="toc-panel" id="toc-panel" hidden><h2>' + t('tocTitle') + '</h2><ol>' + items + '</ol></div>' +
          '</div>' +
        '</div>';
      setupToc(bar, info);
    }

    // 4) 소개
    var intro = document.querySelector('[data-render="chapter-intro"]');
    if (intro) {
      intro.innerHTML =
        '<p class="title-en">' + esc(other(ch.title)) + '</p>' +
        '<p class="page-lead">' + esc(T(ch.intro)) + '</p>' +
        '<div class="chapter-meta">' +
          '<span class="chip">' + t('textbookPage', { p: ch.page }) + '</span>' +
          '<span class="chip">' + t('sectionCount', { n: ch.sections.length }) + '</span>' +
        '</div>';
    }

    // 5) 이전 · 단원 목차 · 다음
    var nav = document.querySelector('[data-render="chapter-nav"]');
    if (nav) {
      var all = C.allChapters();
      var prev = all[found.index - 1], next = all[found.index + 1];
      var link = function (x, cls, label) {
        return x ? '<a class="card ' + cls + '" href="' + ROOT + C.chapterHref(x.chapter.id) + '"><small>' + label + '</small>' +
          '<b>' + x.chapter.id + ' ' + esc(T(x.chapter.title)) + '</b></a>' : '<span class="spacer"></span>';
      };
      nav.setAttribute('aria-label', t('unitToc'));
      nav.innerHTML = link(prev, 'prev', t('prevChapter')) +
        '<a class="btn btn-outline middle" href="' + ROOT + u.href + '">☰ ' + t('unitToc') + '</a>' +
        link(next, 'next', t('nextChapter'));
    }

    document.title = ch.id + ' ' + T(ch.title) + ' · ' + t('siteName');
  }

  var tocObserver = null;
  function setupToc(bar, info) {
    var btn = bar.querySelector('.toc-btn');
    var panel = bar.querySelector('.toc-panel');
    function open() { panel.hidden = false; btn.setAttribute('aria-expanded', 'true'); var a = panel.querySelector('a[aria-current="true"]') || panel.querySelector('a'); if (a) a.focus(); }
    function close(focusBtn) { panel.hidden = true; btn.setAttribute('aria-expanded', 'false'); if (focusBtn) btn.focus(); }
    btn.addEventListener('click', function () { if (panel.hidden) open(); else close(false); });
    panel.addEventListener('click', function (e) { if (e.target.closest('a')) close(false); });
    panel.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(true); });
    document.addEventListener('click', function (e) { if (!panel.hidden && !bar.contains(e.target)) close(false); });

    function mark(id) {
      currentSection = id;
      var links = panel.querySelectorAll('a[data-sec]');
      for (var i = 0; i < links.length; i++) {
        var on = links[i].getAttribute('data-sec') === id;
        if (on) links[i].setAttribute('aria-current', 'true'); else links[i].removeAttribute('aria-current');
        var chip = links[i].querySelector('.toc-now');
        if (on && !chip) links[i].insertAdjacentHTML('beforeend', '<span class="toc-now">' + t('tocNow') + '</span>');
        if (!on && chip) chip.remove();
      }
    }
    mark(currentSection || info[0].id);

    // 화면 가운데쯤에 걸린 소단원을 "지금 읽는 중"으로 표시
    if (tocObserver) tocObserver.disconnect();
    if (window.IntersectionObserver) {
      tocObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) mark(en.target.id); });
      }, { rootMargin: '-35% 0px -60% 0px' });
      info.forEach(function (x) { tocObserver.observe(x.el); });
    }
  }

  /* ---------- 수식 ---------- */
  function renderMath(root) {
    if (!window.renderMathInElement) return;   // CDN을 못 불러오면 원문 그대로 둔다
    renderMathInElement(root || body, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '\\[', right: '\\]', display: true },
        { left: '\\(', right: '\\)', display: false }
      ],
      throwOnError: false,
      strict: false,
      ignoredClasses: ['no-math'],
      // \htmlClass{k-eps}{\varepsilon} 처럼 기호에 색·밑줄 클래스를 붙일 수 있게
      trust: function (ctx) { return ctx.command === '\\htmlClass'; }
    });
  }

  /* ---------- 풀이 보기 / 접기 ---------- */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.solution-toggle');
    if (!btn) return;
    var panel = document.getElementById(btn.getAttribute('aria-controls'));
    if (!panel) return;
    var open = btn.getAttribute('aria-expanded') !== 'true';
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    panel.hidden = !open;
    var label = btn.querySelector('[data-i18n]');
    if (label) { label.setAttribute('data-i18n', open ? 'solHide' : 'solShow'); label.textContent = t(open ? 'solHide' : 'solShow'); }
  });

  /* 설정한 메인 색에 맞춰 색 이름을 채운다. 예) <span data-color-name="main"></span> → "파란색"
     δ·할선에 쓰는 셋째 색은 보라색이지만, 메인 색이 보라색이면 파란색으로 바뀐다 (style.css 참고) */
  function applyColorNames() {
    var main = Settings.get('main');
    var names = { main: main, third: main === 'purple' ? 'blue' : 'purple' };
    var els = document.querySelectorAll('[data-color-name]');
    for (var i = 0; i < els.length; i++) els[i].textContent = t('color.' + names[els[i].getAttribute('data-color-name')]);
  }

  function applyLanguage() {
    I18N.apply(document);
    applyColorNames();
    var title = body.getAttribute(lang() === 'en' ? 'data-title-en' : 'data-title-ko');
    if (title) document.title = title;
    var maps = document.querySelectorAll('[data-render="map"]');
    for (var i = 0; i < maps.length; i++) renderMap(maps[i]);
    if (body.hasAttribute('data-unit')) renderUnit();
    if (body.hasAttribute('data-chapter')) renderChapter();
  }

  /* ---------- 시작 ---------- */
  buildHeader();
  buildDrawer();
  buildFooter();
  applyLanguage();
  renderMath();

  // 중단원 페이지는 소단원을 나중에 만들기 때문에, 주소의 #앵커 위치로 다시 이동
  if (location.hash && body.hasAttribute('data-chapter')) {
    var target = document.getElementById(location.hash.slice(1));
    if (target) setTimeout(function () { target.scrollIntoView(); }, 0);
  }

  document.addEventListener('settingschange', function (e) {
    if (e.detail.changed === 'lang' || e.detail.changed === 'all') applyLanguage();
    else if (e.detail.changed === 'main') applyColorNames();
  });

  window.Site = { root: ROOT, T: T, lang: lang, esc: esc, renderMath: renderMath,
                  openProfile: function () { openProfileDialog(); } };
})();
