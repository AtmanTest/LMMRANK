# LLMRANK 🤖

**AI Model Leaderboard** — Classement composite de **79 modèles IA**, agrégé depuis **11 benchmarks** publics avec score pondéré, filtres avancés et historique.

**[→ Voir le classement](https://atmantest.github.io/LMMRANK/)**

## À propos

LLMRANK compile les scores de modèles LLM et SLM — OpenAI, Anthropic, Google, Meta, DeepSeek, Mistral, xAI, Alibaba, et 17 autres providers — sur des benchmarks comme HLE, GPQA Diamond, SWE-bench, Chatbot Arena, LiveBench, AIME, MATH-500, LiveCodeBench, BFCL et OSWorld.

Le score composite utilise une normalisation z-score, pondérée par fiabilité de la source, fraîcheur des données et confiance.

## Structure

```
/
  index.html              — Page principale
  styles.css              — Styles (thème sombre, responsive)
  app.js                  — Application frontend
  scripts/
    generate_data.py      — Génération et mise à jour des données
  public/data/
    llm-ranking.json      — Classement complet (79 modèles)
    llm-history.json      — Historique des scores top 15 (30 jours)
  .github/workflows/
    update-llm-ranking.yml — Mise à jour automatique quotidienne
```

## Démarrage local

```bash
# Cloner
git clone https://github.com/AtmanTest/LMMRANK.git
cd LMMRANK

# Générer les données
python3 scripts/generate_data.py

# Servir localement
python3 -m http.server 8000
# → http://localhost:8000
```

## Fonctionnalités

- **79 modèles** · 25 providers · scores composites
- **11 benchmarks** : HLE, GPQA, SWE, Arena, LiveBench, MATH, LCB, BFCL, OSWorld, AIME, MMLU-Pro
- **Filtres** : provider, famille, modalité, licence, prix, rapidité, statut
- **Score composite** : normalisation z-score, pondération, fraîcheur, confiance
- **Intervalle de confiance** reflétant la couverture de benchmarks
- **Marquage stale/partial** pour les modèles sans données récentes
- **Historique** : graphique top 10 sur 30 jours
- **Refresh automatique** : GitHub Actions quotidien
- **Responsive** : desktop, tablette, mobile
- **Accessible** : navigation clavier, WCAG AA, reduced motion

## Méthodologie

1. Chaque benchmark est normalisé en z-score sur son échelle
2. Pondération par fiabilité de la source (papers revus > auto-déclaré)
3. Coefficient de fraîcheur : les données >30 jours sont dépréciées
4. Coefficient de confiance source
5. Les benchmarks absents n'affectent pas le score
6. Intervalle de confiance basé sur le nombre de benchmarks disponibles

## Sources

Voir la [section Sources](https://atmantest.github.io/LMMRANK/#sources) en bas de la page.

## Licence

Propriétaire — Tous droits réservés.
