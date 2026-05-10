// 月・日セレクト初期化
const bMonth = document.getElementById('b-month');
const bDay = document.getElementById('b-day');
for(let m=1;m<=12;m++){const o=document.createElement('option');o.value=m;o.textContent=m+'月';bMonth.appendChild(o);}
for(let d=1;d<=31;d++){const o=document.createElement('option');o.value=d;o.textContent=d+'日';bDay.appendChild(o);}

const NOW = new Date().getFullYear();
let birthYear, birthMonth, birthDay, events=[];
const cv = document.getElementById('cv');
const cx = cv.getContext('2d');
const evList = document.getElementById('ev-list');
const modalBg = document.getElementById('modal-bg');

// 日本の学年計算: 4/2〜翌4/1生まれが同学年
function schoolEntryYear(by, bm, bd) {
  // 4月2日以降生まれ → 翌年度入学、4月1日以前生まれ → 当年度入学
  if (bm < 4 || (bm === 4 && bd <= 1)) return by + 6;
  return by + 7;
}

document.getElementById('btn-start').addEventListener('click', startApp);

function startApp() {
  const y=parseInt(document.getElementById('b-year').value);
  const m=parseInt(bMonth.value);
  const d=parseInt(bDay.value);
  if(!y||y<1920||y>2020){document.getElementById('b-year').style.borderColor='#ef4444';return;}
  birthYear=y; birthMonth=m; birthDay=d;
  const ey = schoolEntryYear(y, m, d); // 小学校入学年度
  document.getElementById('chart-title').textContent=`${y}年${m}月${d}日生まれのライフチャート`;

  // サンプルイベント（リアルな幸福度付き）
  const stages = [
    [y, '誕生', '新しい命の始まり', 80],
    [ey, '小学校入学', '期待と不安の新生活', 75],
    [ey+3, '小学校中学年', '友達と遊ぶ毎日が楽しかった', 85],
    [ey+6, '中学校入学', '環境の変化に戸惑い', 60],
    [ey+8, '中学3年', '受験勉強に追われた日々', 45],
    [ey+9, '高校入学', '新しい出会いと青春', 70],
    [ey+11, '高校3年', '進路や受験のプレッシャー', 40],
    [ey+12, '大学/専門学校', '自由な時間と新しい学び', 75],
    [ey+14, '就活', '将来への不安と焦り', 35],
    [ey+16, '社会人', '新生活のスタート', 60],
    [ey+19, '仕事3年目', '少しずつ自信がついてきた', 55],
  ];
  events=[];
  stages.forEach(([yr,label,memo,val])=>{if(yr<=NOW)events.push({year:yr,label,memo,val});});
  if(events.length&&events[events.length-1].year<NOW)events.push({year:NOW,label:'現在',memo:'',val:50});
  
  document.getElementById('intro').classList.add('hidden');
  document.getElementById('app').classList.add('visible');
  renderEvents(); drawChart();
}

function renderEvents(){
  events.sort((a,b)=>a.year-b.year);
  evList.innerHTML='';
  events.forEach((ev,i)=>{
    const d=document.createElement('div');d.className='ev';
    d.innerHTML=`<div class="ev-top">
      <input class="ev-yr" type="number" value="${ev.year}" data-i="${i}" min="1920" max="${NOW}">
      <input class="ev-nm" type="text" value="${ev.label}" data-i="${i}" placeholder="イベント名">
      <button class="ev-del" data-i="${i}">✕</button>
    </div>
    <div class="sl-row">
      <span>😢</span>
      <input type="range" min="0" max="100" value="${ev.val}" data-i="${i}">
      <span>😊</span>
      <span class="sl-v" id="sv${i}">${ev.val}</span>
    </div>
    <textarea class="ev-memo" data-i="${i}" placeholder="メモ（任意）">${ev.memo||''}</textarea>`;
    evList.appendChild(d);
  });
  // スライダー
  evList.querySelectorAll('input[type=range]').forEach(s=>{
    s.addEventListener('input',e=>{const i=+e.target.dataset.i;events[i].val=+e.target.value;document.getElementById('sv'+i).textContent=e.target.value;drawChart();});
  });
  // 名前変更
  evList.querySelectorAll('.ev-nm').forEach(n=>{
    n.addEventListener('input',e=>{events[+e.target.dataset.i].label=e.target.value;drawChart();});
  });
  // メモ変更
  evList.querySelectorAll('.ev-memo').forEach(n=>{
    n.addEventListener('input',e=>{events[+e.target.dataset.i].memo=e.target.value;});
  });
  // 年変更
  evList.querySelectorAll('.ev-yr').forEach(y=>{
    y.addEventListener('change',e=>{
      const i=+e.target.dataset.i;
      const v=+e.target.value;
      if(v>=1920&&v<=NOW){events[i].year=v;renderEvents();drawChart();}
    });
  });
  // 削除
  evList.querySelectorAll('.ev-del').forEach(b=>{
    b.addEventListener('click',()=>{events.splice(+b.dataset.i,1);renderEvents();drawChart();});
  });
}

