// ぶんきょうくみんけんてい 本体
(() => {
"use strict";
const CFG = window.KENTEI_CONFIG || {};
const CH = (window.KENTEI_CHARAS || {})[CFG.CHARA] || null;
const LINES = window.KENTEI_LINES || {};
const $ = id => document.getElementById(id);

const LEVELS = {
  5: { name: "5きゅう", sub: "ひっこして きたばかり", pass: 7 },
  4: { name: "4きゅう", sub: "すんで 1ねんくらい", pass: 7 },
  3: { name: "3きゅう", sub: "すんで すうねん", pass: 7 },
  2: { name: "2きゅう", sub: "ガチの くみん", pass: 7 },
  1: { name: "1きゅう", sub: "かちょうでも なやむ", pass: 10 }
};
const TITLE = { 5: "5きゅうくみん", 4: "4きゅうくみん", 3: "3きゅうくみん", 2: "2きゅうくみん", 1: "いっきゅうくみん" };
const FAIL_TITLE = "くみんけんしゅうせい";
const MARKS = ["あ", "い", "う"];
const PER = 10;

// ---- こまごま -------------------------------------------------
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
// 漢字[よみ] → ルビ（先にエスケープしてから変換）
const ruby = s => esc(s).replace(/([㐀-鿿豈-﫿々〆〇ヵヶ]+)\[([^\]]+)\]/g, "<ruby>$1<rt>$2</rt></ruby>");
const plain = s => String(s ?? "").replace(/\[[^\]]*\]/g, "");
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = a => a[Math.floor(Math.random() * a.length)];
const idSalt = id => [...String(id)].reduce((s, c) => s + c.codePointAt(0), 0) % 3;
// 正解は軽く符号化してある（ビルド側 scripts/build_questions.py と対）。0始まりの位置を返す
const answerOf = item => ((Number(item.k) - idSalt(item.id)) % 3 + 3) % 3;
const jstDate = (d = new Date()) => new Date(d.getTime() + 9 * 3600e3).toISOString().slice(0, 10);
const kanaDate = (d = new Date()) => { const [y, m, dd] = jstDate(d).split("-").map(Number); return `${y}ねん ${m}がつ ${dd}にち`; };
const safeUrl = u => /^https:\/\//.test(String(u || "")) ? u : "";
const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* きえても こまらない */ } }
};

// ---- キャラクター ---------------------------------------------
function say(elId, scene, extra) {
  const el = $(elId); if (!el) return;
  if (!CH) { el.hidden = true; return; }
  el.innerHTML = `${CH.svg}<span class="bubble">${esc(pick(LINES[scene] || [""]))}</span>`;
  el.setAttribute("aria-hidden", "true");
  el.classList.remove("hop");
  if (extra) { void el.offsetWidth; el.classList.add(extra); }
}

// ---- タブ -----------------------------------------------------
const TABS = ["kentei", "meibo", "faq"];
function showTab(name) {
  TABS.forEach(t => {
    $("tab-" + t).setAttribute("aria-selected", String(t === name));
    $("p-" + t).hidden = t !== name;
  });
  if (name === "meibo") renderMeibo();
}
TABS.forEach(t => $("tab-" + t).addEventListener("click", () => showTab(t)));

// ---- フォームのリンク ----------------------------------------
document.querySelectorAll(".formlink-report").forEach(a => { if (CFG.FORM_REPORT) { a.href = CFG.FORM_REPORT; a.target = "_blank"; a.rel = "noopener"; } });
document.querySelectorAll(".formlink-submit").forEach(a => { if (CFG.FORM_SUBMIT) { a.href = CFG.FORM_SUBMIT; a.target = "_blank"; a.rel = "noopener"; } });

// ---- もんだい の よみこみ -----------------------------------
const BANK = {};
async function loadBank() {
  const d = jstDate();
  await Promise.all([5, 4, 3, 2, 1].map(async n => {
    try {
      const r = await fetch(`questions/${n}.json?d=${d}`, { cache: "no-cache" });
      const j = await r.json();
      BANK[n] = Array.isArray(j.items) ? j.items : [];
      if (j.dev) $("devbanner").hidden = false;
    } catch { BANK[n] = []; }
  }));
}

