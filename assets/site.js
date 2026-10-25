/* The OSI Company site script, shared by every page. Load with <script src="assets/site.js" defer>.
   1) Top bar: Contents + pinned links (data-pin on nav.index) + a Sections menu.
   2) Review-page widgets, each only if its element exists: flashcards + glossary (from a global
      TERMS array), quiz (from a global QUIZ array), and the back-to-top button. */
  /* Top bar: keep Contents and the pinned links (data-pin on the nav) in the bar, put the rest in a
     Sections menu, and keep anchor jumps clear of the sticky bar */
  (function(){
    function pad(){
      var n = document.querySelector('nav.index');
      var sticky = n && getComputedStyle(n).position === 'sticky';
      document.documentElement.style.scrollPaddingTop = sticky ? (n.offsetHeight + 8) + 'px' : '';
    }
    function build(){
      var nav = document.querySelector('nav.index');
      if (!nav) return;
      var wrap = nav.querySelector('.wrap') || nav;
      var links = [].slice.call(wrap.querySelectorAll(':scope > a'));
      var rest = links.filter(function(a){ return !a.classList.contains('toc-link'); });
      var want = (nav.getAttribute('data-pin') || '').split(/\s+/).filter(Boolean);
      var pinned = want.map(function(h){ return rest.filter(function(a){ return a.getAttribute('href') === h; })[0]; }).filter(Boolean);
      if (!pinned.length) pinned = rest.slice(0, 2);
      var more = rest.filter(function(a){ return pinned.indexOf(a) < 0; });
      if (!more.length) return;
      var btn = document.createElement('button');
      btn.type = 'button'; btn.className = 'menu-btn'; btn.textContent = '\u2630 Sections';
      btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-controls', 'navMenu');
      var panel = document.createElement('div');
      panel.id = 'navMenu'; panel.className = 'nav-menu'; panel.hidden = true;
      more.forEach(function(a){ panel.appendChild(a); });
      pinned.forEach(function(a){ wrap.appendChild(a); });
      wrap.appendChild(btn); wrap.appendChild(panel);
      nav.classList.add('has-menu');
      btn.style.fontSize = getComputedStyle(pinned[0] || more[0]).fontSize;
      function set(open){ panel.hidden = !open; btn.setAttribute('aria-expanded', open ? 'true' : 'false'); }
      btn.addEventListener('click', function(e){ e.stopPropagation(); set(panel.hidden); });
      panel.addEventListener('click', function(e){ if (e.target.closest('a')) set(false); });
      document.addEventListener('click', function(e){ if (!panel.hidden && !nav.contains(e.target)) set(false); });
      document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && !panel.hidden){ set(false); btn.focus(); } });
    }
    document.addEventListener('DOMContentLoaded', function(){ build(); pad(); });
    window.addEventListener('resize', pad);
  })();

