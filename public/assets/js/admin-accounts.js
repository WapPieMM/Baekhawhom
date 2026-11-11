(() => {
  const FALLBACK_THUMB = "/assets/images/theme/card_portrait_1.jpg";
  const cfg = window.SHOP_CONFIG || {};
  const $ = (id) => document.getElementById(id);
  const form = $("accountForm");
  const contactForm = $("contactForm");
  const themeForm = $("themeForm");

  const ready =
    window.supabase &&
    cfg.supabaseUrl &&
    cfg.supabaseAnonKey &&
    !cfg.supabaseUrl.includes("YOUR-PROJECT");
  const db = ready
    ? window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey)
    : null;

  let rows = [];
  let pendingDeleteId = null;
  let isSupabaseAdmin = false;

  const categoryName = { chicken_skin: "ไอดีไก่สกิน", normal: "ไอดีปกติ" };
  const statusName = { available: "พร้อมขาย", sold: "ขายแล้ว" };
  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
    );

  function message(id, text, error = false) {
    const el = $(id);
    if (!el) return;
    el.textContent = text;
    el.style.color = error ? "#a45d52" : "#5a7247";
  }

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("ไม่สามารถอ่านไฟล์รูปภาพได้"));
      reader.readAsDataURL(file);
    });
  }

  async function uploadImageFile(file, prefix = "upload") {
    if (file.size > 10 * 1024 * 1024) {
      throw new Error("รูปภาพต้องมีขนาดไม่เกิน 10 MB");
    }
    const dataUrl = await readFileAsDataUrl(file);
    const res = await fetch("/api/upload-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dataUrl, prefix })
    });
    const json = await res.json();
    if (!res.ok || !json.url) {
      throw new Error(json.error || "อัปโหลดรูปไม่สำเร็จ");
    }
    return json.url;
  }

  function showAdmin() {
    $("loginPanel").hidden = true;
    $("managerPanel").hidden = false;
    $("logoutBtn").hidden = false;
    loadThemeAndContacts();
    loadAccounts();
  }

  async function verifySession() {
    // Allow quick access or check existing session
    if (sessionStorage.getItem("bkh_quick_admin") === "1") {
      showAdmin();
      return;
    }
    if (!db) {
      showAdmin();
      return;
    }
    try {
      const {
        data: { session }
      } = await db.auth.getSession();
      if (!session) return;
      const {
        data: { user }
      } = await db.auth.getUser();
      if (user?.app_metadata?.role === "admin") {
        isSupabaseAdmin = true;
        showAdmin();
      }
    } catch (_e) {
      // Stay on login panel
    }
  }

  if ($("quickAccessBtn")) {
    $("quickAccessBtn").addEventListener("click", () => {
      sessionStorage.setItem("bkh_quick_admin", "1");
      showAdmin();
    });
  }

  $("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!db) {
      sessionStorage.setItem("bkh_quick_admin", "1");
      return showAdmin();
    }
    const fd = new FormData(e.currentTarget);
    const { data, error } = await db.auth.signInWithPassword({
      email: fd.get("email"),
      password: fd.get("password")
    });
    if (error) return message("loginMessage", error.message, true);
    if (data.user?.app_metadata?.role === "admin") {
      isSupabaseAdmin = true;
    }
    sessionStorage.setItem("bkh_quick_admin", "1");
    showAdmin();
  });

  $("logoutBtn").addEventListener("click", async () => {
    sessionStorage.removeItem("bkh_quick_admin");
    if (db) await db.auth.signOut();
    location.reload();
  });

  // Live file upload handlers for the 3 Hero Image Slots
  function wireHeroSlotUpload(fileInputId, urlInputName, previewImgId, prefix) {
    const fileInput = $(fileInputId);
    const previewImg = $(previewImgId);
    const urlInput = themeForm?.elements[urlInputName];
    if (!fileInput || !previewImg || !urlInput) return;

    fileInput.addEventListener("change", async () => {
      const file = fileInput.files?.[0];
      if (!file) return;
      try {
        message("themeMessage", "กำลังอัปโหลดรูปภาพ...");
        const uploadedUrl = await uploadImageFile(file, prefix);
        urlInput.value = uploadedUrl;
        previewImg.src = uploadedUrl;
        message("themeMessage", "อัปโหลดรูปเรียบร้อย กดปุ่ม 'บันทึกการตั้งค่าหน้าแรก' เพื่อใช้งาน");
      } catch (err) {
        message("themeMessage", err.message || "อัปโหลดไม่สำเร็จ", true);
      }
    });

    urlInput.addEventListener("input", () => {
      if (urlInput.value.trim()) {
        previewImg.src = urlInput.value.trim();
      }
    });
  }

  wireHeroSlotUpload("fileHeroGirl", "hero_girl_url", "previewHeroGirl", "hero_girl");
  wireHeroSlotUpload("fileHeroBunny", "hero_bunny_url", "previewHeroBunny", "hero_bunny");
  wireHeroSlotUpload("fileHeroBg", "hero_bg_url", "previewHeroBg", "hero_bg");

  // Account card image preview
  const accountImageFile = $("accountImageFile");
  const accountImageUrlInput = $("accountImageUrlInput");
  const accountFormPreview = $("accountFormPreview");

  if (accountImageFile) {
    accountImageFile.addEventListener("change", async () => {
      const file = accountImageFile.files?.[0];
      if (!file) return;
      try {
        message("formMessage", "กำลังอัปโหลดรูปการ์ด...");
        const url = await uploadImageFile(file, "card");
        accountImageUrlInput.value = url;
        accountFormPreview.src = url;
        message("formMessage", "อัปโหลดรูปการ์ดเรียบร้อย");
      } catch (err) {
        message("formMessage", err.message || "อัปโหลดรูปไม่สำเร็จ", true);
      }
    });
  }

  if (accountImageUrlInput) {
    accountImageUrlInput.addEventListener("input", () => {
      if (accountImageUrlInput.value.trim()) {
        accountFormPreview.src = accountImageUrlInput.value.trim();
      }
    });
  }

  // Load Theme & Contact Settings
  async function loadThemeAndContacts() {
    try {
      const res = await fetch("/api/site-settings");
      if (!res.ok) return;
      const data = await res.json();

      if (themeForm) {
        ["hero_girl_url", "hero_bunny_url", "hero_bg_url", "shop_name", "shop_subtitle", "shop_quote", "shop_status"].forEach((k) => {
          if (themeForm.elements[k]) themeForm.elements[k].value = data[k] ?? "";
        });
        if (data.hero_girl_url) $("previewHeroGirl").src = data.hero_girl_url;
        if (data.hero_bunny_url) $("previewHeroBunny").src = data.hero_bunny_url;
        if (data.hero_bg_url) $("previewHeroBg").src = data.hero_bg_url;
      }

      if (contactForm) {
        ["line_url", "line_text", "instagram_url", "instagram_text", "facebook_url", "facebook_text"].forEach((k) => {
          if (contactForm.elements[k]) contactForm.elements[k].value = data[k] ?? "";
        });
      }
    } catch (_e) {
      // Ignore
    }

    if (db && isSupabaseAdmin) {
      try {
        const { data } = await db
          .from("shop_settings")
          .select("*")
          .eq("id", "main")
          .maybeSingle();
        if (data && contactForm) {
          ["line_url", "line_text", "instagram_url", "instagram_text", "facebook_url", "facebook_text"].forEach((k) => {
            if (data[k] && contactForm.elements[k]) {
              contactForm.elements[k].value = data[k];
            }
          });
        }
      } catch (_e) {
        // Ignore
      }
    }
  }

  // Save Homepage Theme Form
  if (themeForm) {
    themeForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(themeForm);
      const payload = {
        hero_girl_url: String(fd.get("hero_girl_url") || "").trim(),
        hero_bunny_url: String(fd.get("hero_bunny_url") || "").trim(),
        hero_bg_url: String(fd.get("hero_bg_url") || "").trim(),
        shop_name: String(fd.get("shop_name") || "Baekhawhom").trim(),
        shop_subtitle: String(fd.get("shop_subtitle") || "").trim(),
        shop_quote: String(fd.get("shop_quote") || "").trim(),
        shop_status: String(fd.get("shop_status") || "เปิดให้บริการ").trim()
      };

      try {
        const res = await fetch("/api/site-settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error("บันทึกไม่สำเร็จ");
        message("themeMessage", "บันทึกรูปภาพและข้อความหน้าแรกเรียบร้อยแล้ว ♡");
      } catch (err) {
        message("themeMessage", err.message || "เกิดข้อผิดพลาด", true);
      }
    });
  }

  if ($("resetThemeBtn")) {
    $("resetThemeBtn").addEventListener("click", async () => {
      try {
        const res = await fetch("/api/site-settings/reset", { method: "POST" });
        if (res.ok) {
          await loadThemeAndContacts();
          await loadAccounts();
          message("themeMessage", "รีเซ็ตรูปภาพหน้าแรกกลับเป็นค่าเริ่มต้นเรียบร้อย");
        }
      } catch (_e) {
        message("themeMessage", "รีเซ็ตไม่สำเร็จ", true);
      }
    });
  }

  function resetAccountForm() {
    form.reset();
    form.elements.id.value = "";
    form.elements.price.value = "299";
    form.elements.image_url.value = "";
    if (accountFormPreview) accountFormPreview.src = FALLBACK_THUMB;
    $("formTitle").textContent = "เพิ่ม / แก้ไขไอดีและรูปการ์ด";
    message("formMessage", "");
  }

  $("resetBtn").addEventListener("click", resetAccountForm);

  // Save Account Form (Server API + Supabase if Admin)
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const id = fd.get("id");
    let imageUrl = String(fd.get("image_url") || "").trim();

    const file = fd.get("image_file");
    if (file && file.size && !imageUrl.startsWith("/uploads/")) {
      try {
        imageUrl = await uploadImageFile(file, "card");
      } catch (err) {
        return message("formMessage", err.message, true);
      }
    }

    const payload = {
      title: String(fd.get("title") || "").trim(),
      category: fd.get("category"),
      status: fd.get("status"),
      price: Number(fd.get("price")),
      description: String(fd.get("description") || "").trim(),
      image_url: imageUrl || FALLBACK_THUMB
    };

    if (!payload.title || !Number.isFinite(payload.price) || payload.price < 0) {
      return message("formMessage", "กรุณาตรวจสอบชื่อและราคา", true);
    }

    try {
      const endpoint = id ? `/api/accounts/${encodeURIComponent(id)}` : "/api/accounts";
      const method = id ? "PUT" : "POST";
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("บันทึกไอดีไม่สำเร็จ");

      if (db && isSupabaseAdmin) {
        if (id) {
          await db.from("accounts").update(payload).eq("id", id);
        } else {
          await db.from("accounts").insert(payload);
        }
      }

      message("formMessage", "บันทึกรายการไอดีเรียบร้อย ♡");
      resetAccountForm();
      await loadAccounts();
    } catch (err) {
      message("formMessage", err.message || "เกิดข้อผิดพลาด", true);
    }
  });

  async function loadAccounts() {
    try {
      const res = await fetch("/api/accounts");
      if (res.ok) {
        rows = await res.json();
      }
    } catch (_e) {
      rows = [];
    }

    if (db && isSupabaseAdmin) {
      try {
        const { data, error } = await db
          .from("accounts")
          .select("id,title,category,status,price,image_url,description,created_at")
          .order("created_at", { ascending: false });
        if (!error && Array.isArray(data) && data.length > 0) {
          rows = data;
        }
      } catch (_e) {
        // Keep server rows
      }
    }

    $("totalCount").textContent = rows.length;
    $("availableCount").textContent = rows.filter((x) => x.status === "available").length;
    $("soldCount").textContent = rows.filter((x) => x.status === "sold").length;
    renderAccounts();
  }

  function renderAccounts() {
    const cat = $("categoryFilter").value;
    const st = $("statusFilter").value;
    const list = rows.filter(
      (x) => (!cat || x.category === cat) && (!st || x.status === st)
    );
    $("accountList").innerHTML = list.length
      ? list
          .map((x) => {
            const imgSrc = x.image_url ? esc(x.image_url) : FALLBACK_THUMB;
            const isConfirming = pendingDeleteId === String(x.id);
            return (
              '<article class="account-row">' +
              '<div><img src="' +
              imgSrc +
              '" alt="' +
              esc(x.title) +
              '" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src=\'' +
              FALLBACK_THUMB +
              '\';"></div>' +
              "<div><h3>" +
              esc(x.title) +
              "</h3><p>" +
              (categoryName[x.category] || "ไอดีปกติ") +
              " · ฿ " +
              Number(x.price).toLocaleString("th-TH") +
              " · " +
              (statusName[x.status] || "พร้อมขาย") +
              "</p></div>" +
              '<div class="row-actions">' +
              '<button type="button" data-edit="' +
              x.id +
              '">แก้ไข / เปลี่ยนรูป</button>' +
              '<button type="button" data-delete="' +
              x.id +
              '">' +
              (isConfirming ? "ยืนยันลบ?" : "ลบ") +
              "</button>" +
              "</div></article>"
            );
          })
          .join("")
      : '<p class="muted">ยังไม่มีรายการในตัวกรองนี้</p>';
  }

  $("accountList").addEventListener("click", async (e) => {
    const edit = e.target.closest("[data-edit]");
    const del = e.target.closest("[data-delete]");
    if (edit) {
      pendingDeleteId = null;
      const x = rows.find((a) => String(a.id) === edit.dataset.edit);
      if (!x) return;
      Object.entries(x).forEach(([k, v]) => {
        if (form.elements[k] && k !== "image_file") form.elements[k].value = v ?? "";
      });
      if (accountFormPreview) {
        accountFormPreview.src = x.image_url || FALLBACK_THUMB;
      }
      $("formTitle").textContent = "แก้ไขไอดี #" + x.id;
      form.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    if (del) {
      const targetId = del.dataset.delete;
      if (pendingDeleteId !== targetId) {
        pendingDeleteId = targetId;
        renderAccounts();
        return;
      }
      pendingDeleteId = null;
      const x = rows.find((a) => String(a.id) === targetId);
      if (!x) return;
      await fetch(`/api/accounts/${encodeURIComponent(x.id)}`, { method: "DELETE" });
      if (db && isSupabaseAdmin) {
        await db.from("accounts").delete().eq("id", x.id);
      }
      resetAccountForm();
      await loadAccounts();
    }
  });

  $("categoryFilter").addEventListener("change", renderAccounts);
  $("statusFilter").addEventListener("change", renderAccounts);
  $("refreshBtn").addEventListener("click", loadAccounts);

  // Save Contact Channels
  contactForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(contactForm);
    const payload = {
      line_url: String(fd.get("line_url") || "").trim(),
      line_text: String(fd.get("line_text") || "").trim(),
      instagram_url: String(fd.get("instagram_url") || "").trim(),
      instagram_text: String(fd.get("instagram_text") || "").trim(),
      facebook_url: String(fd.get("facebook_url") || "").trim(),
      facebook_text: String(fd.get("facebook_text") || "").trim()
    };

    try {
      const res = await fetch("/api/site-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("บันทึกไม่สำเร็จ");

      if (db && isSupabaseAdmin) {
        await db.from("shop_settings").upsert({
          id: "main",
          ...payload,
          updated_at: new Date().toISOString()
        });
      }
      message("contactMessage", "บันทึกช่องทางติดต่อเรียบร้อยแล้ว ♡");
    } catch (err) {
      message("contactMessage", err.message || "เกิดข้อผิดพลาด", true);
    }
  });

  document.addEventListener("DOMContentLoaded", verifySession);
})();