// ---- トップ ---------------------------------------------------
let oneCount = 0;
function buildLevels() {
  const box = $("levels"); box.innerHTML = "";
  [5, 4, 3, 2, 1].forEach(n => {
    const L = LEVELS[n];
    const b = document.createElement("button");
    b.className = "lv"; b.type = "button";
    const sub = n === 1 ? `${L.sub}（ごうかくしゃ ${oneCount}にん）` : L.sub;
    b.innerHTML = `<span class="num">${n}</span><span>${L.name}<span class="sub">${esc(sub)}</span></span>`;
    if ((BANK[n] || []).length < PER) { b.disabled = true; b.title = "じゅんびちゅう"; }
    b.addEventListener("click", () => start(n));
    box.appendChild(b);
  });
  const best = Number(store.get("kentei_best"));
  if (best >= 1 && best <= 5) { $("mybest").hidden = false; $("mybest").textContent = `あなたの いまの しょうごう：${TITLE[best]}`; }
}

// きょうの いちもん：日付から決定的に1問（同じ日は全員同じ）
function ichimon() {
  const all = [5, 4, 3, 2, 1].flatMap(n => (BANK[n] || []).map(it => ({ ...it, lv: n }))).sort((a, b) => a.id < b.id ? -1 : 1);
  if (!all.length) return;
  const d = jstDate();
  let h = 2166136261; for (const c of d) { h ^= c.codePointAt(0); h = Math.imul(h, 16777619) >>> 0; }
  const it = all[h % all.length];
  $("ichimon").hidden = false;
  $("im-when").textContent = `${kanaDate()}（${LEVELS[it.lv].name}の もんだい）`;
  $("im-q").innerHTML = ruby(it.q);
  const ans = answerOf(it);
  const order = shuffle([0, 1, 2]);
  const box = $("im-choices");
  box.innerHTML = order.map((ci, pos) => `<button class="ch" type="button" data-ci="${ci}"><span class="mk">${MARKS[pos]}</span><span>${ruby(it.c[ci])}</span></button>`).join("");
  box.querySelectorAll(".ch").forEach(b => b.addEventListener("click", () => {
    const ci = Number(b.dataset.ci), ok = ci === ans;
    box.querySelectorAll(".ch").forEach(x => { x.disabled = true; const xi = Number(x.dataset.ci); if (xi === ans) x.classList.add("ok"); else if (xi === ci) x.classList.add("ng"); });
    $("im-judge").innerHTML = judgeHtml(ok, it, false);
  }));
}

// ---- しゅつだい ---------------------------------------------
const MARU = `<svg viewBox="0 0 64 64" fill="none" stroke="var(--green)" stroke-width="6" stroke-linecap="round"><path d="M33 9c-14 1-24 12-23 25 1 12 11 21 23 21 13 0 23-11 22-24C54 19 45 10 34 9"/></svg>`;
const BATSU = `<svg viewBox="0 0 64 64" fill="none" stroke="var(--red)" stroke-width="6" stroke-linecap="round"><path d="M14 12l37 40M50 13L13 51"/></svg>`;
function judgeHtml(ok, it, shake) {
  const w = ok ? pick(["せいかい", "やるね", "さすが", "まる"]) : pick(["ざんねん", "おしい", "うーん", "ばつ"]);
  const src = safeUrl(it.src) ? `<div class="src"><a href="${esc(it.src)}" target="_blank" rel="noopener">しゅってん</a>${it.note ? `（${esc(it.note)}）` : ""}</div>` : "";
  return `<div class="judge ${!ok && shake ? "shake" : ""}">${ok ? MARU : BATSU}<div><div>${w}</div><div class="exp">${esc(it.e)}</div>${src}</div></div>`;
}

