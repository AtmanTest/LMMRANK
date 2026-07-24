/* LLMRANK v2 — Application
   ============================================================ */

const state = { ranking: null, history: null, chart: null, error: null, showAllBench: false };

/* ─── Load ─── */
async function loadData() {
  showLoading();
  const bust = `?t=${Date.now()}`;
  try {
    const [rr, hr] = await Promise.all([
      fetch(`public/data/llm-ranking.json${bust}`),
      fetch(`public/data/llm-history.json${bust}`)
    ]);
    if (!rr.ok) throw new Error(`HTTP ${rr.status}`);
    if (!hr.ok) throw new Error(`HTTP ${hr.status}`);
    state.ranking = await rr.json();
    state.history = await hr.json();
    state.error = null;
    validateData();
    initUI();
  } catch (e) {
    state.error = e.message;
    showError(e);
  }
}

function validateData() {
  const r = state.ranking;
  if (!r || !r.rankings) throw new Error('Données invalides');
  r.metadata = r.metadata || {};
  r.metadata.model_count = r.rankings.length;
  r.metadata.provider_count = Object.keys(r.providers || {}).length;
  r.metadata.benchmark_count = Object.keys(r.benchmarks || {}).length;
}

/* ─── UI States ─── */
function showLoading() {
  const body = document.getElementById('rankingBody');
  body.innerHTML = `<tr><td colspan="16"><div class="loading-state"><div class="spinner"></div><span>Chargement…</span></div></td></tr>`;
  document.getElementById('stats').innerHTML = '';
  document.getElementById('metaLine').textContent = 'Chargement…';
}

function showError(err) {
  document.getElementById('rankingBody').innerHTML =
    `<tr><td colspan="16"><div class="error-state">
      <span class="icon">⚠️</span>
      <p>Impossible de charger les données</p>
      <p class="error-detail">${err.message}</p>
      <button onclick="loadData()" style="margin-top:12px">Réessayer</button>
    </div></td></tr>`;
  document.getElementById('metaLine').textContent = 'Erreur';
}

/* ─── Init UI ─── */
function initUI() {
  const r = state.ranking;
  const meta = r.metadata;

  // Hero counts
  document.getElementById('modelCountHero').textContent = meta.model_count;
  document.getElementById('benchmarkCountHero').textContent = meta.benchmark_count;

  // Meta line
  const genDate = r.generated_at
    ? new Date(r.generated_at).toLocaleDateString('fr-FR')
    : '—';
  document.getElementById('metaLine').textContent =
    `${meta.model_count} modèles · ${meta.provider_count} providers · ${r.benchmarks ? Object.keys(r.benchmarks).length : 0} benchmarks · ${genDate}`;
  document.getElementById('footerDate').textContent = genDate;

  // Populate filter dropdowns
  populateSelect('#providerFilter', r.rankings.map(x => x.provider), 'Tous');
  populateSelect('#familyFilter', [...new Set(r.rankings.map(x => x.family))].filter(Boolean), 'Toutes');
  populateSelect('#modalityFilter', r.modalities || [], 'Toutes');
  populateSelect('#licenseFilter', r.licenses || [], 'Toutes');

  // Sources grid
  renderSources();

  // Render everything
  renderStats();
  renderTable();
  renderChart();
  updateFooter();
}

function populateSelect(selId, values, allLabel) {
  const sel = document.querySelector(selId);
  if (!sel) return;
  if (sel.options.length > 1) return;
  sel.innerHTML = `<option value="all">${allLabel}</option>`;
  [...new Set(values)].sort().forEach(v => {
    const o = document.createElement('option');
    o.value = v;
    o.textContent = v;
    sel.appendChild(o);
  });
}

/* ─── Filter / Sort ─── */
function filtered() {
  const prov = val('#providerFilter');
  const family = val('#familyFilter');
  const mod = val('#modalityFilter');
  const lic = val('#licenseFilter');
  const pr = val('#priceFilter');
  const sp = val('#speedFilter');
  const st = val('#statusFilter');
  const q = val('#searchInput').toLowerCase().trim();
  const sort = val('#sortSelect');

  let rows = [...state.ranking.rankings];

  if (prov !== 'all') rows = rows.filter(r => r.provider === prov);
  if (family !== 'all') rows = rows.filter(r => r.family === family);
  if (mod !== 'all') rows = rows.filter(r => r.modality === mod);
  if (lic !== 'all') rows = rows.filter(r => r.license === lic);
  if (pr !== 'all') rows = rows.filter(r => (r.price_in || 999) <= parseFloat(pr));
  if (sp !== 'all') {
    const t = r => r.throughput || 0;
    if (sp === 'fast') rows = rows.filter(r => t(r) >= 150);
    else if (sp === 'medium') rows = rows.filter(r => t(r) >= 50 && t(r) < 150);
    else rows = rows.filter(r => t(r) < 50);
  }
  if (st !== 'all') rows = rows.filter(r => (r.status || 'active') === st);
  if (q) rows = rows.filter(r => `${r.display_name} ${r.provider} ${r.vendor}`.toLowerCase().includes(q));

  // Sort
  if (sort === 'score') rows.sort((a, b) => b.global_score - a.global_score);
  else if (sort === 'price') rows.sort((a, b) => (a.price_in || 999) - (b.price_in || 999));
  else if (sort === 'price-desc') rows.sort((a, b) => (b.price_in || 0) - (a.price_in || 0));
  else if (sort === 'speed') rows.sort((a, b) => (a.throughput || 0) - (b.throughput || 0));
  else if (sort === 'context') rows.sort((a, b) => (a.context_window || 0) - (b.context_window || 0));
  else rows.sort((a, b) => (a.rank || 999) - (b.rank || 999));

  return rows;
}