(function(){
  /* ---- flashcards ---- */
  const grid = document.getElementById('cardGrid');
  if (grid && typeof TERMS !== 'undefined') {
    TERMS.forEach((item, i) => {
      const card = document.createElement('button');
      card.className = 'flashcard';
      card.setAttribute('aria-label', 'Flashcard: ' + item.t + '. Press to flip.');
      card.dataset.i = i;
      card.innerHTML = `
        <div class="flashcard-inner">
          <div class="flashcard-face front"><div class="lbl">Term</div><div class="term">${item.t}</div></div>
          <div class="flashcard-face back"><div class="lbl">Definition</div><div class="def">${item.d}</div></div>
        </div>`;
      card.addEventListener('click', () => card.classList.toggle('flipped'));
      card.addEventListener('dblclick', () => { card.classList.toggle('known'); updateProgress(); });
      grid.appendChild(card);
    });
    function updateProgress(){
      const known = document.querySelectorAll('.flashcard.known').length;
      document.getElementById('cardProgress').textContent = `${known} / ${TERMS.length} marked known (double-click a card to mark it)`;
    }
    updateProgress();
    document.getElementById('shuffleBtn').addEventListener('click', () => {
      const cards = Array.from(grid.children);
      cards.sort(() => Math.random() - 0.5);
      cards.forEach(c => { c.classList.remove('flipped'); grid.appendChild(c); });
    });
    document.getElementById('resetKnownBtn').addEventListener('click', () => {
      document.querySelectorAll('.flashcard.known').forEach(c => c.classList.remove('known'));
      updateProgress();
    });
  }

  /* ---- quiz ---- */
  const quizList = document.getElementById('quizList');
  if (quizList && typeof QUIZ !== 'undefined') {
    let score = 0, answered = 0;
    function renderQuiz(){
      quizList.innerHTML = ''; score = 0; answered = 0;
      QUIZ.forEach((item, qi) => {
        const box = document.createElement('div');
        box.className = 'quiz-q';
        box.innerHTML = `<p class="qtext"><span class="qnum">Q${qi+1}.</span>${item.q}</p><div class="choices"></div><p class="explain"></p>`;
        const choicesEl = box.querySelector('.choices');
        item.choices.forEach((c, ci) => {
          const b = document.createElement('button');
          b.className = 'choice'; b.textContent = c;
          b.addEventListener('click', () => {
            if (box.dataset.done) return;
            box.dataset.done = '1'; answered++;
            if (ci === item.correct) score++;
            Array.from(choicesEl.children).forEach((el, ei) => {
              el.disabled = true;
              if (ei === item.correct) el.classList.add('correct');
              else if (ei === ci) el.classList.add('incorrect');
            });
            box.querySelector('.explain').textContent = item.explain;
            box.querySelector('.explain').classList.add('show');
            updateScore();
          });
          choicesEl.appendChild(b);
        });
        quizList.appendChild(box);
      });
      updateScore();
    }
    function updateScore(){
      document.getElementById('quizScore').textContent =
        answered === 0 ? `${QUIZ.length} questions — click an answer to check yourself` : `Score: ${score} / ${answered} answered`;
    }
    renderQuiz();
    document.getElementById('resetQuizBtn').addEventListener('click', renderQuiz);
  }

  /* ---- glossary ---- */
  const glossaryList = document.getElementById('glossaryList');
  const alphaNav = document.getElementById('alphaNav');
  if (glossaryList && alphaNav && typeof TERMS !== 'undefined') {
    const letters = [...new Set(TERMS.map(t => t.t[0].toUpperCase()))];
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach(L => {
      const a = document.createElement('a');
      a.textContent = L;
      if (letters.includes(L)) { a.href = '#g-' + L; a.className = 'has'; }
      else { a.href = 'javascript:void(0)'; }
      alphaNav.appendChild(a);
    });
    let currentLetter = '';
    TERMS.forEach(item => {
      const L = item.t[0].toUpperCase();
      if (L !== currentLetter) {
        currentLetter = L;
        const h = document.createElement('div');
        h.className = 'glossary-letter'; h.id = 'g-' + L; h.textContent = L;
        glossaryList.appendChild(h);
      }
      const wrap = document.createElement('div');
      wrap.className = 'gitem';
      wrap.innerHTML = `<dt>${item.t}</dt><dd>${item.d}</dd>`;
      wrap.dataset.search = (item.t + ' ' + item.d).toLowerCase();
      glossaryList.appendChild(wrap);
    });
    document.getElementById('glossarySearch').addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      document.querySelectorAll('.gitem').forEach(el => {
        el.classList.toggle('hidden', q && !el.dataset.search.includes(q));
      });
    });
  }

  /* ---- back to top ---- */
  const backToTop = document.getElementById('backToTop');
  if (backToTop) {
    function toggleBackToTop(){ backToTop.classList.toggle('show', window.scrollY > 480); }
    window.addEventListener('scroll', toggleBackToTop, {passive:true});
    toggleBackToTop();
    backToTop.addEventListener('click', () => window.scrollTo({top:0, behavior:'smooth'}));
  }
})();
