/* 미적분학 첫걸음 — 개인 메모장
   메모는 로그인한 프로필별로 저장한다 (profiles.js의 Profiles.read/write, 서버로 보내지 않음).
   memo.html?tag=s05-1 로 열면 그 소단원 태그가 붙은 새 메모를 만든다. */
(function () {
  'use strict';

  var C = window.CURRICULUM, t = I18N.t;
  var $ = function (id) { return document.getElementById(id); };

  var memos = [], currentId = null, saveTimer = null;

  var el = {
    list: $('memo-list'), count: $('memo-count'), msg: $('memo-msg'),
    search: $('memo-search'), filter: $('memo-filter'),
    placeholder: $('memo-placeholder'), editor: $('memo-editor'),
    title: $('memo-title'), tag: $('memo-tag'), body: $('memo-body'),
    status: $('memo-status'), go: $('memo-go'), del: $('memo-delete'),
    importFile: $('memo-import')
  };

  function lang() { return I18N.lang(); }

  /* ---------- 저장 ---------- */
  function load() {
    var data = Profiles.read('memos', []);
    memos = Array.isArray(data) ? data.filter(valid) : [];
  }

  function persist() {
    if (Profiles.write('memos', memos)) return true;
    el.msg.textContent = t('memoStorageFail');
    return false;
  }

  /* 메모장 위쪽: 지금 누구의 메모장인지 + 로그인 버튼 */
  function renderOwner() {
    var box = $('memo-owner');
    if (!box) return;
    var p = Profiles.current();
    box.textContent = '';
    var txt = document.createElement('span');
    txt.textContent = p ? t('memoOwner', { name: p.name }) : t('memoOwnerGuest');
    box.appendChild(txt);
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn btn-outline btn-sm';
    b.textContent = p ? t('logout') : t('loginSignup');
    b.addEventListener('click', function () { if (Profiles.current()) Profiles.logout(); else Site.openProfile(); });
    box.appendChild(b);
  }

  function valid(m) {
    return m && typeof m.id === 'string' && typeof m.title === 'string' && typeof m.body === 'string';
  }

  function uid() { return 'm' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function find(id) { for (var i = 0; i < memos.length; i++) if (memos[i].id === id) return memos[i]; return null; }
  function isBlank(m) { return !m.title.trim() && !m.body.trim(); }

  /* 제목도 내용도 없는 메모는 다른 메모로 넘어갈 때 정리 */
  function dropBlank(exceptId) {
    var before = memos.length;
    memos = memos.filter(function (m) { return m.id === exceptId || !isBlank(m); });
    if (memos.length !== before) persist();
  }

  function fmtDate(ms) {
    return new Date(ms).toLocaleString(lang() === 'en' ? 'en-US' : 'ko-KR',
      { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  /* ---------- 단원 태그 ---------- */
  function fillTagSelect(sel, withAll) {
    var keep = sel.value;
    var L = lang();
    sel.textContent = '';
    function opt(v, label) { var o = document.createElement('option'); o.value = v; o.textContent = label; return o; }
    if (withAll) sel.appendChild(opt('*', t('memoAllTags')));
    sel.appendChild(opt('', t('memoNoTag')));
    C.forEach(function (u) {
      var g = document.createElement('optgroup');
      g.label = u.num + '. ' + u.title[L];
      g.appendChild(opt('u' + u.id, u.num + '. ' + u.title[L] + (L === 'en' ? ' (whole unit)' : ' (단원 전체)')));
      u.chapters.forEach(function (ch) {
        g.appendChild(opt('ch' + ch.id, ch.id + ' ' + ch.title[L]));
        ch.sections.forEach(function (s, i) {
          g.appendChild(opt(C.sectionId(ch.id, i), '　└ ' + ch.id + '-' + (i + 1) + ' ' + s[L]));
        });
      });
      sel.appendChild(g);
    });
    sel.value = keep || (withAll ? '*' : '');
    if (sel.selectedIndex < 0) sel.value = withAll ? '*' : '';
  }

  function chapterOfTag(tag) {
    var m = /^(?:ch|s)(\d\d)/.exec(tag || '');
    return m ? m[1] : null;
  }
  function unitOfTag(tag) {
    if (/^u\d$/.test(tag)) return +tag.slice(1);
    var ch = chapterOfTag(tag), f = ch && C.findChapter(ch);
    return f ? f.unit.id : null;
  }

  /* 거르기: 단원을 고르면 그 단원의 중단원·소단원 메모도, 중단원을 고르면 그 소단원 메모도 보인다 */
  function matches(m, filter) {
    if (filter === '*') return true;
    if (filter === '') return !m.tag;
    if (/^u\d$/.test(filter)) return unitOfTag(m.tag) === +filter.slice(1);
    if (/^ch\d\d$/.test(filter)) return chapterOfTag(m.tag) === filter.slice(2) && !/^u/.test(m.tag);
    return m.tag === filter;
  }

  /* ---------- 목록 ---------- */
  function renderList() {
    var q = el.search.value.trim().toLowerCase();
    var filter = el.filter.value;
    var shown = memos
      .filter(function (m) { return matches(m, filter); })
      .filter(function (m) { return !q || (m.title + '\n' + m.body).toLowerCase().indexOf(q) !== -1; })
      .sort(function (a, b) { return b.updated - a.updated; });

    el.list.textContent = '';
    el.count.textContent = t('memoCount', { n: memos.length });

    if (!shown.length) {
      var li = document.createElement('li');
      li.className = 'memo-empty';
      li.textContent = memos.length ? t('memoNoResult') : t('memoEmpty');
      el.list.appendChild(li);
      return;
    }

    shown.forEach(function (m) {
      var li = document.createElement('li');
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'memo-item';
      b.setAttribute('data-id', m.id);
      if (m.id === currentId) b.setAttribute('aria-current', 'true');

      var title = document.createElement('span');
      title.className = 'memo-item-title';
      title.textContent = m.title.trim() || t('memoUntitled');

      var meta = document.createElement('span');
      meta.className = 'memo-item-meta';
      var tagInfo = C.describeTag(m.tag, lang());
      if (tagInfo) { var tg = document.createElement('span'); tg.textContent = '🏷 ' + tagInfo.label; meta.appendChild(tg); }
      var dt = document.createElement('span');
      dt.textContent = t('memoUpdated') + ' ' + fmtDate(m.updated);
      meta.appendChild(dt);

      var pv = document.createElement('span');
      pv.className = 'memo-item-preview';
      pv.textContent = m.body.replace(/\s+/g, ' ').trim();

      b.appendChild(title); b.appendChild(meta);
      if (pv.textContent) b.appendChild(pv);
      li.appendChild(b);
      el.list.appendChild(li);
    });
  }

  /* ---------- LaTeX 미리보기 · 수식 버튼 ---------- */
  var TEX = [
    ['frac', '\\frac{a}{b}'], ['sqrt', '\\sqrt{x}'], ['pow', 'x^{2}'],
    ['lim', '\\lim_{x \\to a} f(x)'], ['deriv', "f'(a)=\\lim_{h \\to 0}\\frac{f(a+h)-f(a)}{h}"],
    ['int', '\\int_{a}^{b} f(x)\\,dx'], ['sum', '\\sum_{k=1}^{n} a_k'], ['inf', '\\infty'],
    ['eps', '\\varepsilon, \\delta'], ['trig', '\\sin x']
  ];
  var preview = $('memo-preview'), texbar = $('memo-texbar'), previewTimer = null;

  function buildTexBar() {
    texbar.textContent = '';
    TEX.forEach(function (it) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'tex-btn';
      b.setAttribute('data-tex', it[1]);
      b.textContent = t('tex.' + it[0]);
      b.title = '$' + it[1] + '$';
      texbar.appendChild(b);
    });
  }

  /* 커서 위치에 $수식$ 을 넣는다 */
  function insertTex(tex) {
    var ta = el.body, s = ta.selectionStart, e = ta.selectionEnd;
    var text = '$' + tex + '$';
    ta.value = ta.value.slice(0, s) + text + ta.value.slice(e);
    ta.focus();
    ta.selectionStart = ta.selectionEnd = s + text.length;
    onEdit();
  }

  /* 글은 textContent로 넣은 뒤 KaTeX가 $ … $ 부분만 수식으로 바꾼다 (HTML은 해석하지 않음) */
  function renderPreview() {
    var text = el.body.value;
    preview.textContent = text.trim() ? text : t('memoPreviewEmpty');
    preview.classList.toggle('is-empty', !text.trim());
    if (text.trim() && window.renderMathInElement) {
      renderMathInElement(preview, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '\\[', right: '\\]', display: true },
          { left: '$', right: '$', display: false },
          { left: '\\(', right: '\\)', display: false }
        ],
        throwOnError: false
      });
    }
  }
  function schedulePreview() { clearTimeout(previewTimer); previewTimer = setTimeout(renderPreview, 150); }

  /* ---------- 편집기 ---------- */
  function updateGoLink(m) {
    var info = C.describeTag(m.tag, lang());
    el.go.hidden = !info;
    if (info) { el.go.href = info.href; el.go.textContent = t('memoGo'); el.go.title = info.label; }
  }

  function open(id, focusField) {
    dropBlank(id);
    var m = find(id);
    if (!m) return;
    currentId = id;
    el.placeholder.hidden = true;
    el.editor.hidden = false;
    el.title.value = m.title;
    el.body.value = m.body;
    el.tag.value = m.tag || '';
    el.status.textContent = '';
    updateGoLink(m);
    renderPreview();
    renderList();
    if (window.matchMedia('(max-width: 900px)').matches) el.editor.scrollIntoView({ block: 'start' });
    if (focusField) focusField.focus();
  }

  function closeEditor() {
    currentId = null;
    el.editor.hidden = true;
    el.placeholder.hidden = false;
    renderList();
  }

  function newMemo(tag) {
    dropBlank(null);
    var now = Date.now();
    var m = { id: uid(), title: '', body: '', tag: tag || '', created: now, updated: now };
    memos.unshift(m);
    persist();
    // 새 메모가 지금 거르기 조건에 안 맞으면 조건을 풀어서 목록에 보이게
    if (!matches(m, el.filter.value)) el.filter.value = '*';
    el.search.value = '';
    open(m.id, el.title);
  }

  function onEdit() {
    var m = find(currentId);
    if (!m) return;
    m.title = el.title.value;
    m.body = el.body.value;
    m.tag = el.tag.value;
    m.updated = Date.now();
    updateGoLink(m);
    schedulePreview();
    // 바로 저장한다 (곧바로 로그아웃·프로필 전환을 해도 다른 사람 메모로 섞이지 않게)
    var ok = persist();
    el.status.textContent = t('memoSaving');
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      if (ok) el.status.textContent = t('memoSaved');
      renderList();
    }, 400);
  }

  function remove() {
    var m = find(currentId);
    if (!m) return;
    if (!isBlank(m) && !window.confirm(t('memoDeleteConfirm'))) return;
    memos = memos.filter(function (x) { return x.id !== m.id; });
    persist();
    closeEditor();
    el.msg.textContent = t('memoDeleted');
    $('memo-new').focus();
  }

  /* ---------- 내보내기 / 불러오기 ---------- */
  function exportFile() {
    var data = JSON.stringify({ app: 'calc-first-step', version: 1, exported: new Date().toISOString(), memos: memos }, null, 2);
    var blob = new Blob([data], { type: 'application/json' });
    var a = document.createElement('a');
    var d = new Date();
    var stamp = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    a.href = URL.createObjectURL(blob);
    a.download = '미적분학첫걸음-메모-' + stamp + '.json';
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 0);
  }

  function importFile(file) {
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var data = JSON.parse(reader.result);
        var list = Array.isArray(data) ? data : data && data.memos;
        if (!Array.isArray(list)) throw new Error('bad');
        var n = 0;
        list.filter(valid).forEach(function (m) {
          var clean = {
            id: m.id, title: m.title.slice(0, 200), body: m.body,
            tag: typeof m.tag === 'string' && C.describeTag(m.tag, 'ko') ? m.tag : '',
            created: +m.created || Date.now(), updated: +m.updated || Date.now()
          };
          var old = find(clean.id);
          if (!old) { memos.push(clean); n++; }
          else if (clean.updated > old.updated) { Object.assign(old, clean); n++; }
        });
        persist();
        renderList();
        el.msg.textContent = t('memoImported', { n: n });
      } catch (e) {
        el.msg.textContent = t('memoImportFail');
      }
    };
    reader.onerror = function () { el.msg.textContent = t('memoImportFail'); };
    reader.readAsText(file);
  }

  /* ---------- 연결 ---------- */
  el.list.addEventListener('click', function (e) {
    var b = e.target.closest('.memo-item');
    if (b) open(b.getAttribute('data-id'), el.body);
  });
  $('memo-new').addEventListener('click', function () { newMemo(''); });
  $('memo-back').addEventListener('click', function () { $('memo-list-title').parentElement.scrollIntoView({ block: 'start' }); });
  el.search.addEventListener('input', renderList);
  el.filter.addEventListener('change', renderList);
  el.title.addEventListener('input', onEdit);
  el.body.addEventListener('input', onEdit);
  el.tag.addEventListener('change', onEdit);
  el.del.addEventListener('click', remove);
  texbar.addEventListener('click', function (e) {
    var b = e.target.closest('.tex-btn');
    if (b) insertTex(b.getAttribute('data-tex'));
  });
  $('memo-export').addEventListener('click', exportFile);
  $('memo-import-btn').addEventListener('click', function () { el.importFile.click(); });
  el.importFile.addEventListener('change', function () {
    if (el.importFile.files[0]) importFile(el.importFile.files[0]);
    el.importFile.value = '';
  });

  document.addEventListener('settingschange', function (e) {
    if (e.detail.changed !== 'lang' && e.detail.changed !== 'all') return;
    fillTagSelect(el.filter, true);
    fillTagSelect(el.tag, false);
    buildTexBar();
    var m = find(currentId);
    if (m) { el.tag.value = m.tag || ''; updateGoLink(m); renderPreview(); }
    renderOwner();
    renderList();
  });

  // 로그인·로그아웃하면 그 사람의 메모로 바꿔 보여 준다
  document.addEventListener('profilechange', function () {
    clearTimeout(saveTimer);
    load();
    dropBlank(null);
    el.search.value = '';
    el.filter.value = '*';
    closeEditor();
    renderOwner();
    el.msg.textContent = '';
  });

  /* ---------- 시작 ---------- */
  renderOwner();
  load();
  dropBlank(null);
  fillTagSelect(el.filter, true);
  fillTagSelect(el.tag, false);
  buildTexBar();

  var params = new URLSearchParams(location.search);
  var tagParam = params.get('tag');
  if (tagParam !== null) {
    // 새로고침해도 메모가 또 생기지 않게 주소에서 지운다
    history.replaceState(null, '', location.pathname);
    newMemo(C.describeTag(tagParam, 'ko') ? tagParam : '');
  } else {
    renderList();
  }
})();
