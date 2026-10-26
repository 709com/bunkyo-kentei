// 文京区民検定（ぶんきょうくみんけんてい）本体
// 画面の言葉は「漢字[よみ]」の書き方で書き、ruby() でふりがな付きにする
(() => {
"use strict";
const CFG = window.KENTEI_CONFIG || {};
const CH = (window.KENTEI_CHARAS || {})[CFG.CHARA] || null;
const LINES = window.KENTEI_LINES || {};
const $ = id => document.getElementById(id);

const LEVELS = {
  5: { name: "5級[きゅう]", sub: "引[ひ]っ越[こ]してきたばかり", pass: 7 },
  4: { name: "4級[きゅう]", sub: "住[す]んで1年[ねん]くらい", pass: 7 },
  3: { name: "3級[きゅう]", sub: "住[す]んで数年[すうねん]", pass: 7 },
  2: { name: "2級[きゅう]", sub: "ガチの区民[くみん]", pass: 7 },
  1: { name: "1級[きゅう]", sub: "課長[かちょう]でも悩[なや]む", pass: 10 }
};
const TITLE = { 5: "5級区民[きゅうくみん]", 4: "4級区民[きゅうくみん]", 3: "3級区民[きゅうくみん]", 2: "2級区民[きゅうくみん]", 1: "一級区民[いっきゅうくみん]" };
const FAIL_TITLE = "区民研修生[くみんけんしゅうせい]";
const KENTEI = "文京区民検定[ぶんきょうくみんけんてい]";
const MARKS = ["あ", "い", "う"];
const PER = 10;

// ---- こまごま -------------------------------------------------
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
// 漢字[よみ] → ルビ（先にエスケープしてから変換）
const ruby = s => esc(s).replace(/([㐀-鿿豈-﫿々〆〇ヵヶ]+)\[([^\]]+)\]/g, "<ruby>$1<rt>$2</rt></ruby>");
const plain = s => String(s ?? "").replace(/\[[^\]]*\]/g, "");
const setR = (id, s) => { $(id).innerHTML = ruby(s); };
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = a => a[Math.floor(Math.random() * a.length)];
const idSalt = id => [...String(id)].reduce((s, c) => s + c.codePointAt(0), 0) % 3;
// 正解は軽く符号化してある（scripts/build_questions.py と対）。0始まりの位置を返す
const answerOf = item => ((Number(item.k) - idSalt(item.id)) % 3 + 3) % 3;
const jstDate = (d = new Date()) => new Date(d.getTime() + 9 * 3600e3).toISOString().slice(0, 10);
const jpDate = (d = new Date()) => { const [y, m, dd] = jstDate(d).split("-").map(Number); return `${y}年[ねん]${m}月[がつ]${dd}日[にち]`; };
const safeUrl = u => /^https:\/\//.test(String(u || "")) ? u : "";
const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* 消えても困らない */ } }
};

// ---- キャラクター ---------------------------------------------
function say(elId, scene, extra) {
  const el = $(elId); if (!el) return;
  if (!CH) { el.hidden = true; return; }
  el.innerHTML = `${CH.svg}<span class="bubble">${ruby(pick(LINES[scene] || [""]))}</span>`;
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

// ---- 問題の読み込み -------------------------------------------
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
    const sub = n === 1 ? `${L.sub}（合格者[ごうかくしゃ] ${oneCount}人[にん]）` : L.sub;
    b.innerHTML = `<span class="num">${n}</span><span class="name">${ruby(L.name)}<span class="sub">${ruby(sub)}</span></span><span class="go" aria-hidden="true">›</span>`;
    if ((BANK[n] || []).length < PER) { b.disabled = true; b.title = "準備中"; }
    b.addEventListener("click", () => start(n));
    box.appendChild(b);
  });
  const best = Number(store.get("kentei_best"));
  if (best >= 1 && best <= 5) { $("mybest").hidden = false; setR("mybest", `あなたの今[いま]の称号[しょうごう]：${TITLE[best]}`); }
}

// 今日の一問：日付から決まる1問（同じ日は全員同じ）
function ichimon() {
  const all = [5, 4, 3, 2, 1].flatMap(n => (BANK[n] || []).map(it => ({ ...it, lv: n }))).sort((a, b) => a.id < b.id ? -1 : 1);
  if (!all.length) return;
  const d = jstDate();
  let h = 2166136261; for (const c of d) { h ^= c.codePointAt(0); h = Math.imul(h, 16777619) >>> 0; }
  const it = all[h % all.length];
  $("ichimon").hidden = false;
  setR("im-when", `${jpDate()}（${LEVELS[it.lv].name}の問題[もんだい]）`);
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
  fitOneLine(box);
}