let cur = null, idx = 0, set = [], picks = [], hits = [];
function start(n) {
  cur = n; idx = 0; picks = []; hits = [];
  set = shuffle([...(BANK[n] || [])]).slice(0, PER).map(it => ({ it, order: shuffle([0, 1, 2]) }));
  if (set.length < PER) return;
  $("home").hidden = true; $("result").hidden = true; $("quiz").hidden = false;
  say("chara-home", "quiz");
  show(); window.scrollTo({ top: 0 });
}
function show() {
  const { it, order } = set[idx];
  $("bar").innerHTML = set.map((_, i) => `<i class="${i < hits.length ? (hits[i] ? "on" : "off") : ""}"></i>`).join("");
  $("qnum").textContent = `${LEVELS[cur].name}　だい${idx + 1}もん`;
  $("qtext").innerHTML = ruby(it.q);
  $("choices").innerHTML = order.map((ci, pos) => `<button class="ch" type="button" data-ci="${ci}"><span class="mk">${MARKS[pos]}</span><span>${ruby(it.c[ci])}</span></button>`).join("");
  $("judge").innerHTML = ""; $("next").hidden = true;
  document.querySelectorAll("#choices .ch").forEach(b => b.addEventListener("click", () => answer(Number(b.dataset.ci))));
}
function answer(ci) {
  if (picks.length > idx) return;
  const { it } = set[idx]; const ans = answerOf(it); const ok = ci === ans;
  picks.push(ci + 1); hits.push(ok);
  document.querySelectorAll("#choices .ch").forEach(b => { b.disabled = true; const x = Number(b.dataset.ci); if (x === ans) b.classList.add("ok"); else if (x === ci) b.classList.add("ng"); });
  $("judge").innerHTML = judgeHtml(ok, it, true);
  $("bar").children[idx].className = ok ? "on" : "off";
  say("chara-home", ok ? "ok" : "ng");
  $("next").hidden = false; $("next").textContent = idx === set.length - 1 ? "けっかを みる" : "つぎへ"; $("next").focus();
}
$("next").addEventListener("click", () => { idx++; if (idx < set.length) show(); else finish(); });
$("quit").addEventListener("click", goHome);

// ---- けっか ---------------------------------------------------
let last = null;
function finish() {
  const L = LEVELS[cur], s = hits.filter(Boolean).length, pass = s >= L.pass;
  last = { level: cur, score: s, pass, qids: set.map(x => x.it.id), answers: picks.slice(), registered: false };
  $("quiz").hidden = true; $("result").hidden = false;
  $("certwrap").hidden = true; $("regmsg").hidden = true; $("regmsg").className = "reg";
  $("name").value = ""; $("name").disabled = false; $("nanoru").disabled = false; $("hp").value = "";
  $("rlevel").textContent = `ぶんきょうくみんけんてい ${L.name}`;
  const big = $("rbig"); big.textContent = pass ? "ごうかく！" : "ふごうかく…";
  big.classList.remove("pop"); void big.offsetWidth; big.classList.add("pop");
  $("rscore").textContent = `10もんちゅう ${s}もん せいかい（ごうかくは ${L.pass}もん から）`;
  $("rmsg").textContent = pass
    ? `きょうから あなたは「${TITLE[cur]}」を なのれます。` + (s === 10 ? " ぜんもん せいかい。" : " なにも もらえませんが。")
    : (s >= 5 ? `あと すこし。きょうは「${FAIL_TITLE}」。` : `ひっこして きたばかり？ きょうは「${FAIL_TITLE}」。`);
  if (pass) {
    $("namelabel").textContent = "ニックネームで なのる";
    $("nanoru").textContent = "なのる";
    $("namehint").textContent = "ほんみょうは かかないでね。めいぼに のります。";
  } else {
    $("namelabel").textContent = "なまえを いれて うけたしょうを だす";
    $("nanoru").textContent = "うけたしょうを だす";
    $("namehint").textContent = "めいぼには のりません。なまえは なくても いいよ。";
  }
  const text = shareText();
  $("copy").textContent = pass ? `「わたしは ${TITLE[cur]}です」を コピー` : `「${FAIL_TITLE}に なりました」を コピー`;
  $("copy").onclick = () => {
    const full = `${text} ${CFG.SITE_URL || location.href}`;
    (navigator.clipboard ? navigator.clipboard.writeText(full) : Promise.reject())
      .then(() => { $("copy").textContent = "コピーした！"; })
      .catch(() => { $("copy").textContent = full; });
  };
  $("xpost").href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(CFG.SITE_URL || location.href)}`;
  say("chara-home", pass ? "pass" : "fail", pass ? "hop" : "");
  if (pass) { const best = Number(store.get("kentei_best")) || 9; if (cur < best) store.set("kentei_best", String(cur)); }
  window.scrollTo({ top: 0 });
}
function shareText() {
  const L = LEVELS[cur], s = last.score;
  return last.pass
    ? `わたしは ${TITLE[cur]}です。ぶんきょうくみんけんてい ${L.name} ごうかく（${s}/10）#ぶんきょうくみんけんてい`
    : `ぶんきょうくみんけんてい ${L.name}を うけて ${FAIL_TITLE}に なりました（${s}/10）#ぶんきょうくみんけんてい`;
}
const nameLen = s => [...s].length;
$("nameform").addEventListener("submit", async ev => {
  ev.preventDefault();
  if (!last) return;
  const name = $("name").value.trim();
  const msg = $("regmsg");
  const tell = (t, err) => { msg.hidden = false; msg.textContent = t; msg.className = "reg" + (err ? " err" : ""); };
  if (nameLen(name) > 12) return tell("なまえは 12もじ まで。", true);
  if (!last.pass) { drawCert({ name: name || "なまえなし" }); return; }
  if (last.registered) return;
  if (!name) return tell("ニックネームを いれてね。", true);
  if (!CFG.GAS_URL) {
    tell("いまは めいぼの じゅんびちゅう。ばんごう なしで ごうかくしょうを だします。", false);
    drawCert({ name });
    return;
  }
  $("nanoru").disabled = true; tell("おくっています…", false);
  try {
    const r = await fetch(CFG.GAS_URL, {
      method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "register", level: last.level, qids: last.qids, answers: last.answers, name, hp: $("hp").value })
    });
    const j = await r.json();
    if (j && j.ok) {
      last.registered = true; $("name").disabled = true;
      tell(`あなたは だい${j.number}ばんめの くみん。めいぼには「${j.display_name}」で のります。`, false);
      drawCert({ name, number: j.number });
      meiboCache = null; loadList();
    } else {
      $("nanoru").disabled = false;
      tell((j && j.message) || "うまく おくれませんでした。もういちど ためしてね。", true);
    }
  } catch {
    $("nanoru").disabled = false;
    tell("いま つながりません。ばんごう なしで ごうかくしょうを だします。あとで もういちど ためしてね。", true);
    drawCert({ name });
  }
});
$("retry").addEventListener("click", () => start(cur));
$("back").addEventListener("click", goHome);
function goHome() {
  $("quiz").hidden = true; $("result").hidden = true; $("home").hidden = false;
  say("chara-home", "home"); buildLevels(); window.scrollTo({ top: 0 });
}

