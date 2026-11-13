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
  const statusName = { available: "พร้อมขาย", installment: "ติดผ่อน", sold: "ขายแล้ว" };
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
    if (!db || !isSupabaseAdmin) {
      throw new Error("กรุณาเข้าสู่ระบบด้วยบัญชี Admin ก่อนอัปโหลดรูป");
    }
    if (!file || !["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      throw new Error("รองรับเฉพาะไฟล์ JPG, PNG หรือ WebP");
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new Error("รูปภาพต้องมีขนาดไม่เกิน 5 MB");
    }
    const safeName = String(file.name || "image").replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = prefix + "/" + Date.now() + "-" + crypto.randomUUID() + "-" + safeName;
    const { data, error } = await db.storage.from("account-images").upload(path, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: false
    });
    if (error) throw new Error("อัปโหลดรูปไม่สำเร็จ: " + error.message);
    const { data: publicData } = db.storage.from("account-images").getPublicUrl(data.path);
    if (!publicData?.publicUrl) throw new Error("สร้าง URL รูปภาพไม่สำเร็จ");
    return publicData.publicUrl;
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
    if (data.user?.app_metadata?.role !== "admin") {
      await db.auth.signOut();
      return message("loginMessage", "บัญชีนี้ยังไม่ได้รับสิทธิ์ Admin", true);
    }
    isSupabaseAdmin = true;
    sessionStorage.removeItem("bkh_quick_admin");
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
        fileInput.value = "";
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
        if (accountFormPreview) accountFormPreview.src = url;
        accountImageFile.value = "";
        message("formMessage", "อัปโหลดรูปการ์ดเรียบร้อย");
      } catch (err) {
        message("formMessage", err.message || "อัปโหลดรูปไม่สำเร็จ", true);
      }
    });
  }

  if (accountImageUrlInput) {
    accountImageUrlInput.addEventListener("input", () => {
      if (accountImageUrlInput.value.trim() && accountFormPreview) {
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
        if (data.hero_girl_url && $("previewHeroGirl")) $("previewHeroGirl").src = data.hero_girl_url;
        if (data.hero_bunny_url && $("previewHeroBunny")) $("previewHeroBunny").src = data.hero_bunny_url;
        if (data.hero_bg_url && $("previewHeroBg")) $("previewHeroBg").src = data.hero_bg_url;
      }

      const contactKeys = [
        "line_url",
        "line_text",
        "instagram_url",
        "instagram_text",
        "facebook_url",
        "facebook_text",
        "twitter_url",
        "twitter_text",
        "discord_url",
        "discord_text"
      ];

      if (contactForm) {
        contactKeys.forEach((k) => {
          if (contactForm.elements[k]) contactForm.elements[k].value = data[k] ?? "";
        });
      }
    } catch (_e) {
      // Ignore
    }

    if (db) {
      try {
        const { data, error } = await db.from("shop_settings").select("*").eq("id", "main").maybeSingle();
        if (error) throw error;
        if (data) {
          let extraContacts = null;
          if (typeof data.hero_bunny_url === "string" && data.hero_bunny_url.startsWith("__bkh_extra_contacts__:")) {
            try {
              extraContacts = JSON.parse(data.hero_bunny_url.slice("__bkh_extra_contacts__:".length));
            } catch (_err) {
              extraContacts = null;
            }
          }
          const contactKeys = [
            "line_url",
            "line_text",
            "instagram_url",
            "instagram_text",
            "facebook_url",
            "facebook_text",
            "twitter_url",
            "twitter_text",
            "discord_url",
            "discord_text"
          ];
          contactKeys.forEach((k) => {
            if (!contactForm?.elements[k]) return;
            if (data[k] != null && data[k] !== "") {
              contactForm.elements[k].value = data[k];
            } else if (extraContacts && extraContacts[k] != null) {
              contactForm.elements[k].value = extraContacts[k];
            }
          });
          ["hero_girl_url", "hero_bg_url", "shop_name", "shop_subtitle", "shop_quote", "shop_status"].forEach((k) => {
            if (themeForm?.elements[k] && data[k] != null) themeForm.elements[k].value = data[k];
          });
          if (data.hero_girl_url && $("previewHeroGirl")) $("previewHeroGirl").src = data.hero_girl_url;
          if (data.hero_bg_url && $("previewHeroBg")) $("previewHeroBg").src = data.hero_bg_url;
        }
      } catch (err) {
        message("themeMessage", "โหลดค่าจาก Supabase ไม่สำเร็จ: " + err.message, true);
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
        shop_name: String(fd.get("shop_name") || "Baekhawhom").trim(),
        shop_subtitle: String(fd.get("shop_subtitle") || "").trim(),
        shop_quote: String(fd.get("shop_quote") || "").trim(),
        shop_status: String(fd.get("shop_status") || "เปิดให้บริการ").trim()
      };
      if (themeForm.elements.hero_bunny_url) {
        payload.hero_bunny_url = String(fd.get("hero_bunny_url") || "").trim();
      }
      if (themeForm.elements.hero_bg_url) {
        payload.hero_bg_url = String(fd.get("hero_bg_url") || "").trim();
      }

      try {
        if (!db || !isSupabaseAdmin) throw new Error("กรุณาเข้าสู่ระบบด้วยบัญชี Admin ก่อนบันทึก");
        const { error } = await db.from("shop_settings").upsert({
          id: "main",
          ...payload,
          updated_at: new Date().toISOString()
        });
        if (error) throw error;
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
      if (!db || !isSupabaseAdmin) throw new Error("กรุณาเข้าสู่ระบบด้วยบัญชี Admin ก่อนบันทึก");
      const cleanDesc = payload.description.replace(INSTALLMENT_TAG_RE, "");
      const primaryPayload = { ...payload, description: cleanDesc };
      let result = id
        ? await db.from("accounts").update(primaryPayload).eq("id", id)
        : await db.from("accounts").insert(primaryPayload);

      // Fallback if remote Supabase table still has the legacy check (status in ('available','sold'))
      if (result.error && payload.status === "installment") {
        const fallbackPayload = {
          ...primaryPayload,
          status: "sold",
          description: cleanDesc ? cleanDesc + "\n[status:installment]" : "[status:installment]"
        };
        result = id
          ? await db.from("accounts").update(fallbackPayload).eq("id", id)
          : await db.from("accounts").insert(fallbackPayload);
      }

      if (result.error) throw result.error;

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
      const { data, error } = await db
        .from("accounts")
        .select("id,title,category,status,price,image_url,description,created_at")
        .order("created_at", { ascending: false });
      if (error) {
        message("formMessage", "โหลดรายการจาก Supabase ไม่สำเร็จ: " + error.message, true);
        rows = [];
      } else {
        rows = Array.isArray(data) ? data : [];
      }
    }

    rows = rows.map(normalizeAccountRow);
    $("totalCount").textContent = rows.length;
    $("availableCount").textContent = rows.filter((x) => x.status === "available").length;
    $("soldCount").textContent = rows.filter(
      (x) => x.status === "sold" || x.status === "installment"
    ).length;
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
      if (!db || !isSupabaseAdmin) return message("formMessage", "กรุณาเข้าสู่ระบบด้วยบัญชี Admin", true);
      const { error } = await db.from("accounts").delete().eq("id", x.id);
      if (error) return message("formMessage", error.message, true);
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
      facebook_text: String(fd.get("facebook_text") || "").trim(),
      twitter_url: String(fd.get("twitter_url") || "").trim(),
      twitter_text: String(fd.get("twitter_text") || "").trim(),
      discord_url: String(fd.get("discord_url") || "").trim(),
      discord_text: String(fd.get("discord_text") || "").trim()
    };

    try {
      await fetch("/api/site-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }).catch(() => {});

      if (!db || !isSupabaseAdmin) throw new Error("กรุณาเข้าสู่ระบบด้วยบัญชี Admin ก่อนบันทึก");
      let { error } = await db.from("shop_settings").upsert({
        id: "main",
        ...payload,
        updated_at: new Date().toISOString()
      });

      // Fallback if remote Supabase table has not added twitter_*/discord_* columns yet
      if (error) {
        const extraJson =
          "__bkh_extra_contacts__:" +
          JSON.stringify({
            twitter_url: payload.twitter_url,
            twitter_text: payload.twitter_text,
            discord_url: payload.discord_url,
            discord_text: payload.discord_text
          });
        const fallbackResult = await db.from("shop_settings").upsert({
          id: "main",
          line_url: payload.line_url,
          line_text: payload.line_text,
          instagram_url: payload.instagram_url,
          instagram_text: payload.instagram_text,
          facebook_url: payload.facebook_url,
          facebook_text: payload.facebook_text,
          hero_bunny_url: extraJson,
          updated_at: new Date().toISOString()
        });
        error = fallbackResult.error;
      }

      if (error) throw error;
      message("contactMessage", "บันทึกช่องทางติดต่อเรียบร้อยแล้ว ♡");
    } catch (err) {
      message("contactMessage", err.message || "เกิดข้อผิดพลาด", true);
    }
  });

  document.addEventListener("DOMContentLoaded", verifySession);
})();