// 選択肢が2行になるときだけ、文字を少し小さく（0.8倍まで）
function fitOneLine(box) {
  box.querySelectorAll(".ch > span:last-child").forEach(s => {
    s.style.fontSize = "";
    const lh = parseFloat(getComputedStyle(s).lineHeight) || 30;
    let size = 1;
    while (size > 0.8 && s.getBoundingClientRect().height > lh * 1.5) {
      size = Math.round((size - 0.05) * 100) / 100;
      s.style.fontSize = size + "em";
    }
  });
}
const fitAll = () => ["choices", "im-choices"].forEach(id => { const b = $(id); if (b && b.offsetParent) fitOneLine(b); });
if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitAll);
window.addEventListener("resize", fitAll);

// ---- 出題 -----------------------------------------------------
const MARU = `<svg viewBox="0 0 64 64" fill="none" stroke="var(--green)" stroke-width="6" stroke-linecap="round"><path d="M33 9c-14 1-24 12-23 25 1 12 11 21 23 21 13 0 23-11 22-24C54 19 45 10 34 9"/></svg>`;
const BATSU = `<svg viewBox="0 0 64 64" fill="none" stroke="var(--red)" stroke-width="6" stroke-linecap="round"><path d="M14 12l37 40M50 13L13 51"/></svg>`;
function judgeHtml(ok, it, shake) {
  const w = ok ? pick(["正解[せいかい]", "お見事[みごと]", "さすが"]) : pick(["残念[ざんねん]", "惜[お]しい", "うーん"]);
  const src = safeUrl(it.src) ? `<div class="src"><a href="${esc(it.src)}" target="_blank" rel="noopener">${ruby("出典[しゅってん]")}</a>${it.note ? `（${esc(it.note)}）` : ""}</div>` : "";
  return `<div class="judge ${!ok && shake ? "shake" : ""}">${ok ? MARU : BATSU}<div><div>${ruby(w)}</div><div class="exp">${ruby(it.e)}</div>${src}</div></div>`;
}

let cur = null, idx = 0, set = [], picks = [], hits = [];
function start(n) {
  cur = n; idx = 0; picks = []; hits = [];
  set = shuffle([...(BANK[n] || [])]).slice(0, PER).map(it => ({ it, order: shuffle([0, 1, 2]) }));
  if (set.length < PER) return;
  $("home").hidden = true; $("result").hidden = true; $("quiz").hidden = false;
  document.body.classList.add("quizmode");
  // スマホの「戻る」で級えらびに戻れるように
  if (!(history.state && history.state.quiz)) { try { history.pushState({ quiz: 1 }, ""); } catch { } }
  show(); window.scrollTo({ top: 0 });
}
function show() {
  const { it, order } = set[idx];
  $("bar").innerHTML = set.map((_, i) => `<i class="${i < hits.length ? (hits[i] ? "on" : "off") : ""}"></i>`).join("");
  $("qnum").innerHTML = `<span>${ruby(LEVELS[cur].name)}</span><span>${ruby(`第[だい]${idx + 1}問[もん]`)} ／ 10</span>`;
  $("qtext").innerHTML = ruby(it.q);
  $("choices").innerHTML = order.map((ci, pos) => `<button class="ch" type="button" data-ci="${ci}"><span class="mk">${MARKS[pos]}</span><span>${ruby(it.c[ci])}</span></button>`).join("");
  $("judge").innerHTML = ""; $("next").hidden = true;
  document.querySelectorAll("#choices .ch").forEach(b => b.addEventListener("click", () => answer(Number(b.dataset.ci))));
  fitOneLine($("choices"));
}
function answer(ci) {
  if (picks.length > idx) return;
  const { it } = set[idx]; const ans = answerOf(it); const ok = ci === ans;
  picks.push(ci + 1); hits.push(ok);
  document.querySelectorAll("#choices .ch").forEach(b => { b.disabled = true; const x = Number(b.dataset.ci); if (x === ans) b.classList.add("ok"); else if (x === ci) b.classList.add("ng"); });
  $("judge").innerHTML = judgeHtml(ok, it, true);
  $("bar").children[idx].className = ok ? "on" : "off";
  say("chara-home", ok ? "ok" : "ng");
  $("next").hidden = false; setR("next", idx === set.length - 1 ? "結果[けっか]を見[み]る" : "次[つぎ]へ"); $("next").focus();
}
$("next").addEventListener("click", () => { idx++; if (idx < set.length) show(); else finish(); });
$("quit").addEventListener("click", goHome);

