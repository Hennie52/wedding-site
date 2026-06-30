/**
 * Gedeelde hulpfunksies vir die portaal én admin.
 *  - markdownToDOM: wys teks met **vet** en *skuins* veilig (geen innerHTML)
 *  - resolveImg: kies die gestoorde foto, of die verstek
 *  - resizeImageFile: verklein 'n foto in die blaaier voor dit opgelaai word
 *  - STORAGE_BUCKET: naam van die Supabase-bergingsemmer
 */
(function () {
  "use strict";

  window.STORAGE_BUCKET = "foto";

  // ── Veilige "markdown-lite" → DOM ──
  function inlineMd(parent, text) {
    // pas **vet** of *skuins* aan; alles bly teks-nodes (veilig teen XSS)
    const re = /(\*\*([^*]+)\*\*|\*([^*]+)\*)/g;
    let last = 0, m;
    while ((m = re.exec(text))) {
      if (m.index > last) parent.appendChild(document.createTextNode(text.slice(last, m.index)));
      if (m[2] !== undefined) {
        const b = document.createElement("strong");
        b.textContent = m[2];
        parent.appendChild(b);
      } else {
        const i = document.createElement("em");
        i.textContent = m[3];
        parent.appendChild(i);
      }
      last = re.lastIndex;
    }
    if (last < text.length) parent.appendChild(document.createTextNode(text.slice(last)));
  }

  window.markdownToDOM = function (el, text) {
    el.textContent = "";
    String(text == null ? "" : text).split("\n").forEach((line, i) => {
      if (i > 0) el.appendChild(document.createElement("br"));
      inlineMd(el, line);
    });
  };

  // ── Kies foto-URL of verstek ──
  window.resolveImg = function (value, fallback) {
    const v = (value == null ? "" : String(value)).trim();
    return v || fallback || "";
  };

  // ── Verklein 'n foto-lêer in die blaaier (canvas → WebP-blob) ──
  window.resizeImageFile = function (file, maxDim, quality) {
    maxDim = maxDim || 1700;
    quality = quality || 0.82;
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        let w = img.naturalWidth, h = img.naturalHeight;
        if (w > maxDim || h > maxDim) {
          const s = Math.min(maxDim / w, maxDim / h);
          w = Math.round(w * s);
          h = Math.round(h * s);
        }
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        canvas.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error("Kon nie foto verwerk nie."))),
          "image/webp",
          quality
        );
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Kon nie die foto laai nie.")); };
      img.src = url;
    });
  };
})();
