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
  const statusLabel = { available: "พร้อมขาย", installment: "ติดผ่อน", sold: "ขายแล้ว" };
  const INSTALLMENT_TAG_RE = /\s*\[status:installment\]\s*$/;

  function normalizeAccountRow(row) {
    if (!row || typeof row !== "object") return row;
    const rawDesc = String(row.description || "");
    const hasTag = INSTALLMENT_TAG_RE.test(rawDesc);
    return {
      ...row,
      status: hasTag ? "installment" : row.status,
      description: rawDesc.replace(INSTALLMENT_TAG_RE, "")
    };
  }

  function isSoldTabGroup(st) {
    return st === "sold" || st === "installment";
  }

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
      (x) =>
        (category === "all" || x.category === category) &&
        x.status === status
    );
    $("availableCount").textContent = rows.filter(
      (x) => (category === "all" || x.category === category) && x.status === "available"
    ).length;
    if ($("installmentCount")) {
      $("installmentCount").textContent = rows.filter(
        (x) => (category === "all" || x.category === category) && x.status === "installment"
      ).length;
    }
    $("soldCount").textContent = rows.filter(
      (x) => (category === "all" || x.category === category) && x.status === "sold"
    ).length;
    $("resultCount").textContent =
      "แสดง " +
      matches.length +
      " รายการ · " +
      (statusLabel[status] || "พร้อมขาย");

    const gridEl = $("accountGrid");
    gridEl.innerHTML = matches.length
      ? matches
          .map((x, idx) => {
            const fallbackImg = FALLBACK_IMAGES[idx % FALLBACK_IMAGES.length];
            const imgSrc = x.image_url ? esc(x.image_url) : fallbackImg;
            const stateClass =
              x.status === "installment"
                ? "installment"
                : x.status === "sold"
                  ? "sold"
                  : "";
            const stateText = statusLabel[x.status] || "พร้อมขาย";
            const catText = catName[x.category] || "ไอดีปกติ";
            const priceFormatted = "฿ " + Number(x.price || 0).toLocaleString("th-TH") + ".-";
            const descText =
              x.description || "ไอดีคัดพิเศษ ตรวจสอบความปลอดภัยเรียบร้อย";
            const previewAttrs =
              ' data-preview-idx="' +
              idx +
              '" data-preview-title="' +
              esc(x.title) +
              '" data-preview-meta="' +
              esc(stateText + " · " + catText) +
              '" data-preview-price="' +
              esc(priceFormatted) +
              '" data-preview-img="' +
              imgSrc +
              '" data-preview-desc="' +
              esc(descText) +
              '"';
            return (
              '<article class="card reveal-on-scroll" style="--reveal-delay: ' +
              (idx % 3) * 85 +
              'ms">' +
              '<div class="card-media"' +
              previewAttrs +
              ">" +
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
              stateClass +
              '">' +
              stateText +
              "</span>" +
              '<span aria-hidden="true">·</span>' +
              "<span>" +
              catText +
              "</span>" +
              "</div>" +
              "<h2" +
              previewAttrs +
              ">" +
              esc(x.title) +
              "</h2>" +
              '<p class="description">' +
              esc(descText) +
              "</p>" +
              '<div class="bottom">' +
              '<strong class="price">' +
              esc(priceFormatted) +
              "</strong>" +
              '<button type="button" class="inquire-link" data-inquire-title="' +
              esc(x.title) +
              '" data-inquire-price="' +
              esc(priceFormatted) +
              '">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>' +
              "ติดต่อสั่งซื้อ ♡</button>" +
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
    document.body.appendChild(layer);

    let targetX = -100;
    let targetY = -100;
    let curX = -100;
    let curY = -100;
    let hasMoved = false;

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
      () => {
        follower.classList.add("is-pressing");
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
    const thresholds = [16, 36, 56, 76, 92];

    const flameRig = candleSlots.map((slot, i) => ({
      slot,
      aura: slot.querySelector(".flame-aura"),
      outer: slot.querySelector(".flame-outer"),
      mid: slot.querySelector(".flame-mid"),
      core: slot.querySelector(".flame-core"),
      smoke: slot.querySelector(".flame-smoke"),
      seed: i * 2.17 + 0.65,
      gustOffset: 0,
      gustVel: 0
    }));

    function buildFlamePath(baseY, topY, halfWidth, dxLow, dxMid, dxTip) {
      const tipX = (22 + dxTip).toFixed(2);
      const tY = topY.toFixed(2);
      const bY = baseY.toFixed(2);
      const spanY = baseY - topY;
      const yUpper = (topY + spanY * 0.34).toFixed(2);
      const yLower = (topY + spanY * 0.68).toFixed(2);
      const yBaseCtrl = (baseY - spanY * 0.04).toFixed(2);

      const lxUpper = (22 - halfWidth * 0.62 + dxMid).toFixed(2);
      const rxUpper = (22 + halfWidth * 0.62 + dxMid).toFixed(2);

      const lxLower = (22 - halfWidth * 1.06 + dxLow).toFixed(2);
      const rxLower = (22 + halfWidth * 1.06 + dxLow).toFixed(2);

      const lxBelly = (22 - halfWidth * 0.92 + dxLow * 0.45).toFixed(2);
      const rxBelly = (22 + halfWidth * 0.92 + dxLow * 0.45).toFixed(2);

      const yBelly = (topY + spanY * 0.82).toFixed(2);
      const lxBase = (22 - halfWidth * 0.42).toFixed(2);
      const rxBase = (22 + halfWidth * 0.42).toFixed(2);

      return (
        "M" + tipX + " " + tY +
        "C" + lxUpper + " " + yUpper + " " + lxLower + " " + yLower + " " + lxBelly + " " + yBelly +
        "C" + (22 - halfWidth * 0.78 + dxLow * 0.18).toFixed(2) + " " + yBaseCtrl + " " + lxBase + " " + bY + " 22 " + bY +
        "C" + rxBase + " " + bY + " " + (22 + halfWidth * 0.78 + dxLow * 0.18).toFixed(2) + " " + yBaseCtrl + " " + rxBelly + " " + yBelly +
        "C" + rxLower + " " + yLower + " " + rxUpper + " " + yUpper + " " + tipX + " " + tY + "Z"
      );
    }

    let progress = 0;
    let finishing = false;
    let finishTime = 0;
    let prevNow = performance.now();
    let pageReady = document.readyState === "complete";
    window.addEventListener(
      "load",
      () => {
        pageReady = true;
      },
      { once: true }
    );

    const startTime = performance.now();
    const minDuration = 2150;

    function updateFlamePhysics(now, dt) {
      const t = now * 0.001;
      const roomDraft =
        Math.sin(t * 1.45) * 1.15 +
        Math.sin(t * 3.1 - 0.8) * 0.65;

      for (let i = 0; i < flameRig.length; i++) {
        const rig = flameRig[i];
        const slot = rig.slot;
        if (!slot || !slot.classList.contains("is-lit")) continue;

        const s = rig.seed;
        if (Math.random() < dt * 2.2) {
          rig.gustVel += (Math.random() - 0.5) * 9.5;
        }
        rig.gustVel += (-rig.gustOffset * 14 - rig.gustVel * 5.2) * dt;
        rig.gustOffset += rig.gustVel * dt;

        const waveFreq = 7.4 + (i % 2) * 0.55;
        const wLow = Math.sin(t * waveFreq + s);
        const wMid = Math.sin(t * waveFreq + s - 0.85) + Math.cos(t * 4.3 + s * 1.4) * 0.45;
        const wTip =
          Math.sin(t * waveFreq + s - 1.75) +
          Math.sin(t * 13.6 + s * 2.1) * 0.38 +
          Math.cos(t * 3.7 - s) * 0.52;

        const dxLow = roomDraft * 0.25 + rig.gustOffset * 0.3 + wLow * 0.65;
        const dxMid = roomDraft * 0.75 + rig.gustOffset * 0.85 + wMid * 1.65;
        const dxTip = roomDraft * 1.45 + rig.gustOffset * 1.65 + wTip * 3.15;

        const thermalPulse =
          Math.sin(t * 9.8 + s * 1.3) * 2.4 +
          Math.cos(t * 16.4 + s * 0.7) * 1.15 +
          Math.sin(t * 4.1 - s) * 1.4;

        const widthMod = 1 + thermalPulse * 0.016;

        if (rig.outer) {
          rig.outer.setAttribute(
            "d",
            buildFlamePath(91.5, 11.5 + thermalPulse, 13.0 * widthMod, dxLow, dxMid, dxTip)
          );
        }
        if (rig.mid) {
          rig.mid.setAttribute(
            "d",
            buildFlamePath(
              89.2,
              21.0 + thermalPulse * 0.85,
              9.2 * widthMod,
              dxLow * 0.82,
              dxMid * 0.85,
              dxTip * 0.86
            )
          );
        }
        if (rig.core) {
          rig.core.setAttribute(
            "d",
            buildFlamePath(
              87.5,
              36.0 + thermalPulse * 0.55,
              5.6 * widthMod,
              dxLow * 0.55,
              dxMid * 0.58,
              dxTip * 0.55
            )
          );
        }
        if (rig.aura) {
          rig.aura.setAttribute(
            "d",
            buildFlamePath(
              95.0,
              5.5 + thermalPulse * 1.05,
              17.2 * widthMod,
              dxLow * 0.9,
              dxMid * 0.95,
              dxTip * 1.05
            )
          );
        }
        if (rig.smoke) {
          const sx1 = (22 + dxTip * 0.8).toFixed(1);
          const sx2 = (22 + dxMid * 1.3).toFixed(1);
          const sx3 = (22 + dxTip * 1.25).toFixed(1);
          rig.smoke.setAttribute("d", "M" + sx1 + " 24C" + sx2 + " 16 " + sx3 + " 9 " + sx1 + " 2");
        }

        const halo =
          0.92 +
          Math.sin(t * 6.8 + s) * 0.06 +
          Math.sin(t * 12.5 + s * 2.1) * 0.03;
        slot.style.setProperty("--flicker-lean", (roomDraft * 0.45).toFixed(2) + "deg");
        slot.style.setProperty("--flicker-stretch", "1");
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
      }

      loader.style.setProperty("--lit-progress", (clamped / 100).toFixed(3));

      if (statusEl) {
        statusEl.textContent =
          litCount >= 5
            ? "จุดเทียนครบทั้ง 5 เล่มแล้ว ยินดีต้อนรับค่ะ ♡"
            : "กำลังจุดเทียนต้อนรับ... " + litCount + " / 5 เล่ม";
      }
    }

    function step(now) {
      const dt = Math.min(0.05, Math.max(0.001, (now - prevNow) * 0.001));
      prevNow = now;

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
      updateFlamePhysics(now, dt);

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
      } else if (now - finishTime < 1150) {
        requestAnimationFrame(step);
      }
    }

    requestAnimationFrame(step);
  }

  initCandelabraLoader();

  function renderContactPickerChannels(settings) {
    const contactPickerList = $("contactPickerList");
    if (!contactPickerList) return;
    const s = settings || {};
    const channels = [
      {
        key: "line",
        label: "LINE Official / ID",
        text: s.line_text || "@baekhawhom",
        url: s.line_url || "https://line.me/",
        badgeHtml: '<span class="channel-badge line">LINE</span>'
      },
      {
        key: "ig",
        label: "Instagram",
        text: s.instagram_text || "baekhawhom",
        url: s.instagram_url || "https://www.instagram.com/",
        badgeHtml:
          '<span class="channel-badge ig" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect width="18" height="18" x="3" y="3" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1"/></svg></span>'
      },
      {
        key: "fb",
        label: "Facebook",
        text: s.facebook_text || "baekhawhom",
        url: s.facebook_url || "https://www.facebook.com/",
        badgeHtml: '<span class="channel-badge fb">f</span>'
      },
      {
        key: "tw",
        label: "Twitter (X)",
        text: s.twitter_text || "@baekhawhom",
        url: s.twitter_url || "https://x.com/",
        badgeHtml:
          '<span class="channel-badge tw" aria-hidden="true"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></span>'
      },
      {
        key: "dc",
        label: "Discord",
        text: s.discord_text || "baekhawhom",
        url: s.discord_url || "https://discord.com/",
        badgeHtml:
          '<span class="channel-badge dc" aria-hidden="true"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg></span>'
      }
    ];

    contactPickerList.innerHTML = channels
      .map(
        (ch) =>
          '<a class="contact-picker-item" href="' +
          esc(ch.url) +
          '" target="_blank" rel="noopener noreferrer">' +
          ch.badgeHtml +
          '<span class="contact-picker-item-body">' +
          "<small>" +
          esc(ch.label) +
          "</small>" +
          "<b>" +
          esc(ch.text) +
          "</b>" +
          "</span>" +
          '<span class="contact-picker-action">ทักแชท ✦</span>' +
          "</a>"
      )
      .join("");
  }

  function initModals() {
    const modal = $("accountModal");
    const modalImage = $("modalImage");
    const modalMeta = $("modalMeta");
    const modalTitle = $("modalTitle");
    const modalDesc = $("modalDesc");
    const modalPrice = $("modalPrice");
    const modalCloseBtn = $("modalCloseBtn");
    const modalContactBtn = $("modalContactBtn");

    const contactPickerModal = $("contactPickerModal");
    const contactPickerCloseBtn = $("contactPickerCloseBtn");
    const contactPickerAccount = $("contactPickerAccount");

    renderContactPickerChannels({});

    function openContactPicker(accountTitle, accountPrice) {
      if (!contactPickerModal) return;
      if (contactPickerAccount) {
        if (accountTitle) {
          contactPickerAccount.textContent =
            "รายการ: " + accountTitle + (accountPrice ? " · " + accountPrice : "");
          contactPickerAccount.hidden = false;
        } else {
          contactPickerAccount.textContent = "";
          contactPickerAccount.hidden = true;
        }
      }
      contactPickerModal.hidden = false;
    }

    if (modalContactBtn) {
      modalContactBtn.addEventListener("click", () => {
        const titleText = modalTitle ? modalTitle.textContent : "";
        const priceText = modalPrice ? modalPrice.textContent : "";
        openContactPicker(titleText, priceText);
      });
    }

    if (contactPickerCloseBtn && contactPickerModal) {
      contactPickerCloseBtn.addEventListener("click", () => {
        contactPickerModal.hidden = true;
      });
    }

    if (modalCloseBtn && modal) {
      modalCloseBtn.addEventListener("click", () => {
        modal.hidden = true;
      });
    }

    document.addEventListener("click", (event) => {
      const inquireBtn = event.target.closest("[data-inquire-title]");
      if (inquireBtn) {
        event.preventDefault();
        openContactPicker(
          inquireBtn.getAttribute("data-inquire-title") || "",
          inquireBtn.getAttribute("data-inquire-price") || ""
        );
        return;
      }

      const previewTrigger = event.target.closest("[data-preview-title]");
      if (previewTrigger && modal) {
        modalTitle.textContent = previewTrigger.getAttribute("data-preview-title") || "";
        modalMeta.textContent = previewTrigger.getAttribute("data-preview-meta") || "";
        modalPrice.textContent = previewTrigger.getAttribute("data-preview-price") || "";
        modalDesc.textContent = previewTrigger.getAttribute("data-preview-desc") || "";
        const imgUrl = previewTrigger.getAttribute("data-preview-img") || FALLBACK_IMAGES[0];
        modalImage.src = imgUrl;
        modalImage.alt = modalTitle.textContent;
        modal.hidden = false;
        return;
      }

      if (contactPickerModal && !contactPickerModal.hidden && event.target === contactPickerModal) {
        contactPickerModal.hidden = true;
        return;
      }

      if (modal && !modal.hidden && event.target === modal) {
        modal.hidden = true;
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        if (contactPickerModal && !contactPickerModal.hidden) {
          contactPickerModal.hidden = true;
          return;
        }
        if (modal && !modal.hidden) {
          modal.hidden = true;
        }
      }
    });
  }

  function applyHeaderTheme(settings) {
    if (!settings || typeof settings !== "object") return;
    const bgEl = $("heroBgImg");
    const nameEl = $("heroShopName");
    const statusEl = $("shopStatusText");
    if (bgEl && settings.hero_bg_url) bgEl.src = settings.hero_bg_url;
    if (nameEl && settings.shop_name) nameEl.textContent = settings.shop_name;

    const dotTagRe = /\s*\[dot:(#[0-9a-fA-F]{6})\]\s*$/;
    const rawStatusStr = String(settings.shop_status || "");
    const dotMatch = rawStatusStr.match(dotTagRe);
    const cleanStatusText = rawStatusStr.replace(dotTagRe, "");
    const statusDotColor =
      settings.shop_status_color || (dotMatch ? dotMatch[1] : "");

    if (statusEl && cleanStatusText) statusEl.textContent = cleanStatusText;
    if (statusDotColor && /^#[0-9a-fA-F]{6}$/.test(statusDotColor)) {
      document.querySelectorAll(".status-dot").forEach((dot) => {
        dot.style.backgroundColor = statusDotColor;
        dot.style.boxShadow = "0 0 6px " + statusDotColor + "66";
      });
    }

    renderContactPickerChannels(settings);
  }

  async function init() {
    initScrollReveal();
    initBackToTopButton();
    initCreamyGothicCursor();
    initModals();

    let serverSettings = null;
    try {
      const settingsRes = await fetch("/api/site-settings");
      if (settingsRes.ok) {
        serverSettings = await settingsRes.json();
        applyHeaderTheme(serverSettings);
      }
    } catch (_e) {
      // Ignore
    }

    if (db) {
      try {
        const { data: shopData } = await db
          .from("shop_settings")
          .select("*")
          .eq("id", "main")
          .maybeSingle();
        if (shopData) {
          const merged = { ...(serverSettings || {}) };
          if (
            typeof shopData.hero_bunny_url === "string" &&
            shopData.hero_bunny_url.startsWith("__bkh_extra_contacts__:")
          ) {
            try {
              const extra = JSON.parse(
                shopData.hero_bunny_url.slice("__bkh_extra_contacts__:".length)
              );
              if (extra && typeof extra === "object") {
                if (extra.twitter_url) merged.twitter_url = extra.twitter_url;
                if (extra.twitter_text) merged.twitter_text = extra.twitter_text;
                if (extra.discord_url) merged.discord_url = extra.discord_url;
                if (extra.discord_text) merged.discord_text = extra.discord_text;
              }
            } catch (_err) {
              // Ignore malformed JSON
            }
          }
          [
            "line_url",
            "line_text",
            "instagram_url",
            "instagram_text",
            "facebook_url",
            "facebook_text",
            "twitter_url",
            "twitter_text",
            "discord_url",
            "discord_text",
            "hero_girl_url",
            "hero_bg_url",
            "shop_name",
            "shop_subtitle",
            "shop_quote",
            "shop_status",
            "shop_status_color"
          ].forEach((key) => {
            if (shopData[key]) merged[key] = shopData[key];
          });
          applyHeaderTheme(merged);
        }
      } catch (_e) {
        // Ignore
      }

      try {
        const { data, error } = await db
          .from("accounts")
          .select("id,title,category,status,price,description,image_url,created_at")
          .order("created_at", { ascending: false });
        rows = !error && Array.isArray(data) ? data.map(normalizeAccountRow) : [];
      } catch (_e) {
        rows = [];
      }
      render();
      return;
    }

    try {
      const res = await fetch("/api/accounts");
      if (res.ok) {
        const list = await res.json();
        rows = Array.isArray(list) ? list.map(normalizeAccountRow) : [];
      }
    } catch (_e) {
      rows = [];
    }
    render();
  }

  document.addEventListener("DOMContentLoaded", init);
})();