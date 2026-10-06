(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isTouch = window.matchMedia("(hover: none)").matches;

  document.getElementById("year").textContent = new Date().getFullYear();

  /* ---------- Neural-network particle background ---------- */
  const canvas = document.getElementById("network");
  const ctx = canvas.getContext("2d");
  let w, h, dpr, nodes = [];
  const mouse = { x: -9999, y: -9999 };

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.width = innerWidth * dpr;
    h = canvas.height = innerHeight * dpr;
    const count = Math.min(110, Math.floor((innerWidth * innerHeight) / 14000));
    nodes = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.3 * dpr,
      vy: (Math.random() - 0.5) * 0.3 * dpr,
      r: (Math.random() * 1.5 + 0.5) * dpr,
    }));
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    // Parallax: shift the field as the page scrolls
    const offset = (scrollY * 0.15 * dpr) % h;
    const linkDist = 130 * dpr;

    for (const n of nodes) {
      n.x += n.vx; n.y += n.vy;
      if (n.x < 0 || n.x > w) n.vx *= -1;
      if (n.y < 0 || n.y > h) n.vy *= -1;
    }
    const pos = nodes.map(n => ({ x: n.x, y: (n.y - offset + h) % h, r: n.r }));

    for (let i = 0; i < pos.length; i++) {
      const a = pos[i];
      for (let j = i + 1; j < pos.length; j++) {
        const b = pos[j];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < linkDist) {
          ctx.strokeStyle = `rgba(108,140,255,${(1 - d / linkDist) * 0.25})`;
          ctx.lineWidth = dpr * 0.6;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
      const md = Math.hypot(a.x - mouse.x * dpr, a.y - mouse.y * dpr);
      if (md < linkDist * 1.4) {
        ctx.strokeStyle = `rgba(57,243,187,${(1 - md / (linkDist * 1.4)) * 0.6})`;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouse.x * dpr, mouse.y * dpr); ctx.stroke();
      }
      ctx.fillStyle = md < linkDist * 1.4 ? "#39f3bb" : "rgba(200,211,255,0.6)";
      ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2); ctx.fill();
    }
    if (!reduceMotion) requestAnimationFrame(draw);
  }

  resize();
  draw();
  addEventListener("resize", resize);

  /* ---------- Cursor glow ---------- */
  const glow = document.querySelector(".cursor-glow");
  addEventListener("pointermove", e => {
    mouse.x = e.clientX; mouse.y = e.clientY;
    if (!isTouch) { glow.style.left = e.clientX + "px"; glow.style.top = e.clientY + "px"; }
  });

  /* ---------- Typing effect ---------- */
  const roles = [
    "lead_software_engineer --ai-platforms",
    "build agents && rag_pipelines",
    "design mcp_servers --secure",
    "enforce least_privilege --audit",
  ];
  const typed = document.getElementById("typed");
  if (reduceMotion) {
    typed.textContent = roles[0];
  } else {
    let r = 0, c = 0, deleting = false;
    (function tick() {
      const word = roles[r];
      typed.textContent = word.slice(0, c);
      if (!deleting && c < word.length) c++;
      else if (deleting && c > 0) c--;
      else if (!deleting) { deleting = true; return setTimeout(tick, 1600); }
      else { deleting = false; r = (r + 1) % roles.length; }
      setTimeout(tick, deleting ? 30 : 60);
    })();
  }

  /* ---------- Scroll reveal (staggered within each parent) ---------- */
  const reveals = document.querySelectorAll(".reveal");
  const groups = new Map();
  reveals.forEach(el => {
    const p = el.parentElement;
    const i = groups.get(p) || 0;
    el.style.setProperty("--d", `${Math.min(i, 6) * 0.08}s`);
    groups.set(p, i + 1);
  });

  const counted = new WeakSet();
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("in");
      entry.target.querySelectorAll("[data-count]").forEach(countUp);
      if (entry.target.id === "terminal-wrap" || entry.target.classList.contains("terminal")) runTerminal();
      io.unobserve(entry.target);
    });
  }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
  reveals.forEach(el => io.observe(el));

  function countUp(el) {
    if (counted.has(el)) return;
    counted.add(el);
    const target = +el.dataset.count;
    const pre = el.dataset.prefix || "", suf = el.dataset.suffix || "";
    if (reduceMotion) { el.textContent = pre + target + suf; return; }
    const start = performance.now(), dur = 1400;
    (function step(t) {
      const p = Math.min((t - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = pre + Math.round(target * eased) + suf;
      if (p < 1) requestAnimationFrame(step);
    })(start);
  }

  /* ---------- Scroll-driven: progress bar, nav, timeline fill, active link ---------- */
  const bar = document.getElementById("progress-bar");
  const nav = document.querySelector(".nav");
  const timeline = document.querySelector(".timeline");
  const fill = document.getElementById("timeline-fill");
  const navLinks = [...document.querySelectorAll("[data-nav]")];
  const sections = navLinks.map(a => document.querySelector(a.getAttribute("href")));

  function onScroll() {
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
    nav.classList.toggle("scrolled", scrollY > 40);

    const rect = timeline.getBoundingClientRect();
    const progress = (innerHeight * 0.6 - rect.top) / rect.height;
    fill.style.transform = `scaleY(${Math.max(0, Math.min(1, progress))})`;

    let current = -1;
    sections.forEach((s, i) => { if (s.getBoundingClientRect().top < innerHeight * 0.4) current = i; });
    navLinks.forEach((a, i) => a.classList.toggle("active", i === current));

    if (reduceMotion) draw();
  }
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- 3D tilt + spotlight on cards ---------- */
  if (!isTouch && !reduceMotion) {
    document.querySelectorAll(".tilt").forEach(card => {
      card.addEventListener("pointermove", e => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        card.style.setProperty("--mx", `${x * 100}%`);
        card.style.setProperty("--my", `${y * 100}%`);
        card.style.transform = `perspective(800px) rotateY(${(x - 0.5) * 8}deg) rotateX(${(0.5 - y) * 8}deg)`;
      });
      card.addEventListener("pointerleave", () => {
        card.style.transform = "";
      });
    });
  }

  /* ---------- Terminal typing in contact section ---------- */
  let terminalStarted = false;
  function runTerminal() {
    if (terminalStarted) return;
    terminalStarted = true;
    const body = document.getElementById("terminal-body");
    const lines = [
      ['<span class="c">➜</span> <span class="k">~</span> whoami', 400],
      ["irvin lin lijie — lead software engineer", 200],
      ['<span class="c">➜</span> <span class="k">~</span> cat focus.txt', 400],
      ["ai agents · rag · mcp · security & data governance", 200],
      ['<span class="c">➜</span> <span class="k">~</span> echo $LOCATION', 400],
      ["singapore 🇸🇬", 200],
      ['<span class="c">➜</span> <span class="k">~</span> ./say_hello.sh', 400],
      ["open to conversations — drop me a line ↓", 0],
    ];
    if (reduceMotion) { body.innerHTML = lines.map(l => l[0]).join("\n"); return; }
    let i = 0;
    (function next() {
      if (i >= lines.length) return;
      body.innerHTML += (i ? "\n" : "") + lines[i][0];
      setTimeout(next, lines[i++][1] + 250);
    })();
  }
})();
