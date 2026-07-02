/**
 * Eukalyptus Trouportaal — gaste-werf logika.
 *  - Toegangshek (gedeelde kode)
 *  - Laai redigeerbare teks (Supabase → andersins verstek)
 *  - Aftelling, galery + lightbox, program/verblyf/vrae/bank
 *  - RSVP-vorm wat na Supabase stoor
 */
(function () {
  "use strict";
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const GATE_KEY = "hj_gate_ok";
  let content = Object.assign({}, window.CONTENT_DEFAULTS);

  /* ---- inhoud laai ---- */
  async function loadContent() {
    const client = window.getSupabaseClient();
    if (!client) return;
    try {
      const { data, error } = await client.from("content").select("key, value");
      if (error) throw error;
      (data || []).forEach((r) => {
        if (r.value != null && r.value !== "") content[r.key] = r.value;
      });
    } catch (e) {
      console.warn("Kon nie inhoud laai nie, gebruik verstek:", e);
    }
  }

  function applyContent() {
    $$("[data-content]").forEach((el) => {
      const k = el.getAttribute("data-content");
      if (!(k in content)) return;
      // alle teks ondersteun vet/skuins markering (veilig — geen innerHTML)
      window.markdownToDOM(el, content[k]);
    });
    document.title = (content.bruidegom || "Hennie") + " & " + (content.bruid || "Jolinda") + " — Trouportaal";
    renderStorie();
    renderProgram();
    renderVerblyf();
    renderVrae();
    renderBank();
    renderTemaSwatches();
    renderRsvpExtra();
    // Verblyf-ligging: sit die Google Maps-skakel op die knoppie; leeg = versteek die blok
    const vmapBox = $("#verblyf-map"), vmapA = $("#verblyf-map-a");
    if (vmapBox && vmapA) {
      const mapUrl = String(content.verblyf_map_url == null ? "" : content.verblyf_map_url).trim();
      if (/^https?:\/\//i.test(mapUrl)) { vmapA.href = mapUrl; vmapBox.style.display = ""; }
      else vmapBox.style.display = "none";
    }
    startCountdown(content.datum_iso);
  }

  // Eie RSVP-vrae (deur die admin bygevoeg)
  function renderRsvpExtra() {
    const box = $("#rsvp-extra-q");
    if (!box) return;
    box.innerHTML = "";
    flexItems(content.rsvp_extra, ["vraag", "tipe"]).forEach((it) => {
      if (!it.vraag) return;
      const grp = document.createElement("div"); grp.className = "rgrp";
      const row = document.createElement("div"); row.className = "rrow";
      const q = document.createElement("span"); q.className = "rq"; q.style.margin = "0"; q.textContent = it.vraag;
      row.appendChild(q); grp.appendChild(row);
      const inp = it.tipe === "lank" ? document.createElement("textarea") : document.createElement("input");
      if (it.tipe !== "lank") inp.type = "text";
      inp.className = "rin"; inp.setAttribute("data-extra", it.vraag);
      grp.appendChild(inp); box.appendChild(grp);
    });
  }

  // Lees die storie-blokke (JSON) veilig
  function storieBlocks() {
    try {
      const arr = JSON.parse(content.storie_blocks || "[]");
      return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
  }

  // ---- Ons storie (herhaalbare blokke, foto links/regs) ----
  function renderStorie() {
    const box = $("#storie-blocks");
    if (!box) return;
    const roman = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
    box.innerHTML = "";
    storieBlocks().forEach((b, i) => {
      const right = b.align === "right";
      const row = document.createElement("div");
      row.className = "two";
      row.dataset.storie = String(i);

      const imgWrap = document.createElement("div");
      imgWrap.className = "two__img " + (right ? "two__img--r" : "two__img--l");
      const img = document.createElement("img");
      img.src = window.resolveImg(b.img, "assets/foto/ring.jpg");
      img.alt = b.titel || "Foto"; img.loading = "lazy";
      const ic = document.createElement("i");
      imgWrap.appendChild(img); imgWrap.appendChild(ic);

      const txt = document.createElement("div");
      const chap = document.createElement("div"); chap.className = "chap";
      const rb = document.createElement("b"); rb.textContent = roman[i] || String(i + 1);
      const cl = document.createElement("span"); cl.className = "l";
      const ct = document.createElement("span"); ct.className = "t"; ct.textContent = b.hoofstuk || "";
      chap.appendChild(rb); chap.appendChild(cl); chap.appendChild(ct);
      const h = document.createElement("h3"); h.className = "chap-h";
      window.markdownToDOM(h, b.titel || "");
      txt.appendChild(chap); txt.appendChild(h);
      String(b.teks || "").split(/\n\s*\n/).forEach((par) => {
        const p = document.createElement("p"); p.className = "prose";
        window.markdownToDOM(p, par);
        txt.appendChild(p);
      });

      // foto regs = teks eerste in die DOM (linkerkolom), dan foto
      if (right) { row.appendChild(txt); row.appendChild(imgWrap); }
      else { row.appendChild(imgWrap); row.appendChild(txt); }
      box.appendChild(row);
    });
  }

  /* ---- program / verblyf / vrae / bank ---- */
  // Lees 'n lys-veld as objekte — werk vir nuwe JSON-formaat OF die ou "a | b | c"-formaat.
  function flexItems(raw, props) {
    const v = String(raw == null ? "" : raw).trim();
    if (v.charAt(0) === "[") {
      try { const a = JSON.parse(v); if (Array.isArray(a)) return a; } catch (e) { /* val terug */ }
    }
    return window.parseList(v).map((cols) => {
      const o = {};
      props.forEach((p, i) => { o[p] = (i === props.length - 1) ? cols.slice(i).join(" | ") : (cols[i] || ""); });
      return o;
    });
  }

  function renderProgram() {
    [["program_vry", "#prog-vry"], ["program_sat", "#prog-sat"], ["program_son", "#prog-son"]]
      .forEach(([key, sel]) => {
        const box = $(sel);
        if (!box) return;
        box.innerHTML = "";
        flexItems(content[key], ["tyd", "titel", "info"]).forEach((it) => {
          const row = document.createElement("div"); row.className = "tl";
          const dot = document.createElement("i");
          const t = document.createElement("div"); t.className = "t"; t.textContent = it.tyd || "";
          const d = document.createElement("div");
          const h = document.createElement("h4"); h.textContent = it.titel || "";
          const p = document.createElement("p"); window.markdownToDOM(p, it.info || "");
          d.appendChild(h); d.appendChild(p);
          row.appendChild(dot); row.appendChild(t); row.appendChild(d);
          box.appendChild(row);
        });
      });
  }

  function renderVerblyf() {
    const box = $("#verblyf-cards");
    if (!box) return;
    box.innerHTML = "";
    flexItems(content.verblyf, ["naam", "afstand", "info"]).forEach((it) => {
      const card = document.createElement("div"); card.className = "vcard";
      const dot = document.createElement("span"); dot.className = "dot";
      const h = document.createElement("h3"); h.textContent = it.naam || "";
      const far = document.createElement("span"); far.className = "far"; far.textContent = it.afstand || "";
      const p = document.createElement("p"); window.markdownToDOM(p, it.info || "");
      card.appendChild(dot); card.appendChild(h); card.appendChild(far); card.appendChild(p);
      box.appendChild(card);
    });
  }

  function renderVrae() {
    const box = $("#vrae-list");
    if (!box) return;
    box.innerHTML = "";
    flexItems(content.vrae, ["vraag", "antwoord"]).forEach((it) => {
      const det = document.createElement("details"); det.className = "det";
      const sum = document.createElement("summary");
      const q = document.createElement("span"); q.className = "q";
      const dia = document.createElement("i");
      const qt = document.createElement("span"); qt.textContent = it.vraag || "";
      q.appendChild(dia); q.appendChild(qt);
      const plus = document.createElement("span"); plus.className = "plus"; plus.textContent = "+";
      sum.appendChild(q); sum.appendChild(plus);
      const ans = document.createElement("p"); window.markdownToDOM(ans, it.antwoord || "");
      det.appendChild(sum); det.appendChild(ans);
      box.appendChild(det);
    });
  }

  function renderBank() {
    const box = $("#bank");
    if (!box) return;
    box.innerHTML = "";
    flexItems(content.bank, ["label", "value"]).forEach((it) => {
      const row = document.createElement("div"); row.className = "bankrow";
      const k = document.createElement("span"); k.className = "k"; k.textContent = it.label || "";
      const v = document.createElement("span"); v.className = "v"; v.textContent = it.value || "";
      row.appendChild(k); row.appendChild(v);
      box.appendChild(row);
    });
  }

  function renderTemaSwatches() {
    const box = $("#tema-swatches");
    if (!box) return;
    box.innerHTML = "";
    flexItems(content.tema_swatches, ["label", "color"]).forEach((it) => {
      const sw = document.createElement("div"); sw.className = "sw";
      const i = document.createElement("i"); i.style.background = it.color || "#8C9A6E";
      const s = document.createElement("span"); s.textContent = it.label || "";
      sw.appendChild(i); sw.appendChild(s);
      box.appendChild(sw);
    });
  }

  /* ---- aftelling ---- */
  let cdTimer = null;
  function startCountdown(iso) {
    const target = new Date(iso).getTime();
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    if (isNaN(target)) return;
    const p = (n) => String(n).padStart(2, "0");
    function tick() {
      let diff = target - Date.now();
      if (diff <= 0) {
        set("cd-dae", "0"); set("cd-ure", "00"); set("cd-min", "00"); set("cd-sek", "00");
        if (cdTimer) clearInterval(cdTimer);
        return;
      }
      set("cd-dae", String(Math.floor(diff / 86400000)));
      set("cd-ure", p(Math.floor((diff % 86400000) / 3600000)));
      set("cd-min", p(Math.floor((diff % 3600000) / 60000)));
      set("cd-sek", p(Math.floor((diff % 60000) / 1000)));
    }
    tick();
    if (cdTimer) clearInterval(cdTimer);
    cdTimer = setInterval(tick, 1000);
  }

  /* ---- foto's per afdeling (hero/storie/tema) uit inhoud ---- */
  function applyImages() {
    const fb = Object.fromEntries(
      window.CONTENT_SCHEMA.filter((f) => f.type === "image").map((f) => [f.key, f.fallback || ""])
    );
    $$("[data-img]").forEach((el) => {
      const key = el.getAttribute("data-img");
      const url = window.resolveImg(content[key], fb[key]);
      if (!url) return;
      if (el.tagName === "IMG") el.src = url;
      else el.style.backgroundImage = 'url("' + url + '")';
    });
  }

  /* ---- galery + lightbox ---- */
  let gallery = [];
  async function renderGallery() {
    const box = $("#gal");
    if (!box) return;
    let photos = [];
    // 1) Gestoorde galery (uit die admin)?
    try {
      const arr = JSON.parse(content.gallery_images || "[]");
      if (Array.isArray(arr) && arr.length) {
        photos = arr
          .filter((x) => x && x.url)
          .map((x) => ({ thumbSrc: x.url, fullSrc: x.url, alt: x.alt || "Foto" }));
      }
    } catch (e) { /* val terug op verstek */ }
    // 2) Verstek-galery (gebundelde foto's)
    if (!photos.length) {
      try {
        const res = await fetch("assets/foto/gallery.json");
        const data = await res.json();
        photos = (data || []).map((g) => ({
          thumbSrc: "assets/foto/" + g.thumb,
          fullSrc: "assets/foto/" + g.full,
          alt: g.alt || "Foto",
        }));
      } catch (e) { console.warn("Galery kon nie laai nie:", e); return; }
    }
    gallery = photos;
    box.innerHTML = "";
    gallery.forEach((g, i) => {
      const b = document.createElement("button");
      b.className = "gal__tile"; b.type = "button";
      b.setAttribute("aria-label", g.alt);
      const img = document.createElement("img");
      img.src = g.thumbSrc; img.alt = g.alt;
      img.loading = "lazy"; img.decoding = "async";
      b.appendChild(img);
      b.addEventListener("click", () => openLb(i));
      box.appendChild(b);
    });
  }
  let lbIdx = 0;
  function openLb(i) {
    lbIdx = i; const lb = $("#lightbox");
    showLb(); lb.classList.remove("hidden");
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", lbKey);
  }
  function showLb() {
    const g = gallery[lbIdx]; if (!g) return;
    const img = $("#lb-img"); img.src = g.fullSrc; img.alt = g.alt || "";
    $("#lb-count").textContent = (lbIdx + 1) + " / " + gallery.length;
  }
  function closeLb() {
    $("#lightbox").classList.add("hidden");
    document.body.style.overflow = "";
    document.removeEventListener("keydown", lbKey);
  }
  function lbGo(d) { lbIdx = (lbIdx + d + gallery.length) % gallery.length; showLb(); }
  function lbKey(e) {
    if (e.key === "Escape") closeLb();
    else if (e.key === "ArrowRight") lbGo(1);
    else if (e.key === "ArrowLeft") lbGo(-1);
  }
  function setupLb() {
    const lb = $("#lightbox");
    $("[data-lb-close]", lb).addEventListener("click", closeLb);
    $("[data-lb-next]", lb).addEventListener("click", (e) => { e.stopPropagation(); lbGo(1); });
    $("[data-lb-prev]", lb).addEventListener("click", (e) => { e.stopPropagation(); lbGo(-1); });
    lb.addEventListener("click", (e) => { if (e.target === lb) closeLb(); });
  }

  /* ---- gate ---- */
  function showSite() {
    $("#gate").classList.add("hidden");
    $("#site").classList.remove("hidden");
  }
  function setupGate() {
    const passed = (function () { try { return localStorage.getItem(GATE_KEY) === "1"; } catch (e) { return false; } })();
    if (passed) { showSite(); return; }
    $("#gate").classList.remove("hidden");
    const input = $("#gate-code"), err = $("#gate-err");
    function tryGate() {
      const val = (input.value || "").trim().toLowerCase();
      const code = String(content.gate_code || "").trim().toLowerCase();
      if (val && code && val === code) {
        try { localStorage.setItem(GATE_KEY, "1"); } catch (e) {}
        err.classList.add("hidden");
        showSite(); window.scrollTo(0, 0);
      } else {
        err.textContent = val ? "Ons kon nie hierdie kode kry nie. Kyk gerus jou uitnodiging." : "Vul asseblief die kode in.";
        err.classList.remove("hidden");
      }
    }
    $("#gate-btn").addEventListener("click", tryGate);
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") tryGate(); });
  }

  /* ---- navigasie + reveal ---- */
  function setupNav() {
    const nav = $(".nav");
    const toggle = $(".nav__toggle");
    function closeMenu() {
      if (nav) nav.classList.remove("open");
      if (toggle) toggle.setAttribute("aria-expanded", "false");
    }

    // Robuuste "gladde sprong" na 'n afdeling.
    // Lui-gelaaide foto's en lettertipes kan die bladsy-hoogte NÁ die eerste sprong laat groei,
    // wat gemaak het dat 'n mens die skakel twee keer moes klik. Ons herbereken die teiken 'n
    // paar keer sodat die eerste klik reg land — en staak sodra die gas self begin scroll.
    let scrollToken = 0;
    function scrollToId(id) {
      const el = document.getElementById(id);
      if (!el) return;
      const token = ++scrollToken;
      // gebruik die werklike kop-hoogte sodat die afdeling nie agter die kieslys wegkruip nie,
      // en beperk tot die bereikbare bereik (RSVP is die laaste afdeling).
      const targetY = function () {
        const offset = (nav ? nav.offsetHeight : 70) + 12;
        const raw = el.getBoundingClientRect().top + window.scrollY - offset;
        const max = document.documentElement.scrollHeight - window.innerHeight;
        return Math.max(0, Math.min(raw, max));
      };
      let cancelled = false;
      const stop = function () { cancelled = true; };
      window.addEventListener("wheel", stop, { passive: true });
      window.addEventListener("touchmove", stop, { passive: true });
      function cleanup() {
        window.removeEventListener("wheel", stop);
        window.removeEventListener("touchmove", stop);
      }
      window.scrollTo({ top: targetY(), behavior: "smooth" });
      let passes = 0;
      (function settle() {
        if (cancelled || token !== scrollToken || passes++ >= 6) { cleanup(); return; }
        setTimeout(function () {
          if (cancelled || token !== scrollToken) { cleanup(); return; }
          const want = targetY();
          if (Math.abs(want - window.scrollY) > 2) window.scrollTo({ top: want, behavior: "smooth" });
          settle();
        }, 220);
      })();
    }

    $$("[data-scroll]").forEach((b) => b.addEventListener("click", () => {
      closeMenu(); // maak die hamburger-kieslys toe wanneer 'n skakel geklik word
      scrollToId(b.getAttribute("data-scroll"));
    }));
    // Hamburger oop/toe (tablet & mobiel)
    if (toggle && nav) {
      toggle.addEventListener("click", (e) => {
        e.stopPropagation();
        const open = nav.classList.toggle("open");
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
      });
      // klik buite die kieslys maak dit toe
      document.addEventListener("click", (e) => {
        if (nav.classList.contains("open") && !nav.contains(e.target)) closeMenu();
      });
      // Escape maak dit toe
      document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeMenu(); });
    }
    const logout = $("#gate-logout");
    if (logout) logout.addEventListener("click", () => {
      try { localStorage.removeItem(GATE_KEY); } catch (e) {}
      location.reload();
    });
  }
  function setupReveal() {
    const els = $$("[data-reveal]");
    if (!("IntersectionObserver" in window) || !els.length) { els.forEach((e) => e.classList.add("in")); return; }
    const io = new IntersectionObserver((es) => {
      es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    els.forEach((e) => io.observe(e));
  }

  /* ---- RSVP ---- */
  const rsvp = { kom: null, slaap: null, naweek: "", ontbyt: null };
  // Kies 'n inhoud-waarde, val terug op 'n verstek as dit leeg is.
  function ctext(key, fallback) {
    const v = content[key];
    return (v != null && String(v).trim() !== "") ? String(v) : fallback;
  }
  function setupRsvp() {
    const form = $("#rsvp-form");
    if (!form) return;
    const max = Math.max(1, Math.min(12, parseInt(content.rsvp_max, 10) || 4));
    const naamPh = ctext("rsvp_ph_naam", "Naam & van");
    // naamvelde: begin met een, en 'n "+"-knoppie voeg meer by tot by die maksimum
    const gv = $("#gaste-velde");
    if (!gv) return;
    gv.innerHTML = "";
    let gasteCount = 0;
    function addGasteField(first) {
      const inp = document.createElement("input");
      inp.className = "rin"; inp.dataset.gas = String(gasteCount);
      inp.placeholder = first ? naamPh : ("Gas " + (gasteCount + 1));
      gv.appendChild(inp);
      gasteCount++;
    }
    addGasteField(true);
    const addGasBtn = document.createElement("button");
    addGasBtn.type = "button"; addGasBtn.className = "rsvp-addgas";
    addGasBtn.textContent = "+ Voeg nog 'n gas by";
    addGasBtn.addEventListener("click", () => {
      if (gasteCount >= max) return;
      addGasteField(false);
      $$("#gaste-velde [data-gas]").slice(-1)[0].focus();
      if (gasteCount >= max) addGasBtn.style.display = "none";
    });
    if (max <= 1) addGasBtn.style.display = "none";
    gv.parentNode.appendChild(addGasBtn);

    // plekhouers vir die vrye-teks-velde uit inhoud
    const eposEl = $("#epos");
    if (eposEl) eposEl.placeholder = ctext("rsvp_ph_epos", "naam@voorbeeld.co.za");
    const dieetEl = $("#dieet");
    if (dieetEl) dieetEl.placeholder = ctext("rsvp_ph_dieet", "Bv. glutenvry, vegetaries, neut-allergie…");
    const liedPh = ctext("rsvp_ph_lied", "Naam of skakel");
    ["#lied0", "#lied1", "#lied2"].forEach(function (sel) {
      const li = $(sel); if (li) li.placeholder = liedPh;
    });
    const boodJa = $("#boodskap-ja");
    if (boodJa) boodJa.placeholder = ctext("rsvp_ph_boodskap", "Deel 'n wens, 'n grappie of net liefde…");

    // stuur- en wysig-knoppie-teks uit inhoud
    const submitBtn = $("#rsvp-submit");
    if (submitBtn) submitBtn.textContent = ctext("rsvp_submit", "Stuur antwoord");
    const editBtn = $("#rsvp-edit");
    if (editBtn) {
      editBtn.textContent = ctext("rsvp_wysig", "Wysig my antwoord");
      const allowEdit = String(content.rsvp_allow_edit == null ? "ja" : content.rsvp_allow_edit).trim().toLowerCase();
      editBtn.style.display = (allowEdit === "nee") ? "none" : "";
    }

    // kom ja/nee
    $$(".choice[data-kom]", form).forEach((b) => b.addEventListener("click", () => {
      rsvp.kom = b.dataset.kom === "ja";
      $$(".choice[data-kom]", form).forEach((x) => x.classList.toggle("on", x === b));
      $("#rsvp-ja").classList.toggle("hidden", !rsvp.kom);
      $("#rsvp-nee").classList.toggle("hidden", rsvp.kom);
      $("#rsvp-actions").classList.remove("hidden");
      clearErr();
    }));
    // slaap
    $$(".choice[data-slaap]", form).forEach((b) => b.addEventListener("click", () => {
      rsvp.slaap = b.dataset.slaap === "ja";
      $$(".choice[data-slaap]", form).forEach((x) => x.classList.toggle("on", x === b));
      $("#rsvp-duur").classList.toggle("hidden", !rsvp.slaap);
      if (!rsvp.slaap) { rsvp.naweek = ""; $$(".choice[data-naweek]", form).forEach((x) => x.classList.remove("on")); }
      clearErr();
    }));
    // naweek
    $$(".choice[data-naweek]", form).forEach((b) => b.addEventListener("click", () => {
      rsvp.naweek = b.dataset.naweek;
      $$(".choice[data-naweek]", form).forEach((x) => x.classList.toggle("on", x === b));
      clearErr();
    }));
    // ontbyt
    $$(".choice[data-ontbyt]", form).forEach((b) => b.addEventListener("click", () => {
      rsvp.ontbyt = b.dataset.ontbyt === "ja";
      $$(".choice[data-ontbyt]", form).forEach((x) => x.classList.toggle("on", x === b));
      clearErr();
    }));

    form.addEventListener("submit", onSubmit);
    if (editBtn) editBtn.addEventListener("click", () => {
      const th = $("#rsvp-thanks");
      if (th) th.classList.add("hidden");
      form.classList.remove("hidden");
    });
  }
  function clearErr() { const e = $("#rsvp-err"); if (e) e.classList.add("hidden"); }
  function showErr(msg) { const e = $("#rsvp-err"); e.textContent = msg; e.classList.remove("hidden"); }
  // Eenvoudige e-pos-toets: iets@iets.iets (geen spasies)
  function isEmail(s) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s || "").trim()); }

  async function onSubmit(e) {
    e.preventDefault();
    const form = $("#rsvp-form");
    if (rsvp.kom === null) { showErr("Laat weet ons asseblief of jy kan kom."); return; }

    let record;
    if (rsvp.kom) {
      const gaste = $$("[data-gas]", form).map((i) => i.value.trim()).filter(Boolean);
      if (!gaste.length) { showErr("Voeg asseblief ten minste een naam by."); return; }
      const epos = ($("#epos").value || "").trim();
      if (!epos) { showErr("Vul asseblief jou e-posadres in sodat ons jou kan bereik."); return; }
      if (!isEmail(epos)) { showErr("Daardie e-posadres lyk nie heeltemal reg nie — kyk asseblief weer."); return; }
      if (rsvp.slaap === null) { showErr("Laat ons weet of jy/julle oorslaap."); return; }
      if (rsvp.slaap && !rsvp.naweek) { showErr("Kies die hele naweek of net Saterdag."); return; }
      if (rsvp.ontbyt === null) { showErr("Laat weet asseblief oor die Sondag-ontbyt."); return; }
      const ekstra = {};
      $$("#rsvp-extra-q [data-extra]").forEach((i) => { const k = i.getAttribute("data-extra"); if (k) ekstra[k] = i.value.trim(); });
      record = {
        lead_naam: gaste[0], epos: epos, gaste, aantal: gaste.length, kom: true,
        slaap: !!rsvp.slaap, naweek: rsvp.naweek, ontbyt: !!rsvp.ontbyt,
        dieet: $("#dieet").value.trim(),
        liedjies: [$("#lied0").value.trim(), $("#lied1").value.trim(), $("#lied2").value.trim()],
        boodskap: $("#boodskap-ja").value.trim(),
        ekstra: ekstra,
      };
    } else {
      record = {
        lead_naam: "Kan nie kom", epos: "", gaste: [], aantal: 0, kom: false,
        slaap: false, naweek: "", ontbyt: false, dieet: "",
        liedjies: [], boodskap: $("#boodskap-nee").value.trim(), ekstra: {},
      };
    }

    const btn = $("#rsvp-submit");
    btn.disabled = true; const lbl = btn.textContent; btn.textContent = "Stuur tans…";
    const client = window.getSupabaseClient();

    function done(demo) {
      btn.disabled = false; btn.textContent = lbl; // herstel knoppie vir "Wysig my antwoord"
      const t = $("#rsvp-thanks");
      $("#rsvp-thanks-h").textContent = rsvp.kom
        ? ctext("rsvp_dankie_ja_h", "Baie dankie!")
        : ctext("rsvp_dankie_nee_h", "Dankie dat jy laat weet");
      const base = rsvp.kom
        ? ctext("rsvp_dankie_ja", "Ons het julle RSVP ontvang. Ons kan nie wag om saam met julle te vier op 7 November 2026 nie!")
        : ctext("rsvp_dankie_nee", "Ons gaan jou mis, maar verstaan heeltemal. Geniet jou dag — met liefde, Hennie & Jolinda.");
      $("#rsvp-thanks-p").textContent = demo
        ? base + " (Demo-modus: nog nie gestoor nie — stel Supabase op om antwoorde te stoor.)"
        : base;
      form.classList.add("hidden");
      t.classList.remove("hidden");
      t.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    if (!client) { console.info("DEMO RSVP:", record); done(true); return; }
    try {
      // stoor via 'n funksie wat op client_id opdateer — 'n wysiging vervang dieselfde ry (geen duplikate)
      const { error } = await client.rpc("save_rsvp", { p_client_id: getClientId(), p_data: record });
      if (error) throw error;
      done(false);
    } catch (err) {
      console.error(err);
      showErr("Ag nee, iets het verkeerd geloop. Probeer asseblief weer.");
      btn.disabled = false; btn.textContent = lbl;
    }
  }

  // Een stabiele ID per toestel sodat 'n gas se latere wysiging dieselfde RSVP-ry opdateer.
  function makeUuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0, v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
  function getClientId() {
    let id = null;
    try { id = localStorage.getItem("hj_rsvp_cid"); } catch (e) {}
    if (!id) { id = makeUuid(); try { localStorage.setItem("hj_rsvp_cid", id); } catch (e) {} }
    return id;
  }

  /* ---- begin ---- */
  async function init() {
    setupNav(); setupReveal(); setupLb();
    await loadContent();
    applyContent();
    applyImages();
    renderGallery();
    setupRsvp();

    // API vir die wysig-modus (edit.js)
    window.PORTAL = {
      content: content,
      schema: window.CONTENT_SCHEMA,
      reapply: function () { applyContent(); applyImages(); renderGallery(); },
      storieBlocks: storieBlocks,
      items: function (key, props) { return flexItems(content[key], props); },
    };

    const editMode = new URLSearchParams(location.search).get("edit") === "1";
    if (editMode) {
      showSite(); // wys die volle bladsy; edit.js bevestig aanmelding voor wysig
      const s = document.createElement("script");
      s.src = "assets/js/edit.js";
      s.defer = true;
      document.body.appendChild(s);
    } else {
      setupGate();
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