// ---- ごうかくしょう（縦書きの賞状を canvas で描いて PNG に） -----
const ROT = new Set([..."ー－—―〜～「」『』（）()…‥＝=-"]);
const SMALL = new Set([..."ぁぃぅぇぉっゃゅょゎァィゥェォッャュョヮ"]);
const PUNCT = new Set([..."、。，．"]);
function vtext(ctx, text, x, y, size, opt = {}) {
  // x：列の中心、y：上端。opt.bottom を渡すと下そろえ
  const step = size * (opt.spacing || 1.08);
  const toks = [];
  for (const m of String(text).matchAll(/[0-9]+|./gu)) {
    const t = m[0];
    if (/^[0-9]{5,}$/.test(t)) toks.push(...t); else toks.push(t);
  }
  const len = toks.reduce((s, t) => s + (t === " " || t === "　" ? 0.5 : 1), 0) * step;
  let cy = opt.bottom != null ? opt.bottom - len : y;
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  for (const t of toks) {
    if (t === " " || t === "　") { cy += step * 0.5; continue; }
    const mid = cy + step / 2;
    ctx.save();
    if (/^[0-9]{2,4}$/.test(t)) {
      ctx.translate(x, mid); const w = ctx.measureText(t).width; const sc = Math.min(1, size * 0.95 / w); ctx.scale(sc, 1); ctx.fillText(t, 0, 0);
    } else if (ROT.has(t)) {
      ctx.translate(x, mid); ctx.rotate(Math.PI / 2); ctx.fillText(t, 0, 0);
    } else if (SMALL.has(t)) {
      ctx.fillText(t, x + size * 0.1, mid - size * 0.1);
    } else if (PUNCT.has(t)) {
      ctx.fillText(t, x + size * 0.55, mid - size * 0.55);
    } else ctx.fillText(t, x, mid);
    ctx.restore();
    cy += step;
  }
  return cy;
}
function fitSize(text, size, maxLen) {
  const n = [...String(text)].length;
  return Math.min(size, Math.floor(maxLen / (n * 1.08)));
}
async function charaImage() {
  if (!CH) return null;
  const svg = CH.svg.replace(/currentColor/g, "#2b2a28").replace(/var\(--paper,([^)]+)\)/g, "$1").replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" ');
  const img = new Image();
  img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  try { await img.decode(); return img; } catch { return null; }
}
async function drawCert({ name, number }) {
  const W = 1000, H = 1414, pass = last.pass, lv = last.level, L = LEVELS[lv];
  const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
  const ctx = cv.getContext("2d");
  const FONT = '"Klee One","Hiragino Mincho ProN","Yu Mincho",serif';
  try { await Promise.all([document.fonts.load(`600 90px "Klee One"`, "ごうかくしょう"), document.fonts.load(`400 40px "Klee One"`, name + "あ")]); } catch { }
  // かみ
  ctx.fillStyle = "#fffaf0"; ctx.fillRect(0, 0, W, H);
  // かざりわく（にじゅう線＋あいだに ちいさな まる）
  const gold = "#a87a22", ink = "#2b2a28";
  ctx.strokeStyle = gold; ctx.lineWidth = 10; ctx.strokeRect(36, 36, W - 72, H - 72);
  ctx.lineWidth = 3; ctx.strokeRect(70, 70, W - 140, H - 140);
  ctx.fillStyle = gold;
  const dots = (x0, y0, x1, y1, n) => { for (let i = 0; i <= n; i++) { const t = i / n; ctx.beginPath(); ctx.arc(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, 5, 0, Math.PI * 2); ctx.fill(); } };
  dots(56, 56, W - 56, 56, 34); dots(56, H - 56, W - 56, H - 56, 34); dots(56, 56, 56, H - 56, 48); dots(W - 56, 56, W - 56, H - 56, 48);
  // すみの かざり（くも がた）
  ctx.strokeStyle = gold; ctx.lineWidth = 3;
  [[90, 90, 1, 1], [W - 90, 90, -1, 1], [90, H - 90, 1, -1], [W - 90, H - 90, -1, -1]].forEach(([x, y, sx, sy]) => {
    ctx.beginPath(); ctx.arc(x + sx * 22, y + sy * 22, 22, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(x + sx * 22, y + sy * 22, 10, 0, Math.PI * 2); ctx.stroke();
  });
  ctx.fillStyle = ink;
  const top = 150, bottom = H - 150, maxLen = bottom - top;
  // れつ を みぎ から ならべる
  const cols = [];
  // gap ＝ つぎの れつ までの きょり
  cols.push({ t: pass ? "ごうかくしょう" : "うけたしょう", size: 96, w: 600, gap: 130 });
  cols.push({ t: `${name}　どの`, size: 64, w: 400, gap: 110, indent: 120 });
  const body = pass
    ? ["あなたは ぶんきょうくみんけんてい", `${L.name}に ごうかく されました`, `よって ここに「${TITLE[lv]}」と`, "みとめます"]
    : ["あなたは ぶんきょうくみんけんてい", `${L.name}に ちょうせん されました`, `よって ここに「${FAIL_TITLE}」と`, "みとめます"];
  body.forEach((t, i) => cols.push({ t, size: 50, w: 400, gap: i === body.length - 1 ? 90 : 68, indent: i === 0 ? 0 : 50 }));
  cols.push({ t: `10もんちゅう ${last.score}もん せいかい`, size: 38, w: 400, gap: 54, indent: 260 });
  if (number) cols.push({ t: `だい${number}ばんめの くみん`, size: 38, w: 400, gap: 54, indent: 260 });
  cols.push({ t: kanaDate(), size: 40, w: 400, gap: 0, indent: 120 });
  let x = W - 150;
  for (const c of cols) {
    const size = fitSize(c.t, c.size, maxLen - (c.indent || 0));
    ctx.font = `${c.w} ${size}px ${FONT}`;
    vtext(ctx, c.t, x, top + (c.indent || 0), size);
    x -= c.gap;
  }
  // はっこう もと と いん（いちばん ひだりの れつ、した そろえ）
  const ix = Math.min(x - 64, 150);
  ctx.font = `600 44px ${FONT}`;
  vtext(ctx, "ぶんきょうくみんけんてい", ix, 0, 44, { bottom: bottom - 120 });
  ctx.save();
  ctx.translate(ix, bottom - 50); ctx.rotate(-0.08);
  ctx.strokeStyle = "#c8372d"; ctx.fillStyle = "#c8372d"; ctx.lineWidth = 6;
  ctx.strokeRect(-56, -56, 112, 112); ctx.lineWidth = 2; ctx.strokeRect(-46, -46, 92, 92);
  ctx.font = `600 36px ${FONT}`;
  vtext(ctx, "けん", 18, -42, 36, { spacing: 1.1 }); vtext(ctx, "てい", -18, -42, 36, { spacing: 1.1 });
  ctx.restore();
  // キャラ（ひだり した に ちいさく）
  const ci = await charaImage();
  if (ci) { ctx.globalAlpha = .9; ctx.drawImage(ci, ix + 80, bottom - 110, 100, 100); ctx.globalAlpha = 1; }
  // ひょうじ と ほぞん
  const url = cv.toDataURL("image/png");
  $("certimg").src = url;
  $("certimg").alt = `${pass ? "ごうかくしょう" : "うけたしょう"}：${name} どの ${pass ? TITLE[lv] : FAIL_TITLE}`;
  $("certdl").href = url; $("certdl").download = `bunkyo-kentei-${lv}kyu.png`;
  const w = $("certwrap"); w.hidden = false; w.classList.remove("rise"); void w.offsetWidth; w.classList.add("rise");
  w.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" });
}

// ---- めいぼ ---------------------------------------------------
let meiboCache = null;
async function loadList() {
  if (!CFG.GAS_URL) return null;
  if (meiboCache) return meiboCache;
  try {
    const r = await fetch(`${CFG.GAS_URL}?list=1`);
    const j = await r.json();
    if (!j || !j.ok) return null;
    meiboCache = j;
    oneCount = Number(j.counts && j.counts["1"]) || 0;
    $("zero-count").textContent = String(oneCount);
    $("faq-one").textContent = oneCount > 0
      ? `いままでに ${oneCount}にんが ごうかく しました。10もん ぜんぶ せいかいで ごうかくです。`
      : "いまのところ だれも うかっていません。10もん ぜんぶ せいかいで ごうかくです。";
    if (j.last_patrol) {
      const days = (Date.now() - new Date(j.last_patrol).getTime()) / 86400e3;
      $("patrol").hidden = !(days >= (CFG.PATROL_STALE_DAYS || 3));
    }
    if (!$("home").hidden) buildLevels();
    return j;
  } catch { return null; }
}
async function renderMeibo() {
  say("chara-meibo", "meibo");
  const body = $("meibo-body");
  const j = await loadList();
  if (!j) { body.innerHTML = `<p class="note">いま めいぼを よみこめません。${CFG.GAS_URL ? "すこし たってから みてね。" : "（じゅんびちゅう）"}</p>`; return; }
  const lv = j.levels || {}, cnt = j.counts || {};
  let h = `<h3>いっきゅうくみん</h3><div class="one">ごうかくしゃ<b>${Number(cnt["1"]) || 0}にん</b></div>`;
  if ((lv["1"] || []).length) h += list(lv["1"]);
  [2, 3, 4, 5].forEach(n => {
    h += `<h3>${TITLE[n]}（${Number(cnt[n]) || 0}にん）</h3>`;
    h += (lv[n] || []).length ? list(lv[n]) : `<p class="note">まだ だれも いません。</p>`;
  });
  body.innerHTML = h;
  function list(a) { return `<ol>${a.map(p => `<li>${esc(p.name)} <small>だい${Number(p.n) || "?"}ばん</small></li>`).join("")}</ol>`; }
}

// ---- はじめ ---------------------------------------------------
say("chara-home", "home"); say("chara-faq", "faq");
loadBank().then(() => { buildLevels(); ichimon(); });
loadList();
})();