function val(id) {
  const el = document.querySelector(id);
  return el ? el.value : 'all';
}

/* ─── Stats ─── */
function renderStats() {
  const rankings = state.ranking.rankings;
  if (!rankings || !rankings.length) return;
  const top = rankings[0];
  const avg = (rankings.reduce((s, r) => s + r.global_score, 0) / rankings.length).toFixed(1);
  const med = median(rankings.map(r => r.global_score)).toFixed(1);
  const providers = state.ranking.providers ? Object.keys(state.ranking.providers).length : '—';
  const active = rankings.filter(r => (r.status || 'active') === 'active').length;
  const withPrice = rankings.filter(r => r.price_in != null && r.price_in > 0).length;

  const items = [
    ['Modèles', String(rankings.length)],
    ['Providers', String(providers)],
    ['Top Score', `${top.global_score} <small>${top.display_name}</small>`],
    ['Médiane', String(med)],
    ['Moyenne', String(avg)],
    ['Benchmarks', String(Object.keys(state.ranking.benchmarks || {}).length)],
    ['Actifs', String(active)],
    ['Prix connus', String(withPrice)]
  ];
  document.getElementById('stats').innerHTML = items
    .map(([k, v]) => `<article class="stat"><span class="k">${k}</span><span class="v">${v}</span></article>`)
    .join('');
}

