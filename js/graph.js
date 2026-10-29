/* 미적분학 첫걸음 — 공통 그래프 엔진 (Canvas)

   const g = Graph.create(canvas, { xMin, xMax, yMin, yMax, aspect });
   g.render = () => { g.clear(); g.grid(); g.axes(); g.plot(f, { color: g.c.main }); ... };
   g.draw();

   - 부모 요소 폭이 바뀌면 다시 그린다 (반응형, 고해상도 화면 대응)
   - 테마·메인 색이 바뀌면(settingschange) 색을 다시 읽어 다시 그린다
   - 색만으로 구분하지 않도록 dash(점선), width(굵기), label(직접 라벨)을 함께 쓴다 */
(function () {
  'use strict';

  var LABEL_FONT = '600 15px "Pretendard Variable", Pretendard, "Malgun Gothic", sans-serif';
  var TICK_FONT = '500 13px "Pretendard Variable", Pretendard, "Malgun Gothic", sans-serif';

  function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  function readColors() {
    return {
      main: cssVar('--g-main'), accent: cssVar('--g-accent'), third: cssVar('--g-third'),
      fillMain: cssVar('--g-fill-main'), fillAccent: cssVar('--g-fill-accent'), fillThird: cssVar('--g-fill-third'),
      grid: cssVar('--g-grid'), axis: cssVar('--g-axis'),
      text: cssVar('--text'), text2: cssVar('--text-2'), bg: cssVar('--surface')
    };
  }

  /* 숫자 표기: 음수는 진짜 빼기 기호(−)로 */
  function fmt(v, digits) {
    if (digits === undefined) digits = 2;
    var s = Math.abs(v) < Math.pow(10, -digits) / 2 ? (0).toFixed(digits) : v.toFixed(digits);
    return s.replace('-', '−');
  }

  function niceStep(range, px, targetPx) {
    var raw = range / Math.max(1, px / (targetPx || 70));
    var mag = Math.pow(10, Math.floor(Math.log10(raw)));
    var n = raw / mag;
    return (n < 1.5 ? 1 : n < 3 ? 2 : n < 7 ? 5 : 10) * mag;
  }

  function Plot(canvas, opts) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.o = Object.assign({
      xMin: -5, xMax: 5, yMin: -5, yMax: 5,
      aspect: 0.7, maxHeight: 520, minHeight: 220
    }, opts || {});
    this.c = readColors();
    this.render = null;
    this._patterns = {};
    this._lastWidth = 0;
    this._resize();

    var self = this;
    if (window.ResizeObserver) {
      new ResizeObserver(function () { if (self._resize()) self.draw(); }).observe(canvas.parentElement);
    } else {
      window.addEventListener('resize', function () { if (self._resize()) self.draw(); });
    }
    document.addEventListener('settingschange', function () {
      // CSS 변수가 적용된 뒤에 색을 읽는다
      requestAnimationFrame(function () { self.c = readColors(); self._patterns = {}; self._resize(true); self.draw(); });
    });
  }

  Plot.prototype = {
    /* 폭이 바뀌었을 때만 캔버스 크기를 새로 잡는다. 바뀌었으면 true */
    _resize: function (force) {
      var w = this.canvas.parentElement.clientWidth;
      if (!w || (!force && w === this._lastWidth)) return false;
      this._lastWidth = w;
      var h = Math.round(Math.max(this.o.minHeight, Math.min(w * this.o.aspect, this.o.maxHeight)));
      var dpr = window.devicePixelRatio || 1;
      this.canvas.style.height = h + 'px';
      this.canvas.width = Math.round(w * dpr);
      this.canvas.height = Math.round(h * dpr);
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.w = w; this.h = h;
      return true;
    },

    setView: function (v) { Object.assign(this.o, v); return this; },
    draw: function () { if (this.render) this.render(this); },

    /* 좌표 변환: 수학 좌표 → 화면 픽셀 */
    X: function (x) { return (x - this.o.xMin) / (this.o.xMax - this.o.xMin) * this.w; },
    Y: function (y) { return this.h - (y - this.o.yMin) / (this.o.yMax - this.o.yMin) * this.h; },
    /* 화면 픽셀 → 수학 좌표 */
    toX: function (px) { return this.o.xMin + px / this.w * (this.o.xMax - this.o.xMin); },
    toY: function (py) { return this.o.yMin + (this.h - py) / this.h * (this.o.yMax - this.o.yMin); },

    clear: function () {
      var ctx = this.ctx;
      ctx.clearRect(0, 0, this.w, this.h);
      ctx.fillStyle = this.c.bg;
      ctx.fillRect(0, 0, this.w, this.h);
    },

    _stroke: function (s) {
      var ctx = this.ctx;
      ctx.strokeStyle = s.color || this.c.text;
      ctx.lineWidth = s.width || 2;
      ctx.setLineDash(s.dash || []);
      ctx.lineCap = s.cap || (s.dash && s.dash[0] <= 3 ? 'round' : 'butt');
      ctx.lineJoin = 'round';
    },

    grid: function (s) {
      s = s || {};
      var ctx = this.ctx, o = this.o;
      var sx = s.xStep || niceStep(o.xMax - o.xMin, this.w);
      var sy = s.yStep || niceStep(o.yMax - o.yMin, this.h);
      ctx.save();
      ctx.strokeStyle = this.c.grid; ctx.lineWidth = 1; ctx.setLineDash([]);
      ctx.beginPath();
      for (var x = Math.ceil(o.xMin / sx) * sx; x <= o.xMax; x += sx) {
        var px = Math.round(this.X(x)) + 0.5; ctx.moveTo(px, 0); ctx.lineTo(px, this.h);
      }
      for (var y = Math.ceil(o.yMin / sy) * sy; y <= o.yMax; y += sy) {
        var py = Math.round(this.Y(y)) + 0.5; ctx.moveTo(0, py); ctx.lineTo(this.w, py);
      }
      ctx.stroke();
      ctx.restore();
      this._sx = sx; this._sy = sy;
    },

    axes: function (s) {
      s = s || {};
      var ctx = this.ctx, o = this.o, c = this.c;
      var sx = s.xStep || this._sx || niceStep(o.xMax - o.xMin, this.w);
      var sy = s.yStep || this._sy || niceStep(o.yMax - o.yMin, this.h);
      // 축이 화면 밖이면 가장자리에 붙여 그린다
      var ax = Math.min(Math.max(this.X(0), 0), this.w);
      var ay = Math.min(Math.max(this.Y(0), 0), this.h);
      ctx.save();
      ctx.strokeStyle = c.axis; ctx.fillStyle = c.axis; ctx.lineWidth = 1.5; ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(0, ay); ctx.lineTo(this.w, ay);
      ctx.moveTo(ax, 0); ctx.lineTo(ax, this.h);
      ctx.stroke();
      // 화살표
      ctx.beginPath();
      ctx.moveTo(this.w, ay); ctx.lineTo(this.w - 9, ay - 5); ctx.lineTo(this.w - 9, ay + 5);
      ctx.moveTo(ax, 0); ctx.lineTo(ax - 5, 9); ctx.lineTo(ax + 5, 9);
      ctx.fill();

      if (s.ticks !== false) {
        ctx.font = TICK_FONT; ctx.fillStyle = c.text2;
        var digits = sx < 1 ? (sx < 0.1 ? 2 : 1) : 0;
        ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        for (var x = Math.ceil(o.xMin / sx) * sx; x <= o.xMax - sx / 2; x += sx) {
          if (Math.abs(x) < sx / 2) continue;
          var px = this.X(x);
          ctx.fillRect(px - 0.75, ay - 4, 1.5, 8);
          var ty = ay + 6 > this.h - 18 ? ay - 22 : ay + 6;
          ctx.fillText(fmt(x, digits), px, ty);
        }
        digits = sy < 1 ? (sy < 0.1 ? 2 : 1) : 0;
        ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
        for (var y = Math.ceil(o.yMin / sy) * sy; y <= o.yMax - sy / 2; y += sy) {
          if (Math.abs(y) < sy / 2) continue;
          var py = this.Y(y);
          ctx.fillRect(ax - 4, py - 0.75, 8, 1.5);
          if (ax - 8 < 24) { ctx.textAlign = 'left'; ctx.fillText(fmt(y, digits), ax + 8, py); ctx.textAlign = 'right'; }
          else ctx.fillText(fmt(y, digits), ax - 8, py);
        }
        if (this.X(0) >= 0 && this.X(0) <= this.w && this.Y(0) >= 0 && this.Y(0) <= this.h) {
          ctx.textAlign = 'right'; ctx.textBaseline = 'top';
          ctx.fillText('O', ax - 6, ay + 4);
        }
      }
      // 축 이름
      ctx.font = LABEL_FONT; ctx.fillStyle = c.text;
      ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
      ctx.fillText(s.xLabel || 'x', this.w - 4, ay - 6);
      ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.fillText(s.yLabel || 'y', ax + 10, 2);
      ctx.restore();
    },

    /* 함수 그래프. 불연속(값이 크게 튀는 곳)에서는 선을 끊는다 */
    plot: function (f, s) {
      s = s || {};
      var ctx = this.ctx, o = this.o;
      var from = s.from !== undefined ? s.from : o.xMin;
      var to = s.to !== undefined ? s.to : o.xMax;
      var n = s.samples || Math.max(200, Math.round(this.w * 1.5));
      ctx.save();
      this._stroke(Object.assign({ color: this.c.main, width: 3 }, s));
      ctx.beginPath();
      var pen = false, prevPy = 0;
      for (var i = 0; i <= n; i++) {
        var x = from + (to - from) * i / n;
        var y = f(x);
        if (!isFinite(y)) { pen = false; continue; }
        var px = this.X(x), py = this.Y(y);
        if (pen && Math.abs(py - prevPy) > this.h * 1.2) pen = false;
        if (py < -this.h) py = -this.h; else if (py > 2 * this.h) py = 2 * this.h;
        if (pen) ctx.lineTo(px, py); else ctx.moveTo(px, py);
        pen = true; prevPy = py;
      }
      ctx.stroke();
      ctx.restore();
    },

    line: function (x1, y1, x2, y2, s) {
      var ctx = this.ctx;
      ctx.save();
      this._stroke(s || {});
      ctx.beginPath();
      ctx.moveTo(this.X(x1), this.Y(y1));
      ctx.lineTo(this.X(x2), this.Y(y2));
      ctx.stroke();
      ctx.restore();
    },

    /* 점 (x0, y0)를 지나고 기울기가 m인 직선을 화면 끝까지 */
    lineThrough: function (x0, y0, m, s) {
      var o = this.o;
      this.line(o.xMin, y0 + m * (o.xMin - x0), o.xMax, y0 + m * (o.xMax - x0), s);
    },

    vline: function (x, s) { this.line(x, this.o.yMin, x, this.o.yMax, s); },
    hline: function (y, s) { this.line(this.o.xMin, y, this.o.xMax, y, s); },

    /* 점. filled:false 이면 빈 원(그 점의 값이 정의되지 않음) */
    point: function (x, y, s) {
      s = s || {};
      var ctx = this.ctx, r = s.r || 6.5;
      var px = this.X(x), py = this.Y(y);
      ctx.save();
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fillStyle = s.filled === false ? this.c.bg : (s.color || this.c.text);
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = s.filled === false ? (s.color || this.c.text) : this.c.bg;
      ctx.stroke();
      ctx.restore();
      if (s.label) this.label(x, y, s.label, Object.assign({ dx: 10, dy: -12, align: 'left' }, s.labelStyle));
    },

    /* 글자. 배경색 테두리(halo)를 둘러 그래프 위에서도 잘 읽히게 */
    label: function (x, y, text, s) {
      s = s || {};
      var ctx = this.ctx;
      var px = this.X(x) + (s.dx || 0), py = this.Y(y) + (s.dy || 0);
      ctx.save();
      ctx.font = s.font || (s.bold ? LABEL_FONT.replace('600', '800') : LABEL_FONT);
      ctx.textAlign = s.align || 'center';
      ctx.textBaseline = s.baseline || 'middle';
      // 화면 밖으로 나가지 않게
      var tw = ctx.measureText(text).width;
      var left = ctx.textAlign === 'left' ? px : ctx.textAlign === 'right' ? px - tw : px - tw / 2;
      if (left < 4) px += 4 - left;
      if (left + tw > this.w - 4) px -= left + tw - (this.w - 4);
      py = Math.min(Math.max(py, 12), this.h - 12);
      ctx.lineJoin = 'round';
      ctx.lineWidth = 5;
      ctx.strokeStyle = this.c.bg;
      ctx.strokeText(text, px, py);
      ctx.fillStyle = s.color || this.c.text;
      ctx.fillText(text, px, py);
      ctx.restore();
    },

    /* 빗금 무늬: 'h'(가로) 'v'(세로) 'd'(대각선) */
    _pattern: function (color, dir) {
      var key = color + dir;
      if (this._patterns[key]) return this._patterns[key];
      var size = 10, pc = document.createElement('canvas');
      pc.width = pc.height = size;
      var p = pc.getContext('2d');
      p.strokeStyle = color; p.lineWidth = 1.5; p.globalAlpha = 0.55;
      p.beginPath();
      if (dir === 'h') { p.moveTo(0, size / 2); p.lineTo(size, size / 2); }
      else if (dir === 'v') { p.moveTo(size / 2, 0); p.lineTo(size / 2, size); }
      else { p.moveTo(0, size); p.lineTo(size, 0); p.moveTo(-2, 2); p.lineTo(2, -2); p.moveTo(size - 2, size + 2); p.lineTo(size + 2, size - 2); }
      p.stroke();
      return (this._patterns[key] = this.ctx.createPattern(pc, 'repeat'));
    },

    /* 직사각형 (수학 좌표의 두 꼭짓점) */
    rect: function (x0, y0, x1, y1, s) {
      s = s || {};
      var ctx = this.ctx;
      var px = this.X(Math.min(x0, x1)), py = this.Y(Math.max(y0, y1));
      var pw = Math.abs(this.X(x1) - this.X(x0)), ph = Math.abs(this.Y(y1) - this.Y(y0));
      ctx.save();
      if (s.fill) { ctx.fillStyle = s.fill; ctx.fillRect(px, py, pw, ph); }
      if (s.hatch) { ctx.fillStyle = this._pattern(s.hatchColor || s.stroke || this.c.text, s.hatch); ctx.fillRect(px, py, pw, ph); }
      if (s.stroke) { this._stroke({ color: s.stroke, width: s.width || 1.5, dash: s.dash }); ctx.strokeRect(px, py, pw, ph); }
      ctx.restore();
    },

    /* 띠: axis 'y' → 가로 띠 (y = lo ~ hi), axis 'x' → 세로 띠 (x = lo ~ hi) */
    band: function (axis, lo, hi, s) {
      s = s || {};
      var o = this.o;
      if (axis === 'y') this.rect(o.xMin, lo, o.xMax, hi, s);
      else this.rect(lo, o.yMin, hi, o.yMax, s);
      if (s.edges !== false && s.stroke) {
        var e = { color: s.stroke, width: 1.5, dash: s.edgeDash || [6, 4] };
        if (axis === 'y') { this.hline(lo, e); this.hline(hi, e); }
        else { this.vline(lo, e); this.vline(hi, e); }
      }
    },

    /* 다각형: pts = [[x, y], ...] (수학 좌표) */
    polygon: function (pts, s) {
      s = s || {};
      var ctx = this.ctx, self = this;
      ctx.save();
      ctx.beginPath();
      pts.forEach(function (p, i) { if (i) ctx.lineTo(self.X(p[0]), self.Y(p[1])); else ctx.moveTo(self.X(p[0]), self.Y(p[1])); });
      if (s.close !== false) ctx.closePath();
      if (s.fill) { ctx.fillStyle = s.fill; ctx.fill(); }
      if (s.hatch) { ctx.fillStyle = this._pattern(s.hatchColor || this.c.text, s.hatch); ctx.fill(); }
      if (s.stroke) { this._stroke({ color: s.stroke, width: s.width || 2, dash: s.dash }); ctx.stroke(); }
      ctx.restore();
    },

    /* 곡선과 x축 사이 영역 (a ~ b) */
    area: function (f, a, b, s) {
      s = s || {};
      var ctx = this.ctx, n = s.samples || 200;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(this.X(a), this.Y(0));
      for (var i = 0; i <= n; i++) { var x = a + (b - a) * i / n; ctx.lineTo(this.X(x), this.Y(f(x))); }
      ctx.lineTo(this.X(b), this.Y(0));
      ctx.closePath();
      if (s.fill) { ctx.fillStyle = s.fill; ctx.fill(); }
      if (s.hatch) { ctx.fillStyle = this._pattern(s.hatchColor || this.c.text, s.hatch); ctx.fill(); }
      ctx.restore();
    }
  };

  /* 슬라이더 ↔ 숫자 표시 연결. 값은 항상 옆에 숫자로 보인다 */
  function bindSlider(input, output, opt) {
    opt = opt || {};
    function update() {
      var v = parseFloat(input.value);
      var text = opt.format ? opt.format(v) : String(v);
      if (output) output.textContent = text;
      input.setAttribute('aria-valuetext', (opt.speak ? opt.speak(v) : text));
      if (opt.onInput) opt.onInput(v);
    }
    input.addEventListener('input', update);
    update();
    return update;
  }

  /* ▶ 자동 재생. reverse:true 이면 큰 값 → 작은 값 (예: h → 0, ε 줄이기) */
  function player(opt) {
    var button = opt.button, input = opt.input;
    var duration = opt.duration || 5000;
    var min = parseFloat(input.min), max = parseFloat(input.max), span = max - min;
    var raf = null, last = 0, pos = 0;

    function label(on) {
      var text = window.I18N ? I18N.t(on ? 'pause' : 'play') : (on ? '일시 정지' : '자동 재생');
      button.setAttribute('aria-pressed', on ? 'true' : 'false');
      button.setAttribute('aria-label', text);
      var icon = button.querySelector('.play-icon'), txt = button.querySelector('.play-text');
      if (icon) icon.textContent = on ? '⏸' : '▶';
      if (txt) txt.textContent = text;
    }

    function frame(ts) {
      if (!raf) return;
      if (!last) last = ts;
      var d = span * (ts - last) / duration;
      last = ts;
      pos += opt.reverse ? -d : d;
      var done = false;
      if (pos > max) { if (opt.loop) pos = min; else { pos = max; done = true; } }
      if (pos < min) { if (opt.loop) pos = max; else { pos = min; done = true; } }
      input.value = pos;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      if (done) stop(); else raf = requestAnimationFrame(frame);
    }

    function start() {
      // 슬라이더 범위가 바뀌었을 수 있으니 시작할 때마다 다시 읽는다
      min = parseFloat(input.min); max = parseFloat(input.max); span = max - min;
      pos = parseFloat(input.value);
      // 끝까지 가 있으면 처음부터
      if (!opt.reverse && pos >= max) pos = min;
      if (opt.reverse && pos <= min) pos = max;
      if (opt.from !== undefined && opt.restartFromStart) pos = opt.from;
      last = 0;
      raf = requestAnimationFrame(frame);
      label(true);
    }

    function stop() {
      if (raf) cancelAnimationFrame(raf);
      raf = null;
      label(false);
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }

    button.addEventListener('click', function () { if (raf) stop(); else start(); });
    // 손으로 슬라이더를 잡으면 자동 재생을 멈춘다
    input.addEventListener('pointerdown', function () { if (raf) stop(); });
    input.addEventListener('keydown', function () { if (raf) stop(); });
    document.addEventListener('settingschange', function () { label(!!raf); });
    label(false);
    return { start: start, stop: stop, isPlaying: function () { return !!raf; } };
  }

  window.Graph = {
    create: function (canvas, opts) { return new Plot(canvas, opts); },
    bindSlider: bindSlider,
    player: player,
    fmt: fmt,
    colors: readColors,
    reducedMotion: function () {
      return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
  };
})();
