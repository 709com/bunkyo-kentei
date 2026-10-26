// キャラクター（オリジナル。区の紋章・シンボルマーク・既存キャラクターとは無関係）
// 線は currentColor（文字色）なので、ダーク表示でも自動で見える
window.KENTEI_CHARAS = {
  enpitsu: {
    name: "えんぴつ せんせい",
    svg: `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M22 13c6-1 14-1 20 0l1 7H21z" fill="#f2a7b5"/>
      <path d="M21 20h22l-1 25H22z" fill="#f4d35e"/>
      <path d="M29 20l-.5 25M35 20l.5 25" stroke-width="1.4" opacity=".55"/>
      <path d="M22 45h20L33 60c-.6 1-1.4 1-2 0z" fill="#f5e6c8"/>
      <path d="M29.5 55.5h5l-2.5 4.5z" fill="currentColor"/>
      <circle cx="28" cy="31" r="1.6" fill="currentColor" stroke="none"/>
      <circle cx="37" cy="31" r="1.6" fill="currentColor" stroke="none"/>
      <path d="M29 37c2 2 5 2 7 0"/>
      <path d="M21 34c-4 1-7 4-8 7M43 34c4 0 7-2 9-5"/>
    </svg>`
  },
  ichou: {
    name: "いちょうの はっぱ",
    svg: `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M32 44C20 44 8 34 7 20c8-6 17-9 25-9s17 3 25 9c-1 14-13 24-25 24z" fill="#f4d35e"/>
      <path d="M32 11l-2 9 2 2 2-2z" fill="var(--paper,#fffdf6)"/>
      <path d="M32 44c0 6 1 11 4 16"/>
      <path d="M18 22c3 6 7 10 14 13M46 22c-3 6-7 10-14 13" stroke-width="1.3" opacity=".5"/>
      <circle cx="25" cy="29" r="1.6" fill="currentColor" stroke="none"/>
      <circle cx="39" cy="29" r="1.6" fill="currentColor" stroke="none"/>
      <path d="M28 35c2.5 2 5.5 2 8 0"/>
    </svg>`
  },
  neko: {
    name: "さかみち ねこ",
    svg: `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M4 60L60 46" stroke-width="2" opacity=".6"/>
      <path d="M16 54c-2-10 2-20 8-24l-2-13 9 8c2-.4 4-.4 6 0l9-8-2 13c6 4 9 13 7 21z" fill="var(--paper,#fffdf6)"/>
      <path d="M50 52c6-2 8-8 5-13"/>
      <circle cx="27" cy="36" r="1.7" fill="currentColor" stroke="none"/>
      <circle cx="39" cy="36" r="1.7" fill="currentColor" stroke="none"/>
      <path d="M31 41l2 1.5 2-1.5M33 42.5v1.5c-1 1.5-3 1.5-4 .5M33 44c1 1.5 3 1.5 4 .5"/>
      <path d="M20 40h-7M20 43l-6 2M46 40h7M46 43l6 2" stroke-width="1.4"/>
    </svg>`
  }
};
window.KENTEI_LINES = {
  home: ["なんきゅうに する？", "1きゅうは まだ だれも…", "なにも もらえないよ"],
  quiz: ["よく よんでね", "あわてない あわてない", "3つに 1つ"],
  ok: ["せいかい！", "やるね", "さすが"],
  ng: ["どんまい", "おしい", "つぎ いこう"],
  pass: ["おめでとう！", "きょうから くみん！"],
  fail: ["また きてね", "なんどでも どうぞ"],
  meibo: ["くみんの みなさん"],
  faq: ["なんでも きいて"]
};