function median(arr) {
  const s = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

/* ─── Table ─── */
function renderTable() {
  const rows = filtered();
  const html = rows.map(r => renderRow(r)).join('');

  if (!html) {
    document.getElementById('rankingBody').innerHTML =
      `<tr><td colspan="16"><div class="empty-state">Aucun modèle trouvé</div></td></tr>`;
  } else {
    document.getElementById('rankingBody').innerHTML = html;
  }

  updateFooter(rows.length);
}

function renderRow(r) {
  const sc = r.global_score || 0;
  const scoreClass = sc >= 80 ? 'top' : sc >= 60 ? 'high' : sc >= 40 ? 'mid' : sc >= 20 ? 'low' : 'bottom';
  const ci = r.confidence_interval
    ? `±${Math.abs((r.confidence_interval.high || sc) - sc).toFixed(1)}`
    : '—';
  const status = r.status || 'active';
  const statusClass = status === 'active' ? 'status-active' : status === 'stale' ? 'status-stale' : 'status-partial';
  const modalities = r.modality ? r.modality.split('+').map(m => `<span class="tag-modality">${m.trim()}</span>`).join('') : '';

  // Benchmarks
  const hle = f(r.benchmarks?.hle?.raw_score);
  const gpqa = f(r.benchmarks?.gpqa_diamond?.raw_score);
  const swe = f(r.benchmarks?.swe_bench_verified?.raw_score);
  const arena = f(r.benchmarks?.arena_elo?.raw_score);
  const liveb = f(r.benchmarks?.livebench?.raw_score);
  const math = f(r.benchmarks?.math_500?.raw_score);
  const lcb = f(r.benchmarks?.live_code_bench?.raw_score);
  const bfcl = f(r.benchmarks?.bfcl?.raw_score);
  const osw = f(r.benchmarks?.osworld?.raw_score);

  const extraClass = state.showAllBench ? '' : 'hide';

  // Price
  let priceStr = '—';
  if (r.price_in != null && r.price_in > 0) {
    priceStr = `$${r.price_in < 0.01 ? r.price_in.toFixed(3) : r.price_in.toFixed(2)}`;
  }

  // Context
  let ctxStr = '—';
  if (r.context_window) ctxStr = r.context_window >= 1000 ? `${r.context_window/1000}M` : `${r.context_window}K`;

  return `<tr>
    <td class="col-rank">${r.rank}</td>
    <td class="col-model">
      <span class="model-name">${r.display_name}</span>
      <span class="model-meta">${r.family || ''}${modalities}</span>
    </td>
    <td class="col-provider">${r.vendor || r.provider}</td>
    <td class="col-score">
      <div class="score-bar-wrap">
        <span class="score-${scoreClass}">${sc}</span>
        <span class="ci">${ci}</span>
        <div class="score-bar score-bar-${scoreClass}"><div class="score-bar-fill" style="width:${sc}%"></div></div>
      </div>
    </td>
    <td class="bench-cell">${hle}</td>
    <td class="bench-cell">${gpqa}</td>
    <td class="bench-cell">${swe}</td>
    <td class="bench-cell">${arena}</td>
    <td class="bench-cell col-extra ${extraClass}">${liveb}</td>
    <td class="bench-cell col-extra ${extraClass}">${math}</td>
    <td class="bench-cell col-extra ${extraClass}">${lcb}</td>
    <td class="bench-cell col-extra ${extraClass}">${bfcl}</td>
    <td class="bench-cell col-extra ${extraClass}">${osw}</td>
    <td class="price-cell">${priceStr}</td>
    <td class="context-cell">${ctxStr}</td>
    <td><span class="status-badge ${statusClass}">${status}</span></td>
  </tr>`;
}

function f(v) {
  if (v == null) return '<span class="na">—</span>';
  return v;
}

function updateFooter(count) {
  const total = state.ranking.rankings.length;
  document.getElementById('tableFooter').textContent =
    `${count} / ${total} modèles affichés`;
}

/* ─── Sources ─── */
function renderSources() {
  const bm = state.ranking.benchmarks;
  if (!bm) return;
  const grid = document.getElementById('sourceGrid');
  grid.innerHTML = Object.entries(bm).map(([k, v]) =>
    `<div class="source-card">
      <span class="s-label">${v.label || k}</span>
      <span class="s-weight">Poids ${v.weight || '?'}% · ${k}</span>
    </div>`
  ).join('');
}

/* ─── Chart ─── */
function renderChart() {
  const rankings = state.ranking.rankings;
  if (!rankings || !rankings.length) return;

  const top10 = rankings.slice(0, 10).map(r => r.model_id);
  const series = state.history ? state.history.filter(x => top10.includes(x.model_id)) : [];
  const dates = [...new Set(series.map(x => x.date))].sort();

  if (dates.length === 0) {
    document.querySelector('.grid-2 .panel:first-child .section-head p').textContent = 'Pas d\'historique';
    return;
  }

  const colors = ['#6366f1','#06b6d4','#22c55e','#eab308','#f97316','#ef4444','#a855f7','#ec4899','#14b8a6','#f43f5e'];

  const datasets = top10.map((id, i) => ({
    label: rankings.find(r => r.model_id === id)?.display_name || id,
    data: dates.map(d => {
      const e = series.find(x => x.date === d && x.model_id === id);
      return e ? e.global_score : null;
    }),
    borderColor: colors[i % colors.length],
    backgroundColor: colors[i % colors.length] + '20',
    borderWidth: 1.5,
    tension: 0.3,
    fill: false,
    pointRadius: 2,
    pointHoverRadius: 5,
  }));

  const ctx = document.getElementById('historyChart');
  if (state.chart) state.chart.destroy();

  state.chart = new Chart(ctx, {
    type: 'line',
    data: { labels: dates, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          labels: { color: '#94a3b8', font: { size: 10 }, boxWidth: 12, padding: 10 },
          maxHeight: 80
        },
        tooltip: {
          backgroundColor: '#111',
          titleColor: '#e2e8f0',
          bodyColor: '#94a3b8',
          borderColor: 'rgba(255,255,255,0.08)',
          borderWidth: 1,
          padding: 8,
          cornerRadius: 6
        }
      },
      scales: {
        x: {
          ticks: { color: '#64748b', font: { size: 10 }, maxTicksLimit: 6 },
          grid: { color: 'rgba(255,255,255,0.05)' }
        },
        y: {
          ticks: { color: '#64748b', font: { size: 10 } },
          grid: { color: 'rgba(255,255,255,0.05)' }
        }
      },
      interaction: { intersect: false, mode: 'index' }
    }
  });
}

/* ─── Events ─── */
document.addEventListener('DOMContentLoaded', () => {
  loadData();

  // Filter inputs
  ['providerFilter','familyFilter','modalityFilter','licenseFilter',
   'priceFilter','speedFilter','statusFilter','searchInput','sortSelect'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', () => renderTable());
  });
  document.getElementById('searchInput')?.addEventListener('input', () => renderTable());

  // Refresh
  document.getElementById('refreshBtn')?.addEventListener('click', () => {
    loadData();
    document.getElementById('refreshBtn').textContent = '⟳';
  });

  // Toggle all benchmarks
  document.getElementById('showAllBenchmarks')?.addEventListener('click', () => {
    state.showAllBench = !state.showAllBench;
    document.getElementById('showAllBenchmarks').textContent =
      state.showAllBench ? '− Benchmarks' : '+ Benchmarks';
    document.querySelectorAll('.col-extra').forEach(el => {
      el.style.display = state.showAllBench ? '' : 'none';
    });
    renderTable();
  });
});
