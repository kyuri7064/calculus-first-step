/* 미적분학 첫걸음 — 전체 단원 데이터 (교과서 『미적분학 첫걸음』 목차 기준)
   page : 교과서에서 그 중단원이 시작하는 쪽
   ready: true 인 소단원만 내용이 완성된 것. 나머지는 "준비 중"으로 표시된다.
   rigor: true 이면 B 페이지(엄밀한 정의 놀이터)와 연결된다. */
window.CURRICULUM = [
  {
    id: 1, num: 'Ⅰ', href: 'unit1.html',
    title: { ko: '수열과 함수', en: 'Sequences and Functions' },
    chapters: [
      { id: '01', page: 10,
        title: { ko: '수열의 극한', en: 'Limits of Sequences' },
        intro: { ko: '항이 끝없이 이어질 때 수열은 어디로 갈까? 수렴과 발산, 극한값 계산을 배워요.',
                 en: 'Where does a sequence go as its terms go on forever? Learn convergence, divergence and computing limits.' },
        sections: [
          { ko: '수열의 수렴과 발산', en: 'Convergence and Divergence of Sequences', ready: true },
          { ko: '수열의 극한값 계산', en: 'Computing Limits of Sequences', ready: true },
          { ko: '등비수열의 극한', en: 'Limits of Geometric Sequences', ready: true },
          { ko: '수열의 극한의 엄밀한 정의', en: 'Rigorous Definition of the Limit of a Sequence', rigor: 'seq-limit', ready: true }
        ]},
      { id: '02', page: 24,
        title: { ko: '무한급수의 수렴과 발산', en: 'Convergence and Divergence of Infinite Series' },
        intro: { ko: '무한히 많은 수를 더해도 값이 정해질 수 있을까? 무한급수와 무한등비급수를 다뤄요.',
                 en: 'Can adding infinitely many numbers give a finite value? Explore infinite series and geometric series.' },
        sections: [
          { ko: '무한급수의 뜻', en: 'What Is an Infinite Series?', ready: true },
          { ko: '무한등비급수', en: 'Infinite Geometric Series', ready: true },
          { ko: '무한급수의 수렴 판정법', en: 'Convergence Tests for Series', ready: true }
        ]},
      { id: '03', page: 34,
        title: { ko: '함수의 극한', en: 'Limits of Functions' },
        intro: { ko: 'x가 a에 가까워질 때 f(x)는 어디에 가까워질까? 함수의 극한과 그 엄밀한 정의를 배워요.',
                 en: 'As x approaches a, what does f(x) approach? Learn limits of functions and their rigorous definition.' },
        sections: [
          { ko: '함수의 수렴과 발산', en: 'Convergence and Divergence of Functions', ready: true },
          { ko: '함수의 극한값 계산', en: 'Computing Limits of Functions', ready: true },
          { ko: '함수의 극한의 엄밀한 정의', en: 'Rigorous Definition of the Limit of a Function', rigor: 'func-limit', ready: true }
        ]},
      { id: '04', page: 48,
        title: { ko: '연속의 개념', en: 'Continuity' },
        intro: { ko: '그래프가 끊어지지 않는다는 것을 수학적으로 정의하고, 연속함수의 성질을 살펴봐요.',
                 en: 'Define "a graph with no breaks" mathematically and study the properties of continuous functions.' },
        sections: [
          { ko: '함수의 연속', en: 'Continuity of Functions', ready: true },
          { ko: '연속함수의 성질', en: 'Properties of Continuous Functions', ready: true },
          { ko: '역함수와 합성함수', en: 'Inverse and Composite Functions', ready: true },
          { ko: '연속성의 엄밀한 정의', en: 'Rigorous Definition of Continuity', rigor: 'continuity', ready: true }
        ]}
    ]
  },
  {
    id: 2, num: 'Ⅱ', href: 'unit2.html',
    title: { ko: '미분과 도함수', en: 'Differentiation and Derivatives' },
    chapters: [
      { id: '05', page: 60,
        title: { ko: '미분과 도함수', en: 'Differentiation and Derivatives' },
        intro: { ko: '한 점에서의 순간 변화율인 미분계수와, 그것을 모든 점에서 모은 도함수를 배워요.',
                 en: 'Learn the derivative at a point (the instantaneous rate of change) and the derivative function.' },
        sections: [
          { ko: '미분계수', en: 'The Derivative at a Point', ready: true },
          { ko: '도함수', en: 'The Derivative Function', ready: true },
          { ko: '이계도함수', en: 'The Second Derivative', ready: true }
        ]},
      { id: '06', page: 72,
        title: { ko: '여러 가지 미분법', en: 'Techniques of Differentiation' },
        intro: { ko: '합성함수, 역함수, 음함수, 매개변수로 나타낸 함수를 미분하는 방법을 익혀요.',
                 en: 'Master differentiating composite, inverse, implicit and parametric functions.' },
        sections: [
          { ko: '합성함수의 미분법', en: 'The Chain Rule', ready: true },
          { ko: '역함수와 음함수의 미분법', en: 'Differentiating Inverse and Implicit Functions', ready: true },
          { ko: '매개변수로 나타낸 함수의 미분법', en: 'Differentiating Parametric Functions', ready: true }
        ]},
      { id: '07', page: 82,
        title: { ko: '다양한 함수의 도함수', en: 'Derivatives of Various Functions' },
        intro: { ko: '지수함수, 로그함수, 삼각함수의 도함수를 구해요.',
                 en: 'Find the derivatives of exponential, logarithmic and trigonometric functions.' },
        sections: [
          { ko: '지수함수와 로그함수', en: 'Exponential and Logarithmic Functions', ready: true },
          { ko: '삼각함수', en: 'Trigonometric Functions', ready: true }
        ]},
      { id: '08', page: 98,
        title: { ko: '함수의 그래프', en: 'Graphs of Functions' },
        intro: { ko: '도함수로 그래프의 증가와 감소, 극값, 오목과 볼록, 점근선을 읽어 내요.',
                 en: 'Use derivatives to read increase and decrease, extrema, concavity and asymptotes from a graph.' },
        sections: [
          { ko: '평균값 정리', en: 'The Mean Value Theorem', ready: true },
          { ko: '함수의 극값', en: 'Local Extrema', ready: true },
          { ko: '그래프의 오목과 볼록', en: 'Concavity', ready: true },
          { ko: '그래프의 점근선', en: 'Asymptotes', ready: true },
          { ko: '함수의 그래프의 개형', en: 'Sketching Graphs', ready: true }
        ]},
      { id: '09', page: 112,
        title: { ko: '도함수의 활용', en: 'Applications of Derivatives' },
        intro: { ko: '방정식과 부등식, 속도, 근사, 최적화, 연계변화율 등 실제 문제에 미분을 써 봐요.',
                 en: 'Apply derivatives to equations, motion, approximation, optimization and related rates.' },
        sections: [
          { ko: '방정식과 부등식', en: 'Equations and Inequalities', ready: true },
          { ko: '속도와 가속도', en: 'Velocity and Acceleration', ready: true },
          { ko: '일차근사함수', en: 'Linear Approximation', ready: true },
          { ko: '로피탈의 법칙', en: "L'Hôpital's Rule", ready: true },
          { ko: '최적화 문제', en: 'Optimization Problems', ready: true },
          { ko: '연계변화율', en: 'Related Rates' }
        ]}
    ]
  },
  {
    id: 3, num: 'Ⅲ', href: 'unit3.html',
    title: { ko: '적분', en: 'Integration' },
    chapters: [
      { id: '10', page: 128,
        title: { ko: '역도함수와 부정적분', en: 'Antiderivatives and Indefinite Integrals' },
        intro: { ko: '미분을 거꾸로 하는 역도함수와 부정적분, 그리고 간단한 미분방정식을 배워요.',
                 en: 'Learn antiderivatives (differentiation in reverse), indefinite integrals and simple differential equations.' },
        sections: [
          { ko: '역도함수와 부정적분', en: 'Antiderivatives and Indefinite Integrals' },
          { ko: '여러 가지 함수의 부정적분', en: 'Indefinite Integrals of Various Functions' },
          { ko: '미분방정식과 초깃값 문제', en: 'Differential Equations and Initial Value Problems' }
        ]},
      { id: '11', page: 138,
        title: { ko: '정적분의 정의와 기본 성질', en: 'Definition and Properties of the Definite Integral' },
        intro: { ko: '잘게 나눈 직사각형 넓이의 합(리만 합)의 극한으로 정적분을 정의해요.',
                 en: 'Define the definite integral as the limit of Riemann sums of thin rectangles.' },
        sections: [
          { ko: '정적분의 정의', en: 'Definition of the Definite Integral', ready: true },
          { ko: '정적분의 성질', en: 'Properties of the Definite Integral' }
        ]},
      { id: '12', page: 146,
        title: { ko: '미적분학의 기본정리', en: 'The Fundamental Theorem of Calculus' },
        intro: { ko: '미분과 적분을 하나로 잇는 기본정리와, 부분적분법·치환적분법을 배워요.',
                 en: 'The theorem that links derivatives and integrals, plus integration by parts and substitution.' },
        sections: [
          { ko: '미적분학의 기본정리', en: 'The Fundamental Theorem of Calculus' },
          { ko: '부분적분법', en: 'Integration by Parts' },
          { ko: '치환적분법', en: 'Integration by Substitution' }
        ]},
      { id: '13', page: 158,
        title: { ko: '여러 가지 적분법', en: 'Techniques of Integration' },
        intro: { ko: '지수함수, 로그함수, 삼각함수, 유리함수의 적분과 이상적분을 다뤄요.',
                 en: 'Integrate exponential, logarithmic, trigonometric and rational functions, and handle improper integrals.' },
        sections: [
          { ko: '지수함수와 로그함수의 적분', en: 'Integrals of Exponential and Logarithmic Functions' },
          { ko: '삼각함수의 적분', en: 'Integrals of Trigonometric Functions' },
          { ko: '삼각함수의 곱의 적분', en: 'Integrals of Products of Trigonometric Functions' },
          { ko: '유리함수의 적분', en: 'Integrals of Rational Functions' },
          { ko: '이상적분', en: 'Improper Integrals' }
        ]},
      { id: '14', page: 170,
        title: { ko: '정적분의 활용', en: 'Applications of the Definite Integral' },
        intro: { ko: '넓이, 부피, 이동 거리를 정적분으로 구해요.',
                 en: 'Use definite integrals to find area, volume and distance traveled.' },
        sections: [
          { ko: '평면도형의 넓이', en: 'Area of Plane Regions' },
          { ko: '입체도형의 부피', en: 'Volume of Solids' },
          { ko: '속도와 거리', en: 'Velocity and Distance' }
        ]}
    ]
  }
];

