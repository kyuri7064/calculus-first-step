/* 미적분학 첫걸음 — 이 기기용 프로필(로그인) + 개인 데이터 저장소

   ▸ 지금 방식: 이 브라우저의 localStorage에 프로필별로 따로 저장한다.
     비밀번호가 없는 "정리용" 프로필이다 (같은 컴퓨터의 다른 사람도 열어 볼 수 있음).
   ▸ 나중에 온라인 계정(Firebase 등)으로 바꿀 때는 이 파일만 고치면 된다.
     메모장(memo.js)과 AI 페이지는 Profiles.read / Profiles.write 만 쓰기 때문이다.

   저장 키
     calc-first-step:profiles          → [{ id, name, created }]
     calc-first-step:current-profile   → 로그인한 프로필 id (없으면 게스트)
     게스트 데이터      calc-first-step:<이름>          (예: calc-first-step:memos — 예전 메모와 호환)
     프로필 데이터      calc-first-step:p:<id>:<이름>
*/
(function () {
  'use strict';

  var PREFIX = 'calc-first-step:';
  var LIST = PREFIX + 'profiles';
  var CURRENT = PREFIX + 'current-profile';
  var DATA_NAMES = ['memos', 'ai-history'];   // 프로필마다 따로 보관하는 데이터

  function getJSON(key, fallback) {
    try { var v = JSON.parse(localStorage.getItem(key)); return v === null || v === undefined ? fallback : v; }
    catch (e) { return fallback; }
  }
  function setJSON(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch (e) { return false; }
  }
  function remove(key) { try { localStorage.removeItem(key); } catch (e) { /* 무시 */ } }

  function list() {
    var l = getJSON(LIST, []);
    return Array.isArray(l) ? l.filter(function (p) { return p && typeof p.id === 'string' && typeof p.name === 'string'; }) : [];
  }
  function current() {
    var id = null;
    try { id = localStorage.getItem(CURRENT); } catch (e) { /* 무시 */ }
    var found = null;
    list().forEach(function (p) { if (p.id === id) found = p; });
    return found;   // null 이면 게스트
  }

  function keyFor(name, profile) {
    return profile ? PREFIX + 'p:' + profile.id + ':' + name : PREFIX + name;
  }

  function fire() {
    document.dispatchEvent(new CustomEvent('profilechange', { detail: { profile: current() } }));
  }

  /* 이름 검사: 1~20자, 같은 이름 금지. 문제없으면 null, 있으면 오류 키 */
  function checkName(name) {
    name = (name || '').trim();
    if (!name) return 'profileErrEmpty';
    if (name.length > 20) return 'profileErrLong';
    var lower = name.toLowerCase();
    if (list().some(function (p) { return p.name.toLowerCase() === lower; })) return 'profileErrDup';
    return null;
  }

  window.Profiles = {
    list: list,
    current: current,
    checkName: checkName,

    /* 새 프로필을 만들고 바로 로그인. bringGuestData 이면 게스트 데이터를 옮겨 온다 */
    create: function (name, bringGuestData) {
      var err = checkName(name);
      if (err) return { error: err };
      var p = { id: 'u' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), name: name.trim(), created: Date.now() };
      var l = list(); l.push(p);
      if (!setJSON(LIST, l)) return { error: 'profileErrStorage' };
      if (bringGuestData) {
        DATA_NAMES.forEach(function (n) {
          var v = getJSON(keyFor(n, null), null);
          if (v !== null) { setJSON(keyFor(n, p), v); remove(keyFor(n, null)); }
        });
      }
      try { localStorage.setItem(CURRENT, p.id); } catch (e) { /* 무시 */ }
      fire();
      return { profile: p };
    },

    login: function (id) {
      if (!list().some(function (p) { return p.id === id; })) return false;
      try { localStorage.setItem(CURRENT, id); } catch (e) { return false; }
      fire();
      return true;
    },

    logout: function () { remove(CURRENT); fire(); },

    /* 프로필과 그 프로필의 데이터를 모두 지운다 */
    removeProfile: function (id) {
      var p = null;
      var l = list().filter(function (x) { if (x.id === id) p = x; return x.id !== id; });
      if (!p) return;
      DATA_NAMES.forEach(function (n) { remove(keyFor(n, p)); });
      setJSON(LIST, l);
      var cur = current();
      if (!cur || cur.id === id) remove(CURRENT);
      fire();
    },

    /* 게스트에게 저장된 데이터가 있는지 (프로필을 만들 때 가져올지 묻기 위해) */
    guestHasData: function () {
      return DATA_NAMES.some(function (n) {
        var v = getJSON(keyFor(n, null), null);
        return Array.isArray(v) ? v.length > 0 : v !== null;
      });
    },

    /* ── 지금 로그인한 사람의 데이터 읽기·쓰기 (온라인 계정으로 바꿀 때 이 두 함수를 서버용으로 교체) ── */
    read: function (name, fallback) { return getJSON(keyFor(name, current()), fallback); },
    write: function (name, value) { return setJSON(keyFor(name, current()), value); }
  };
})();
