/**
 * LLMRANK — Pipeline
 * Met à jour les timestamps des données.
 */

const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, 'public', 'data');
const rankingPath = path.join(dataDir, 'llm-ranking.json');
const historyPath = path.join(dataDir, 'llm-history.json');

// Vérifier que les fichiers existent
for (const p of [rankingPath, historyPath]) {
  if (!fs.existsSync(p)) {
    console.error(`❌ Fichier introuvable : ${p}`);
    process.exit(1);
  }
}

// Mise à jour du ranking
const ranking = JSON.parse(fs.readFileSync(rankingPath, 'utf8'));
const now = new Date();
ranking.generated_at = now.toISOString();
ranking.metadata = ranking.metadata || {};
ranking.metadata.date = now.toISOString().slice(0, 10);
ranking.metadata.model_count = ranking.rankings ? ranking.rankings.length : (ranking.metadata.model_count || 0);
fs.writeFileSync(rankingPath, JSON.stringify(ranking, null, 2) + '\n');
console.log(`✅ ranking.json mis à jour — ${now.toISOString().slice(0, 10)}`);

// Mise à jour de l'historique
const history = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
if (ranking.rankings) {
  // Ajouter un snapshot du top 5 à la date du jour
  const today = ranking.metadata.date;
  const existing = history.filter(h => h.date === today);
  const toAdd = [];
  for (const r of ranking.rankings.slice(0, 8)) {
    if (!existing.find(e => e.model_id === r.model_id)) {
      toAdd.push({
        model_id: r.model_id,
        display_name: r.display_name,
        provider: r.provider,
        global_score: r.global_score,
        date: today
      });
    }
  }
  if (toAdd.length > 0) {
    history.push(...toAdd);
    console.log(`➕ ${toAdd.length} nouveaux snapshots historique`);
  }
}

fs.writeFileSync(historyPath, JSON.stringify(history, null, 2) + '\n');
console.log(`✅ history.json mis à jour — ${history.length} entrées totales`);
console.log('✅ Pipeline terminé');
