(() => {
  'use strict';

  const projects = window.PORTFOLIO_PROJECTS || [];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;

  const escapeHtml = value => String(value).replace(/[&<>'"]/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[char]));

  function renderFeatured() {
    const host = document.getElementById('featuredProjects');
    host.innerHTML = projects.filter(project => project.featured).map(project => `
      <article class="featured-case reveal" data-project="${escapeHtml(project.id)}">
        <div class="case-copy">
          <div class="case-number">CASE ${escapeHtml(project.index)}</div>
          <span class="case-platform">${escapeHtml(project.platform)}</span>
          <h3>${escapeHtml(project.title)}</h3>
          <p class="case-impact">${escapeHtml(project.impact)}</p>
          <p class="case-summary">${escapeHtml(project.summary)}</p>
          <p class="case-narrative">${escapeHtml(project.narrative)}</p>
          <div class="case-meta">${project.tags.map(tag => `<span>${escapeHtml(tag)}</span>`).join('')}</div>
          <a class="case-link" href="${escapeHtml(project.url)}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHtml(project.title)} 공식 페이지 열기">프로젝트 열기 <b>↗</b></a>
        </div>
        <a class="case-media" href="${escapeHtml(project.url)}" target="_blank" rel="noopener noreferrer" tabindex="-1" aria-hidden="true">
          <img src="${escapeHtml(project.image)}" alt="" decoding="async">
        </a>
      </article>
    `).join('');
  }

  function renderArchive() {
    const host = document.getElementById('projectGrid');
    host.innerHTML = projects.map((project, index) => `
      <a class="project-card reveal" data-kind="${escapeHtml(project.kind)}" data-project-id="${escapeHtml(project.id)}" data-collaboration="${project.collaboration ? 'true' : 'false'}" href="${escapeHtml(project.url)}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHtml(project.title)} 프로젝트 열기">
        <div class="project-image"><img src="${escapeHtml(project.image)}" alt="${escapeHtml(project.title)} 대표 이미지" ${index > 2 ? 'loading="lazy"' : ''} decoding="async"></div>
        <div class="project-copy">
          <div class="project-topline"><span>${String(index + 1).padStart(2, '0')} / ${escapeHtml(project.platform)}</span><b>${project.collaboration ? 'AI COLLAB' : escapeHtml(project.kind.toUpperCase())}</b></div>
          <h3>${escapeHtml(project.title)}</h3>
          <p>${escapeHtml(project.summary)}</p>
          <div class="project-tags">${project.tags.slice(0, 3).map(tag => `<span>${escapeHtml(tag)}</span>`).join('')}</div>
        </div>
        <span class="project-arrow" aria-hidden="true">↗</span>
      </a>
    `).join('');
    document.getElementById('projectCount').textContent = projects.length;
  }

  renderFeatured();
  renderArchive();
  const publicProjectCount = document.getElementById('publicProjectCount');
  publicProjectCount.dataset.count = projects.length;
  document.getElementById('heroProjectLink').textContent = `${projects.length} PROJECTS`;

  const boot = document.getElementById('bootScreen');
  const bootPercent = document.getElementById('bootPercent');
  const bootStart = performance.now();
  function tickBoot(now) {
    const elapsed = now - bootStart;
    const progress = Math.min(100, Math.round((elapsed / 900) * 100));
    bootPercent.textContent = String(progress).padStart(3, '0');
    if (progress < 100) requestAnimationFrame(tickBoot);
    else setTimeout(() => boot.classList.add('done'), 120);
  }
  if (reduceMotion) {
    bootPercent.textContent = '100';
    boot.classList.add('done');
  } else requestAnimationFrame(tickBoot);

  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  document.querySelectorAll('.reveal').forEach(element => revealObserver.observe(element));

  const header = document.getElementById('siteHeader');
  const progress = document.getElementById('scrollProgress');
  let scrollTicking = false;
  function updateScrollUI() {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - innerHeight;
    header.classList.toggle('scrolled', y > 30);
    progress.style.width = `${max > 0 ? (y / max) * 100 : 0}%`;
    if (!reduceMotion && innerWidth > 800) {
      document.querySelectorAll('.case-media img').forEach(image => {
        const box = image.parentElement.getBoundingClientRect();
        if (box.bottom < 0 || box.top > innerHeight) return;
        const offset = ((box.top + box.height / 2) - innerHeight / 2) / innerHeight;
        if (!image.closest('[data-project="magic-brick"]')) image.style.transform = `translateY(${offset * -18}px) scale(1.12)`;
      });
    }
    scrollTicking = false;
  }
  addEventListener('scroll', () => {
    if (!scrollTicking) {
      scrollTicking = true;
      requestAnimationFrame(updateScrollUI);
    }
  }, { passive: true });
  updateScrollUI();

  const stats = document.querySelector('.hero-stats');
  let counted = false;
  const countObserver = new IntersectionObserver(entries => {
    if (!entries[0].isIntersecting || counted) return;
    counted = true;
    document.querySelectorAll('[data-count]').forEach(element => {
      const target = Number(element.dataset.count);
      if (reduceMotion) {
        element.textContent = target.toLocaleString('ko-KR');
        return;
      }
      const start = performance.now();
      const duration = 1250;
      function frame(now) {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 4);
        element.textContent = Math.round(target * eased).toLocaleString('ko-KR');
        if (t < 1) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    });
  }, { threshold: 0.25 });
  countObserver.observe(stats);

  document.querySelectorAll('.archive-controls button').forEach(button => {
    button.addEventListener('click', () => {
      const filter = button.dataset.filter;
      document.querySelectorAll('.archive-controls button').forEach(item => item.classList.toggle('active', item === button));
      const cards = [...document.querySelectorAll('.project-card')];
      let visible = 0;
      cards.forEach(card => {
        const match = filter === 'all' || card.dataset.kind === filter || (filter === 'ai' && card.dataset.collaboration === 'true');
        card.classList.toggle('filtered-out', !match);
        if (match) visible++;
      });
      document.getElementById('projectCount').textContent = visible;
    });
  });

  const canvas = document.getElementById('ambientCanvas');
  const ctx = canvas.getContext('2d');
  let particles = [];
  let pointer = { x: -9999, y: -9999 };
  let canvasWidth = 0;
  let canvasHeight = 0;
  let animationFrame = 0;

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    canvasWidth = rect.width;
    canvasHeight = rect.height;
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.max(18, Math.min(52, Math.round(rect.width / 28)));
    particles = Array.from({ length: count }, (_, index) => ({
      x: (index / count) * rect.width + Math.random() * 60,
      y: Math.random() * rect.height,
      vx: (Math.random() - .5) * .16,
      vy: (Math.random() - .5) * .16,
      r: Math.random() * 1.5 + .4
    }));
  }

  function drawAmbient() {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    particles.forEach((particle, index) => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      if (particle.x < -20) particle.x = canvasWidth + 20;
      if (particle.x > canvasWidth + 20) particle.x = -20;
      if (particle.y < -20) particle.y = canvasHeight + 20;
      if (particle.y > canvasHeight + 20) particle.y = -20;
      const pointerDistance = Math.hypot(particle.x - pointer.x, particle.y - pointer.y);
      if (pointerDistance < 145) {
        ctx.strokeStyle = `rgba(185,255,90,${(1 - pointerDistance / 145) * .32})`;
        ctx.beginPath(); ctx.moveTo(particle.x, particle.y); ctx.lineTo(pointer.x, pointer.y); ctx.stroke();
      }
      for (let j = index + 1; j < particles.length; j++) {
        const other = particles[j];
        const distance = Math.hypot(particle.x - other.x, particle.y - other.y);
        if (distance < 112) {
          ctx.strokeStyle = `rgba(190,205,220,${(1 - distance / 112) * .09})`;
          ctx.beginPath(); ctx.moveTo(particle.x, particle.y); ctx.lineTo(other.x, other.y); ctx.stroke();
        }
      }
      ctx.fillStyle = index % 9 === 0 ? '#b9ff5a' : 'rgba(220,228,235,.48)';
      ctx.beginPath(); ctx.arc(particle.x, particle.y, particle.r, 0, Math.PI * 2); ctx.fill();
    });
    if (!document.hidden && !reduceMotion) animationFrame = requestAnimationFrame(drawAmbient);
  }

  resizeCanvas();
  if (reduceMotion) drawAmbient(); else drawAmbient();
  addEventListener('resize', resizeCanvas, { passive: true });
  canvas.parentElement.addEventListener('pointermove', event => {
    const rect = canvas.getBoundingClientRect();
    pointer.x = event.clientX - rect.left;
    pointer.y = event.clientY - rect.top;
  }, { passive: true });
  canvas.parentElement.addEventListener('pointerleave', () => { pointer = { x: -9999, y: -9999 }; });
  document.addEventListener('visibilitychange', () => {
    cancelAnimationFrame(animationFrame);
    if (!document.hidden && !reduceMotion) drawAmbient();
  });

  if (finePointer && !reduceMotion) {
    const glow = document.getElementById('cursorGlow');
    addEventListener('pointermove', event => {
      glow.style.left = `${event.clientX}px`;
      glow.style.top = `${event.clientY}px`;
      glow.style.opacity = '1';
    }, { passive: true });
    document.querySelectorAll('.magnetic').forEach(element => {
      element.addEventListener('pointermove', event => {
        const rect = element.getBoundingClientRect();
        element.style.transform = `translate(${(event.clientX - rect.left - rect.width / 2) * .08}px,${(event.clientY - rect.top - rect.height / 2) * .12}px)`;
      });
      element.addEventListener('pointerleave', () => { element.style.transform = ''; });
    });
  }

  document.getElementById('currentYear').textContent = new Date().getFullYear();
})();