function renderChartToCanvas(targetCanvas, w, h, dpr = 1, isPrint = false) {
  const tcx = targetCanvas.getContext('2d');
  targetCanvas.width = w * dpr; targetCanvas.height = h * dpr;
  tcx.setTransform(dpr, 0, 0, dpr, 0, 0);
  
  // 背景色（Canvas自体に背景を塗る）
  tcx.fillStyle = isPrint ? '#ffffff' : '#0b0f19';
  tcx.fillRect(0, 0, w, h);
  
  if (events.length < 2) return [];
  const pad = { t: 40, b: 100, l: 60, r: 30 };
  const cw = w - pad.l - pad.r;
  const ch = h - pad.t - pad.b;
  const sorted = [...events].sort((a, b) => a.year - b.year);
  const minY = sorted[0].year, maxY = sorted[sorted.length - 1].year, span = maxY - minY || 1;
  const xF = yr => pad.l + ((yr - minY) / span) * cw;
  const yF = v => pad.t + ch - (v / 100) * ch;
  
  // グリッド
  tcx.strokeStyle = isPrint ? 'rgba(0,0,0,.06)' : 'rgba(255,255,255,.04)'; tcx.lineWidth = 1;
  for (let v = 0; v <= 100; v += 25) { tcx.beginPath(); tcx.moveTo(pad.l, yF(v)); tcx.lineTo(w - pad.r, yF(v)); tcx.stroke(); }
  tcx.strokeStyle = isPrint ? 'rgba(0,0,0,.15)' : 'rgba(255,255,255,.1)'; tcx.setLineDash([4, 4]);
  tcx.beginPath(); tcx.moveTo(pad.l, yF(50)); tcx.lineTo(w - pad.r, yF(50)); tcx.stroke(); tcx.setLineDash([]);
  
  // 座標
  const pts = sorted.map(ev => ({ x: xF(ev.year), y: yF(ev.val), ev }));
  
  // 曲線
  tcx.beginPath(); tcx.moveTo(pts[0].x, pts[0].y);
  for (let i = 0; i < pts.length - 1; i++) {
    const cpx = (pts[i].x + pts[i + 1].x) / 2;
    tcx.bezierCurveTo(cpx, pts[i].y, cpx, pts[i + 1].y, pts[i + 1].x, pts[i + 1].y);
  }
  
  if (isPrint) {
    tcx.strokeStyle = '#0284c7'; // 印刷用には少し濃いめの青
    tcx.lineWidth = 3.5;
    tcx.stroke();
  } else {
    const gr = tcx.createLinearGradient(pad.l, 0, w - pad.r, 0);
    gr.addColorStop(0, '#00f2fe'); gr.addColorStop(1, '#4facfe');
    tcx.strokeStyle = gr; tcx.lineWidth = 3.5; tcx.shadowColor = 'rgba(0,242,254,.4)'; tcx.shadowBlur = 12; tcx.stroke(); tcx.shadowBlur = 0;
  }
  
  // 塗り
  tcx.lineTo(pts[pts.length - 1].x, h - pad.b); tcx.lineTo(pts[0].x, h - pad.b); tcx.closePath();
  const fg = tcx.createLinearGradient(0, pad.t, 0, h - pad.b);
  fg.addColorStop(0, isPrint ? 'rgba(2,132,199,.1)' : 'rgba(0,242,254,.08)');
  fg.addColorStop(1, isPrint ? 'rgba(2,132,199,0)' : 'rgba(0,242,254,0)');
  tcx.fillStyle = fg; tcx.fill();
  
  // 点・ラベル
  pts.forEach((p, i) => {
    tcx.beginPath(); tcx.arc(p.x, p.y, 5, 0, Math.PI * 2); tcx.fillStyle = '#fff'; tcx.fill();
    tcx.strokeStyle = isPrint ? '#0284c7' : '#00f2fe'; tcx.lineWidth = 2; tcx.stroke();
    
    tcx.fillStyle = isPrint ? '#1e293b' : 'rgba(255,255,255,.7)'; tcx.font = '600 11px Outfit,sans-serif'; tcx.textAlign = 'center';
    tcx.fillText(p.ev.label, p.x, p.ev.val >= 50 ? p.y - 16 : p.y + 22);
    
    tcx.fillStyle = isPrint ? '#64748b' : 'rgba(255,255,255,.3)'; tcx.font = '10px Inter,sans-serif';
    const ny = (i % 3 === 0) ? h - pad.b + 18 : (i % 3 === 1) ? h - pad.b + 32 : h - pad.b + 46;
    tcx.fillText(p.ev.year + '年', p.x, ny);
  });
  
  tcx.fillStyle = isPrint ? '#94a3b8' : 'rgba(255,255,255,.25)'; tcx.font = '10px Outfit,sans-serif'; tcx.textAlign = 'right';
  tcx.fillText('幸福度 高', pad.l - 8, pad.t + 8); tcx.fillText('幸福度 低', pad.l - 8, h - pad.b);
  return pts;
}

