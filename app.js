/**
 * LLMRANK v3 — Real Chatbot Arena data
 * 378 modèles, scores Elo, filtres temps réel
 */
(function () {
  'use strict';

  const EL = document.getElementById.bind(document);
  const Q = document.querySelectorAll.bind(document);

  // ─── State ───
  let rankings = [];
  let filtered = [];
  const state = {
    provider: 'all',
    search: '',
    sort: 'rank',
    limit: 100,
  };

  // ─── Format helpers ───
  function fmtPrice(v) {
    if (v == null || isNaN(v)) return '—';
    return '$' + v.toFixed(2);
  }

  function fmtContext(v) {
    if (!v) return '—';
    if (v >= 1_000_000) return (v / 1_000_000).toFixed(v % 1_000_000 === 0 ? 0 : 1) + 'M';
    if (v >= 1_000) return (v / 1_000).toFixed(v % 1_000 === 0 ? 0 : 1) + 'K';
    return v.toLocaleString();
  }

  function fmtVotes(v) {
    if (!v) return '—';
    return v.toLocaleString();
  }

  function fmtScore(v) {
    return v != null ? v.toFixed(0) : '—';
  }

  // ─── Render ───
  function render() {
    const tbody = EL('rankings-body');
    const count = EL('count');
    const fullCount = rankings.length;

    // Apply filters
    filtered = rankings.filter(function (m) {
      if (state.provider !== 'all' && m.provider !== state.provider) return false;
      if (state.search) {
        var q = state.search.toLowerCase();
        var name = (m.display_name || '').toLowerCase();
        var prov = (m.provider || '').toLowerCase();
        if (name.indexOf(q) === -1 && prov.indexOf(q) === -1) return false;
      }
      return true;
    });

    // Sort
    switch (state.sort) {
      case 'score': filtered.sort(function (a, b) { return (b.arena_score || 0) - (a.arena_score || 0); }); break;
      case 'votes': filtered.sort(function (a, b) { return (b.arena_votes || 0) - (a.arena_votes || 0); }); break;
      case 'context': filtered.sort(function (a, b) { return (b.context_tokens || 0) - (a.context_tokens || 0); }); break;
      case 'price': filtered.sort(function (a, b) { return (a.price_in_per_mtok || 999) - (b.price_in_per_mtok || 999); }); break;
      case 'rank':
      default: filtered.sort(function (a, b) { return a.arena_rank - b.arena_rank; }); break;
    }

    count.textContent = filtered.length + ' / ' + fullCount + ' modèles';

    var html = '';
    var show = state.limit === 0 ? filtered : filtered.slice(0, state.limit);
    for (var i = 0; i < show.length; i++) {
      var m = show[i];
      var rank = m.arena_rank;
      var rankSpread = m.arena_rank_spread || '—';
      var name = m.display_name || m.model_id;
      var provider = m.provider || '?';
      var score = fmtScore(m.arena_score);
      var ci = m.arena_score_ci ? '±' + m.arena_score_ci : '';
      var votes = fmtVotes(m.arena_votes);
      var priceIn = fmtPrice(m.price_in_per_mtok);
      var priceOut = fmtPrice(m.price_out_per_mtok);
      var ctx = fmtContext(m.context_tokens);
      var prelim = m.arena_preliminary ? ' <span class="badge-prelim">Prélim.</span>' : '';

      var cls = rank <= 10 ? 'row-top' : '';

      html += '<tr class="' + cls + '">';
      html += '<td class="td-rank">' + rank + '</td>';
      html += '<td class="td-model"><strong>' + name + '</strong>' + prelim + '<br><span class="provider-tag">' + provider + '</span></td>';
      html += '<td class="td-score">' + score + ' <span class="ci">' + ci + '</span></td>';
      html += '<td class="td-votes">' + votes + '</td>';
      html += '<td class="td-price">' + priceIn + ' / ' + priceOut + '</td>';
      html += '<td class="td-ctx">' + ctx + '</td>';
      html += '</tr>';
    }

    if (show.length === 0) {
      html = '<tr><td colspan="6" class="empty-row">🔍 Aucun modèle trouvé</td></tr>';
    }

    tbody.innerHTML = html;

    // Update stats
    if (EL('avg-score')) {
      var sum = 0, c = 0;
      for (var j = 0; j < filtered.length; j++) {
        if (filtered[j].arena_score != null) { sum += filtered[j].arena_score; c++; }
      }
      EL('avg-score').textContent = c > 0 ? (sum / c).toFixed(0) : '—';
    }
    if (EL('top-score')) {
      EL('top-score').textContent = rankings.length > 0 ? fmtScore(rankings[0].arena_score) : '—';
    }
    if (EL('model-count')) {
      EL('model-count').textContent = fullCount;
    }
    if (EL('provider-count')) {
      EL('provider-count').textContent = rankings.reduce(function (acc, m) { return acc.indexOf(m.provider) === -1 ? acc.concat([m.provider]) : acc; }, []).length;
    }
  }

  // ─── Load data ───
  function loadData() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'public/data/llm-ranking.json', true);
    xhr.onload = function () {
      if (xhr.status === 200) {
        try {
          var data = JSON.parse(xhr.responseText);
          rankings = data.rankings || [];
          initFilters();
          render();
        } catch (e) {
          EL('rankings-body').innerHTML = '<tr><td colspan="6" class="empty-row">⚠️ Erreur de chargement des données</td></tr>';
        }
      } else {
        EL('rankings-body').innerHTML = '<tr><td colspan="6" class="empty-row">⚠️ Données non disponibles</td></tr>';
      }
    };
    xhr.onerror = function () {
      EL('rankings-body').innerHTML = '<tr><td colspan="6" class="empty-row">⚠️ Erreur réseau</td></tr>';
    };
    xhr.send();
  }

  // ─── Filters ───
  function initFilters() {
    // Provider filter
    var providers = [];
    for (var i = 0; i < rankings.length; i++) {
      var p = rankings[i].provider;
      if (p && providers.indexOf(p) === -1) providers.push(p);
    }
    providers.sort();

    var sel = EL('filter-provider');
    var html = '<option value="all">Tous les providers</option>';
    for (var j = 0; j < providers.length; j++) {
      html += '<option value="' + providers[j] + '">' + providers[j] + '</option>';
    }
    sel.innerHTML = html;
    sel.addEventListener('change', function () {
      state.provider = this.value;
      render();
    });

    // Search
    EL('filter-search').addEventListener('input', function () {
      state.search = this.value;
      render();
    });

    // Sort
    EL('filter-sort').addEventListener('change', function () {
      state.sort = this.value;
      render();
    });

    // Show all
    EL('btn-showall').addEventListener('click', function () {
      state.limit = state.limit === 0 ? 100 : 0;
      this.textContent = state.limit === 0 ? 'Afficher moins' : 'Afficher tout (' + rankings.length + ')';
      render();
    });
  }

  // ─── Init ───
  document.addEventListener('DOMContentLoaded', loadData);
})();
