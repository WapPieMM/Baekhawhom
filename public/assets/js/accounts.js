(() => {
  const FALLBACK_IMAGES = [
    "/assets/images/theme/card_portrait_1.jpg",
    "/assets/images/theme/card_portrait_2.jpg",
    "/assets/images/theme/card_portrait_3.jpg"
  ];

  const cfg = window.SHOP_CONFIG || {};
  const $ = (id) => document.getElementById(id);
  const configured =
    window.supabase &&
    cfg.supabaseUrl &&
    cfg.supabaseAnonKey &&
    !cfg.supabaseUrl.includes("YOUR-PROJECT");
  const db = configured
    ? window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey)
    : null;

  let rows = [];
  let category = "all";
  let status = "available";
  const catName = { chicken_skin: "ไอดีไก่สกิน", normal: "ไอดีปกติ" };
  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
    );

  let scrollRevealObserver = null;

  function observeRevealElements(elements) {
    if (!elements || !elements.length) return;
    const prefersReducedMotion =
      window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      elements.forEach((el) => {
        if (!el) return;
        el.classList.add("reveal-on-scroll", "is-visible");
      });
      return;
    }

    if (!scrollRevealObserver) {
      scrollRevealObserver = new IntersectionObserver(
        (entries, obs) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              obs.unobserve(entry.target);
            }
          });
        },
        {
          root: null,
          rootMargin: "0px 0px -8% 0px",
          threshold: 0.12
        }
      );
    }

    elements.forEach((el) => {
      if (!el) return;
      el.classList.add("reveal-on-scroll");
      scrollRevealObserver.observe(el);
    });
  }

  function initScrollReveal() {
    const targets = [];
    const introCopy = document.querySelector(".intro-copy");
    const introBadge = document.querySelector(".intro-badge");
    const toolbarRow = document.querySelector(".toolbar-row");
    const footerEl = document.querySelector("footer");

    if (introCopy) targets.push(introCopy);
    if (introBadge) {
      introBadge.style.setProperty("--reveal-delay", "90ms");
      targets.push(introBadge);
    }
    if (toolbarRow) {
      toolbarRow.style.setProperty("--reveal-delay", "140ms");
      targets.push(toolbarRow);
    }
    if (footerEl) targets.push(footerEl);

    observeRevealElements(targets);
  }

  function render() {
    const matches = rows.filter(
      (x) => (category === "all" || x.category === category) && x.status === status
    );
    $("availableCount").textContent = rows.filter(
      (x) => (category === "all" || x.category === category) && x.status === "available"
    ).length;
    $("soldCount").textContent = rows.filter(
      (x) => (category === "all" || x.category === category) && x.status === "sold"
    ).length;
    $("resultCount").textContent =
      "แสดง " +
      matches.length +
      " รายการ · " +
      (status === "available" ? "พร้อมขาย" : "ขายแล้ว");

    const gridEl = $("accountGrid");
    gridEl.innerHTML = matches.length
      ? matches
          .map((x, idx) => {
            const fallbackImg = FALLBACK_IMAGES[idx % FALLBACK_IMAGES.length];
            const imgSrc = x.image_url ? esc(x.image_url) : fallbackImg;
            const isSold = x.status === "sold";
            return (
              '<article class="card reveal-on-scroll" style="--reveal-delay: ' +
              (idx % 3) * 85 +
              'ms">' +
              '<div class="card-media">' +
              '<img src="' +
              imgSrc +
              '" alt="' +
              esc(x.title) +
              '" referrerpolicy="no-referrer" loading="lazy" onerror="this.onerror=null;this.src=\'' +
              fallbackImg +
              '\';">' +
              "</div>" +
              '<div class="body">' +
              '<div class="card-meta">' +
              '<span class="state-label ' +
              (isSold ? "sold" : "") +
              '">' +
              (isSold ? "ขายแล้ว" : "พร้อมขาย") +
              "</span>" +
              '<span aria-hidden="true">·</span>' +
              "<span>" +
              (catName[x.category] || "ไอดีปกติ") +
              "</span>" +
              "</div>" +
              "<h2>" +
              esc(x.title) +
              "</h2>" +
              '<p class="description">' +
              esc(x.description || "ไอดีคัดพิเศษ ตรวจสอบความปลอดภัยเรียบร้อย") +
              "</p>" +
              '<div class="bottom">' +
              '<strong class="price">฿ ' +
              Number(x.price || 0).toLocaleString("th-TH") +
              ".-</strong>" +
              '<a class="inquire-link" href="/#contactSection">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>' +
              "ติดต่อสอบถาม</a>" +
              "</div></div></article>"
            );
          })
          .join("")
      : '<p class="empty reveal-on-scroll">ยังไม่มีรายการในหมวดนี้ค่ะ ♡</p>';

    observeRevealElements(Array.from(gridEl.querySelectorAll(".card, .empty")));
  }

  document.querySelectorAll("[data-category]").forEach((b) =>
    b.addEventListener("click", () => {
      category = b.dataset.category;
      document
        .querySelectorAll("[data-category]")
        .forEach((x) => x.classList.toggle("active", x === b));
      render();
    })
  );

  document.querySelectorAll("[data-status]").forEach((b) =>
    b.addEventListener("click", () => {
      status = b.dataset.status;
      document
        .querySelectorAll("[data-status]")
        .forEach((x) => x.classList.toggle("active", x === b));
      render();
    })
  );

  function initBackToTopButton() {
    const btn = document.getElementById("backToTopBtn");
    if (!btn) return;

    const heroSection = document.querySelector(".intro");

    const updateVisibility = () => {
      if (heroSection) {
        const rect = heroSection.getBoundingClientRect();
        btn.classList.toggle("is-visible", rect.bottom <= 76);
      } else {
        btn.classList.toggle("is-visible", window.scrollY > 280);
      }
    };

    if (heroSection && "IntersectionObserver" in window) {
      const heroObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            btn.classList.toggle(
              "is-visible",
              !entry.isIntersecting && entry.boundingClientRect.top < 0
            );
          });
        },
        { root: null, rootMargin: "-76px 0px 0px 0px", threshold: 0 }
      );
      heroObserver.observe(heroSection);
    }

    window.addEventListener("scroll", updateVisibility, { passive: true });
    updateVisibility();

    btn.addEventListener("click", () => {
      const prefersReducedMotion =
        window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({
        top: 0,
        behavior: prefersReducedMotion ? "auto" : "smooth"
      });
    });
  }

  function initCreamyGothicCursor() {
    if (
      !window.matchMedia ||
      window.matchMedia("(hover: none), (pointer: coarse)").matches ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const layer = document.createElement("div");
    layer.className = "gothic-cursor-layer";
    layer.setAttribute("aria-hidden", "true");

    const follower = document.createElement("div");
    follower.className = "gothic-cursor-follower";
    follower.innerHTML = '<div class="gothic-cursor-emblem">♡</div>';
    layer.appendChild(follower);

    const SYMBOLS = ["✦", "♡", "✧", "❦"];
    const POOL_SIZE = 12;
    const pool = [];

    for (let i = 0; i < POOL_SIZE; i++) {
      const el = document.createElement("span");
      el.className = "gothic-cursor-particle";
      el.textContent = SYMBOLS[i % SYMBOLS.length];
      layer.appendChild(el);
      pool.push({
        el,
        active: false,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        life: 0,
        maxLife: 0.65,
        scale: 1,
        rot: 0
      });
    }

    document.body.appendChild(layer);

    let targetX = -100;
    let targetY = -100;
    let curX = -100;
    let curY = -100;
    let lastSpawnX = -100;
    let lastSpawnY = -100;
    let hasMoved = false;
    let poolIdx = 0;

    function spawnParticle(x, y, burst) {
      const p = pool[poolIdx];
      poolIdx = (poolIdx + 1) % POOL_SIZE;
      p.active = true;
      p.x = x + (Math.random() - 0.5) * (burst ? 16 : 10);
      p.y = y + (Math.random() - 0.5) * (burst ? 16 : 10);
      p.vx = (Math.random() - 0.5) * (burst ? 42 : 18);
      p.vy = -14 - Math.random() * (burst ? 28 : 16);
      p.life = 0;
      p.maxLife = 0.52 + Math.random() * 0.28;
      p.scale = burst ? 0.95 + Math.random() * 0.35 : 0.75 + Math.random() * 0.3;
      p.rot = (Math.random() - 0.5) * 35;
      p.el.textContent = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
    }

    window.addEventListener(
      "pointermove",
      (e) => {
        targetX = e.clientX;
        targetY = e.clientY;
        if (!hasMoved) {
          hasMoved = true;
          curX = targetX;
          curY = targetY;
          follower.classList.add("is-active");
        }

        const dx = targetX - lastSpawnX;
        const dy = targetY - lastSpawnY;
        if (dx * dx + dy * dy > 520) {
          lastSpawnX = targetX;
          lastSpawnY = targetY;
          spawnParticle(targetX, targetY, false);
        }

        const interactive =
          e.target &&
          e.target.closest &&
          e.target.closest(
            "a, button, [role='button'], .card, .winged-profile-frame"
          );
        follower.classList.toggle("is-hovering", Boolean(interactive));
      },
      { passive: true }
    );

    window.addEventListener(
      "pointerdown",
      (e) => {
        follower.classList.add("is-pressing");
        for (let i = 0; i < 3; i++) {
          spawnParticle(e.clientX, e.clientY, true);
        }
      },
      { passive: true }
    );

    window.addEventListener(
      "pointerup",
      () => {
        follower.classList.remove("is-pressing");
      },
      { passive: true }
    );

    document.addEventListener("mouseleave", () => {
      follower.classList.remove("is-active");
      hasMoved = false;
    });

    let prevNow = performance.now();
    function tick(now) {
      const dt = Math.min(0.05, Math.max(0.001, (now - prevNow) * 0.001));
      prevNow = now;

      if (hasMoved) {
        const lerp = Math.min(1, dt * 16);
        curX += (targetX - curX) * lerp;
        curY += (targetY - curY) * lerp;
        follower.style.transform =
          "translate3d(" + (curX + 10).toFixed(1) + "px, " + (curY + 10).toFixed(1) + "px, 0)";
      }

      for (let i = 0; i < POOL_SIZE; i++) {
        const p = pool[i];
        if (!p.active) continue;
        p.life += dt;
        if (p.life >= p.maxLife) {
          p.active = false;
          p.el.style.opacity = "0";
          continue;
        }
        const progress = p.life / p.maxLife;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        const alpha = progress < 0.2 ? progress / 0.2 : 1 - (progress - 0.2) / 0.8;
        const sc = p.scale * (1 - progress * 0.35);
        p.el.style.opacity = Math.max(0, alpha * 0.88).toFixed(2);
        p.el.style.transform =
          "translate3d(" +
          p.x.toFixed(1) +
          "px, " +
          p.y.toFixed(1) +
          "px, 0) scale(" +
          sc.toFixed(2) +
          ") rotate(" +
          (p.rot + progress * 24).toFixed(1) +
          "deg)";
      }

      requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }

  function initCandelabraLoader() {
    const loader = document.getElementById("candelabraLoader");
    if (!loader) return;

    const fillEl = document.getElementById("loaderBarFill");
    const percentEl = document.getElementById("loaderPercentText");
    const statusEl = document.getElementById("loaderStatusLabel");
    const candleSlots = Array.from(loader.querySelectorAll(".candle-flame-slot"));
    const ticks = Array.from(loader.querySelectorAll(".loader-candle-ticks .tick"));
    const thresholds = [16, 36, 56, 76, 92];

    let progress = 0;
    let finishing = false;
    let finishTime = 0;
    let pageReady = document.readyState === "complete";
    window.addEventListener(
      "load",
      () => {
        pageReady = true;
      },
      { once: true }
    );

    const startTime = performance.now();
    const minDuration = 2050;

    function updateFlamePhysics(now) {
      const t = now * 0.001;
      for (let i = 0; i < candleSlots.length; i++) {
        const slot = candleSlots[i];
        if (!slot || !slot.classList.contains("is-lit")) continue;
        const seed = i * 1.73 + 0.4;
        const wind =
          Math.sin(t * 5.4 + seed) * 2.1 +
          Math.sin(t * 11.8 + seed * 1.9) * 1.15 +
          Math.cos(t * 2.7 - seed) * 0.85;
        const stretch =
          1 +
          Math.sin(t * 8.6 + seed * 1.3) * 0.048 +
          Math.cos(t * 15.2 + seed) * 0.024;
        const halo =
          0.92 +
          Math.sin(t * 7.2 + seed) * 0.08 +
          Math.sin(t * 13.5 + seed * 2.1) * 0.04;

        slot.style.setProperty("--flicker-lean", wind.toFixed(2) + "deg");
        slot.style.setProperty("--flicker-stretch", stretch.toFixed(3));
        slot.style.setProperty("--halo-Dynamic", halo.toFixed(3));
      }
    }

    function updateUI(pct) {
      const clamped = Math.max(0, Math.min(100, pct));
      if (fillEl) fillEl.style.width = clamped.toFixed(1) + "%";
      if (percentEl) percentEl.textContent = Math.round(clamped) + "%";

      let litCount = 0;
      for (let i = 0; i < thresholds.length; i++) {
        const isLit = clamped >= thresholds[i];
        if (isLit) litCount++;
        if (candleSlots[i]) candleSlots[i].classList.toggle("is-lit", isLit);
        if (ticks[i]) ticks[i].classList.toggle("is-lit", isLit);
      }

      if (statusEl) {
        statusEl.textContent =
          litCount >= 5
            ? "จุดเทียนครบทั้ง 5 เล่มแล้ว ยินดีต้อนรับค่ะ ♡"
            : "กำลังจุดเทียนต้อนรับ... " + litCount + " / 5 เล่ม";
      }
    }

    function step(now) {
      const elapsed = now - startTime;
      const timeRatio = Math.min(1, elapsed / minDuration);
      const eased =
        timeRatio < 0.5
          ? 2 * timeRatio * timeRatio
          : 1 - Math.pow(-2 * timeRatio + 2, 2) / 2;

      const cap = pageReady ? 100 : 90;
      const target = Math.min(cap, eased * 100);
      progress += (target - progress) * 0.28;
      if (pageReady && timeRatio >= 1) {
        progress = 100;
      }

      updateUI(finishing ? 100 : progress);
      updateFlamePhysics(now);

      if (!finishing) {
        if (progress >= 99.6) {
          finishing = true;
          finishTime = now;
          updateUI(100);
          setTimeout(() => {
            loader.classList.add("is-complete");
            setTimeout(() => {
              loader.hidden = true;
            }, 680);
          }, 420);
        }
        requestAnimationFrame(step);
      } else if (now - finishTime < 1100) {
        requestAnimationFrame(step);
      }
    }

    requestAnimationFrame(step);
  }

  initCandelabraLoader();

  function initGothicAmbientParticles() {
    if (
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.className = "gothic-ambient-canvas";
    canvas.setAttribute("aria-hidden", "true");
    document.body.appendChild(canvas);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;

    function resize() {
      width = window.innerWidth || document.documentElement.clientWidth || 1280;
      height = window.innerHeight || document.documentElement.clientHeight || 800;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    resize();
    window.addEventListener("resize", resize, { passive: true });

    const PARTICLE_COUNT = 26;
    const particles = [];

    function createParticle(initialRandomY) {
      const rand = Math.random();
      const kind = rand < 0.48 ? "petal" : rand < 0.78 ? "dust" : "star";
      const isDarkPetal = kind === "petal" && Math.random() < 0.42;
      const depth = 0.45 + Math.random() * 0.65;

      return {
        kind,
        isDarkPetal,
        depth,
        x: Math.random() * width,
        y: initialRandomY ? Math.random() * height : -24 - Math.random() * 80,
        vx: (Math.random() - 0.35) * 11 * depth,
        vy: (kind === "dust" ? 8 + Math.random() * 12 : 13 + Math.random() * 18) * depth,
        size:
          kind === "petal"
            ? (5.2 + Math.random() * 4.8) * depth
            : kind === "star"
              ? (3.6 + Math.random() * 3.2) * depth
              : (1.5 + Math.random() * 2.2) * depth,
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 1.35,
        flip: Math.random() * Math.PI * 2,
        flipSpeed: 0.9 + Math.random() * 1.6,
        swayPhase: Math.random() * Math.PI * 2,
        swaySpeed: 0.7 + Math.random() * 1.1,
        swayAmp: (8 + Math.random() * 16) * depth,
        twinklePhase: Math.random() * Math.PI * 2,
        twinkleSpeed: 1.8 + Math.random() * 2.6,
        baseAlpha:
          kind === "petal"
            ? isDarkPetal
              ? 0.26 + Math.random() * 0.22
              : 0.56 + Math.random() * 0.28
            : 0.34 + Math.random() * 0.4
      };
    }

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push(createParticle(true));
    }

    function drawPetal(p, alpha) {
      const flipScale = 0.28 + Math.abs(Math.cos(p.flip)) * 0.72;
      const s = p.size;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.scale(1, flipScale);
      ctx.globalAlpha = alpha;

      ctx.beginPath();
      ctx.moveTo(0, -s);
      ctx.bezierCurveTo(s * 0.95, -s * 0.85, s * 1.1, s * 0.35, 0, s);
      ctx.bezierCurveTo(-s * 1.1, s * 0.35, -s * 0.95, -s * 0.85, 0, -s);
      ctx.closePath();

      if (p.isDarkPetal) {
        const grad = ctx.createLinearGradient(-s, -s, s, s);
        grad.addColorStop(0, "#3a3644");
        grad.addColorStop(0.55, "#1f1d26");
        grad.addColorStop(1, "#121017");
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.lineWidth = 0.6;
        ctx.strokeStyle = "rgba(195, 192, 212, 0.42)";
        ctx.stroke();
      } else {
        const grad = ctx.createLinearGradient(-s, -s, s, s);
        grad.addColorStop(0, "#ffffff");
        grad.addColorStop(0.65, "#f3f3f9");
        grad.addColorStop(1, "#dfdfe9");
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.lineWidth = 0.75;
        ctx.strokeStyle = "rgba(154, 152, 168, 0.52)";
        ctx.stroke();
      }

      ctx.restore();
    }

    function drawStar(p, alpha) {
      const s = p.size;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot * 0.4);
      ctx.globalAlpha = alpha;

      ctx.beginPath();
      ctx.moveTo(0, -s);
      ctx.quadraticCurveTo(0, 0, s, 0);
      ctx.quadraticCurveTo(0, 0, 0, s);
      ctx.quadraticCurveTo(0, 0, -s, 0);
      ctx.quadraticCurveTo(0, 0, 0, -s);
      ctx.closePath();

      ctx.fillStyle = "#c9b38c";
      ctx.shadowColor = "rgba(212, 190, 148, 0.65)";
      ctx.shadowBlur = 6;
      ctx.fill();
      ctx.restore();
    }

    function drawDust(p, alpha) {
      const r = p.size;
      ctx.save();
      ctx.globalAlpha = alpha;
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 2.4);
      grad.addColorStop(0, "rgba(218, 198, 158, 0.95)");
      grad.addColorStop(0.5, "rgba(182, 178, 196, 0.5)");
      grad.addColorStop(1, "rgba(182, 178, 196, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r * 2.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    let prevTime = performance.now();

    function step(now) {
      const dt = Math.min(0.05, Math.max(0.001, (now - prevTime) * 0.001));
      prevTime = now;

      if (!document.hidden) {
        ctx.clearRect(0, 0, width, height);

        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          p.swayPhase += p.swaySpeed * dt;
          p.twinklePhase += p.twinkleSpeed * dt;
          p.rot += p.rotSpeed * dt;
          p.flip += p.flipSpeed * dt;

          const breezeX = Math.sin(p.swayPhase) * p.swayAmp * dt;
          p.x += p.vx * dt + breezeX;
          p.y += p.vy * dt;

          if (p.y > height + 32) {
            particles[i] = createParticle(false);
            continue;
          }
          if (p.x < -36) p.x = width + 30;
          if (p.x > width + 36) p.x = -30;

          const twinkle = 0.68 + 0.32 * Math.sin(p.twinklePhase);
          const alpha = Math.max(0.08, Math.min(0.95, p.baseAlpha * twinkle));

          if (p.kind === "petal") {
            drawPetal(p, alpha);
          } else if (p.kind === "star") {
            drawStar(p, alpha);
          } else {
            drawDust(p, alpha);
          }
        }
      }

      requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  }

  async function init() {
    initScrollReveal();
    initBackToTopButton();
    initCreamyGothicCursor();
    initGothicAmbientParticles();

    if (db) {
      try {
        const { data: shopData } = await db
          .from("shop_settings")
          .select("hero_girl_url")
          .eq("id", "main")
          .maybeSingle();
        const badgeImg = $("badgeProfileImg");
        if (badgeImg && shopData && shopData.hero_girl_url) {
          badgeImg.src = shopData.hero_girl_url;
        }
      } catch (_e) {
        // Ignore
      }

      try {
        const { data, error } = await db
          .from("accounts")
          .select("id,title,category,status,price,description,image_url,created_at")
          .order("created_at", { ascending: false });
        rows = !error && Array.isArray(data) ? data : [];
      } catch (_e) {
        rows = [];
      }
      render();
      return;
    }

    try {
      const settingsRes = await fetch("/api/site-settings");
      if (settingsRes.ok) {
        const settings = await settingsRes.json();
        const badgeImg = $("badgeProfileImg");
        if (badgeImg && settings && settings.hero_girl_url) {
          badgeImg.src = settings.hero_girl_url;
        }
      }
    } catch (_e) {
      // Ignore
    }

    try {
      const res = await fetch("/api/accounts");
      if (res.ok) {
        rows = await res.json();
      }
    } catch (_e) {
      rows = [];
    }
    render();
  }

  document.addEventListener("DOMContentLoaded", init);
})();