function drawChart() {
  const wrapper = cv.parentElement;
  const w = Math.max(wrapper.clientWidth, events.length * 70);
  const h = wrapper.clientHeight;
  const dpr = window.devicePixelRatio || 1;
  window._chartPts = renderChartToCanvas(cv, w, h, dpr);
}

// ツールチップ
const tooltip = document.getElementById('tooltip');
const chartWrapper = document.querySelector('.chart-wrapper');

cv.addEventListener('mousemove', e => {
  if (!window._chartPts) return;
  const rect = cv.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;
  const scaleX = cv.width / (window.devicePixelRatio || 1) / rect.width;
  const scaleY = cv.height / (window.devicePixelRatio || 1) / rect.height;
  const cx2 = mx * scaleX;
  const cy2 = my * scaleY;

  let found = null;
  for (const p of window._chartPts) {
    if (Math.abs(p.x - cx2) < 15 && Math.abs(p.y - cy2) < 15) { found = p; break; }
  }
  if (found && found.ev.memo) {
    tooltip.querySelector('.tt-name').textContent = found.ev.label;
    tooltip.querySelector('.tt-year').textContent = found.ev.year + '年（幸福度: ' + found.ev.val + '）';
    tooltip.querySelector('.tt-memo').textContent = found.ev.memo;
    tooltip.style.left = (mx + 15) + 'px';
    tooltip.style.top = (my - 10) + 'px';
    tooltip.style.opacity = '1';
  } else {
    tooltip.style.opacity = '0';
  }
});
cv.addEventListener('mouseleave', () => { tooltip.style.opacity = '0'; });

window.addEventListener('resize',drawChart);

// 追加モーダル
document.getElementById('btn-add').addEventListener('click',()=>{
  document.getElementById('m-yr').value='';document.getElementById('m-tt').value='';document.getElementById('m-memo').value='';document.getElementById('m-vl').value='50';
  modalBg.classList.add('open');
});
document.getElementById('m-cancel').addEventListener('click',()=>modalBg.classList.remove('open'));
modalBg.addEventListener('click',e=>{if(e.target===modalBg)modalBg.classList.remove('open');});
document.getElementById('m-ok').addEventListener('click',()=>{
  const yr=+document.getElementById('m-yr').value,tt=document.getElementById('m-tt').value.trim(),memo=document.getElementById('m-memo').value.trim(),vl=+document.getElementById('m-vl').value;
  if(!yr||yr<birthYear||yr>NOW){alert(birthYear+'年〜'+NOW+'年の間で入力してください');return;}
  if(!tt){alert('イベント名を入力してください');return;}
  events.push({year:yr,label:tt,memo:memo,val:Math.max(0,Math.min(100,vl||50))});
  modalBg.classList.remove('open');renderEvents();drawChart();saveToStorage();
});

