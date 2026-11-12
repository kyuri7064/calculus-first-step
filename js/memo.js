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
  function isBlank(m) { return !m.title.trim() && !m.body.trim() && !(m.att && m.att.length); }

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
      if (m.att && m.att.length) { var at = document.createElement('span'); at.textContent = t('attCount', { n: m.att.length }); meta.appendChild(at); }

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

  /* ---------- 첨부: 사진 · 그래프 ----------
     첨부도 메모와 함께 같은 곳(이 브라우저)에 저장된다. 사진은 저장 공간을 아끼려고 줄여서 JPEG로 바꾼다.
     그래프는 그림이 아니라 식과 범위만 저장하고, 열 때마다 다시 그린다 (색 설정·다크 모드를 따라감). */
  var PHOTO_MAX = 1280, PHOTO_Q = 0.8, ATT_MAX = 12, EXPR_MAX = 80;

  /* 수식 해석기: eval 없이 정해진 기호만 읽는다 (불러온 파일의 식도 안전하게).
     지원: + − × ÷ ^, 괄호, x, pi(π), e, sin cos tan sqrt abs exp ln log, 2x 같은 곱셈 생략 */
  var FUNCS = {
    sqrt: Math.sqrt, sin: Math.sin, cos: Math.cos, tan: Math.tan, abs: Math.abs,
    exp: Math.exp, ln: Math.log, log: function (v) { return Math.log(v) / Math.LN10; }
  };
  var NAMES = ['sqrt', 'sin', 'cos', 'tan', 'abs', 'exp', 'ln', 'log', 'pi', 'x', 'e'];

  function tokenize(src) {
    var s = src.replace(/[−–]/g, '-').replace(/[×·]/g, '*').replace(/÷/g, '/').replace(/π/g, 'pi')
               .replace(/²/g, '^2').replace(/³/g, '^3').replace(/√/g, 'sqrt').replace(/\s+/g, '');
    var out = [], i = 0;
    while (i < s.length) {
      var ch = s[i], m = /^(\d+\.?\d*|\.\d+)/.exec(s.slice(i));
      if (m) { out.push({ k: 'n', v: parseFloat(m[1]) }); i += m[1].length; continue; }
      if ('+-*/^()'.indexOf(ch) !== -1) { out.push({ k: ch }); i++; continue; }
      var low = s.slice(i).toLowerCase(), name = null;
      for (var j = 0; j < NAMES.length; j++) if (low.indexOf(NAMES[j]) === 0) { name = NAMES[j]; break; }
      if (!name) throw new Error(ch);
      out.push(FUNCS[name] ? { k: 'f', v: name } : { k: 'id', v: name });
      i += name.length;
    }
    return out;
  }

  function compile(src) {
    var tk = tokenize(src), p = 0;
    if (!tk.length) throw new Error('empty');
    function peek() { return tk[p]; }
    function eat(k) { if (!tk[p] || tk[p].k !== k) throw new Error(k); return tk[p++]; }
    function startsPrimary(t) { return t && (t.k === 'n' || t.k === 'id' || t.k === 'f' || t.k === '('); }
    function primary() {
      var t = tk[p++];
      if (!t) throw new Error('end');
      if (t.k === 'n') { var v = t.v; return function () { return v; }; }
      if (t.k === 'id') {
        if (t.v === 'x') return function (x) { return x; };
        var c = t.v === 'pi' ? Math.PI : Math.E;
        return function () { return c; };
      }
      if (t.k === 'f') {
        var fn = FUNCS[t.v], arg = peek() && peek().k === '(' ? primary() : power();
        return function (x) { return fn(arg(x)); };
      }
      if (t.k === '(') { var e = expr(); eat(')'); return e; }
      throw new Error(t.k);
    }
    function power() {
      var b = primary();
      if (peek() && peek().k === '^') { p++; var ex = unary(); return function (x) { return Math.pow(b(x), ex(x)); }; }
      return b;
    }
    function unary() {
      var t = peek();
      if (t && (t.k === '-' || t.k === '+')) { p++; var u = unary(); return t.k === '-' ? function (x) { return -u(x); } : u; }
      return power();
    }
    function term() {
      var a = unary();
      for (;;) {
        var t = peek();
        if (t && (t.k === '*' || t.k === '/')) {
          p++; var b = unary(), l = a;
          a = t.k === '*' ? (function (l, b) { return function (x) { return l(x) * b(x); }; })(l, b)
                          : (function (l, b) { return function (x) { return l(x) / b(x); }; })(l, b);
        } else if (startsPrimary(t)) {   // 2x, 3sin x, (x+1)(x-1)
          var c = unary(), l2 = a;
          a = (function (l, c) { return function (x) { return l(x) * c(x); }; })(l2, c);
        } else return a;
      }
    }
    function expr() {
      var a = term();
      for (;;) {
        var t = peek();
        if (!t || (t.k !== '+' && t.k !== '-')) return a;
        p++; var b = term(), l = a;
        a = t.k === '+' ? (function (l, b) { return function (x) { return l(x) + b(x); }; })(l, b)
                        : (function (l, b) { return function (x) { return l(x) - b(x); }; })(l, b);
      }
    }
    var f = expr();
    if (p < tk.length) throw new Error('rest');
    return f;
  }

  /* 그래프 정의 → 그릴 함수들과 화면 범위. 문제가 있으면 오류 메시지 키를 돌려준다 */
  function prepareGraph(def) {
    var fs = [];
    try {
      [def.f, def.g].forEach(function (s) { if (s && s.trim()) fs.push(compile(s)); });
    } catch (e) { return { err: 'attErrExpr' }; }
    if (!fs.length) return { err: 'attErrEmpty' };
    var a = +def.a, b = +def.b;
    if (!isFinite(a) || !isFinite(b) || b <= a || b - a > 1000) return { err: 'attErrRange' };
    var ys = [];
    fs.forEach(function (f) {
      for (var i = 0; i <= 400; i++) { var y = f(a + (b - a) * i / 400); if (isFinite(y)) ys.push(y); }
    });
    if (!ys.length) return { err: 'attErrNoValue' };
    ys.sort(function (u, v) { return u - v; });
    // 점근선 근처의 아주 큰 값 때문에 그래프가 납작해지지 않게 양 끝 2%는 버린다
    var lo = ys[Math.floor(ys.length * 0.02)], hi = ys[Math.ceil(ys.length * 0.98) - 1];
    if (lo > 0 && lo < (hi - lo) * 0.5) lo = 0;   // x축이 가까우면 함께 보이게
    if (hi < 0 && -hi < (hi - lo) * 0.5) hi = 0;
    if (hi - lo < 1e-9) { lo -= 1; hi += 1; }
    var pad = (hi - lo) * 0.12;
    return { fs: fs, view: { xMin: a - (b - a) * 0.04, xMax: b + (b - a) * 0.04, yMin: lo - pad, yMax: hi + pad } };
  }

  function drawGraph(g, def) {
    var P = prepareGraph(def), c = g.c;
    if (P.err) { g.clear(); g.label((g.o.xMin + g.o.xMax) / 2, (g.o.yMin + g.o.yMax) / 2, t(P.err), { color: c.text2 }); return; }
    g.setView(P.view);
    g.clear(); g.grid(); g.axes();
    var styles = [{ color: c.main, width: 3.5 }, { color: c.accent, width: 3, dash: [11, 6] }];
    P.fs.forEach(function (f, i) { g.plot(f, styles[i]); });
  }

  function graphCaption(def) {
    // 두 개일 때는 선 모양(━ 실선, ╍ 점선)을 앞에 붙여 어느 식인지 구분한다
    var list = [def.f, def.g].filter(function (s) { return s && s.trim(); });
    return list.map(function (s, i) { return (list.length > 1 ? ['━ ', '╍ '][i] : '') + 'y = ' + s.trim(); }).join(',  ')
      + '   (' + def.a + ' ≤ x ≤ ' + def.b + ')';
  }

  var attList = $('att-list'), graphForm = $('att-graph-form'), gfErr = $('gf-err');
  var liveGraphs = [];   // 지금 화면에 그려진 그래프 (설정이 바뀌면 다시 그림)

  function renderAttachments() {
    var m = find(currentId);
    attList.textContent = '';
    liveGraphs = [];
    var list = (m && m.att) || [];
    attList.hidden = !list.length;
    list.forEach(function (a) {
      var li = document.createElement('li');
      li.className = 'attach-item';
      var cap = document.createElement('p');
      cap.className = 'attach-cap';
      if (a.type === 'photo') {
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'attach-photo';
        b.setAttribute('data-view', a.id);
        b.setAttribute('aria-label', t('attView') + ': ' + (a.name || t('attPhotoName')));
        var img = document.createElement('img');
        img.src = a.src; img.alt = ''; img.loading = 'lazy';
        b.appendChild(img);
        li.appendChild(b);
        cap.textContent = '🖼 ' + (a.name || t('attPhotoName'));
      } else {
        var wrap = document.createElement('div');
        wrap.className = 'viz-canvas-wrap';
        var cv = document.createElement('canvas');
        cv.setAttribute('role', 'img');
        cv.setAttribute('aria-label', t('attGraphName') + ': ' + graphCaption(a));
        wrap.appendChild(cv);
        li.appendChild(wrap);
        cap.textContent = '📈 ' + graphCaption(a);
        var g = Graph.create(cv, { xMin: -5, xMax: 5, yMin: -5, yMax: 5, aspect: 0.62, maxHeight: 300 });
        g.render = function () { drawGraph(g, a); };
        liveGraphs.push(g);
      }
      var del = document.createElement('button');
      del.type = 'button'; del.className = 'btn btn-delete btn-sm attach-del';
      del.setAttribute('data-del', a.id);
      del.textContent = t('attRemove');
      var row = document.createElement('div');
      row.className = 'attach-row';
      row.appendChild(cap); row.appendChild(del);
      li.appendChild(row);
      attList.appendChild(li);
    });
    liveGraphs.forEach(function (g) { g.draw(); });
  }

  /* 첨부 하나 추가. 저장 공간이 모자라면 되돌린다 */
  function addAttachment(a) {
    var m = find(currentId);
    if (!m) return false;
    m.att = m.att || [];
    if (m.att.length >= ATT_MAX) { el.status.textContent = t('attErrMany', { n: ATT_MAX }); return false; }
    a.id = 'a' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    m.att.push(a);
    m.updated = Date.now();
    if (!Profiles.write('memos', memos)) {
      m.att.pop();
      el.status.textContent = t('attErrFull');
      return false;
    }
    el.status.textContent = t('memoSaved');
    renderAttachments();
    renderList();
    return true;
  }

  function removeAttachment(id) {
    var m = find(currentId);
    if (!m || !m.att) return;
    if (!window.confirm(t('attRemoveConfirm'))) return;
    m.att = m.att.filter(function (a) { return a.id !== id; });
    m.updated = Date.now();
    persist();
    renderAttachments();
    renderList();
  }

  /* 사진 → 긴 변 1280px 이하 JPEG (투명한 부분은 흰색) */
  function shrinkPhoto(file, done) {
    var reader = new FileReader();
    reader.onload = function () {
      var img = new Image();
      img.onload = function () {
        var k = Math.min(1, PHOTO_MAX / Math.max(img.width, img.height));
        var w = Math.max(1, Math.round(img.width * k)), h = Math.max(1, Math.round(img.height * k));
        var cv = document.createElement('canvas');
        cv.width = w; cv.height = h;
        var ctx = cv.getContext('2d');
        ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        done(cv.toDataURL('image/jpeg', PHOTO_Q));
      };
      img.onerror = function () { done(null); };
      img.src = reader.result;
    };
    reader.onerror = function () { done(null); };
    reader.readAsDataURL(file);
  }

  function addPhotos(files) {
    files = Array.prototype.filter.call(files, function (f) { return /^image\//.test(f.type); });
    if (!files.length) return;
    el.status.textContent = t('attLoading');
    var i = 0;
    (function next() {
      if (i >= files.length) return;
      var f = files[i++];
      shrinkPhoto(f, function (src) {
        if (!src) { el.status.textContent = t('attErrPhoto'); return next(); }
        var name = (f.name && f.name !== 'image.png') ? f.name.replace(/\.[^.]+$/, '').slice(0, 60) : '';
        if (addAttachment({ type: 'photo', src: src, name: name })) next();
      });
    })();
  }

  /* 그래프 넣기 양식 */
  var gf = { f: $('gf-f'), g: $('gf-g'), a: $('gf-a'), b: $('gf-b') };
  var gfGraph = null, gfTimer = null;
  function formDef() { return { f: gf.f.value.slice(0, EXPR_MAX), g: gf.g.value.slice(0, EXPR_MAX), a: +gf.a.value, b: +gf.b.value }; }
  function showGraphForm(on) {
    graphForm.hidden = !on;
    $('att-graph-btn').setAttribute('aria-expanded', on ? 'true' : 'false');
    if (on) {
      gfErr.textContent = '';
      if (!gfGraph) {
        gfGraph = Graph.create($('gf-canvas'), { xMin: -5, xMax: 5, yMin: -5, yMax: 5, aspect: 0.62, maxHeight: 300 });
        gfGraph.render = function () { drawGraph(gfGraph, formDef()); };
      }
      gfGraph.draw();
      gf.f.focus();
    }
  }
  graphForm.addEventListener('input', function () {
    clearTimeout(gfTimer);
    gfTimer = setTimeout(function () {
      var P = prepareGraph(formDef());
      gfErr.textContent = P.err && (gf.f.value.trim() || gf.g.value.trim()) ? t(P.err) : '';
      if (gfGraph) gfGraph.draw();
    }, 200);
  });
  graphForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var d = formDef(), P = prepareGraph(d);
    if (P.err) { gfErr.textContent = t(P.err); return; }
    if (addAttachment({ type: 'graph', f: d.f.trim(), g: d.g.trim(), a: d.a, b: d.b })) {
      gf.f.value = ''; gf.g.value = '';
      showGraphForm(false);
      $('att-graph-btn').focus();
    }
  });
  $('gf-cancel').addEventListener('click', function () { showGraphForm(false); $('att-graph-btn').focus(); });
  $('att-graph-btn').addEventListener('click', function () { showGraphForm(graphForm.hidden); });
  $('att-photo-btn').addEventListener('click', function () { $('att-photo').click(); });
  $('att-photo').addEventListener('change', function () { addPhotos(this.files); this.value = ''; });
  // 캡처한 그림을 본문에 붙여 넣어도 사진으로 첨부 (글자를 붙여 넣을 때는 그대로)
  el.body.addEventListener('paste', function (e) {
    var cd = e.clipboardData;
    if (!cd || (cd.types && Array.prototype.indexOf.call(cd.types, 'text/plain') !== -1)) return;
    var files = Array.prototype.filter.call(cd.files || [], function (f) { return /^image\//.test(f.type); });
    if (files.length) { e.preventDefault(); addPhotos(files); }
  });

  attList.addEventListener('click', function (e) {
    var d = e.target.closest('[data-del]');
    if (d) { removeAttachment(d.getAttribute('data-del')); return; }
    var v = e.target.closest('[data-view]'), m = find(currentId);
    if (!v || !m) return;
    var a = m.att.filter(function (x) { return x.id === v.getAttribute('data-view'); })[0];
    if (!a) return;
    var dlg = $('att-dialog');
    $('att-dialog-img').src = a.src;
    $('att-dialog-img').alt = a.name || t('attPhotoName');
    $('att-dialog-cap').textContent = a.name || t('attPhotoName');
    if (dlg.showModal) dlg.showModal(); else window.open(a.src);
  });
  $('att-dialog-close').addEventListener('click', function () { $('att-dialog').close(); });
  $('att-dialog').addEventListener('click', function (e) { if (e.target === this) this.close(); });

  /* 불러온 파일의 첨부는 모양을 확인하고 안전한 것만 남긴다 */
  function cleanAtt(list) {
    if (!Array.isArray(list)) return [];
    return list.filter(function (a) {
      if (!a || typeof a.id !== 'string') return false;
      if (a.type === 'photo') return typeof a.src === 'string' && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+\/=]+$/.test(a.src);
      if (a.type === 'graph') return typeof a.f === 'string' && typeof a.g === 'string' && a.f.length <= EXPR_MAX && a.g.length <= EXPR_MAX && isFinite(a.a) && isFinite(a.b);
      return false;
    }).slice(0, ATT_MAX).map(function (a) {
      return a.type === 'photo'
        ? { id: a.id, type: 'photo', src: a.src, name: typeof a.name === 'string' ? a.name.slice(0, 60) : '' }
        : { id: a.id, type: 'graph', f: a.f, g: a.g, a: +a.a, b: +a.b };
    });
  }

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
    showGraphForm(false);
    renderAttachments();
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
            created: +m.created || Date.now(), updated: +m.updated || Date.now(),
            att: cleanAtt(m.att)
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
    if (gfGraph && !graphForm.hidden) gfGraph.draw();
    if (e.detail.changed !== 'lang' && e.detail.changed !== 'all') { liveGraphs.forEach(function (g) { g.draw(); }); return; }
    renderAttachments();
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
