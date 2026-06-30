/* ═══════════════════════════════════════════════════════════════════
   Eucalyptus Trouportaal — Beheerpaneel logika (admin.js)
   Vanilla JS, geen raamwerke. Gekoppel aan Supabase.
   ─────────────────────────────────────────────────────────────────────
   Databron:
     • rsvps   — oop RSVP's (elke ry = een party wat geantwoord het)
     • content — sleutel→waarde teks (oorlê CONTENT_DEFAULTS)
     • planner — sleutel→jsonb ('budget', 'suppliers')
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  /* ── kort helpers ───────────────────────────────────────────────── */
  var $ = function (id) { return document.getElementById(id); };
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function show(node) { if (node) node.classList.remove("hidden"); }
  function hide(node) { if (node) node.classList.add("hidden"); }
  function isUrl(s) { return /^https?:\/\//i.test(String(s || "").trim()); }
  function geld(n) {
    var v = Math.round(Number(n) || 0);
    return "R " + v.toLocaleString("en-US").replace(/,/g, " ");
  }
  function num(v) { var n = parseFloat(v); return isNaN(n) ? 0 : n; }
  function relTyd(iso) {
    if (!iso) return "";
    var t = new Date(iso).getTime();
    if (isNaN(t)) return "";
    var d = Math.floor((Date.now() - t) / 86400000);
    if (d <= 0) return "Vandag";
    if (d === 1) return "Gister";
    return d + " dae gel.";
  }
  function toast(msg) {
    try {
      var t = el("div", "toast", msg);
      document.body.appendChild(t);
      setTimeout(function () {
        t.style.transition = "opacity .4s";
        t.style.opacity = "0";
        setTimeout(function () { t.remove(); }, 420);
      }, 1900);
    } catch (e) { /* stil */ }
  }

  /* ── status van 'n rsvp-ry ──────────────────────────────────────── */
  function statusVan(r) { return r.kom ? "kom" : "nie"; }
  function statusTeks(s) { return s === "kom" ? "Kom" : (s === "nie" ? "Kom nie" : "Wag nog"); }

  /* ── globale toestand ───────────────────────────────────────────── */
  var sb = null;                 // supabase client
  var rsvps = [];                // ry-objekte uit die db
  var content = {};              // saamgesmelte teks (defaults + db)
  var budget = [];               // [{kat,begroot,bestee,betaal}]
  var suppliers = [];            // [{item,verskaffer,bedrag,status,sper}]
  var guestFilter = "almal";
  var guestSearch = "";
  var activeTab = "oorsig";

  /* ── tabbe (volgorde soos die ontwerp) ──────────────────────────── */
  var TABS = [
    { id: "oorsig", naam: "Oorsig", view: "oorsig" },
    { id: "gaste", naam: "Gaste", view: "gaste" },
    { id: "liedjies", naam: "Liedjies", view: "liedjies" },
    { id: "begroting", naam: "Begroting", view: "begroting" },
    { id: "betalings", naam: "Betalings", view: "betalings" },
    { id: "kamers", naam: "Kamers", view: "planner", planner: "rooms" },
    { id: "tafels", naam: "Tafels", view: "planner", planner: "tables" },
    { id: "vloer", naam: "Vloer", view: "planner", planner: "floor" },
    { id: "groepe", naam: "Groepe", view: "planner", planner: "groups" },
    { id: "teks", naam: "Redigeer teks", view: "teks" },
    { id: "instellings", naam: "Instellings", view: "instellings" }
  ];
  var PLANNER_META = {
    rooms: ["Kamers", "Sleep gaste na slaapplekke — kapasiteit, beddens en notas per kamer."],
    tables: ["Tafels", "Sleep gaste na tafels en hou sitplekke per tafel dop."],
    floor: ["Vloerplan", "Rangskik die tafels presies soos die onthaal uitgelê word."],
    groups: ["Groepe", "Kleur-kodeer gaste in groepe — families, paartjies, bruidspan."]
  };

  /* ── Volgorde van die redigeer-panele (pas by index.html) ───────────
     Elke groep kry 'n kort "Soos op die werf"-wenk. */
  var PANEL_ORDER = [
    "Hero", "Ons storie", "Program", "Galery", "Verblyf",
    "Tema & drag", "Geskenke", "Vrae & antwoorde", "RSVP",
    "Kontak", "Instellings"
  ];
  var PANEL_HINTS = {
    "Hero": "Die groot opening-blad met die name en foto bo-aan die werf.",
    "Ons storie": "Die twee storie-blokke met foto's oor julle reis.",
    "Program": "Die dag-vir-dag program vir Vrydag, Saterdag en Sondag.",
    "Galery": "Die fotogalery wat gaste op die werf sien.",
    "Verblyf": "Die slaapplek-opsies en die slotnota daaronder.",
    "Tema & drag": "Die tema-beskrywing, dragkode en die tema-foto.",
    "Geskenke": "Die geskenk-inleiding en julle bankbesonderhede.",
    "Vrae & antwoorde": "Die algemene vrae wat gaste onderaan sien.",
    "RSVP": "Die onderskrif en getal naamvelde op die RSVP-vorm.",
    "Kontak": "Selnommers en die voetskrif-datum heel onderaan.",
    "Instellings": "Sleutel-velde: name, datum, plek en die toegangskode."
  };

  /* ── die plaaslike werkkopie van die galery-array (uit content.gallery_images) */
  var galleryItems = [];

  /* ════════════════════════════════════════════════════════════════
     OPSTART: kies skerm (nie-opgestel / aanmeld / dashboard)
     ════════════════════════════════════════════════════════════════ */
  document.addEventListener("DOMContentLoaded", boot);

  function boot() {
    if (!window.isSupabaseConfigured || !window.isSupabaseConfigured()) {
      show($("screen-setup"));
      return;
    }
    sb = window.getSupabaseClient();
    if (!sb) {
      // gekonfigureer maar kliënt kon nie laai nie (bv. CDN geblok)
      show($("screen-setup"));
      return;
    }
    wireAuth();
    sb.auth.getSession()
      .then(function (res) {
        var session = res && res.data && res.data.session;
        if (session) enterDashboard();
        else show($("screen-login"));
      })
      .catch(function (err) {
        console.warn("getSession het misluk:", err);
        show($("screen-login"));
      });
  }

  /* ── Aanmeld / afmeld ───────────────────────────────────────────── */
  function wireAuth() {
    var form = $("login-form");
    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        doLogin();
      });
    }
    var lo = $("logout-btn");
    if (lo) lo.addEventListener("click", doLogout);
  }

  function doLogin() {
    var email = ($("login-email").value || "").trim();
    var password = $("login-password").value || "";
    var btn = $("login-btn");
    var errBox = $("login-error");
    hide(errBox);
    if (!email || !password) {
      errBox.textContent = "Vul asseblief jou e-pos en wagwoord in.";
      show(errBox);
      return;
    }
    btn.disabled = true;
    btn.textContent = "Teken in…";
    sb.auth.signInWithPassword({ email: email, password: password })
      .then(function (res) {
        if (res.error) throw res.error;
        enterDashboard();
      })
      .catch(function (err) {
        console.warn("Aanmelding het misluk:", err);
        errBox.textContent = "Aanmelding het misluk. Kontroleer jou e-pos en wagwoord.";
        show(errBox);
      })
      .finally(function () {
        btn.disabled = false;
        btn.textContent = "Teken in";
      });
  }

  function doLogout() {
    sb.auth.signOut().finally(function () { location.reload(); });
  }

  /* ════════════════════════════════════════════════════════════════
     DASHBOARD
     ════════════════════════════════════════════════════════════════ */
  function enterDashboard() {
    hide($("screen-setup"));
    hide($("screen-login"));
    show($("screen-app"));
    buildTabs();
    buildContentForms();
    wireGuestUI();
    wireBudgetUI();
    wireModal();
    selectTab("oorsig");

    // laai data parallel; elke tab gebruik wat beskikbaar is
    loadRsvps();
    loadContent();
    loadPlanner();
  }

  /* ── Tabbe ──────────────────────────────────────────────────────── */
  function buildTabs() {
    var bar = $("tabs");
    bar.textContent = "";
    TABS.forEach(function (t) {
      var b = el("button", "tab", t.naam);
      b.dataset.tab = t.id;
      b.addEventListener("click", function () { selectTab(t.id); });
      bar.appendChild(b);
    });
  }

  function selectTab(id) {
    var tab = TABS.find(function (t) { return t.id === id; });
    if (!tab) return;
    activeTab = id;

    // wys regte afdeling
    document.querySelectorAll(".view").forEach(function (v) {
      v.hidden = (v.getAttribute("data-view") !== tab.view);
    });
    // merk aktiewe knoppie
    document.querySelectorAll(".tab").forEach(function (b) {
      b.classList.toggle("active", b.dataset.tab === id);
    });

    if (tab.view === "planner") openPlanner(tab.planner);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /* ════════════════════════════════════════════════════════════════
     RSVP's
     ════════════════════════════════════════════════════════════════ */
  function loadRsvps() {
    sb.from("rsvps").select("*").order("created_at", { ascending: false })
      .then(function (res) {
        if (res.error) throw res.error;
        rsvps = (res.data || []).map(normRsvp);
      })
      .catch(function (err) {
        console.warn("Kon nie RSVP's laai nie:", err);
        rsvps = [];
      })
      .finally(function () {
        renderOorsig();
        renderGuests();
        renderSongs();
      });
  }

  function normRsvp(r) {
    return {
      id: r.id,
      lead_naam: r.lead_naam || "",
      gaste: Array.isArray(r.gaste) ? r.gaste : safeArr(r.gaste),
      aantal: r.aantal || 0,
      kom: !!r.kom,
      slaap: !!r.slaap,
      naweek: r.naweek || "",
      ontbyt: !!r.ontbyt,
      dieet: r.dieet || "",
      liedjies: Array.isArray(r.liedjies) ? r.liedjies : safeArr(r.liedjies),
      boodskap: r.boodskap || "",
      created_at: r.created_at || null
    };
  }
  function safeArr(v) {
    if (Array.isArray(v)) return v;
    try { var p = JSON.parse(v); return Array.isArray(p) ? p : []; } catch (e) { return []; }
  }

  /* ── Oorsig ─────────────────────────────────────────────────────── */
  function renderOorsig() {
    var kom = 0, nie = 0, gasteKom = 0, slaap = 0, naweek = 0, ontbyt = 0, liedjieTel = 0;
    rsvps.forEach(function (r) {
      if (r.kom) {
        kom++; gasteKom += (r.aantal || (r.gaste ? r.gaste.length : 0) || 0);
        if (r.slaap) { slaap++; if (r.naweek === "naweek") naweek++; }
        if (r.ontbyt) ontbyt++;
      } else { nie++; }
      liedjieTel += (r.liedjies || []).filter(Boolean).length;
    });
    var totaal = rsvps.length;

    // datum / venue / koppel uit content
    var datumIso = content.datum_iso || window.CONTENT_DEFAULTS.datum_iso;
    var dt = new Date(datumIso);
    var dae = isNaN(dt) ? "—" : Math.max(0, Math.ceil((dt.getTime() - Date.now()) / 86400000));
    $("ov-days").textContent = String(dae);
    $("ov-datum").textContent = content.datum_teks || window.CONTENT_DEFAULTS.datum_teks || "";
    $("ov-venue").textContent = content.venue || window.CONTENT_DEFAULTS.venue || "";

    $("ov-resp-count").textContent = String(totaal);
    var pct = totaal ? Math.min(100, Math.round(kom / totaal * 100)) : 0;
    $("ov-bar-fill").style.width = pct + "%";
    $("ov-resp-text").textContent = totaal
      ? (totaal + " antwoorde · " + kom + " kom · " + nie + " kom nie")
      : "Nog geen antwoorde nie";

    // statkaarte
    var stats = [
      { naam: "Antwoorde", waarde: totaal, kleur: "#8C9A6E", filter: "almal" },
      { naam: "Bevestig (kom)", waarde: kom, kleur: "#6E7C50", filter: "kom" },
      { naam: "Gaste in totaal", waarde: gasteKom, kleur: "#4F5D3A", filter: "kom" },
      { naam: "Kom nie", waarde: nie, kleur: "#c6543f", filter: "nie" },
      { naam: "Slaap oor", waarde: slaap, kleur: "#8C9A6E", filter: "kom" },
      { naam: "Heelnaweek", waarde: naweek, kleur: "#6E7C50", filter: "kom" },
      { naam: "Sondag-ontbyt", waarde: ontbyt, kleur: "#b9a77e", filter: "kom" },
      { naam: "Liedjieversoeke", waarde: liedjieTel, kleur: "#cdbf9e", filter: null }
    ];
    var grid = $("ov-stats");
    grid.textContent = "";
    stats.forEach(function (s) {
      var card = el("div", "stat-card" + (s.filter ? "" : " no-click"));
      card.style.borderTopColor = s.kleur;
      card.appendChild(el("div", "stat-num", String(s.waarde)));
      card.appendChild(el("div", "stat-name", s.naam));
      if (s.filter) {
        card.addEventListener("click", function () {
          guestFilter = s.filter; selectTab("gaste"); syncFilterChips(); renderGuests();
        });
      } else {
        card.addEventListener("click", function () { selectTab("liedjies"); });
      }
      grid.appendChild(card);
    });

    // donut
    var pKom = totaal ? kom / totaal * 360 : 0;
    var pNie = totaal ? pKom + nie / totaal * 360 : 0;
    $("ov-donut").style.background =
      "conic-gradient(#6E7C50 0 " + pKom + "deg, #c6543f " + pKom + "deg " + pNie +
      "deg, #e2dcc9 " + pNie + "deg 360deg)";
    $("ov-donut-guests").textContent = String(gasteKom);
    $("lg-kom").textContent = String(kom);
    $("lg-nie").textContent = String(nie);
    $("ov-song-count").textContent = String(liedjieTel);

    // onlangse aktiwiteit (top 7)
    var act = $("ov-activity");
    act.textContent = "";
    $("ov-activity-count").textContent = totaal + " antwoorde";
    if (!totaal) {
      var empty = el("p", "empty-state", "Nog geen antwoorde nie.");
      act.appendChild(empty);
    } else {
      rsvps.slice(0, 7).forEach(function (r) {
        var st = statusVan(r);
        var row = el("div", "activity-row");
        var dot = el("span", "activity-dot");
        dot.style.background = st === "kom" ? "#6E7C50" : "#c6543f";
        var main = el("div", "activity-main");
        main.appendChild(el("div", "activity-name", r.lead_naam || "Gas"));
        var subTxt = r.kom
          ? ((r.aantal || 0) + " gaste" + (r.slaap ? " · slaap oor" : ""))
          : "Kan nie maak nie";
        main.appendChild(el("div", "activity-sub", subTxt));
        var chip = el("span", "chip chip-" + st, statusTeks(st));
        var when = el("span", "activity-when", relTyd(r.created_at));
        row.appendChild(dot); row.appendChild(main); row.appendChild(chip); row.appendChild(when);
        row.addEventListener("click", function () { openDetail(r); });
        act.appendChild(row);
      });
    }
  }

  /* ── Gaste ──────────────────────────────────────────────────────── */
  function wireGuestUI() {
    var s = $("guest-search");
    if (s) s.addEventListener("input", function () {
      guestSearch = s.value.trim().toLowerCase();
      renderGuests();
    });
    var filters = $("guest-filters");
    filters.textContent = "";
    [["almal", "Almal"], ["kom", "Kom"], ["nie", "Kom nie"]].forEach(function (f) {
      var b = el("button", "filter-chip", f[1]);
      b.dataset.filter = f[0];
      b.addEventListener("click", function () {
        guestFilter = f[0]; syncFilterChips(); renderGuests();
      });
      filters.appendChild(b);
    });
    syncFilterChips();
    var csv = $("csv-btn");
    if (csv) csv.addEventListener("click", exportCsv);
  }
  function syncFilterChips() {
    document.querySelectorAll("#guest-filters .filter-chip").forEach(function (b) {
      b.classList.toggle("active", b.dataset.filter === guestFilter);
    });
  }

  function filteredGuests() {
    return rsvps.filter(function (r) {
      var st = statusVan(r);
      if (guestFilter !== "almal" && st !== guestFilter) return false;
      if (guestSearch) {
        var hay = (r.lead_naam + " " + (r.gaste || []).join(" ")).toLowerCase();
        if (hay.indexOf(guestSearch) === -1) return false;
      }
      return true;
    });
  }

  function renderGuests() {
    var tb = $("guest-rows");
    tb.textContent = "";
    var list = filteredGuests();
    if (!list.length) {
      show($("guest-empty"));
      return;
    }
    hide($("guest-empty"));
    list.forEach(function (r) {
      var st = statusVan(r);
      var tr = el("tr", "row-click");

      var tdName = el("td");
      tdName.appendChild(el("div", "cell-name", r.lead_naam || "Gas"));
      var n = (r.gaste || []).length;
      tdName.appendChild(el("div", "cell-sub", n ? (n + (n === 1 ? " gas" : " gaste")) : ""));
      tr.appendChild(tdName);

      var tdStatus = el("td");
      tdStatus.appendChild(el("span", "chip chip-" + st, statusTeks(st)));
      tr.appendChild(tdStatus);

      var gasteTxt = r.kom ? ((r.aantal || 0) + " · " + (r.gaste || []).join(", ")) : "—";
      tr.appendChild(el("td", null, gasteTxt));

      var slaapTxt = r.kom ? (r.slaap ? (r.naweek === "naweek" ? "Heelnaweek" : "Saterdag") : "Nee") : "—";
      tr.appendChild(el("td", null, slaapTxt));

      tr.appendChild(el("td", null, r.kom ? (r.ontbyt ? "Ja" : "Nee") : "—"));

      tr.appendChild(el("td", "cell-dim", r.dieet || "—"));

      tr.appendChild(el("td", "cell-arrow", "›"));

      tr.addEventListener("click", function () { openDetail(r); });
      tb.appendChild(tr);
    });
  }

  function exportCsv() {
    var head = ["Datum", "Naam", "Status", "Aantal", "Gaste", "Slaap", "Naweek",
                "Ontbyt", "Dieet", "Liedjies", "Boodskap"];
    var rows = rsvps.map(function (r) {
      var st = r.kom ? "Kom" : "Kom nie";
      var datum = r.created_at ? new Date(r.created_at).toLocaleDateString("af-ZA") : "";
      return [
        datum, r.lead_naam, st, r.aantal || 0, (r.gaste || []).join("; "),
        r.slaap ? "Ja" : "Nee", r.naweek || "", r.ontbyt ? "Ja" : "Nee",
        r.dieet || "", (r.liedjies || []).filter(Boolean).join("; "),
        (r.boodskap || "").replace(/\n/g, " ")
      ];
    });
    var csv = [head].concat(rows).map(function (row) {
      return row.map(function (c) { return '"' + String(c).replace(/"/g, '""') + '"'; }).join(",");
    }).join("\r\n");
    var blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url; a.download = "hennie-jolinda-gastelys.csv";
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
    toast("Gastelys uitgevoer (CSV)");
  }

  /* ── Liedjies ───────────────────────────────────────────────────── */
  function renderSongs() {
    var list = [];
    rsvps.forEach(function (r) {
      (r.liedjies || []).filter(Boolean).forEach(function (s) {
        list.push({ teks: String(s).trim(), deur: r.lead_naam || "Gas" });
      });
    });
    var box = $("songs-list");
    box.textContent = "";
    if (!list.length) {
      show($("songs-empty"));
      return;
    }
    hide($("songs-empty"));
    list.forEach(function (l, i) {
      var row = el("div", "song-row");
      row.appendChild(el("span", "song-no", String(i + 1).padStart(2, "0")));
      var main = el("div", "song-main");
      var titel = isUrl(l.teks) ? l.teks.replace(/^https?:\/\/(www\.)?/, "").slice(0, 60) : l.teks;
      main.appendChild(el("div", "song-title", titel));
      main.appendChild(el("div", "song-by", "Versoek deur " + l.deur));
      row.appendChild(main);
      if (isUrl(l.teks)) {
        var a = el("a", "song-play", "▶ Luister");
        a.href = l.teks; a.target = "_blank"; a.rel = "noopener noreferrer";
        row.appendChild(a);
      }
      box.appendChild(row);
    });
  }

  /* ════════════════════════════════════════════════════════════════
     PLANNER (een raam vir Kamers/Tafels/Vloer/Groepe)
     ════════════════════════════════════════════════════════════════ */
  function loadPlanner() {
    // begroting + verskaffers uit planner-tabel
    sb.from("planner").select("*")
      .then(function (res) {
        if (res.error) throw res.error;
        var map = {};
        (res.data || []).forEach(function (row) { map[row.key] = row.value; });
        budget = Array.isArray(map.budget) && map.budget.length ? map.budget : null;
        suppliers = Array.isArray(map.suppliers) && map.suppliers.length ? map.suppliers : null;
        seedIfNeeded();
      })
      .catch(function (err) {
        console.warn("Kon nie beplanner-data laai nie:", err);
        budget = null; suppliers = null;
        seedIfNeeded();
      });
  }

  // Seed vanuit data.js se BEGROTING / VERSKAFFERS as die db leeg is
  function seedIfNeeded() {
    var needBudget = !budget;
    var needSuppliers = !suppliers;
    if (!needBudget && !needSuppliers) { renderBudget(); renderSuppliers(); return; }

    importSeed().then(function (seed) {
      if (needBudget) {
        budget = (seed.BEGROTING || []).map(function (b) {
          return { kat: b.kat, begroot: b.begroot, bestee: b.bestee, betaal: b.betaal };
        });
        savePlanner("budget", budget); // skryf seed terug
      }
      if (needSuppliers) {
        suppliers = (seed.VERSKAFFERS || []).map(function (v) {
          return { item: v.item, verskaffer: v.verskaffer, bedrag: v.bedrag, status: v.status, sper: v.sper };
        });
        savePlanner("suppliers", suppliers);
      }
      renderBudget(); renderSuppliers();
    }).catch(function (err) {
      console.warn("Kon nie saaddata laai nie:", err);
      if (!budget) budget = [];
      if (!suppliers) suppliers = [];
      renderBudget(); renderSuppliers();
    });
  }

  // Probeer data.js dinamies invoer; val terug op ingeboude seed.
  function importSeed() {
    var candidates = [
      "../../design-import/eucalyptus-wedding-portal/project/data.js",
      "../../../design-import/eucalyptus-wedding-portal/project/data.js"
    ];
    return new Promise(function (resolve) {
      (function tryNext(i) {
        if (i >= candidates.length) { resolve(FALLBACK_SEED); return; }
        import(candidates[i])
          .then(function (m) {
            if (m && (m.BEGROTING || m.VERSKAFFERS)) resolve(m);
            else tryNext(i + 1);
          })
          .catch(function () { tryNext(i + 1); });
      })(0);
    });
  }

  // Ingeboude kopie van data.js se seed (val-terug as die module nie laai nie).
  var FALLBACK_SEED = {
    BEGROTING: [
      { kat: "Onthaal & Venue", begroot: 85000, bestee: 85000, betaal: 40000 },
      { kat: "Spyseniering", begroot: 60000, bestee: 58200, betaal: 20000 },
      { kat: "Fotograaf & Video", begroot: 28000, bestee: 28000, betaal: 28000 },
      { kat: "Blomme & Versiering", begroot: 32000, bestee: 34500, betaal: 12000 },
      { kat: "Klere & Uitrusting", begroot: 40000, bestee: 36800, betaal: 36800 },
      { kat: "DJ & Klank", begroot: 15000, bestee: 15000, betaal: 7500 },
      { kat: "Troukoek & Soet", begroot: 9000, bestee: 8600, betaal: 8600 },
      { kat: "Uitnodigings & Drukwerk", begroot: 7000, bestee: 6400, betaal: 6400 },
      { kat: "Vervoer & Verblyf", begroot: 18000, bestee: 14000, betaal: 5000 },
      { kat: "Diverse / Onvoorsien", begroot: 12000, bestee: 4200, betaal: 4200 }
    ],
    VERSKAFFERS: [
      { item: "Venue balans", verskaffer: "Kuungana Bush Lodge", bedrag: 45000, status: "uitstaande", sper: "2026-10-01" },
      { item: "Spyseniering balans", verskaffer: "Bushveld Catering", bedrag: 38200, status: "deposito", sper: "2026-10-15" },
      { item: "Fotograaf", verskaffer: "MMP Fotografie", bedrag: 28000, status: "betaal", sper: "2026-06-01" },
      { item: "Blomme", verskaffer: "Wild & Groen", bedrag: 22500, status: "uitstaande", sper: "2026-10-20" },
      { item: "DJ", verskaffer: "SoundWave DJ", bedrag: 7500, status: "deposito", sper: "2026-09-30" },
      { item: "Troukoek", verskaffer: "Soet Tafel", bedrag: 8600, status: "betaal", sper: "2026-08-01" },
      { item: "Trourok", verskaffer: "Bruid Boutique", bedrag: 18000, status: "betaal", sper: "2026-05-15" },
      { item: "Pak (bruidegom)", verskaffer: "Heren Pakke", bedrag: 8800, status: "betaal", sper: "2026-07-10" }
    ]
  };

  function savePlanner(key, value) {
    return sb.from("planner").upsert({ key: key, value: value }, { onConflict: "key" })
      .then(function (res) { if (res.error) throw res.error; return true; });
  }

  var plannerSrcSet = false;
  function openPlanner(page) {
    var frame = $("planner-frame");
    var meta = PLANNER_META[page] || ["Beplanner", ""];
    $("planner-title").textContent = meta[0];
    $("planner-sub").textContent = meta[1];
    if (!plannerSrcSet) {
      frame.setAttribute("src", "beplanner.html?embed=1");
      plannerSrcSet = true;
    }
    // herhaal totdat die raam se go() bestaan (soos die ontwerp doen)
    (function tryGo(n) {
      try {
        if (frame.contentWindow && typeof frame.contentWindow.go === "function") {
          frame.contentWindow.go(page);
          return;
        }
      } catch (e) { /* kruis-oorsprong / nog nie gereed */ }
      if (n < 30) setTimeout(function () { tryGo(n + 1); }, 150);
    })(0);
  }

  /* ════════════════════════════════════════════════════════════════
     BEGROTING
     ════════════════════════════════════════════════════════════════ */
  function wireBudgetUI() {
    var save = $("budget-save");
    if (save) save.addEventListener("click", function () {
      var st = $("budget-status");
      st.textContent = "Stoor…"; st.className = "save-status";
      savePlanner("budget", budget)
        .then(function () { st.textContent = "Gestoor ✓"; st.className = "save-status ok"; })
        .catch(function (err) {
          console.warn("Begroting stoor het misluk:", err);
          st.textContent = "Kon nie stoor nie."; st.className = "save-status err";
        });
    });
    var add = $("budget-add");
    if (add) add.addEventListener("click", function () {
      budget.push({ kat: "Nuwe kategorie", begroot: 0, bestee: 0, betaal: 0 });
      renderBudget();
    });
  }

  function renderBudget() {
    var tb = $("budget-rows");
    tb.textContent = "";
    (budget || []).forEach(function (row, i) {
      var tr = el("tr");

      var tdKat = el("td");
      tdKat.appendChild(makeInput("text", "cat-input", row.kat, function (v) { row.kat = v; }));
      tr.appendChild(tdKat);

      ["begroot", "bestee", "betaal"].forEach(function (field) {
        var td = el("td");
        td.appendChild(makeInput("number", null, row[field], function (v) {
          row[field] = num(v); renderBudgetTotals();
          var oor = tr.querySelector(".oor-cell");
          if (oor) setOor(oor, row);
        }));
        tr.appendChild(td);
      });

      var tdOor = el("td", "oor-cell");
      setOor(tdOor, row);
      tr.appendChild(tdOor);

      var tdDel = el("td");
      var del = el("button", "row-del", "✕");
      del.title = "Verwyder ry";
      del.addEventListener("click", function () { budget.splice(i, 1); renderBudget(); });
      tdDel.appendChild(del);
      tr.appendChild(tdDel);

      tb.appendChild(tr);
    });
    renderBudgetTotals();
  }
  function setOor(td, row) {
    var oor = num(row.begroot) - num(row.bestee);
    td.textContent = geld(oor);
    td.className = "oor-cell " + (oor < 0 ? "over-neg" : "over-pos");
  }
  function makeInput(type, cls, val, onChange) {
    var inp = document.createElement("input");
    inp.type = type;
    if (cls) inp.className = cls;
    inp.value = (val == null ? "" : val);
    inp.addEventListener("input", function () { onChange(inp.value); });
    return inp;
  }
  function renderBudgetTotals() {
    var tBeg = 0, tBest = 0, tBet = 0;
    (budget || []).forEach(function (r) {
      tBeg += num(r.begroot); tBest += num(r.bestee); tBet += num(r.betaal);
    });
    var oor = tBeg - tBest;

    // boonste somkaarte
    var totals = $("budget-totals");
    totals.textContent = "";
    [
      { naam: "Totaal begroot", w: geld(tBeg), kleur: "#34402A" },
      { naam: "Totaal bestee", w: geld(tBest), kleur: "#6E7C50" },
      { naam: "Reeds betaal", w: geld(tBet), kleur: "#8C9A6E" },
      { naam: oor < 0 ? "Oor begroting" : "Nog oor", w: geld(oor), kleur: oor < 0 ? "#c6543f" : "#4F5D3A" }
    ].forEach(function (c) {
      var card = el("div", "stat-card no-click");
      card.style.borderTopColor = c.kleur;
      var n = el("div", "stat-num", c.w); n.style.fontSize = "30px";
      card.appendChild(n);
      card.appendChild(el("div", "stat-name", c.naam));
      totals.appendChild(card);
    });

    // tabel-voet
    var foot = $("budget-foot");
    foot.textContent = "";
    var tr = el("tr");
    tr.appendChild(el("td", null, "Totaal"));
    [tBeg, tBest, tBet].forEach(function (v) {
      var td = el("td"); td.appendChild(el("span", "foot-num", geld(v))); tr.appendChild(td);
    });
    var tdOor = el("td");
    var oorSpan = el("span", "foot-num " + (oor < 0 ? "over-neg" : "over-pos"), geld(oor));
    tdOor.appendChild(oorSpan); tr.appendChild(tdOor);
    tr.appendChild(el("td", null, ""));
    foot.appendChild(tr);
  }

  /* ════════════════════════════════════════════════════════════════
     BETALINGS & VERSKAFFERS
     ════════════════════════════════════════════════════════════════ */
  function payMeta(status) {
    var map = {
      betaal: ["chip-betaal", "Betaal"],
      deposito: ["chip-deposito", "Deposito"],
      uitstaande: ["chip-uitstaande", "Uitstaande"]
    };
    return map[status] || map.uitstaande;
  }

  function renderSuppliers() {
    var totBedrag = 0, totBetaal = 0, totUit = 0;
    (suppliers || []).forEach(function (v) {
      var status = v.status || "uitstaande";
      var bedrag = num(v.bedrag);
      totBedrag += bedrag;
      if (status === "betaal") { totBetaal += bedrag; }
      else if (status === "deposito") {
        var dep = Math.round(bedrag * 0.4);
        totBetaal += dep; totUit += bedrag - dep;
      } else { totUit += bedrag; }
    });

    var totals = $("pay-totals");
    totals.textContent = "";
    [
      { naam: "Totale fakture", w: geld(totBedrag), kleur: "#34402A" },
      { naam: "Reeds betaal", w: geld(totBetaal), kleur: "#6E7C50" },
      { naam: "Nog uitstaande", w: geld(totUit), kleur: "#c6543f" }
    ].forEach(function (c) {
      var card = el("div", "stat-card no-click");
      card.style.borderTopColor = c.kleur;
      var n = el("div", "stat-num", c.w); n.style.fontSize = "30px";
      card.appendChild(n);
      card.appendChild(el("div", "stat-name", c.naam));
      totals.appendChild(card);
    });

    var box = $("suppliers-list");
    box.textContent = "";
    if (!(suppliers || []).length) {
      box.appendChild(el("p", "empty-state", "Nog geen verskaffers nie."));
      return;
    }
    suppliers.forEach(function (v, i) {
      var status = v.status || "uitstaande";
      var meta = payMeta(status);
      var row = el("div", "supplier-row");

      var main = el("div", "supplier-main");
      main.appendChild(el("div", "supplier-item", v.item || ""));
      main.appendChild(el("div", "supplier-name", v.verskaffer || ""));
      row.appendChild(main);

      row.appendChild(el("div", "supplier-amt", geld(v.bedrag)));
      row.appendChild(el("div", "supplier-due", "Sper: " + (v.sper || "—")));

      var btn = el("button", "chip chip-btn " + meta[0], meta[1]);
      btn.addEventListener("click", function () {
        var orde = ["uitstaande", "deposito", "betaal"];
        var next = orde[(orde.indexOf(status) + 1) % orde.length];
        suppliers[i].status = next;
        renderSuppliers();
        var st = $("suppliers-status");
        st.textContent = "Stoor…"; st.className = "save-status";
        savePlanner("suppliers", suppliers)
          .then(function () {
            st.textContent = "Status opgedateer → " + payMeta(next)[1];
            st.className = "save-status ok";
            toast("Status opgedateer → " + payMeta(next)[1]);
          })
          .catch(function (err) {
            console.warn("Verskaffer-status stoor het misluk:", err);
            st.textContent = "Kon nie stoor nie."; st.className = "save-status err";
          });
      });
      row.appendChild(btn);

      box.appendChild(row);
    });
  }

  /* ════════════════════════════════════════════════════════════════
     INHOUD (Redigeer teks + Instellings) — outo-gebou uit CONTENT_SCHEMA
     ════════════════════════════════════════════════════════════════ */
  function loadContent() {
    content = Object.assign({}, window.CONTENT_DEFAULTS);
    sb.from("content").select("*")
      .then(function (res) {
        if (res.error) throw res.error;
        (res.data || []).forEach(function (row) {
          if (row.value != null) content[row.key] = row.value;
        });
      })
      .catch(function (err) {
        console.warn("Kon nie inhoud laai nie:", err);
      })
      .finally(function () {
        fillContentForms();
        renderOorsig(); // datum/venue kan verander het
      });
  }

  /* ── Storage-oplaai: verklein → laai op → gee publieke URL terug ──── */
  function uploadImage(file) {
    return window.resizeImageFile(file, 1700, 0.82).then(function (blob) {
      var path = "uploads/" + Date.now() + "-" +
        Math.random().toString(36).slice(2) + ".webp";
      return sb.storage.from(window.STORAGE_BUCKET)
        .upload(path, blob, { contentType: "image/webp", upsert: true })
        .then(function (res) {
          if (res.error) throw res.error;
          var pub = sb.storage.from(window.STORAGE_BUCKET).getPublicUrl(path);
          return pub.data.publicUrl;
        });
    });
  }

  // Best-effort verwydering van 'n opgelaaide lêer (slegs ons eie uploads/).
  function deleteUploadedImage(url) {
    try {
      var marker = "/" + window.STORAGE_BUCKET + "/";
      var i = String(url || "").indexOf(marker);
      if (i === -1) return;
      var path = url.slice(i + marker.length).split("?")[0];
      if (path.indexOf("uploads/") !== 0) return; // moenie verstek-foto's raak nie
      sb.storage.from(window.STORAGE_BUCKET).remove([path]).then(function () {}, function () {});
    } catch (e) { /* stil */ }
  }

  /* ── B / I formaat-knoppies vir 'n teks-veld ────────────────────────
     Wikkel die gemerkte teks in **vet** of *skuins* (pas by shared.js). */
  function wrapSelection(input, marker) {
    var s = input.selectionStart, e = input.selectionEnd;
    var v = input.value;
    if (s == null) { s = v.length; e = v.length; }
    var sel = v.slice(s, e);
    var before = v.slice(0, s), after = v.slice(e);
    input.value = before + marker + sel + marker + after;
    var pos = sel ? (s + marker.length + sel.length + marker.length) : (s + marker.length);
    input.focus();
    try { input.setSelectionRange(pos, pos); } catch (er) { /* getal/ander tipes */ }
  }
  function makeFormatBar(input) {
    var bar = el("div", "fmt-bar");
    var b = el("button", "fmt-btn fmt-b", "B");
    b.type = "button"; b.title = "Vet"; b.setAttribute("aria-label", "Vet");
    b.addEventListener("click", function () { wrapSelection(input, "**"); });
    var i = el("button", "fmt-btn fmt-i", "I");
    i.type = "button"; i.title = "Skuins"; i.setAttribute("aria-label", "Skuins");
    i.addEventListener("click", function () { wrapSelection(input, "*"); });
    bar.appendChild(b); bar.appendChild(i);
    return bar;
  }

  // Bou die redigeer-vorms (een keer); waardes word later ingevul.
  function buildContentForms() {
    var schema = window.CONTENT_SCHEMA || [];

    // groepeer velde per .group (in skema-volgorde)
    var groups = {};
    var seen = [];
    schema.forEach(function (f) {
      if (!groups[f.group]) { groups[f.group] = []; seen.push(f.group); }
      groups[f.group].push(f);
    });

    // panele in PANEL_ORDER, daarna enige oorblywende groepe
    var order = [];
    PANEL_ORDER.forEach(function (g) { if (groups[g]) order.push(g); });
    seen.forEach(function (g) { if (order.indexOf(g) === -1) order.push(g); });

    // "Redigeer teks" is nou 'n lewendige iframe-wysiger; bou net die vorm
    // as die ou houer steeds bestaan (terugwaartse versoenbaarheid).
    var container = $("content-groups");
    if (container) {
      container.textContent = "";
      var intro = el("p", "content-intro",
        "Verander enige teks of foto hieronder en klik Stoor onderaan.");
      container.appendChild(intro);
      order.forEach(function (g) {
        container.appendChild(buildPanel(g, groups[g], "content"));
      });
    }

    // Instellings-tab: net die "Instellings"-groep
    var sBox = $("settings-fields");
    sBox.textContent = "";
    var settingsFields = schema.filter(function (f) { return f.group === "Instellings"; });
    if (settingsFields.length) {
      sBox.appendChild(buildPanel("Instellings", settingsFields, "settings"));
    }

    if ($("content-save")) wireContentSave("content-save", "content-status", "content");
    wireContentSave("settings-save", "settings-status", "settings");
  }

  function buildPanel(title, fields, scope) {
    var g = el("div", "content-group");
    g.appendChild(el("div", "content-group-title", title));
    var hint = PANEL_HINTS[title];
    if (hint) g.appendChild(el("p", "content-group-hint", "Soos op die werf: " + hint));
    g.appendChild(el("div", "content-group-rule"));
    fields.forEach(function (f) {
      g.appendChild(buildField(f, scope));
    });
    return g;
  }

  function buildField(f, scope) {
    var fld = el("div", "content-field");
    var lab = el("label", "content-field-label", f.label);
    if (f.type !== "image" && f.type !== "gallery") {
      lab.setAttribute("for", scope + "-" + f.key);
    }
    fld.appendChild(lab);

    if (f.type === "gallery") {
      buildGalleryManager(fld);
      return fld;
    }

    if (f.type === "image") {
      buildImageField(fld, f, scope);
      return fld;
    }

    // teks / textarea / list
    var input;
    if (f.type === "textarea" || f.type === "list") {
      input = document.createElement("textarea");
      if (f.type === "list") input.rows = 5;
    } else {
      input = document.createElement("input");
      input.type = "text";
    }
    input.id = scope + "-" + f.key;
    input.dataset.key = f.key;
    input.dataset.scope = scope;

    // B/I-balkie bo elke teks/textarea-veld (nie vir list nie — daar tel kolomme)
    if (f.type === "text" || f.type === "textarea") {
      fld.appendChild(makeFormatBar(input));
    }
    fld.appendChild(input);

    if (f.help) fld.appendChild(el("p", "content-field-help", f.help));
    return fld;
  }

  /* ── Beeld-veld: huidige foto + vervang + herstel ──────────────────── */
  function buildImageField(fld, f, scope) {
    var wrap = el("div", "img-field");
    wrap.dataset.key = f.key;
    wrap.dataset.scope = scope;
    wrap.dataset.type = "image";
    wrap.dataset.fallback = f.fallback || "";
    wrap.dataset.value = ""; // gestoorde URL (leeg = verstek)

    var thumb = document.createElement("img");
    thumb.className = "img-thumb";
    thumb.alt = f.label || "Foto";
    wrap.appendChild(thumb);

    var controls = el("div", "img-controls");

    var pickLabel = el("label", "img-pick", "Vervang foto");
    var file = document.createElement("input");
    file.type = "file";
    file.accept = "image/*";
    file.className = "img-file";
    pickLabel.appendChild(file);
    controls.appendChild(pickLabel);

    var reset = el("button", "img-reset", "Herstel na verstek");
    reset.type = "button";
    controls.appendChild(reset);

    var status = el("span", "img-status", "");
    controls.appendChild(status);

    wrap.appendChild(controls);
    if (f.help) wrap.appendChild(el("p", "content-field-help", f.help));
    fld.appendChild(wrap);

    file.addEventListener("change", function () {
      var chosen = file.files && file.files[0];
      if (!chosen) return;
      status.textContent = "Laai tans op…";
      status.className = "img-status busy";
      pickLabel.classList.add("busy");
      uploadImage(chosen)
        .then(function (url) {
          var prev = wrap.dataset.value;
          wrap.dataset.value = url;
          setImgThumb(thumb, url, wrap.dataset.fallback);
          status.textContent = "Opgelaai ✓ (klik Stoor om te bewaar)";
          status.className = "img-status ok";
          if (prev && prev !== url) deleteUploadedImage(prev); // ruim ou oplaai op
        })
        .catch(function (err) {
          console.warn("Foto-oplaai het misluk:", err);
          status.textContent = "Kon nie oplaai nie.";
          status.className = "img-status err";
          toast("Foto-oplaai het misluk");
        })
        .finally(function () {
          pickLabel.classList.remove("busy");
          file.value = "";
        });
    });

    reset.addEventListener("click", function () {
      var prev = wrap.dataset.value;
      wrap.dataset.value = "";
      setImgThumb(thumb, "", wrap.dataset.fallback);
      status.textContent = "Herstel na verstek (klik Stoor om te bewaar)";
      status.className = "img-status";
      if (prev) deleteUploadedImage(prev); // ruim ou oplaai op
    });
  }

  function setImgThumb(thumb, value, fallback) {
    var src = window.resolveImg(value, fallback);
    if (src) { thumb.src = src; thumb.classList.remove("empty"); }
    else { thumb.removeAttribute("src"); thumb.classList.add("empty"); }
  }

  /* ── Galery-bestuurder ─────────────────────────────────────────────── */
  function buildGalleryManager(fld) {
    var box = el("div", "gallery-manager");
    box.id = "gallery-manager";

    var hint = el("p", "gallery-empty-hint",
      "Leeg — die werf wys die verstek-foto's totdat jy jou eie oplaai.");
    box.appendChild(hint);

    var uploadLabel = el("label", "img-pick gallery-upload", "Laai foto's op");
    var file = document.createElement("input");
    file.type = "file";
    file.accept = "image/*";
    file.multiple = true;
    file.className = "img-file";
    uploadLabel.appendChild(file);
    box.appendChild(uploadLabel);

    var status = el("span", "img-status gallery-status", "");
    box.appendChild(status);

    var grid = el("div", "gallery-grid");
    grid.id = "gallery-grid";
    box.appendChild(grid);

    fld.appendChild(box);

    file.addEventListener("change", function () {
      var files = file.files ? Array.prototype.slice.call(file.files) : [];
      if (!files.length) return;
      status.textContent = "Laai tans op…";
      status.className = "img-status gallery-status busy";
      uploadLabel.classList.add("busy");

      // Laai elke foto onafhanklik — een wat misluk stop nie die res nie.
      var chain = Promise.resolve();
      var ok = 0, fail = 0;
      files.forEach(function (f) {
        chain = chain.then(function () {
          return uploadImage(f)
            .then(function (url) { galleryItems.push({ url: url, alt: "" }); ok++; })
            .catch(function (err) { console.warn("Een foto kon nie oplaai nie:", err); fail++; });
        });
      });
      chain
        .then(function () {
          renderGalleryGrid();
          if (fail === 0) {
            status.textContent = ok + " opgelaai ✓ (klik Stoor om te bewaar)";
            status.className = "img-status gallery-status ok";
          } else {
            status.textContent = ok + " van " + (ok + fail) + " opgelaai — klik Stoor om dié wat geslaag het te bewaar.";
            status.className = "img-status gallery-status err";
            toast(fail + " foto(s) kon nie oplaai nie");
          }
        })
        .finally(function () {
          uploadLabel.classList.remove("busy");
          file.value = "";
        });
    });

    renderGalleryGrid();
  }

  function renderGalleryGrid() {
    var grid = $("gallery-grid");
    if (!grid) return;
    grid.textContent = "";
    var hint = document.querySelector(".gallery-empty-hint");
    if (hint) hint.style.display = galleryItems.length ? "none" : "";

    galleryItems.forEach(function (item, i) {
      var card = el("div", "gallery-item");

      var img = document.createElement("img");
      img.className = "gallery-thumb";
      img.src = item.url || "";
      img.alt = item.alt || "";
      card.appendChild(img);

      var alt = document.createElement("input");
      alt.type = "text";
      alt.className = "gallery-alt";
      alt.placeholder = "Beskrywing (opsioneel)";
      alt.value = item.alt || "";
      alt.addEventListener("input", function () { galleryItems[i].alt = alt.value; });
      card.appendChild(alt);

      var btns = el("div", "gallery-item-btns");

      var up = el("button", "gallery-mini", "Op");
      up.type = "button"; up.title = "Skuif op";
      up.disabled = (i === 0);
      up.addEventListener("click", function () { moveGallery(i, -1); });
      btns.appendChild(up);

      var down = el("button", "gallery-mini", "Af");
      down.type = "button"; down.title = "Skuif af";
      down.disabled = (i === galleryItems.length - 1);
      down.addEventListener("click", function () { moveGallery(i, 1); });
      btns.appendChild(down);

      var del = el("button", "gallery-mini gallery-del", "Verwyder");
      del.type = "button";
      del.addEventListener("click", function () {
        var removed = galleryItems.splice(i, 1)[0];
        if (removed) deleteUploadedImage(removed.url);
        renderGalleryGrid();
      });
      btns.appendChild(del);

      card.appendChild(btns);
      grid.appendChild(card);
    });
  }

  function moveGallery(i, dir) {
    var j = i + dir;
    if (j < 0 || j >= galleryItems.length) return;
    var tmp = galleryItems[i];
    galleryItems[i] = galleryItems[j];
    galleryItems[j] = tmp;
    renderGalleryGrid();
  }

  function fillContentForms() {
    // teks / textarea / list
    document.querySelectorAll("[data-key][data-scope]").forEach(function (node) {
      if (node.dataset.type === "image") {
        var url = content[node.dataset.key];
        if (url == null) url = "";
        node.dataset.value = String(url);
        var thumb = node.querySelector(".img-thumb");
        if (thumb) setImgThumb(thumb, node.dataset.value, node.dataset.fallback);
        return;
      }
      // gewone invoervelde (input / textarea)
      if (node.tagName === "INPUT" || node.tagName === "TEXTAREA") {
        var key = node.dataset.key;
        var val = content[key];
        if (val == null) val = window.CONTENT_DEFAULTS[key] || "";
        node.value = val;
      }
    });

    // galery-array uit content.gallery_images (JSON)
    galleryItems = parseGallery(content.gallery_images);
    renderGalleryGrid();
  }

  function parseGallery(raw) {
    if (!raw) return [];
    try {
      var arr = JSON.parse(raw);
      if (!Array.isArray(arr)) return [];
      return arr
        .filter(function (o) { return o && typeof o === "object" && o.url; })
        .map(function (o) { return { url: String(o.url), alt: o.alt ? String(o.alt) : "" }; });
    } catch (e) { return []; }
  }

  function wireContentSave(btnId, statusId, scope) {
    var btn = $(btnId);
    if (!btn) return;
    btn.addEventListener("click", function () {
      var st = $(statusId);
      st.textContent = "Stoor…"; st.className = "save-status";
      btn.disabled = true;

      var rows = [];

      // teks / textarea / list-invoervelde
      document.querySelectorAll('input[data-scope="' + scope + '"], textarea[data-scope="' + scope + '"]')
        .forEach(function (inp) {
          var key = inp.dataset.key;
          var value = inp.value;
          content[key] = value;
          rows.push({ key: key, value: value });
        });

      // beeld-velde (waarde = URL-string; leeg = verstek)
      document.querySelectorAll('.img-field[data-scope="' + scope + '"]')
        .forEach(function (wrap) {
          var key = wrap.dataset.key;
          var value = wrap.dataset.value || "";
          content[key] = value;
          rows.push({ key: key, value: value });
        });

      // galery — slegs vanaf die hoof-inhoud-redigeerder
      if (scope === "content" && document.getElementById("gallery-manager")) {
        var json = JSON.stringify(galleryItems);
        content.gallery_images = json;
        rows.push({ key: "gallery_images", value: json });
      }

      sb.from("content").upsert(rows, { onConflict: "key" })
        .then(function (res) {
          if (res.error) throw res.error;
          st.textContent = "Alles gestoor ✓"; st.className = "save-status ok";
          toast("Veranderinge gestoor");
          fillContentForms();   // sinkroniseer albei vorms
          renderOorsig();
        })
        .catch(function (err) {
          console.warn("Inhoud stoor het misluk:", err);
          st.textContent = "Kon nie stoor nie. Probeer weer."; st.className = "save-status err";
        })
        .finally(function () { btn.disabled = false; });
    });
  }

  /* ════════════════════════════════════════════════════════════════
     GAS-DETAIL MODAL
     ════════════════════════════════════════════════════════════════ */
  function wireModal() {
    var overlay = $("detail-overlay");
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) closeDetail();
    });
    $("detail-close").addEventListener("click", closeDetail);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeDetail();
    });
  }

  function openDetail(r) {
    var st = statusVan(r);
    $("d-naam").textContent = r.lead_naam || "Gas";
    var n = (r.gaste || []).length;
    $("d-sub").textContent = (r.created_at ? new Date(r.created_at).toLocaleDateString("af-ZA") + " · " : "")
      + (n ? n + (n === 1 ? " gas" : " gaste") : "");

    var status = $("d-status");
    status.className = "chip chip-" + st;
    status.textContent = st === "kom" ? "✦ Kom na die troue" : "Kan nie maak nie";

    // rye
    var rowsBox = $("d-rows");
    rowsBox.textContent = "";
    var kv = [];
    if (r.kom) {
      kv.push(["Aantal gaste", String(r.aantal || 0)]);
      if ((r.gaste || []).length) kv.push(["Wie kom", (r.gaste || []).join(", ")]);
      kv.push(["Slaap oor", r.slaap ? "Ja" : "Nee"]);
      if (r.slaap) kv.push(["Duur", r.naweek === "naweek" ? "Heelnaweek" : "Net Saterdag"]);
      kv.push(["Sondag-ontbyt", r.ontbyt ? "Ja, graag" : "Nee dankie"]);
      kv.push(["Dieet", r.dieet || "Geen"]);
    } else {
      kv.push(["Antwoord", "Kan ongelukkig nie maak nie"]);
    }
    // Eie/bygevoegde RSVP-vrae se antwoorde
    var ek = r.ekstra;
    if (typeof ek === "string") { try { ek = JSON.parse(ek); } catch (e) { ek = {}; } }
    if (ek && typeof ek === "object") {
      Object.keys(ek).forEach(function (q) { if (ek[q]) kv.push([q, String(ek[q])]); });
    }
    kv.forEach(function (pair) {
      var row = el("div", "modal-kv");
      row.appendChild(el("span", "k", pair[0]));
      row.appendChild(el("span", "v", pair[1]));
      rowsBox.appendChild(row);
    });

    // liedjies
    var songs = (r.liedjies || []).filter(Boolean);
    var sWrap = $("d-songs-wrap");
    var sBox = $("d-songs");
    sBox.textContent = "";
    if (songs.length) {
      show(sWrap);
      songs.forEach(function (s) {
        var item = el("div", "modal-song");
        var titel = isUrl(s) ? String(s).replace(/^https?:\/\/(www\.)?/, "").slice(0, 50) : s;
        item.appendChild(el("span", null, titel));
        if (isUrl(s)) {
          var a = el("a", null, "▶ Open");
          a.href = s; a.target = "_blank"; a.rel = "noopener noreferrer";
          item.appendChild(a);
        }
        sBox.appendChild(item);
      });
    } else { hide(sWrap); }

    // boodskap
    var mWrap = $("d-msg-wrap");
    if (r.boodskap && r.boodskap.trim()) {
      show(mWrap);
      $("d-msg").textContent = "“" + r.boodskap.trim() + "”";
    } else { hide(mWrap); }

    show($("detail-overlay"));
  }

  function closeDetail() { hide($("detail-overlay")); }

})();