// ===== 保存機能 (localStorage) =====
function saveToStorage() {
  const data = { birthYear, birthMonth, birthDay, events };
  localStorage.setItem('lifechart_data', JSON.stringify(data));
}
function loadFromStorage() {
  const raw = localStorage.getItem('lifechart_data');
  if (!raw) return false;
  try {
    const data = JSON.parse(raw);
    birthYear = data.birthYear; birthMonth = data.birthMonth; birthDay = data.birthDay;
    events = data.events || [];
    document.getElementById('chart-title').textContent = `${birthYear}年${birthMonth}月${birthDay}日生まれのライフチャート`;
    document.getElementById('intro').classList.add('hidden');
    document.getElementById('app').classList.add('visible');
    renderEvents(); drawChart();
    return true;
  } catch(e) { return false; }
}
// 変更時に自動保存をフック
const origRender = renderEvents;
renderEvents = function() { origRender(); saveToStorage(); };

// ===== エクスポート (JSON) =====
document.getElementById('btn-export-json').addEventListener('click', () => {
  const data = JSON.stringify({ birthYear, birthMonth, birthDay, events }, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const a = document.createElement('a'); a.download = `life-chart-${birthYear}.json`;
  a.href = URL.createObjectURL(blob); a.click(); URL.revokeObjectURL(a.href);
});

// ===== エクスポート (CSV) =====
document.getElementById('btn-export-csv').addEventListener('click', () => {
  const bom = '\uFEFF'; // Excel用BOM
  let csv = bom + '年,イベント名,メモ,幸福度\n';
  [...events].sort((a,b) => a.year - b.year).forEach(ev => {
    const esc = s => '"' + (s||'').replace(/"/g, '""') + '"';
    csv += `${ev.year},${esc(ev.label)},${esc(ev.memo)},${ev.val}\n`;
  });
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a'); a.download = `life-chart-${birthYear}.csv`;
  a.href = URL.createObjectURL(blob); a.click(); URL.revokeObjectURL(a.href);
});

// ===== インポート (JSON) =====
const fileInput = document.getElementById('file-import');
document.getElementById('btn-import').addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', e => {
  const file = e.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const data = JSON.parse(ev.target.result);
      if (!data.birthYear || !data.events) { alert('無効なファイル形式です'); return; }
      birthYear = data.birthYear; birthMonth = data.birthMonth || 1; birthDay = data.birthDay || 1;
      events = data.events;
      document.getElementById('chart-title').textContent = `${birthYear}年${birthMonth}月${birthDay}日生まれのライフチャート`;
      document.getElementById('intro').classList.add('hidden');
      document.getElementById('app').classList.add('visible');
      renderEvents(); drawChart();
    } catch(err) { alert('ファイルの読み込みに失敗しました: ' + err.message); }
  };
  reader.readAsText(file); fileInput.value = '';
});

// リセット
document.getElementById('btn-reset').addEventListener('click',()=>{
  if(!confirm('リセットして最初からやり直しますか？'))return;
  events=[]; localStorage.removeItem('lifechart_data');
  document.getElementById('app').classList.remove('visible');
  document.getElementById('intro').classList.remove('hidden');
});
// 画像エクスポート
document.getElementById('btn-export').addEventListener('click',()=>{
  const offscreenCv = document.createElement('canvas');
  const a4W = 1414; // A4横の比率 (1.414:1)
  const a4H = 1000;
  
  // A4サイズ、DPR=2の高解像度で描画（第5引数にtrueを渡して印刷用デザインに）
  renderChartToCanvas(offscreenCv, a4W, a4H, 2, true);
  
  const a = document.createElement('a');
  a.download = `life-chart-${birthYear}.png`;
  a.href = offscreenCv.toDataURL('image/png');
  a.click();
});

// ===== 起動時にlocalStorageから復元 =====
loadFromStorage();
