/**
 * INHOUD-SKEMA — die enigste plek waar al die redigeerbare teks gedefinieer word.
 * Die portaal (portal.js) gebruik die verstek-waardes; die admin-bladsy (admin.js)
 * bou outomaties 'n redigeer-vorm hieruit.
 *
 *  key     - unieke sleutel (databasis + data-content="key" in die HTML)
 *  label   - wat die admin sien
 *  type    - "text" | "textarea" | "list"
 *  group   - admin-afdeling
 *  default - verstek-teks (wys as niks in die databasis is nie)
 *  help    - opsionele wenk
 *
 * "list"-velde: een item per reël; velde geskei met " | " (sien help).
 */
window.CONTENT_SCHEMA = [
  // ───── Instellings ─────
  { key:"gate_code", label:"Toegangskode (gaste tik dit in)", type:"text", group:"Instellings",
    default:"troue2026", help:"Een gedeelde kode wat op al jou uitnodigings gedruk word." },
  { key:"bruidegom", label:"Bruidegom se naam", type:"text", group:"Instellings", default:"Hennie" },
  { key:"bruid", label:"Bruid se naam", type:"text", group:"Instellings", default:"Jolinda" },
  { key:"datum_iso", label:"Troudatum & tyd (vir aftelling)", type:"text", group:"Instellings",
    default:"2026-11-07T16:00:00", help:"Formaat: JJJJ-MM-DDTuu:mm:ss — bv. 2026-11-07T16:00:00" },
  { key:"venue", label:"Plek / venue", type:"text", group:"Instellings", default:"Plek · nog te bevestig" },
  { key:"dorp", label:"Dorp / streek", type:"text", group:"Instellings", default:"Gauteng, Suid-Afrika" },
  { key:"rsvp_sperdatum", label:"RSVP-sperdatum", type:"text", group:"Instellings", default:"30 September 2026" },
  { key:"gate_sub", label:"Toegangshek — onderskrif", type:"text", group:"Instellings", default:"Trouportaal · 7.11.2026" },
  { key:"gate_welkom", label:"Toegangshek — opskrif", type:"text", group:"Instellings", default:"Welkom" },
  { key:"gate_p", label:"Toegangshek — instruksie", type:"text", group:"Instellings", default:"Tik die kode op jou uitnodiging in om binne te tree." },
  { key:"gate_btn", label:"Toegangshek — knoppie", type:"text", group:"Instellings", default:"Tree binne ✦" },
  { key:"gate_hint", label:"Toegangshek — wenk onderaan", type:"text", group:"Instellings", default:"Die kode staan op jou uitnodiging." },
  { key:"monogram", label:"Monogram (H&J)", type:"text", group:"Instellings", default:"H&J" },
  { key:"monogram_date", label:"Monogram-datum", type:"text", group:"Instellings", default:"07.11.26" },

  // ───── Hero ─────
  { key:"hero_eyebrow", label:"Hero — bokant die name", type:"text", group:"Hero", default:"Die troue van" },
  { key:"hero_meta", label:"Hero — datumreël", type:"text", group:"Hero", default:"Sat · 07 Nov 2026 · 16:00" },
  { key:"hero_intro", label:"Hero — inleiding", type:"textarea", group:"Hero",
    default:"Ons nooi jou uit om saam met ons te kom vier onder die bome — 'n dag van liefde, lag en eukalyptus. Welkom by ons storie." },
  { key:"countdown_caption", label:"Onder die aftelling", type:"text", group:"Hero",
    default:"Saterdag, 7 November 2026 · 16:00 · Plek nog te bevestig" },
  { key:"cd_pre", label:"Bo die aftelling", type:"text", group:"Hero", default:"Ons sê “ja” oor" },
  { key:"img_hero", label:"Hero-foto", type:"image", group:"Hero", default:"", fallback:"assets/foto/wandel.jpg" },

  // ───── Ons storie (herhaalbare blokke) ─────
  // Elke blok: {hoofstuk, titel, teks, img, align}. align = "left" (foto links) of "right" (foto regs).
  { key:"storie_blocks", label:"Ons storie — blokke", type:"blocks", group:"Ons storie",
    default: JSON.stringify([
      { hoofstuk:"Hoofstuk een", titel:"Die begin",
        teks:"Plek vir julle eie verhaal — hoe julle ontmoet het, daardie eerste kuier, en die oomblik toe julle geweet het.\n\nVertel van die aansoek onder die bome, met die ring wat in die laatmiddagson blink.",
        img:"assets/foto/ring.jpg", align:"left" },
      { hoofstuk:"Hoofstuk twee", titel:"Ons drietjie",
        teks:"'n Stukkie oor julle seun en die gesin wat julle saam bou. Hy is 'n groot deel van die dag — en sal saamstap na die altaar.\n\nVandag word ons amptelik 'n familie.",
        img:"assets/foto/opgooi.jpg", align:"right" },
    ]) },

  // ───── Galery ─────
  { key:"gallery_images", label:"Galery-foto's", type:"gallery", group:"Galery", default:"",
    help:"Laai foto's op, sleep om te herrangskik, of vee uit. Leeg = wys die verstek-foto's." },

  // ───── Program ─────
  { key:"program_vry", label:"Program — Vrydag", type:"list", group:"Program",
    default:"18:00 | Welkomsdrankies | Ontspanne kuier vir gaste wat reeds opdaag en oorslaap.\n19:00 | Informele ete | Saans saam om die vuur — gemaklik aantrek.",
    help:"Een item per reël:  tyd | titel | beskrywing" },
  { key:"program_sat", label:"Program — Saterdag (troudag)", type:"list", group:"Program",
    default:"15:30 | Gaste arriveer | Vind jou plek; verversings word bedien.\n16:00 | Seremonie | Ons sê “ja” onder die bome.\n17:00 | Gelukwense & foto's | Drankies en happies terwyl ons foto's neem.\n18:30 | Onthaal & ete | Sit-ete, heildronke en toesprake.\n20:30 | Eerste dans & partytjie | Die dansvloer maak oop — kom dans saam!",
    help:"Een item per reël:  tyd | titel | beskrywing" },
  { key:"program_son", label:"Program — Sondag", type:"list", group:"Program",
    default:"09:00 | Ontbytbuffet | 'n Ontspanne afskeid-ontbyt vir die wat oorslaap.",
    help:"Een item per reël:  tyd | titel | beskrywing" },
  { key:"prog_d1_num", label:"Program — Dag 1 datum-nommer", type:"text", group:"Program", default:"06" },
  { key:"prog_d1_naam", label:"Program — Dag 1 naam", type:"text", group:"Program", default:"Vrydag" },
  { key:"prog_d1_sub", label:"Program — Dag 1 onderskrif", type:"text", group:"Program", default:"November 2026" },
  { key:"prog_d2_num", label:"Program — Dag 2 datum-nommer", type:"text", group:"Program", default:"07" },
  { key:"prog_d2_naam", label:"Program — Dag 2 naam", type:"text", group:"Program", default:"Saterdag" },
  { key:"prog_d2_sub", label:"Program — Dag 2 onderskrif", type:"text", group:"Program", default:"November 2026 · Troudag" },
  { key:"prog_d3_num", label:"Program — Dag 3 datum-nommer", type:"text", group:"Program", default:"08" },
  { key:"prog_d3_naam", label:"Program — Dag 3 naam", type:"text", group:"Program", default:"Sondag" },
  { key:"prog_d3_sub", label:"Program — Dag 3 onderskrif", type:"text", group:"Program", default:"November 2026" },

  // ───── Verblyf ─────
  { key:"verblyf", label:"Verblyf-opsies", type:"list", group:"Verblyf",
    default:"Op die venue | 0 km · Hoofverblyf | Beperkte kamers op die terrein vir naby-familie. Plek vir besonderhede en pryse.\nGastehuis naby | ± 5 km | Bekostigbare opsie kort van die venue af. Voeg skakel en kontak by.\nSelfsorg / kampeer | ± 8 km | Vir die avontuurlustiges. Plek vir besprekingsinligting.",
    help:"Een opsie per reël:  naam | afstand | beskrywing" },
  { key:"verblyf_note", label:"Verblyf — slotnota", type:"textarea", group:"Verblyf",
    default:"Plek vir kaartskakels, kontaknommers en besprekingsbesonderhede — net 'n klik om te wysig." },

  // ───── Tema & drag ─────
  { key:"tema_p1", label:"Tema — paragraaf 1", type:"textarea", group:"Tema & drag",
    default:"Ons tema is sag en natuurlik — eukalyptusgroen, salie en warm sandtone. Trek gemaklik aan in pastel-kleure wat by die bosveld pas." },
  { key:"tema_drag_label", label:"Tema — \"Drag:\"-etiket", type:"text", group:"Tema & drag", default:"Drag:" },
  { key:"tema_drag", label:"Tema — dragkode-reël", type:"textarea", group:"Tema & drag",
    default:"Semi-formeel / “garden formal”. Vermy wit. Dames: gemaklike hakke vir gras." },
  { key:"img_tema", label:"Tema — foto", type:"image", group:"Tema & drag", default:"", fallback:"assets/foto/familie.jpg" },
  { key:"tema_swatches", label:"Tema — kleure", type:"blocks", group:"Tema & drag",
    default: JSON.stringify([
      { label:"Room", color:"#F2ECDD" },
      { label:"Sand", color:"#CFC2A0" },
      { label:"Salie", color:"#8C9A6E" },
      { label:"Olyf", color:"#4F5D3A" },
    ]) },

  // ───── Geskenke ─────
  { key:"geskenke_intro", label:"Geskenke — inleiding", type:"textarea", group:"Geskenke",
    default:"Julle teenwoordigheid is die grootste geskenk. Vir wie graag wil bydra tot ons wittebrood en nuwe huis, is hier ons besonderhede." },
  { key:"bank", label:"Bankbesonderhede", type:"list", group:"Geskenke",
    default:"Rekeningnaam | H & J Smit\nBank | —  (voeg by)\nRekeningnommer | —  (voeg by)\nVerwysing | Jou van + “troue”",
    help:"Een reël elk:  etiket | waarde" },

  // ───── Vrae & antwoorde ─────
  { key:"vrae", label:"Vrae & antwoorde", type:"list", group:"Vrae & antwoorde",
    default:"Teen wanneer moet ek RSVP? | Bevestig asseblief jou bywoning voor 30 September 2026 sodat ons getalle kan finaliseer.\nMag ek kinders saambring? | Ons laat jou per uitnodiging weet hoeveel plekke beskikbaar is. Sien jou RSVP vir die getal plekke.\nIs daar plek om oor te slaap? | Ja — beperkte verblyf op die venue plus opsies naby. Kies “slaap oor” by jou RSVP.\nWat is die drag? | Semi-formeel / garden formal in sagte natuurlike kleure. Vermy wit; gemaklike skoene vir gras.\nHoe laat begin die seremonie? | Die seremonie begin om 16:00. Probeer asseblief 15:30 reeds opdaag.",
    help:"Een vraag per reël:  vraag | antwoord" },

  // ───── RSVP ─────
  { key:"rsvp_intro", label:"RSVP — onderskrif", type:"textarea", group:"RSVP",
    default:"Ons kan nie wag om dit saam met jou te vier nie." },
  { key:"rsvp_max", label:"RSVP — maks. gaste per antwoord", type:"text", group:"RSVP", default:"4",
    help:"Hoeveel gaste 'n gas kan byvoeg (die \"+ Voeg gas by\"-knoppie stop hier). Bv. 4." },
  // Eie RSVP-vrae wat jy kan byvoeg/verwyder. Elke item: {vraag, tipe:"kort"|"lank"}.
  { key:"rsvp_extra", label:"RSVP — eie vrae", type:"blocks", group:"RSVP", default: "[]",
    help:"Voeg jou eie vrae by; gaste se antwoorde wys in die Gaste-besonderhede." },
  { key:"rsvp_q_kom", label:"RSVP-vraag: kom jy?", type:"text", group:"RSVP", default:"Kom jy die troue toe?" },
  { key:"rsvp_btn_ja", label:"RSVP-knoppie: ja", type:"text", group:"RSVP", default:"Ja, ek/ons kom!" },
  { key:"rsvp_btn_nee", label:"RSVP-knoppie: nee", type:"text", group:"RSVP", default:"Ongelukkig nie" },
  { key:"rsvp_nee_teks", label:"RSVP: boodskap as jy nie kom nie", type:"textarea", group:"RSVP",
    default:"Ons gaan jou mis, maar verstaan heeltemal. Dankie dat jy laat weet." },
  { key:"rsvp_q_wie", label:"RSVP-vraag: wie kom alles?", type:"text", group:"RSVP", default:"Wie kom alles?" },
  { key:"rsvp_q_slaap", label:"RSVP-vraag: slaap oor?", type:"text", group:"RSVP", default:"Slaap jy/julle oor?" },
  { key:"rsvp_q_naweek", label:"RSVP-vraag: vir hoe lank?", type:"text", group:"RSVP", default:"Vir hoe lank?" },
  { key:"rsvp_q_ontbyt", label:"RSVP-vraag: Sondag-ontbyt?", type:"text", group:"RSVP", default:"Sondag-ontbytbuffet?" },
  { key:"rsvp_q_dieet", label:"RSVP-vraag: dieet", type:"text", group:"RSVP", default:"Dieetbehoeftes of allergieë" },
  { key:"rsvp_q_liedjies", label:"RSVP-vraag: liedjies", type:"text", group:"RSVP", default:"Versoek 3 liedjies vir die dansvloer" },
  { key:"rsvp_q_boodskap", label:"RSVP-vraag: boodskap", type:"text", group:"RSVP", default:"'n Boodskap aan Hennie & Jolinda" },
  { key:"rsvp_titel", label:"RSVP — groot opskrif", type:"text", group:"RSVP", default:"RSVP" },
  { key:"rsvp_submit", label:"RSVP — stuur-knoppie", type:"text", group:"RSVP", default:"Stuur antwoord" },
  { key:"rsvp_allow_edit", label:"Laat gaste toe om hul RSVP te wysig? (ja/nee)", type:"text", group:"RSVP", default:"ja",
    help:"Tik 'ja' of 'nee'. 'nee' versteek die \"Wysig my antwoord\"-knoppie ná 'n gas gestuur het." },
  { key:"rsvp_wysig", label:"RSVP — \"wysig antwoord\"-knoppie", type:"text", group:"RSVP", default:"Wysig my antwoord" },
  { key:"rsvp_nee_label", label:"RSVP — boodskap-etiket (as jy nie kom nie)", type:"text", group:"RSVP", default:"Boodskap aan ons (opsioneel)" },
  { key:"rsvp_liedjies_hint", label:"RSVP — liedjies-wenk", type:"text", group:"RSVP", default:"Tik die naam, of plak gerus 'n Spotify/YouTube-skakel." },
  { key:"rsvp_dankie_ja_h", label:"RSVP — dankie-opskrif (kom wel)", type:"text", group:"RSVP", default:"Baie dankie!" },
  { key:"rsvp_dankie_ja", label:"RSVP — dankie-boodskap (kom wel)", type:"textarea", group:"RSVP",
    default:"Ons het julle RSVP ontvang. Ons kan nie wag om saam met julle te vier op 7 November 2026 nie!" },
  { key:"rsvp_dankie_nee_h", label:"RSVP — dankie-opskrif (kan nie)", type:"text", group:"RSVP", default:"Dankie dat jy laat weet" },
  { key:"rsvp_dankie_nee", label:"RSVP — dankie-boodskap (kan nie)", type:"textarea", group:"RSVP",
    default:"Ons gaan jou mis, maar verstaan heeltemal. Geniet jou dag — met liefde, Hennie & Jolinda." },
  { key:"rsvp_ph_naam", label:"RSVP — plekhouer: naam", type:"text", group:"RSVP", default:"Naam & van" },
  { key:"rsvp_ph_dieet", label:"RSVP — plekhouer: dieet", type:"text", group:"RSVP", default:"Bv. glutenvry, vegetaries, neut-allergie…" },
  { key:"rsvp_ph_lied", label:"RSVP — plekhouer: liedjie", type:"text", group:"RSVP", default:"Naam of skakel" },
  { key:"rsvp_ph_boodskap", label:"RSVP — plekhouer: boodskap", type:"text", group:"RSVP", default:"Deel 'n wens, 'n grappie of net liefde…" },
  { key:"rsvp_btn_slaap_ja", label:"RSVP-knoppie: slaap oor — ja", type:"text", group:"RSVP", default:"Ja" },
  { key:"rsvp_btn_slaap_nee", label:"RSVP-knoppie: slaap oor — nee", type:"text", group:"RSVP", default:"Nee" },
  { key:"rsvp_btn_naweek_heel", label:"RSVP-knoppie: hele naweek", type:"text", group:"RSVP", default:"Die hele naweek" },
  { key:"rsvp_btn_naweek_sat", label:"RSVP-knoppie: net Saterdagaand", type:"text", group:"RSVP", default:"Net Saterdagaand" },
  { key:"rsvp_btn_ontbyt_ja", label:"RSVP-knoppie: ontbyt — ja", type:"text", group:"RSVP", default:"Ja, graag" },
  { key:"rsvp_btn_ontbyt_nee", label:"RSVP-knoppie: ontbyt — nee", type:"text", group:"RSVP", default:"Nee dankie" },

  // ───── Voetskrif / kontak ─────
  { key:"tel_hennie", label:"Hennie se selnommer", type:"text", group:"Kontak", default:"+27 00 000 0000" },
  { key:"tel_jolinda", label:"Jolinda se selnommer", type:"text", group:"Kontak", default:"+27 00 000 0000" },
  { key:"datum_teks", label:"Voetskrif-datum", type:"text", group:"Kontak", default:"7 November 2026" },

  // ───── Kieslys & afdeling-name (die name wat op die werf wys) ─────
  { key:"nav_storie", label:"Kieslys: Ons Storie", type:"text", group:"Kieslys & name", default:"Ons Storie" },
  { key:"nav_program", label:"Kieslys: Program", type:"text", group:"Kieslys & name", default:"Program" },
  { key:"nav_galery", label:"Kieslys: Galery", type:"text", group:"Kieslys & name", default:"Galery" },
  { key:"nav_verblyf", label:"Kieslys: Verblyf", type:"text", group:"Kieslys & name", default:"Verblyf" },
  { key:"nav_tema", label:"Kieslys: Tema", type:"text", group:"Kieslys & name", default:"Tema" },
  { key:"nav_geskenke", label:"Kieslys: Geskenke", type:"text", group:"Kieslys & name", default:"Geskenke" },
  { key:"nav_vrae", label:"Kieslys: Q&A", type:"text", group:"Kieslys & name", default:"Q&A" },
  { key:"storie_opskrif", label:"Afdeling-opskrif: Ons storie", type:"text", group:"Kieslys & name",
    default:"Hoe dit alles *begin het*", help:"Sit *sterretjies* om 'n woord om dit skuins te maak (soos op die werf)." },
  { key:"program_opskrif", label:"Afdeling-opskrif: Program", type:"text", group:"Kieslys & name", default:"Die dag se *gebeure*" },
  { key:"galery_opskrif", label:"Afdeling-opskrif: Galery", type:"text", group:"Kieslys & name", default:"Vasgelê in *liefde*" },
  { key:"verblyf_opskrif", label:"Afdeling-opskrif: Verblyf", type:"text", group:"Kieslys & name", default:"Waar om *te bly*" },
  { key:"tema_opskrif", label:"Afdeling-opskrif: Tema", type:"text", group:"Kieslys & name", default:"Eukalyptus, *groen & sand*" },
  { key:"geskenke_opskrif", label:"Afdeling-opskrif: Geskenke", type:"text", group:"Kieslys & name", default:"'n Bydrae tot ons *nuwe begin*" },
  { key:"vrae_opskrif", label:"Afdeling-opskrif: Q&A", type:"text", group:"Kieslys & name", default:"Goed om te *weet*" },
  { key:"nav_brand", label:"Kieslys: handelsmerk (links bo)", type:"text", group:"Kieslys & name", default:"H & J" },
  { key:"nav_rsvp", label:"Kieslys: RSVP-knoppie", type:"text", group:"Kieslys & name", default:"RSVP" },
  { key:"kicker_storie", label:"Bo-opskrif: Ons storie", type:"text", group:"Kieslys & name", default:"Ons storie" },
  { key:"kicker_program", label:"Bo-opskrif: Program", type:"text", group:"Kieslys & name", default:"Program vir die naweek" },
  { key:"kicker_galery", label:"Bo-opskrif: Galery", type:"text", group:"Kieslys & name", default:"Ons oomblikke" },
  { key:"kicker_verblyf", label:"Bo-opskrif: Verblyf", type:"text", group:"Kieslys & name", default:"Verblyf" },
  { key:"kicker_geskenke", label:"Bo-opskrif: Geskenke", type:"text", group:"Kieslys & name", default:"Geskenke" },
  { key:"kicker_vrae", label:"Bo-opskrif: Q&A", type:"text", group:"Kieslys & name", default:"Vrae & antwoorde" },
  { key:"kicker_rsvp", label:"Bo-opskrif: RSVP", type:"text", group:"Kieslys & name", default:"Bevestig jou bywoning" },
  { key:"kicker_tema", label:"Bo-opskrif: Tema", type:"text", group:"Kieslys & name", default:"Tema & drag" },
];

// Sleutel → verstek kaart
window.CONTENT_DEFAULTS = Object.fromEntries(
  window.CONTENT_SCHEMA.map((f) => [f.key, f.default])
);

// Hulp: ontleed 'n "list"-veld na rye van velde (geskei deur " | ")
window.parseList = function (raw) {
  return String(raw || "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => l.split("|").map((c) => c.trim()));
};
