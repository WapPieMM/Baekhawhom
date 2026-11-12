(() => {
  const DEFAULT_CARDS = [
    "/assets/images/theme/card_portrait_1.jpg",
    "/assets/images/theme/card_portrait_2.jpg",
    "/assets/images/theme/card_portrait_3.jpg"
  ];

  const catLabel = {
    chicken_skin: "ไอดีไก่สกิน",
    normal: "ไอดีปกติ"
  };

  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
    );

  // 5-Branch Candelabra Entry Loading Screen (Candles light 1 -> 5 with progress bar + 60fps Gothic flame physics)
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
    const minDuration = 2250;

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
          }, 480);
        }
        requestAnimationFrame(step);
      } else if (now - finishTime < 1150) {
        requestAnimationFrame(step);
      }
    }

    requestAnimationFrame(step);
  }

  initCandelabraLoader();

  // 60fps Realistic 3D Wing Kinematics Engine (multi-harmonic figure-8 stroke + hover response)
  function initRealisticWingPhysics60fps() {
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const frames = Array.from(document.querySelectorAll(".winged-profile-frame"));
    const instances = frames
      .map((frame, index) => {
        const leftWing = frame.querySelector(".wing-left");
        const rightWing = frame.querySelector(".wing-right");
        if (!leftWing || !rightWing) return null;

        frame.classList.add("js-raf-active");
        const isHero = frame.classList.contains("hero-size");

        const state = {
          frame,
          leftWing,
          rightWing,
          isHero,
          phase: index * 1.1,
          speed: isHero ? 2.45 : 2.15,
          targetSpeed: isHero ? 2.45 : 2.15,
          ampScale: 1.0,
          targetAmpScale: 1.0,
          pointerX: 0,
          pointerY: 0,
          smoothX: 0,
          smoothY: 0
        };

        frame.addEventListener("pointerenter", () => {
          state.targetSpeed = isHero ? 4.1 : 3.4;
          state.targetAmpScale = 1.22;
        });

        frame.addEventListener("pointerleave", () => {
          state.targetSpeed = isHero ? 2.45 : 2.15;
          state.targetAmpScale = 1.0;
          state.pointerX = 0;
          state.pointerY = 0;
        });

        frame.addEventListener("pointermove", (e) => {
          const rect = frame.getBoundingClientRect();
          if (!rect.width || !rect.height) return;
          state.pointerX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
          state.pointerY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
        });

        return state;
      })
      .filter(Boolean);

    if (!instances.length) return;

    let lastTime = performance.now();

    function step(now) {
      const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) * 0.001));
      lastTime = now;

      for (let i = 0; i < instances.length; i++) {
        const inst = instances[i];
        const damp = Math.min(1, dt * 6.5);

        inst.speed += (inst.targetSpeed - inst.speed) * damp;
        inst.ampScale += (inst.targetAmpScale - inst.ampScale) * damp;
        inst.smoothX += (inst.pointerX - inst.smoothX) * damp;
        inst.smoothY += (inst.pointerY - inst.smoothY) * damp;
        inst.phase = (inst.phase + inst.speed * dt) % (Math.PI * 200);

        const p = inst.phase;
        const amp = inst.ampScale;

        // Primary stroke + 2nd harmonic (asymmetric downstroke/upstroke) + figure-8 pitch wave
        const s1 = Math.sin(p);
        const s2 = Math.sin(p * 2 - 0.55) * 0.24;
        const c1 = Math.cos(p - 0.4);
        const ripple = Math.sin(p * 3 + 0.3) * 0.12;

        const stroke = (s1 + s2) * amp;
        const feather = (c1 + ripple) * amp;

        // 3D angles for left & right wings
        const leftRotY = (8.5 + stroke * 17.5 + inst.smoothX * 4).toFixed(2);
        const rightRotY = (-8.5 - stroke * 17.5 + inst.smoothX * 4).toFixed(2);

        const leftRotZ = (feather * 4.6 + stroke * 2.2 - inst.smoothY * 2).toFixed(2);
        const rightRotZ = (-feather * 4.6 - stroke * 2.2 + inst.smoothY * 2).toFixed(2);

        const leftSkewY = (feather * 1.9).toFixed(2);
        const rightSkewY = (-feather * 1.9).toFixed(2);

        const scaleX = (1 - Math.max(0, s1) * 0.036 * amp).toFixed(4);

        inst.leftWing.style.transform =
          "perspective(950px) rotateY(" +
          leftRotY +
          "deg) rotateZ(" +
          leftRotZ +
          "deg) skewY(" +
          leftSkewY +
          "deg) scaleX(" +
          scaleX +
          ") translateZ(0)";

        inst.rightWing.style.transform =
          "perspective(950px) rotateY(" +
          rightRotY +
          "deg) rotateZ(" +
          rightRotZ +
          "deg) skewY(" +
          rightSkewY +
          "deg) scaleX(" +
          scaleX +
          ") translateZ(0)";
      }

      requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  }

  initRealisticWingPhysics60fps();

  // Subtle Scroll-Reveal Animation via IntersectionObserver API
  let scrollRevealObserver = null;

  function observeRevealElements(elements) {
    if (!elements || !elements.length) return;
    const reduceMotion =
      window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion || !("IntersectionObserver" in window)) {
      elements.forEach((el) => {
        if (el) el.classList.add("is-visible");
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
    const heroGroups = [
      { el: document.querySelector(".hero-character-col"), delay: 0 },
      { el: document.querySelector(".hero-center-col"), delay: 90 },
      { el: document.querySelector(".hero-mascot-col"), delay: 180 }
    ];

    heroGroups.forEach(({ el, delay }) => {
      if (!el) return;
      el.style.setProperty("--reveal-delay", delay + "ms");
      observeRevealElements([el]);
    });

    const trustPlaque = document.querySelector(".trust-plaque-section");
    if (trustPlaque) {
      observeRevealElements([trustPlaque]);
    }

    const trustCols = Array.from(document.querySelectorAll(".trust-col"));
    trustCols.forEach((col, idx) => {
      col.style.setProperty("--reveal-delay", idx * 80 + "ms");
    });
    observeRevealElements(trustCols);

    const showcaseTargets = [
      document.querySelector(".contact-ornate-plaque"),
      document.querySelector(".featured-accounts-area"),
      document.querySelector(".footer")
    ].filter(Boolean);

    showcaseTargets.forEach((el, idx) => {
      el.style.setProperty("--reveal-delay", idx * 70 + "ms");
    });
    observeRevealElements(showcaseTargets);
  }

  initScrollReveal();

  // Back to Top floating button (appears after scrolling past the hero section)
  function initBackToTopButton() {
    const btn = document.getElementById("backToTopBtn");
    if (!btn) return;

    const heroSection =
      document.getElementById("home") || document.querySelector(".hero-cathedral-stage");

    const updateVisibility = () => {
      if (heroSection) {
        const rect = heroSection.getBoundingClientRect();
        btn.classList.toggle("is-visible", rect.bottom <= 90);
      } else {
        btn.classList.toggle("is-visible", window.scrollY > 360);
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
        { root: null, rootMargin: "-80px 0px 0px 0px", threshold: 0 }
      );
      heroObserver.observe(heroSection);
    }

    window.addEventListener("scroll", updateVisibility, { passive: true });
    updateVisibility();

    btn.addEventListener("click", () => {
      const reduceMotion =
        window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({
        top: 0,
        behavior: reduceMotion ? "auto" : "smooth"
      });
    });
  }

  initBackToTopButton();

  // Custom Creamy Gothic Cursor Follower & Sparkle/Heart Trail
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
    const POOL_SIZE = 14;
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
            "a, button, [role='button'], .portrait-card, .card, .winged-profile-frame"
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

  initCreamyGothicCursor();

  // Ambient Floating Gothic Rose Petals & Shimmering Silver/Gold Dust (60fps Canvas)
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

    const PARTICLE_COUNT = 32;
    const particles = [];

    function createParticle(initialRandomY) {
      const rand = Math.random();
      // 48% pearl-white & obsidian gothic rose petals, 30% champagne-gold & silver dust motes, 22% 4-point gothic starlight
      const kind = rand < 0.48 ? "petal" : rand < 0.78 ? "dust" : "star";
      const isDarkPetal = kind === "petal" && Math.random() < 0.42;
      const depth = 0.45 + Math.random() * 0.65; // 0.45 (far) to 1.1 (near)

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
              ? 0.28 + Math.random() * 0.24
              : 0.58 + Math.random() * 0.28
            : 0.36 + Math.random() * 0.42
      };
    }

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push(createParticle(true));
    }

    let pointerX = -9999;
    let pointerY = -9999;
    let pointerVx = 0;
    let pointerVy = 0;
    let lastPointerX = -9999;
    let lastPointerY = -9999;

    window.addEventListener(
      "pointermove",
      (e) => {
        if (lastPointerX > -9000) {
          pointerVx = (e.clientX - lastPointerX) * 0.35;
          pointerVy = (e.clientY - lastPointerY) * 0.35;
        }
        lastPointerX = e.clientX;
        lastPointerY = e.clientY;
        pointerX = e.clientX;
        pointerY = e.clientY;
      },
      { passive: true }
    );

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
        pointerVx *= 0.92;
        pointerVy *= 0.92;

        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          p.swayPhase += p.swaySpeed * dt;
          p.twinklePhase += p.twinkleSpeed * dt;
          p.rot += p.rotSpeed * dt;
          p.flip += p.flipSpeed * dt;

          const breezeX = Math.sin(p.swayPhase) * p.swayAmp * dt;
          p.x += p.vx * dt + breezeX;
          p.y += p.vy * dt;

          // Subtle interactive breeze when pointer passes near a particle
          const dx = p.x - pointerX;
          const dy = p.y - pointerY;
          const distSq = dx * dx + dy * dy;
          if (distSq < 13500 && distSq > 4) {
            const dist = Math.sqrt(distSq);
            const push = (1 - dist / 116) * 24 * dt * p.depth;
            p.x += (dx / dist) * push + pointerVx * 0.08 * dt;
            p.y += (dy / dist) * push + pointerVy * 0.08 * dt;
          }

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

  initGothicAmbientParticles();

  // Smooth anchor scrolling
  document.addEventListener("click", (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (!link) return;
    const href = link.getAttribute("href");
    if (!href || href === "#") return;
    const target = document.querySelector(href);
    if (!target) return;
    event.preventDefault();
    const modal = document.getElementById("accountModal");
    if (modal && !modal.hidden) modal.hidden = true;
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  // Quick-view modal logic
  const modal = document.getElementById("accountModal");
  const modalImage = document.getElementById("modalImage");
  const modalMeta = document.getElementById("modalMeta");
  const modalTitle = document.getElementById("modalTitle");
  const modalDesc = document.getElementById("modalDesc");
  const modalPrice = document.getElementById("modalPrice");
  const modalCloseBtn = document.getElementById("modalCloseBtn");

  document.addEventListener("click", (event) => {
    const previewBtn = event.target.closest("[data-preview-title]");
    if (previewBtn && modal) {
      modalTitle.textContent = previewBtn.getAttribute("data-preview-title") || "";
      modalMeta.textContent = previewBtn.getAttribute("data-preview-meta") || "";
      modalPrice.textContent = previewBtn.getAttribute("data-preview-price") || "";
      modalDesc.textContent = previewBtn.getAttribute("data-preview-desc") || "";
      const imgUrl = previewBtn.getAttribute("data-preview-img") || DEFAULT_CARDS[0];
      modalImage.src = imgUrl;
      modalImage.alt = modalTitle.textContent;
      modal.hidden = false;
      return;
    }

    if (modal && !modal.hidden && event.target === modal) {
      modal.hidden = true;
    }
  });

  if (modalCloseBtn && modal) {
    modalCloseBtn.addEventListener("click", () => {
      modal.hidden = true;
    });
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal && !modal.hidden) {
      modal.hidden = true;
    }
  });

  // Carousel state
  let allAccounts = [];
  let startIndex = 0;
  let cardFallbacks = [...DEFAULT_CARDS];

  function renderCarousel() {
    const featuredArea = document.getElementById("accounts");
    const showcaseGrid = document.querySelector(".lower-showcase-grid");
    const grid = document.getElementById("homeAccountGrid");
    if (!grid) return;

    if (!Array.isArray(allAccounts) || allAccounts.length === 0) {
      grid.innerHTML = "";
      if (featuredArea) featuredArea.hidden = true;
      if (showcaseGrid) showcaseGrid.classList.add("single-col-contact");
      return;
    }

    if (featuredArea) featuredArea.hidden = false;
    if (showcaseGrid) showcaseGrid.classList.remove("single-col-contact");

    const visible = [];
    const count = Math.min(3, allAccounts.length);
    for (let i = 0; i < count; i++) {
      const idx = (startIndex + i) % allAccounts.length;
      visible.push({ item: allAccounts[idx], idx });
    }

    grid.innerHTML = visible
      .map(({ item, idx }, cardPos) => {
        const fallbackImg = cardFallbacks[idx % cardFallbacks.length] || DEFAULT_CARDS[0];
        const imgSrc = item.image_url ? esc(item.image_url) : fallbackImg;
        const catText = catLabel[item.category] || "ไอดีปกติ";
        const priceFormatted = "฿ " + Number(item.price || 0).toLocaleString("th-TH") + ".-";
        const codeText = "รหัส BKH-" + String(item.id || idx + 1).padStart(2, "0");
        const descText =
          item.description ||
          "ไอดีคัดพิเศษ ตรวจสอบความปลอดภัยเรียบร้อย พร้อมส่งมอบทันที";

        return (
          '<article class="portrait-card reveal-on-scroll" style="--reveal-delay:' +
          cardPos * 85 +
          'ms">' +
          '<span class="card-crown-badge" aria-hidden="true">♛</span>' +
          '<div class="portrait-frame">' +
          '<img src="' +
          imgSrc +
          '" alt="' +
          esc(item.title) +
          '" referrerpolicy="no-referrer" loading="lazy" onerror="this.onerror=null;this.src=\'' +
          fallbackImg +
          '\';">' +
          "</div>" +
          '<div class="portrait-card-info">' +
          "<h3>" +
          esc(item.title) +
          "</h3>" +
          '<strong class="portrait-price">' +
          esc(priceFormatted) +
          "</strong>" +
          '<button type="button" class="portrait-detail-btn" data-preview-title="' +
          esc(item.title) +
          '" data-preview-meta="' +
          esc("พร้อมขาย · " + catText + " · " + codeText) +
          '" data-preview-price="' +
          esc(priceFormatted) +
          '" data-preview-img="' +
          imgSrc +
          '" data-preview-desc="' +
          esc(descText) +
          '">ดูรายละเอียด ♡</button>' +
          "</div></article>"
        );
      })
      .join("");

    observeRevealElements(Array.from(grid.querySelectorAll(".portrait-card")));
  }

  const prevBtn = document.getElementById("carouselPrevBtn");
  const nextBtn = document.getElementById("carouselNextBtn");

  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      if (!allAccounts.length) return;
      startIndex = (startIndex - 1 + allAccounts.length) % allAccounts.length;
      renderCarousel();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      if (!allAccounts.length) return;
      startIndex = (startIndex + 1) % allAccounts.length;
      renderCarousel();
    });
  }

  function applyThemeSettings(settings) {
    if (!settings) return;
    const setImg = (id, url) => {
      const el = document.getElementById(id);
      if (el && url) el.src = url;
    };
    const setText = (id, text) => {
      const el = document.getElementById(id);
      if (el && text) el.textContent = text;
    };

    setImg("heroGirlImg", settings.hero_girl_url);
    setImg("contactProfileImg", settings.hero_girl_url);
    setImg("heroBunnyImg", settings.hero_bunny_url);
    setImg("heroBgImg", settings.hero_bg_url);

    setText("heroShopName", settings.shop_name);
    setText("footerShopName", settings.shop_name);
    setText("heroShopSubtitle", settings.shop_subtitle);
    setText("heroShopQuote", settings.shop_quote);
    setText("shopStatusText", settings.shop_status);

    cardFallbacks = [
      settings.card_1_url || DEFAULT_CARDS[0],
      settings.card_2_url || DEFAULT_CARDS[1],
      settings.card_3_url || DEFAULT_CARDS[2]
    ];

    // Contact Channels
    const contactList = document.getElementById("contactList");
    if (contactList) {
      const lineUrl = settings.line_url || "https://line.me/";
      const lineText = settings.line_text || "@baekhawhom";
      const igUrl = settings.instagram_url || "https://www.instagram.com/";
      const igText = settings.instagram_text || "baekhawhom";
      const fbUrl = settings.facebook_url || "https://www.facebook.com/";
      const fbText = settings.facebook_text || "baekhawhom";

      contactList.innerHTML =
        '<a class="contact-channel-row" href="' +
        esc(lineUrl) +
        '" target="_blank" rel="noopener noreferrer">' +
        '<span class="channel-badge line">LINE</span>' +
        '<span class="channel-text">LINE : <b>' +
        esc(lineText) +
        "</b></span></a>" +
        '<a class="contact-channel-row" href="' +
        esc(igUrl) +
        '" target="_blank" rel="noopener noreferrer">' +
        '<span class="channel-badge ig" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect width="18" height="18" x="3" y="3" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1"/></svg></span>' +
        '<span class="channel-text">Instagram : <b>' +
        esc(igText) +
        "</b></span></a>" +
        '<a class="contact-channel-row" href="' +
        esc(fbUrl) +
        '" target="_blank" rel="noopener noreferrer">' +
        '<span class="channel-badge fb">f</span>' +
        '<span class="channel-text">Facebook : <b>' +
        esc(fbText) +
        "</b></span></a>";

      const primaryContactBtn = document.getElementById("primaryContactBtn");
      if (primaryContactBtn) {
        primaryContactBtn.href = lineUrl;
      }
    }
  }

  // Load settings from backend API + Supabase
  (async () => {
    renderCarousel();

    let serverSettings = null;
    try {
      const res = await fetch("/api/site-settings");
      if (res.ok) {
        serverSettings = await res.json();
        applyThemeSettings(serverSettings);
      }
    } catch (_e) {
      // Ignore network error
    }

    const cfg = window.SHOP_CONFIG || {};
    const hasSupabase =
      window.supabase &&
      cfg.supabaseUrl &&
      cfg.supabaseAnonKey &&
      !cfg.supabaseUrl.includes("YOUR-PROJECT");

    if (!hasSupabase) {
      if (serverSettings && Array.isArray(serverSettings.featured_accounts)) {
        allAccounts = serverSettings.featured_accounts.filter((x) => x.status !== "sold");
      } else {
        allAccounts = [];
      }
      renderCarousel();
      return;
    }

    const db = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);

    try {
      const { data: accountsData, error: accountsErr } = await db
        .from("accounts")
        .select("id,title,category,status,price,description,image_url,created_at")
        .eq("status", "available")
        .order("created_at", { ascending: false })
        .limit(12);

      if (!accountsErr && Array.isArray(accountsData)) {
        allAccounts = accountsData;
      } else {
        allAccounts = [];
      }
      renderCarousel();
    } catch (_e) {
      allAccounts = [];
      renderCarousel();
    }

    try {
      const { data: shopData, error: shopErr } = await db
        .from("shop_settings")
        .select("*")
        .eq("id", "main")
        .maybeSingle();

      if (!shopErr && shopData) {
        const merged = { ...(serverSettings || {}) };
        if (shopData.line_url) merged.line_url = shopData.line_url;
        if (shopData.line_text) merged.line_text = shopData.line_text;
        if (shopData.instagram_url) merged.instagram_url = shopData.instagram_url;
        if (shopData.instagram_text) merged.instagram_text = shopData.instagram_text;
        if (shopData.facebook_url) merged.facebook_url = shopData.facebook_url;
        if (shopData.facebook_text) merged.facebook_text = shopData.facebook_text;
        ["hero_girl_url", "hero_bunny_url", "hero_bg_url", "shop_name", "shop_subtitle", "shop_quote", "shop_status"].forEach((key) => {
          if (shopData[key]) merged[key] = shopData[key];
        });
        applyThemeSettings(merged);
      }
    } catch (_e) {
      // Keep server settings
    }
  })();
})();