// ---- 結果 -----------------------------------------------------
let last = null;
function finish() {
  const L = LEVELS[cur], s = hits.filter(Boolean).length, pass = s >= L.pass;
  last = { level: cur, score: s, pass, qids: set.map(x => x.it.id), answers: picks.slice(), registered: false };
  $("quiz").hidden = true; $("result").hidden = false;
  document.body.classList.remove("quizmode");
  $("certwrap").hidden = true; $("regmsg").hidden = true; $("regmsg").className = "reg";
  $("name").value = ""; $("name").disabled = false; $("nanoru").disabled = false; $("hp").value = "";
  setR("rlevel", `${KENTEI} ${L.name}`);
  const big = $("rbig"); big.innerHTML = ruby(pass ? "合格[ごうかく]！" : "不合格[ふごうかく]…");
  big.classList.remove("pop"); void big.offsetWidth; big.classList.add("pop");
  setR("rscore", `10問中[もんちゅう] ${s}問[もん]正解[せいかい]（合格[ごうかく]は${L.pass}問[もん]から）`);
  setR("rmsg", pass
    ? `今日[きょう]からあなたは「${TITLE[cur]}」を名乗[なの]れます。` + (s === 10 ? "全問正解[ぜんもんせいかい]。" : "何[なに]ももらえませんが。")
    : (s >= 5 ? `あと少[すこ]し。今日[きょう]は「${FAIL_TITLE}」。` : `引[ひ]っ越[こ]してきたばかり？ 今日[きょう]は「${FAIL_TITLE}」。`));
  if (pass) {
    setR("namelabel", "ニックネームで名乗[なの]る");
    setR("nanoru", "名乗[なの]る");
    setR("namehint", "本名[ほんみょう]は書[か]かないでね。名簿[めいぼ]に載[の]ります。");
  } else {
    setR("namelabel", "名前[なまえ]を入[い]れて受験証[じゅけんしょう]を出[だ]す");
    setR("nanoru", "受験証[じゅけんしょう]を出[だ]す");
    setR("namehint", "名簿[めいぼ]には載[の]りません。名前[なまえ]はなくてもいいよ。");
  }
  const text = shareText();
  setR("copy", pass ? `「私[わたし]は${TITLE[cur]}です」をコピー` : `「${FAIL_TITLE}になりました」をコピー`);
  $("copy").onclick = () => {
    const full = `${text} ${CFG.SITE_URL || location.href}`;
    (navigator.clipboard ? navigator.clipboard.writeText(full) : Promise.reject())
      .then(() => { $("copy").textContent = "コピーしました"; })
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
    ? `私は${plain(TITLE[cur])}です。${plain(KENTEI)} ${plain(L.name)} 合格（${s}/10）#文京区民検定`
    : `${plain(KENTEI)} ${plain(L.name)}を受けて${plain(FAIL_TITLE)}になりました（${s}/10）#文京区民検定`;
}
const nameLen = s => [...s].length;
$("nameform").addEventListener("submit", async ev => {
  ev.preventDefault();
  if (!last) return;
  const name = $("name").value.trim();
  const msg = $("regmsg");
  const tell = (t, err) => { msg.hidden = false; msg.textContent = t; msg.className = "reg" + (err ? " err" : ""); };
  if (nameLen(name) > 12) return tell("名前は12文字までです。", true);
  if (!last.pass) { drawCert({ name: name || "名前なし" }); return; }
  if (last.registered) return;
  if (!name) return tell("ニックネームを入れてください。", true);
  if (!CFG.GAS_URL) {
    tell("いまは名簿の準備中です。番号なしで合格証を出します。", false);
    drawCert({ name });
    return;
  }
  $("nanoru").disabled = true; tell("送っています…", false);
  try {
    const r = await fetch(CFG.GAS_URL, {
      method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "register", level: last.level, qids: last.qids, answers: last.answers, name, hp: $("hp").value })
    });
    const j = await r.json();
    if (j && j.ok) {
      last.registered = true; $("name").disabled = true;
      tell(`あなたは第${j.number}番目の区民。名簿には「${j.display_name}」で載ります。`, false);
      drawCert({ name, number: j.number });
      meiboCache = null; loadList();
    } else {
      $("nanoru").disabled = false;
      tell((j && j.message) || "うまく送れませんでした。もう一度ためしてください。", true);
    }
  } catch {
    $("nanoru").disabled = false;
    tell("いまつながりません。番号なしで合格証を出します。あとでもう一度ためしてください。", true);
    drawCert({ name });
  }
});
$("retry").addEventListener("click", () => start(cur));
$("back").addEventListener("click", goHome);
window.addEventListener("popstate", () => { if (!$("quiz").hidden || !$("result").hidden) goHome(true); });
function goHome(fromBack) {
  if (fromBack !== true && history.state && history.state.quiz) { history.back(); return; }
  document.body.classList.remove("quizmode");
  $("quiz").hidden = true; $("result").hidden = true; $("home").hidden = false;
  say("chara-home", "home"); buildLevels(); window.scrollTo({ top: 0 });
}

