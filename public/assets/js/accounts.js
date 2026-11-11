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

    $("accountGrid").innerHTML = matches.length
      ? matches
          .map((x, idx) => {
            const fallbackImg = FALLBACK_IMAGES[idx % FALLBACK_IMAGES.length];
            const imgSrc = x.image_url ? esc(x.image_url) : fallbackImg;
            const isSold = x.status === "sold";
            return (
              '<article class="card">' +
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
      : '<p class="empty">ยังไม่มีรายการในหมวดนี้ค่ะ ♡</p>';
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

  async function init() {
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

    let serverRows = [];
    try {
      const res = await fetch("/api/accounts");
      if (res.ok) {
        serverRows = await res.json();
      }
    } catch (_e) {
      // Ignore
    }

    if (db) {
      try {
        const { data, error } = await db
          .from("accounts")
          .select("id,title,category,status,price,description,image_url,created_at")
          .order("created_at", { ascending: false });
        if (!error && Array.isArray(data) && data.length > 0) {
          rows = data;
          render();
          return;
        }
      } catch (_e) {
        // Fallback to serverRows
      }
    }

    rows = serverRows;
    render();
  }

  document.addEventListener("DOMContentLoaded", init);
})();