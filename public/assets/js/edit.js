/**
 * WYSIG-MODUS — 'n volledige inline bladsy-bouer.
 *
 * Laai NET wanneer die URL ?edit=1 het. Die bladsy self is die werklike
 * gaste-voorblad (index.html); die admin sluit dit in 'n selfde-oorsprong
 * iframe by admin.html in. Hierdie lêer laat 'n aangemelde admin ALLES op
 * die bladsy inlyn wysig en stoor na Supabase.
 *
 *  - Teks      : elke [data-content] element  → modaal met teksveld
 *  - Foto's    : elke [data-img] element       → kies lêer → oplaai
 *  - Blokke    : storie/program/verblyf/vrae/bank/tema → generiese blok-wysiger
 *  - Galery    : #gal (gallery_images)         → multi-oplaai, herrangskik
 *
 * Veiligheid: nooit innerHTML met gebruiker/db/lêer-data nie — alles word met
 * textContent / createElement gebou; elke JSON.parse is beskerm; foute gooi
 * nooit in die UI nie (vang + toast).
 */
(function () {
  "use strict";
  if (new URLSearchParams(location.search).get("edit") !== "1") return;
  var P = window.PORTAL;
  if (!P) return;

  var EMBEDDED = (function () { try { return window.parent && window.parent !== window; } catch (e) { return false; } })();

  /* ── Gebruik die admin (ouervenster) se aangemelde kliënt wanneer ons binne die admin-iframe loop ── */
  function resolveClient() {
    try {
      if (window.parent && window.parent !== window && typeof window.parent.getSupabaseClient === "function") {
        var pc = window.parent.getSupabaseClient();
        if (pc) return pc;
      }
    } catch (e) { /* kruis-oorsprong — onwaarskynlik, val terug */ }
    return (window.getSupabaseClient && window.getSupabaseClient()) || null;
  }
  var sb = resolveClient();

  if (!sb) { banner("Supabase is nie opgestel nie — kan nie wysig nie.", false); return; }
  sb.auth.getSession().then(function (res) {
    if (res && res.data && res.data.session) start();
    else banner("Meld eers by die Admin aan om te wysig.", true);
  }).catch(function () { banner("Meld eers by die Admin aan om te wysig.", true); });

  /* ───────────────────────── klein DOM-helpers ───────────────────────── */
  function elc(tag, cls, txt) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (txt != null) n.textContent = txt;
    return n;
  }
  function btn(txt, kind) {
    var b = elc("button", "edit-btn" + (kind ? " edit-btn--" + kind : ""), txt);
    b.type = "button";
    return b;
  }
  function toast(msg) {
    var t = elc("div", "edit-toast", msg);
    document.body.appendChild(t);
    setTimeout(function () { t.style.opacity = "0"; setTimeout(function () { t.remove(); }, 400); }, 1900);
  }
  function banner(msg, withLink) {
    injectCss();
    var bar = elc("div", "edit-bar");
    bar.appendChild(elc("span", "edit-bar__msg", msg));
    if (withLink) {
      var a = document.createElement("a");
      a.href = "admin.html"; a.className = "edit-btn edit-btn--primary"; a.textContent = "Gaan na Admin";
      bar.appendChild(a);
    }
    document.body.appendChild(bar);
    document.body.style.paddingTop = "52px";
  }

  /* ───────────────────────── stoor / oplaai ───────────────────────── */
  function saveContent(key, value) {
    return Promise.resolve(sb.from("content").upsert([{ key: key, value: value }], { onConflict: "key" }))
      .then(function (r) {
        if (r && r.error) throw r.error;
        P.content[key] = value; // hou die lewendige inhoud-objek in pas
      });
  }
  function uploadFoto(file) {
    return window.resizeImageFile(file, 1700, 0.82).then(function (blob) {
      var path = "uploads/" + Date.now() + "-" + Math.random().toString(36).slice(2) + ".webp";
      return Promise.resolve(sb.storage.from(window.STORAGE_BUCKET).upload(path, blob, { contentType: "image/webp", upsert: true }))
        .then(function (up) {
          if (up && up.error) throw up.error;
          return sb.storage.from(window.STORAGE_BUCKET).getPublicUrl(path).data.publicUrl;
        });
    });
  }
  function pickFile(cb, multiple) {
    var inp = document.createElement("input");
    inp.type = "file"; inp.accept = "image/*";
    if (multiple) inp.multiple = true;
    inp.style.display = "none";
    document.body.appendChild(inp);
    inp.addEventListener("change", function () {
      var fs = Array.prototype.slice.call(inp.files || []);
      inp.remove();
      if (fs.length) { multiple ? cb(fs) : cb(fs[0]); }
    });
    inp.click();
  }

  /* ───────────────────────── modaal ───────────────────────── */
  function modal(title) {
    var ov = elc("div", "edit-modal");
    var card = elc("div", "edit-modal__card");
    var head = elc("div", "edit-modal__head");
    head.appendChild(elc("h3", null, title));
    var x = btn("✕", ""); x.classList.add("edit-modal__x"); head.appendChild(x);
    card.appendChild(head);
    var bodyWrap = elc("div", "edit-modal__body");
    card.appendChild(bodyWrap);
    ov.appendChild(card);

    function close() {
      ov.remove();
      document.removeEventListener("keydown", onKey);
    }
    function onKey(e) { if (e.key === "Escape") close(); }
    ov.addEventListener("click", function (e) { if (e.target === ov) close(); });
    x.onclick = close;
    document.addEventListener("keydown", onKey);
    document.body.appendChild(ov);
    // card én body — vir terugwaartse versoenbaarheid plaas helpers in .card
    return { ov: ov, card: bodyWrap, foot: card, close: close };
  }
  function field(label, value, multiline) {
    var w = elc("label", "edit-field");
    w.appendChild(elc("span", "edit-field__lab", label));
    var input = multiline ? document.createElement("textarea") : document.createElement("input");
    if (!multiline) input.type = "text";
    input.className = "edit-input";
    input.value = value == null ? "" : String(value);
    w.appendChild(input);
    return { wrap: w, input: input };
  }
  function actions() { return elc("div", "edit-actions"); }

  /* ───────────────────────── skema-hulp ───────────────────────── */
  function schemaField(key) {
    var a = P.schema || [];
    for (var i = 0; i < a.length; i++) if (a[i].key === key) return a[i];
    return null;
  }

  /* ───────────────────────── 1) TEKS-wysiger ───────────────────────── */
  function editKey(key, title, help) {
    var m = modal(title || "Wysig teks");
    var f = field("Teks", P.content[key], true);
    m.card.appendChild(f.wrap);
    m.card.appendChild(elc("p", "edit-hint", help || "Wenk: **sterretjies** = vet, *enkel sterretjies* = skuins."));
    var bar = actions();
    var cancel = btn("Kanselleer", ""), save = btn("Stoor", "primary");
    bar.appendChild(cancel); bar.appendChild(save);
    m.card.appendChild(bar);
    setTimeout(function () { try { f.input.focus(); } catch (e) {} }, 30);
    cancel.onclick = m.close;
    save.onclick = function () {
      save.disabled = true; save.textContent = "Stoor…";
      saveContent(key, f.input.value)
        .then(function () { safeReapply(); m.close(); toast("Gestoor ✓"); })
        .catch(function (e) { console.error(e); save.disabled = false; save.textContent = "Stoor"; toast("Kon nie stoor nie"); });
    };
  }
  function editText(el) {
    var key = el.getAttribute("data-content");
    var sf = schemaField(key);
    editKey(key, "Wysig teks", sf && sf.help ? sf.help : null);
  }

  /* ───────────────────────── 2) FOTO vervang ───────────────────────── */
  function replaceImage(el) {
    var key = el.getAttribute("data-img");
    pickFile(function (file) {
      toast("Laai foto op…");
      uploadFoto(file)
        .then(function (url) { return saveContent(key, url); })
        .then(function () { safeReapply(); toast("Foto gestoor ✓"); })
        .catch(function (e) { console.error(e); toast("Foto-oplaai het misluk"); });
    });
  }

  /* ───────────────────────── 3) GENERIESE BLOK-wysiger ─────────────────────────
   * cfg = { title, addLabel, fields:[{prop,label,type}] }
   *   type: 'text' | 'textarea' | 'image' | 'color' | 'align'
   * Lees items via PORTAL.items(key, props) (JSON óf ou pype-formaat).
   * Stoor JSON.stringify(items) na die inhoud-sleutel.
   */
  function blockEditor(key, cfg) {
    cfg = cfg || {};
    var fields = cfg.fields || [];
    var props = fields.map(function (f) { return f.prop; });
    var items;
    try {
      items = (P.items(key, props) || []).map(function (o) { return cloneItem(o, props); });
    } catch (e) { console.error(e); items = []; }

    var m = modal(cfg.title || "Wysig afdeling");
    var list = elc("div", "edit-blocks");
    m.card.appendChild(list);

    var add = btn("＋ " + (cfg.addLabel || "Voeg item by"), "");
    add.classList.add("edit-block-add");
    m.card.appendChild(add);

    var bar = actions();
    var cancel = btn("Kanselleer", ""), save = btn("Stoor", "primary");
    bar.appendChild(cancel); bar.appendChild(save);
    m.card.appendChild(bar);

    function cloneItem(o, ps) {
      var n = {};
      ps.forEach(function (p) { n[p] = (o && o[p] != null) ? o[p] : ""; });
      return n;
    }
    function blank() { return cloneItem({}, props); }

    function move(i, dir) {
      var j = i + dir;
      if (j < 0 || j >= items.length) return;
      var t = items[i]; items[i] = items[j]; items[j] = t;
      render();
    }
    function remove(i) {
      if (!confirm("Verwyder hierdie item?")) return;
      items.splice(i, 1);
      render();
    }

    function renderCard(item, i) {
      var cardEl = elc("div", "edit-block");

      var top = elc("div", "edit-block__top");
      top.appendChild(elc("span", "edit-block__num", "#" + (i + 1)));
      var ctrls = elc("div", "edit-block__ctrls");
      var up = btn("↑", ""); up.title = "Skuif op";
      var dn = btn("↓", ""); dn.title = "Skuif af";
      var rm = btn("Verwyder", "danger");
      up.disabled = (i === 0);
      dn.disabled = (i === items.length - 1);
      up.onclick = function () { move(i, -1); };
      dn.onclick = function () { move(i, 1); };
      rm.onclick = function () { remove(i); };
      ctrls.appendChild(up); ctrls.appendChild(dn); ctrls.appendChild(rm);
      top.appendChild(ctrls);
      cardEl.appendChild(top);

      fields.forEach(function (f) {
        if (f.type === "image") {
          var w = elc("div", "edit-field");
          w.appendChild(elc("span", "edit-field__lab", f.label));
          var row = elc("div", "edit-imgrow");
          var thumb = document.createElement("img");
          thumb.className = "edit-thumb";
          thumb.src = window.resolveImg(item[f.prop], "assets/foto/ring.jpg");
          thumb.alt = "";
          var rep = btn("Vervang foto", "");
          rep.onclick = (function (it, p, t, b) {
            return function () {
              pickFile(function (file) {
                b.disabled = true; b.textContent = "Laai op…";
                uploadFoto(file)
                  .then(function (url) { it[p] = url; t.src = url; b.disabled = false; b.textContent = "Vervang foto"; toast("Foto opgelaai — klik Stoor"); })
                  .catch(function (e) { console.error(e); b.disabled = false; b.textContent = "Vervang foto"; toast("Oplaai het misluk"); });
              });
            };
          })(item, f.prop, thumb, rep);
          row.appendChild(thumb); row.appendChild(rep);
          w.appendChild(row);
          cardEl.appendChild(w);
        } else if (f.type === "color") {
          var cw = elc("label", "edit-field");
          cw.appendChild(elc("span", "edit-field__lab", f.label));
          var crow = elc("div", "edit-colorrow");
          var ci = document.createElement("input");
          ci.type = "color";
          ci.className = "edit-color";
          ci.value = normColor(item[f.prop]);
          var ct = document.createElement("input");
          ct.type = "text"; ct.className = "edit-input edit-color-text";
          ct.value = item[f.prop] || "";
          ci.oninput = (function (it, p, txt) { return function () { it[p] = ci.value; txt.value = ci.value; }; })(item, f.prop, ct);
          ct.oninput = (function (it, p, pick) { return function () { it[p] = ct.value; var n = normColor(ct.value); if (n) pick.value = n; }; })(item, f.prop, ci);
          crow.appendChild(ci); crow.appendChild(ct);
          cw.appendChild(crow);
          cardEl.appendChild(cw);
        } else if (f.type === "align") {
          var aw = elc("label", "edit-field");
          aw.appendChild(elc("span", "edit-field__lab", f.label));
          var ab = btn(alignLabel(item[f.prop]), "");
          ab.classList.add("edit-align-btn");
          ab.onclick = (function (it, p, b) {
            return function () {
              it[p] = (it[p] === "right") ? "left" : "right";
              b.textContent = alignLabel(it[p]);
            };
          })(item, f.prop, ab);
          aw.appendChild(ab);
          cardEl.appendChild(aw);
        } else {
          var fld = field(f.label, item[f.prop], f.type === "textarea");
          fld.input.oninput = (function (it, p, inp) { return function () { it[p] = inp.value; }; })(item, f.prop, fld.input);
          cardEl.appendChild(fld.wrap);
        }
      });

      return cardEl;
    }

    function render() {
      list.textContent = "";
      if (!items.length) {
        list.appendChild(elc("p", "edit-hint", "Nog geen items nie — klik “" + (cfg.addLabel || "Voeg item by") + "”."));
      }
      items.forEach(function (item, i) { list.appendChild(renderCard(item, i)); });
    }

    add.onclick = function () {
      items.push(blank());
      render();
      // rol na die nuwe kaart
      setTimeout(function () { try { list.lastChild && list.lastChild.scrollIntoView({ block: "nearest" }); } catch (e) {} }, 10);
    };
    cancel.onclick = m.close;
    save.onclick = function () {
      save.disabled = true; save.textContent = "Stoor…";
      var json;
      try { json = JSON.stringify(items); }
      catch (e) { console.error(e); save.disabled = false; save.textContent = "Stoor"; toast("Kon nie stoor nie"); return; }
      saveContent(key, json)
        .then(function () { safeReapply(); m.close(); toast("Gestoor ✓"); })
        .catch(function (e) { console.error(e); save.disabled = false; save.textContent = "Stoor"; toast("Kon nie stoor nie"); });
    };

    render();
  }

  function alignLabel(v) { return v === "right" ? "Foto: regs ⟶" : "⟵ Foto: links"; }
  function normColor(v) {
    var s = String(v == null ? "" : v).trim();
    if (/^#[0-9a-fA-F]{6}$/.test(s)) return s;
    if (/^#[0-9a-fA-F]{3}$/.test(s)) return "#" + s[1] + s[1] + s[2] + s[2] + s[3] + s[3];
    return "#8C9A6E";
  }

  /* Blok-afdeling konfigurasies */
  var BLOCKS = {
    storie_blocks: {
      title: "Ons storie — blokke",
      addLabel: "Voeg storie-blok by",
      fields: [
        { prop: "hoofstuk", label: "Hoofstuk-etiket", type: "text" },
        { prop: "titel", label: "Titel", type: "text" },
        { prop: "teks", label: "Teks (los 'n leë reël tussen paragrawe)", type: "textarea" },
        { prop: "img", label: "Foto", type: "image" },
        { prop: "align", label: "Foto-kant", type: "align" }
      ]
    },
    program_vry: { title: "Program — Vrydag", addLabel: "Voeg item by", fields: progFields() },
    program_sat: { title: "Program — Saterdag", addLabel: "Voeg item by", fields: progFields() },
    program_son: { title: "Program — Sondag", addLabel: "Voeg item by", fields: progFields() },
    verblyf: {
      title: "Verblyf-opsies", addLabel: "Voeg verblyf-opsie by",
      fields: [
        { prop: "naam", label: "Naam", type: "text" },
        { prop: "afstand", label: "Afstand", type: "text" },
        { prop: "info", label: "Beskrywing", type: "textarea" }
      ]
    },
    vrae: {
      title: "Vrae & antwoorde", addLabel: "Voeg vraag by",
      fields: [
        { prop: "vraag", label: "Vraag", type: "text" },
        { prop: "antwoord", label: "Antwoord", type: "textarea" }
      ]
    },
    bank: {
      title: "Bankbesonderhede", addLabel: "Voeg reël by",
      fields: [
        { prop: "label", label: "Etiket", type: "text" },
        { prop: "value", label: "Waarde", type: "text" }
      ]
    },
    tema_swatches: {
      title: "Tema — kleure", addLabel: "Voeg kleur by",
      fields: [
        { prop: "label", label: "Etiket", type: "text" },
        { prop: "color", label: "Kleur", type: "color" }
      ]
    },
    rsvp_extra: {
      title: "Eie RSVP-vrae", addLabel: "Voeg vraag by",
      fields: [
        { prop: "vraag", label: "Vraag", type: "text" },
        { prop: "tipe", label: "Antwoord-tipe — tik 'kort' of 'lank'", type: "text" }
      ]
    }
  };
  function progFields() {
    return [
      { prop: "tyd", label: "Tyd", type: "text" },
      { prop: "titel", label: "Titel", type: "text" },
      { prop: "info", label: "Beskrywing", type: "textarea" }
    ];
  }

  /* ───────────────────────── 4) GALERY ─────────────────────────
   * key gallery_images, array van {url, alt}.
   * Wanneer leeg: saai die werklys uit die gebundelde gallery.json sodat die
   * admin die foto's wat NOU wys kan wysig/verwyder/herrangskik.
   */
  function loadGallerySeed() {
    try {
      var arr = JSON.parse(P.content.gallery_images || "[]");
      if (Array.isArray(arr) && arr.length) {
        return Promise.resolve(arr.filter(function (x) { return x && x.url; })
          .map(function (x) { return { url: x.url, alt: x.alt || "" }; }));
      }
    } catch (e) { /* val terug op verstek */ }
    return Promise.resolve(fetch("assets/foto/gallery.json"))
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (!Array.isArray(data)) return [];
        return data.map(function (g) { return { url: "assets/foto/" + (g.full || g.thumb), alt: g.alt || "" }; });
      })
      .catch(function (e) { console.warn("Kon nie verstek-galery laai nie:", e); return []; });
  }

  function openGallery() {
    var m = modal("Bestuur galery-foto's");
    var up = btn("Laai foto's op", "primary");
    up.classList.add("edit-gal-up");
    var hint = elc("p", "edit-hint", "Laai joue eie foto's op, herrangskik met die pyltjies, gee elkeen 'n beskrywing, of verwyder.");
    var grid = elc("div", "edit-gal-grid");
    m.card.appendChild(hint);
    m.card.appendChild(up);
    m.card.appendChild(grid);

    var bar = actions();
    var cancel = btn("Kanselleer", ""), save = btn("Stoor", "primary");
    bar.appendChild(cancel); bar.appendChild(save);
    m.card.appendChild(bar);

    var items = [];
    var loading = elc("p", "edit-hint", "Laai tans…");
    grid.appendChild(loading);

    function render() {
      grid.textContent = "";
      if (!items.length) { grid.appendChild(elc("p", "edit-hint", "Geen foto's nie — laai van jou eie op.")); return; }
      items.forEach(function (it, i) {
        var cell = elc("div", "edit-gal-cell");
        var im = document.createElement("img");
        im.src = window.resolveImg(it.url, "assets/foto/ring.jpg"); im.alt = "";
        cell.appendChild(im);

        var altw = field("Beskrywing", it.alt, false);
        altw.input.classList.add("edit-gal-alt");
        altw.input.oninput = (function (x, inp) { return function () { x.alt = inp.value; }; })(it, altw.input);
        cell.appendChild(altw.wrap);

        var row = elc("div", "edit-gal-ctrls");
        var u = btn("↑", ""), d = btn("↓", ""), rm = btn("✕", "danger");
        u.disabled = (i === 0); d.disabled = (i === items.length - 1);
        u.onclick = function () { var t = items[i - 1]; items[i - 1] = items[i]; items[i] = t; render(); };
        d.onclick = function () { var t = items[i + 1]; items[i + 1] = items[i]; items[i] = t; render(); };
        rm.onclick = function () { items.splice(i, 1); render(); };
        row.appendChild(u); row.appendChild(d); row.appendChild(rm);
        cell.appendChild(row);
        grid.appendChild(cell);
      });
    }

    loadGallerySeed().then(function (seed) { items = seed; render(); });

    up.onclick = function () {
      pickFile(function (files) {
        up.disabled = true; up.textContent = "Laai op…";
        var chain = Promise.resolve(), ok = 0, fail = 0, total = files.length;
        files.forEach(function (f) {
          chain = chain.then(function () {
            up.textContent = "Laai op… " + (ok + fail + 1) + " van " + total;
            return uploadFoto(f)
              .then(function (url) { items.push({ url: url, alt: "" }); ok++; })
              .catch(function (e) { console.warn(e); fail++; });
          });
        });
        chain.then(function () {
          render();
          up.disabled = false; up.textContent = "Laai foto's op";
          toast(ok + " van " + total + " opgelaai" + (fail ? " — " + fail + " het misluk" : ""));
        });
      }, true);
    };

    cancel.onclick = m.close;
    save.onclick = function () {
      save.disabled = true; save.textContent = "Stoor…";
      var json;
      try { json = JSON.stringify(items.map(function (x) { return { url: x.url, alt: x.alt || "" }; })); }
      catch (e) { console.error(e); save.disabled = false; save.textContent = "Stoor"; toast("Kon nie stoor nie"); return; }
      saveContent("gallery_images", json)
        .then(function () { safeReapply(); m.close(); toast("Galery gestoor ✓"); })
        .catch(function (e) { console.error(e); save.disabled = false; save.textContent = "Stoor"; toast("Kon nie stoor nie"); });
    };
  }

  /* ───────────────────────── her-aanwending (veilig) ───────────────────────── */
  var _floatBtn = null;
  function hideFloat() { if (_floatBtn) _floatBtn.style.display = "none"; }
  function safeReapply() {
    hideFloat(); // die swewende knoppie kan na 'n stale (verwyderde) element wys
    try { P.reapply(); } catch (e) { console.error(e); toast("Bladsy kon nie verfris nie"); }
  }

  /* ───────────────────────── begin wysig-modus ───────────────────────── */
  function start() {
    injectCss();
    document.body.classList.add("edit-on");
    document.body.style.paddingTop = "52px";

    /* Boonste wysig-balk */
    var bar = elc("div", "edit-bar");
    bar.appendChild(elc("span", "edit-bar__msg", "✎ Wysig-modus — beweeg oor enige teks of foto en klik die wysig-knoppie."));
    var done = btn("Klaar", "primary");
    done.onclick = function () {
      // Binne die admin-iframe: laai net hierdie iframe weer (bly op die Redigeer-tab).
      // Standalone: gaan na admin.html.
      if (EMBEDDED) { location.reload(); }
      else { location.href = "admin.html"; }
    };
    bar.appendChild(done);
    document.body.appendChild(bar);

    /* Open die regte wysiger vir 'n element */
    function openEditorFor(t) {
      var st = t.closest("[data-storie]");
      if (st) { blockEditor("storie_blocks", BLOCKS.storie_blocks); return; }
      var img = t.closest("[data-img]");
      if (img) { replaceImage(img); return; }
      var tx = t.closest("[data-content]");
      if (tx) { editText(tx); return; }
    }

    /* Vind die naaste wysigbare teiken (sluit die hero-media-streek in vir die agtergrond-foto) */
    function findTarget(node) {
      if (!node || !node.closest) return null;
      // ons eie UI nooit
      if (node.closest(".edit-modal,.edit-bar,.edit-addbtn,.edit-float,.edit-toast")) return null;
      var t = node.closest("[data-storie],[data-img],[data-content]");
      if (t) return t;
      // Hero-foto is 'n agtergrond-div agter teks — laat die hele media-streek dit bereik
      var media = node.closest(".hero__media, .hero__img");
      if (media) {
        var bg = media.querySelector("[data-img]") || document.querySelector(".hero [data-img]");
        if (bg) return bg;
      }
      return null;
    }

    /* Delegeer klikke (capture, sodat dit voor die nav-rol-handler kom) */
    document.addEventListener("click", function (e) {
      if (!document.body.classList.contains("edit-on")) return;
      if (e.target.closest && e.target.closest(".edit-modal,.edit-bar,.edit-addbtn,.edit-float,.edit-toast")) return;
      var t = findTarget(e.target);
      if (t) { e.preventDefault(); e.stopPropagation(); openEditorFor(t); }
    }, true);

    /* Swewende "✎ Wysig"-knoppie wat die element volg waaroor jy beweeg */
    var current = null;
    var floatBtn = elc("button", "edit-float", "✎ Wysig");
    floatBtn.type = "button";
    document.body.appendChild(floatBtn);
    _floatBtn = floatBtn;
    document.addEventListener("mousemove", function (e) {
      if (!document.body.classList.contains("edit-on")) return;
      if (e.target.closest && e.target.closest(".edit-modal,.edit-bar,.edit-addbtn,.edit-float,.edit-toast")) return;
      var t = findTarget(e.target);
      if (!t) { floatBtn.style.display = "none"; current = null; return; }
      if (t === current && floatBtn.style.display !== "none") return;
      current = t;
      var r = t.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) { floatBtn.style.display = "none"; return; }
      floatBtn.style.display = "inline-flex";
      floatBtn.style.top = (window.scrollY + r.top + 6) + "px";
      floatBtn.style.left = (window.scrollX + Math.max(8, r.left) + 6) + "px";
    });
    // posisie raak stale wanneer 'n mens rol — versteek dan
    window.addEventListener("scroll", function () { floatBtn.style.display = "none"; current = null; }, { passive: true });
    floatBtn.addEventListener("click", function (e) {
      e.preventDefault(); e.stopPropagation();
      if (current) openEditorFor(current);
    });

    /* Plaas 'n wysig-knoppie reg onder elke gestruktureerde afdeling */
    function sectionButton(containerId, label, onClick) {
      var node = document.getElementById(containerId);
      if (!node || !node.parentNode) return;
      var b = btn(label, "add");
      b.classList.add("edit-addbtn");
      b.onclick = onClick;
      node.parentNode.insertBefore(b, node.nextSibling);
    }

    sectionButton("storie-blocks", "✎ Wysig Ons storie", function () { blockEditor("storie_blocks", BLOCKS.storie_blocks); });
    sectionButton("prog-vry", "✎ Wysig Program — Vrydag", function () { blockEditor("program_vry", BLOCKS.program_vry); });
    sectionButton("prog-sat", "✎ Wysig Program — Saterdag", function () { blockEditor("program_sat", BLOCKS.program_sat); });
    sectionButton("prog-son", "✎ Wysig Program — Sondag", function () { blockEditor("program_son", BLOCKS.program_son); });
    sectionButton("verblyf-cards", "✎ Wysig Verblyf-opsies", function () { blockEditor("verblyf", BLOCKS.verblyf); });
    // Die Maps-skakel is 'n href (nie sigbare teks nie) — kry sy eie wysig-knoppie
    sectionButton("verblyf-map", "✎ Wysig Google Maps-skakel", function () {
      var sf = schemaField("verblyf_map_url");
      editKey("verblyf_map_url", "Google Maps-skakel",
        (sf && sf.help) || "Plak enige Google Maps \"deel\"-skakel. Los leeg om die ligging-blok weg te steek.");
    });
    sectionButton("vrae-list", "✎ Wysig Vrae & antwoorde", function () { blockEditor("vrae", BLOCKS.vrae); });
    sectionButton("bank", "✎ Wysig Bankbesonderhede", function () { blockEditor("bank", BLOCKS.bank); });
    sectionButton("tema-swatches", "✎ Wysig Tema-kleure", function () { blockEditor("tema_swatches", BLOCKS.tema_swatches); });
    sectionButton("gal", "⚙ Bestuur galery-foto's", openGallery);

    // RSVP: wys al die versteekte afdelings sodat die admin elke vraag/knoppie kan wysig
    ["rsvp-ja", "rsvp-nee", "rsvp-duur", "rsvp-actions"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.classList.remove("hidden");
    });
    sectionButton("rsvp-extra-q", "✎ Voeg/wysig eie RSVP-vrae", function () { blockEditor("rsvp_extra", BLOCKS.rsvp_extra); });

    toast("Wysig-modus aktief");
  }

  /* ───────────────────────── style ───────────────────────── */
  function injectCss() {
    if (document.getElementById("edit-css")) return;
    var s = elc("style"); s.id = "edit-css";
    s.textContent = [
      ".edit-bar{position:fixed;top:0;left:0;right:0;z-index:9999;background:#34402A;color:#eef0e3;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 18px;font-family:'Jost',sans-serif;font-size:13px;box-shadow:0 4px 14px rgba(0,0,0,.25)}",
      ".edit-bar__msg{letter-spacing:.4px}",
      ".edit-btn{font-family:'Jost',sans-serif;font-size:12px;font-weight:500;letter-spacing:1px;border:1px solid #6E7C50;background:#fff;color:#4F5D3A;border-radius:4px;padding:9px 16px;cursor:pointer;text-decoration:none;display:inline-block;line-height:1.1}",
      ".edit-btn:disabled{opacity:.45;cursor:default}",
      ".edit-btn--primary{background:#4F5D3A;color:#faf6ee;border-color:#4F5D3A}",
      ".edit-btn--danger{background:#f6e0da;color:#c6543f;border-color:#e3b9ae}",
      ".edit-btn--add{background:#34402A;color:#eef0e3;border-color:#34402A;display:block;margin:24px auto 0;letter-spacing:2px;text-transform:uppercase;font-size:11px;padding:13px 22px}",
      ".edit-on [data-content],.edit-on [data-img],.edit-on [data-storie],.edit-on .hero__media{cursor:pointer;transition:outline .12s}",
      ".edit-on [data-content]:hover,.edit-on [data-img]:hover,.edit-on [data-storie]:hover,.edit-on .hero__media:hover{outline:2px solid #8C9A6E;outline-offset:4px;border-radius:2px}",
      ".edit-float{position:absolute;z-index:9998;display:none;align-items:center;gap:4px;background:#34402A;color:#eef0e3;border:1px solid #B8963E;border-radius:5px;font-family:'Jost',sans-serif;font-size:11px;font-weight:500;letter-spacing:1px;padding:6px 11px;cursor:pointer;box-shadow:0 6px 16px rgba(0,0,0,.3)}",
      ".edit-float:hover{background:#4F5D3A}",
      ".edit-modal{position:fixed;inset:0;z-index:10000;background:rgba(28,35,20,.55);-webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px);display:flex;align-items:flex-start;justify-content:center;padding:6vh 16px;overflow:auto}",
      ".edit-modal__card{background:#FAF6EE;border-radius:8px;max-width:560px;width:100%;max-height:86vh;display:flex;flex-direction:column;box-shadow:0 30px 80px -20px rgba(0,0,0,.5);font-family:'Jost',sans-serif}",
      ".edit-modal__head{display:flex;align-items:center;justify-content:space-between;padding:22px 26px 12px;flex:0 0 auto}",
      ".edit-modal__head h3{font-family:'Cormorant Garamond',serif;font-weight:500;font-size:24px;color:#34402A;margin:0}",
      ".edit-modal__x{padding:4px 10px}",
      ".edit-modal__body{padding:4px 26px 22px;overflow:auto;flex:1 1 auto}",
      ".edit-field{display:block;margin-bottom:14px}",
      ".edit-field__lab{display:block;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#7a7f6c;margin-bottom:6px}",
      ".edit-input{width:100%;font-family:'Jost',sans-serif;font-size:15px;color:#34402A;background:#fff;border:1px solid #d8cdb4;border-radius:6px;padding:11px 13px;outline:none;box-sizing:border-box}",
      "textarea.edit-input{min-height:110px;resize:vertical;line-height:1.5}",
      ".edit-input:focus{border-color:#8C9A6E}",
      ".edit-hint{font-size:12px;color:#9aa088;margin:0 0 10px}",
      ".edit-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:18px;padding-top:14px;border-top:1px solid #ece4d2}",
      ".edit-imgrow{display:flex;align-items:center;gap:14px;margin:2px 0}",
      ".edit-thumb{width:84px;height:84px;object-fit:cover;border-radius:6px;border:1px solid #d8cdb4;background:#fff;flex:0 0 auto}",
      ".edit-blocks{display:flex;flex-direction:column;gap:16px;margin-bottom:6px}",
      ".edit-block{border:1px solid #e3dcc9;border-radius:8px;padding:14px 16px;background:#fff}",
      ".edit-block__top{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}",
      ".edit-block__num{font-size:11px;letter-spacing:1px;color:#9aa088}",
      ".edit-block__ctrls{display:flex;gap:6px}",
      ".edit-block__ctrls .edit-btn{padding:6px 10px}",
      ".edit-block-add{display:block;width:100%;margin:14px 0 2px;border-style:dashed}",
      ".edit-colorrow{display:flex;align-items:center;gap:10px}",
      ".edit-color{width:46px;height:38px;padding:0;border:1px solid #d8cdb4;border-radius:6px;background:#fff;cursor:pointer;flex:0 0 auto}",
      ".edit-color-text{flex:1 1 auto}",
      ".edit-align-btn{width:100%}",
      ".edit-gal-up{display:inline-block;margin:0 0 12px}",
      ".edit-gal-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:14px;margin:6px 0}",
      ".edit-gal-cell{border:1px solid #e3dcc9;border-radius:8px;overflow:hidden;background:#fff;display:flex;flex-direction:column}",
      ".edit-gal-cell>img{width:100%;height:110px;object-fit:cover;display:block}",
      ".edit-gal-cell .edit-field{margin:8px 10px 0}",
      ".edit-gal-alt{font-size:13px;padding:7px 9px}",
      ".edit-gal-ctrls{display:flex;justify-content:center;gap:6px;padding:8px}",
      ".edit-gal-ctrls .edit-btn{padding:5px 9px;font-size:12px}",
      ".edit-toast{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);z-index:10001;background:#34402A;color:#eef0e3;font-family:'Jost',sans-serif;font-size:13px;padding:11px 20px;border-radius:8px;box-shadow:0 14px 34px -12px rgba(0,0,0,.45);transition:opacity .4s}"
    ].join("\n");
    document.head.appendChild(s);
  }
})();