// ---- 合格証（縦書きの賞状を canvas で描いて PNG に） -----------
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
  const svg = CH.svg.replace(/currentColor/g, "#1f2937").replace(/var\(--paper,([^)]+)\)/g, "$1").replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" ');
  const img = new Image();
  img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  try { await img.decode(); return img; } catch { return null; }
}
async function drawCert({ name, number }) {
  const W = 1000, H = 1414, pass = last.pass, lv = last.level, L = LEVELS[lv];
  const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
  const ctx = cv.getContext("2d");
  const FONT = '"Zen Old Mincho","Hiragino Mincho ProN","Yu Mincho",serif';
  const lvName = plain(L.name), title = plain(TITLE[lv]), fail = plain(FAIL_TITLE);
  // 賞状らしく漢数字で（年は一字ずつ、月日と点数は十を使う）
  const KD = "〇一二三四五六七八九";
  const kj = n => n < 10 ? KD[n] : (n < 20 ? "十" : KD[Math.floor(n / 10)] + "十") + (n % 10 ? KD[n % 10] : "");
  const [yy, mm, dd] = jstDate().split("-").map(Number);
  const today = `${[...String(yy)].map(c => KD[c]).join("")}年${kj(mm)}月${kj(dd)}日`;
  try { await document.fonts.load(`700 90px "Zen Old Mincho"`, "合格証受験" + name + title + fail + "殿文京区民検定第番目のあなたはにされましたよってここにと認めます問中正解年月日0123456789〇一二三四五六七八九十之印挑戦"); } catch { }
  // 紙
  ctx.fillStyle = "#fffaf0"; ctx.fillRect(0, 0, W, H);
  // 飾り枠（二重線＋あいだに小さな丸）
  const gold = "#a87a22", ink = "#1f2937";
  ctx.strokeStyle = gold; ctx.lineWidth = 10; ctx.strokeRect(36, 36, W - 72, H - 72);
  ctx.lineWidth = 3; ctx.strokeRect(70, 70, W - 140, H - 140);
  ctx.fillStyle = gold;
  const dots = (x0, y0, x1, y1, n) => { for (let i = 0; i <= n; i++) { const t = i / n; ctx.beginPath(); ctx.arc(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, 5, 0, Math.PI * 2); ctx.fill(); } };
  dots(56, 56, W - 56, 56, 34); dots(56, H - 56, W - 56, H - 56, 34); dots(56, 56, 56, H - 56, 48); dots(W - 56, 56, W - 56, H - 56, 48);
  ctx.strokeStyle = gold; ctx.lineWidth = 3;
  [[90, 90, 1, 1], [W - 90, 90, -1, 1], [90, H - 90, 1, -1], [W - 90, H - 90, -1, -1]].forEach(([x, y, sx, sy]) => {
    ctx.beginPath(); ctx.arc(x + sx * 22, y + sy * 22, 22, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(x + sx * 22, y + sy * 22, 10, 0, Math.PI * 2); ctx.stroke();
  });
  ctx.fillStyle = ink;
  const top = 150, bottom = H - 150, maxLen = bottom - top;
  // 列を右から並べる（gap＝次の列までの距離）
  const cols = [];
  cols.push({ t: pass ? "合格証" : "受験証", size: 110, w: 700, gap: 140 });
  cols.push({ t: `${name}　殿`, size: 66, w: 700, gap: 115, indent: 120 });
  const body = pass
    ? ["あなたは文京区民検定", `${lvName}に合格されました`, `よってここに「${title}」と`, "認めます"]
    : ["あなたは文京区民検定", `${lvName}に挑戦されました`, `よってここに「${fail}」と`, "認めます"];
  body.forEach((t, i) => cols.push({ t, size: 54, w: 700, gap: i === body.length - 1 ? 95 : 72, indent: i === 0 ? 0 : 54 }));
  cols.push({ t: `十問中 ${kj(last.score)}問正解`, size: 40, w: 700, gap: 56, indent: 260 });
  if (number) cols.push({ t: `第${number}番目の区民`, size: 40, w: 700, gap: 56, indent: 260 });
  cols.push({ t: today, size: 42, w: 700, gap: 0, indent: 120 });
  let x = W - 150;
  for (const c of cols) {
    const size = fitSize(c.t, c.size, maxLen - (c.indent || 0));
    ctx.font = `${c.w} ${size}px ${FONT}`;
    vtext(ctx, c.t, x, top + (c.indent || 0), size);
    x -= c.gap;
  }
  // 発行元と印（いちばん左の列、下そろえ）
  const ix = Math.min(x - 64, 150);
  ctx.font = `700 50px ${FONT}`;
  vtext(ctx, "文京区民検定", ix, 0, 50, { bottom: bottom - 130 });
  ctx.save();
  ctx.translate(ix, bottom - 50); ctx.rotate(-0.08);
  ctx.strokeStyle = "#c8372d"; ctx.fillStyle = "#c8372d"; ctx.lineWidth = 6;
  ctx.strokeRect(-56, -56, 112, 112); ctx.lineWidth = 2; ctx.strokeRect(-46, -46, 92, 92);
  ctx.font = `700 40px ${FONT}`;
  vtext(ctx, "検定", 18, -44, 40, { spacing: 1.1 }); vtext(ctx, "之印", -18, -44, 40, { spacing: 1.1 });
  ctx.restore();
  // キャラ（左下に小さく）
  const ci = await charaImage();
  if (ci) { ctx.globalAlpha = .9; ctx.drawImage(ci, ix + 80, bottom - 110, 100, 100); ctx.globalAlpha = 1; }
  // 表示と保存
  const url = cv.toDataURL("image/png");
  $("certimg").src = url;
  $("certimg").alt = `${pass ? "合格証" : "受験証"}：${name} 殿 ${pass ? title : fail}`;
  $("certdl").href = url; $("certdl").download = `bunkyo-kentei-${lv}kyu.png`;
  const w = $("certwrap"); w.hidden = false; w.classList.remove("rise"); void w.offsetWidth; w.classList.add("rise");
  w.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" });
}

// ---- 名簿 -----------------------------------------------------
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
    setR("faq-one", oneCount > 0
      ? `いままでに${oneCount}人[にん]が合格[ごうかく]しました。10問[もん]すべて正解[せいかい]で合格[ごうかく]です。`
      : "いまのところ誰[だれ]も受[う]かっていません。10問[もん]すべて正解[せいかい]で合格[ごうかく]です。");
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
  if (!j) { body.innerHTML = `<p class="note">${ruby("いま名簿[めいぼ]を読[よ]み込[こ]めません。")}${CFG.GAS_URL ? ruby("少[すこ]したってから見[み]てください。") : ruby("（準備中[じゅんびちゅう]）")}</p>`; return; }
  const lv = j.levels || {}, cnt = j.counts || {};
  let h = `<h3>${ruby(TITLE[1])}</h3><div class="one">${ruby("合格者[ごうかくしゃ]")}<b>${Number(cnt["1"]) || 0}${ruby("人[にん]")}</b></div>`;
  if ((lv["1"] || []).length) h += list(lv["1"]);
  [2, 3, 4, 5].forEach(n => {
    h += `<h3>${ruby(TITLE[n])}（${Number(cnt[n]) || 0}${ruby("人[にん]")}）</h3>`;
    h += (lv[n] || []).length ? list(lv[n]) : `<p class="note">${ruby("まだ誰[だれ]もいません。")}</p>`;
  });
  body.innerHTML = h;
  function list(a) { return `<ol>${a.map(p => `<li>${esc(p.name)} <small>第${Number(p.n) || "?"}番</small></li>`).join("")}</ol>`; }
}

// ---- はじめ ---------------------------------------------------
say("chara-home", "home"); say("chara-faq", "faq");
loadBank().then(() => { buildLevels(); ichimon(); });
loadList();
})();
