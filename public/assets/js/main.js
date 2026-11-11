// Static storefront interactions and live contact details from Supabase.
document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const target = document.querySelector(link.getAttribute("href"));
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

(async () => {
  const cfg = window.SHOP_CONFIG || {};
  if (!window.supabase || !cfg.supabaseUrl || !cfg.supabaseAnonKey) return;
  const db = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
  const { data, error } = await db.from("shop_settings").select("*").eq("id", "main").maybeSingle();
  if (error || !data) return;
  const channels = [
    ["line", "https://line.me/", "LINE", "L"],
    ["instagram", "https://www.instagram.com/", "INSTAGRAM", "◎"],
    ["facebook", "https://www.facebook.com/", "FACEBOOK", "f"]
  ];
  const list = document.querySelector(".contact-list");
  if (!list) return;
  list.innerHTML = channels.filter(([key]) => data[key + "_url"]).map(([key, fallback, label, symbol]) => {
    const url = data[key + "_url"];
    const text = data[key + "_text"] || label;
    const safeUrl = String(url).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
    const safeText = String(text).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
    return '<a href="' + safeUrl + '" target="_blank" rel="noopener noreferrer"><span class="contact-symbol">' + symbol + '</span><span><b>' + label + '</b><small>' + safeText + '</small></span><i>↗</i></a>';
  }).join("");
  if (!list.children.length) list.innerHTML = "<p>ยังไม่ได้ตั้งค่าช่องทางติดต่อ</p>";
})();
