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
    const grid = document.getElementById("homeAccountGrid");
    if (!grid || !allAccounts.length) return;

    const visible = [];
    const count = Math.min(3, allAccounts.length);
    for (let i = 0; i < count; i++) {
      const idx = (startIndex + i) % allAccounts.length;
      visible.push({ item: allAccounts[idx], idx });
    }

    grid.innerHTML = visible
      .map(({ item, idx }) => {
        const fallbackImg = cardFallbacks[idx % cardFallbacks.length] || DEFAULT_CARDS[0];
        const imgSrc = item.image_url ? esc(item.image_url) : fallbackImg;
        const catText = catLabel[item.category] || "ไอดีปกติ";
        const priceFormatted = "฿ " + Number(item.price || 0).toLocaleString("th-TH") + ".-";
        const codeText = "รหัส BKH-" + String(item.id || idx + 1).padStart(2, "0");
        const descText =
          item.description ||
          "ไอดีคัดพิเศษ ตรวจสอบความปลอดภัยเรียบร้อย พร้อมส่งมอบทันที";

        return (
          '<article class="portrait-card">' +
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

    if (Array.isArray(settings.featured_accounts) && settings.featured_accounts.length > 0) {
      const available = settings.featured_accounts.filter(
        (x) => x.status !== "sold"
      );
      allAccounts = available.length ? available : settings.featured_accounts;
      renderCarousel();
    }
  }

  // Load settings from backend API + Supabase
  (async () => {
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

    // Also check Supabase if configured
    const cfg = window.SHOP_CONFIG || {};
    if (!window.supabase || !cfg.supabaseUrl || !cfg.supabaseAnonKey) return;
    const db = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);

    try {
      const { data: accountsData, error: accountsErr } = await db
        .from("accounts")
        .select("id,title,category,status,price,description,image_url,created_at")
        .eq("status", "available")
        .order("created_at", { ascending: false })
        .limit(12);

      if (!accountsErr && Array.isArray(accountsData) && accountsData.length > 0) {
        allAccounts = accountsData;
        renderCarousel();
      }
    } catch (_e) {
      // Keep server accounts
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
        applyThemeSettings(merged);
      }
    } catch (_e) {
      // Keep server settings
    }
  })();
})();