(function (C) {
  /* 중단원 파일 경로, 소단원 앵커 (예: chapters/ch05.html#s05-1) */
  C.chapterHref = function (chId) { return 'chapters/ch' + chId + '.html'; };
  C.sectionId = function (chId, index) { return 's' + chId + '-' + (index + 1); };

  /* 중단원 번호로 찾기 → { unit, chapter, index(전체 순서) } */
  C.findChapter = function (chId) {
    var n = 0;
    for (var i = 0; i < C.length; i++) {
      for (var j = 0; j < C[i].chapters.length; j++) {
        if (C[i].chapters[j].id === chId) return { unit: C[i], chapter: C[i].chapters[j], index: n };
        n++;
      }
    }
    return null;
  };

  /* 모든 중단원을 순서대로 */
  C.allChapters = function () {
    var list = [];
    C.forEach(function (u) { u.chapters.forEach(function (ch) { list.push({ unit: u, chapter: ch }); }); });
    return list;
  };

  /* 메모 태그용: "u1" / "ch05" / "s05-1" → 이름과 링크 */
  C.describeTag = function (tag, lang) {
    if (!tag) return null;
    var m;
    if ((m = /^u(\d)$/.exec(tag))) {
      var u = C[+m[1] - 1];
      return u ? { label: u.num + '. ' + u.title[lang], href: u.href } : null;
    }
    if ((m = /^ch(\d\d)$/.exec(tag))) {
      var f = C.findChapter(m[1]);
      return f ? { label: f.chapter.id + ' ' + f.chapter.title[lang], href: C.chapterHref(f.chapter.id) } : null;
    }
    if ((m = /^s(\d\d)-(\d+)$/.exec(tag))) {
      var g = C.findChapter(m[1]);
      var s = g && g.chapter.sections[+m[2] - 1];
      return s ? { label: g.chapter.id + '-' + m[2] + ' ' + s[lang], href: C.chapterHref(g.chapter.id) + '#' + tag } : null;
    }
    return null;
  };
})(window.CURRICULUM);
