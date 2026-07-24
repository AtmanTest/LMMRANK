# LLMRANK 🏆

**AI Model Leaderboard** — Classement Elo de **378 modèles IA** depuis **Chatbot Arena (LMSYS)**, données réelles issues de préférences humaines avec votes, prix et métriques.

**[→ Voir le classement](https://atmantest.github.io/LMMRANK/)**

## À propos

LLMRANK affiche les scores Elo Arena de 378 modèles — OpenAI, Anthropic, Google, Meta, DeepSeek, Mistral, xAI, Alibaba, et 26 fournisseurs — classés par préférence humaine. Les données proviennent directement de [Chatbot Arena](https://arena.ai/leaderboard/text/overall).

## Structure

```
/
  index.html                   — Page principale
  styles.css                   — Styles (thème sombre, responsive)
  app.js                       — Application frontend
  scripts/
    arena_importer.py          — Import et parsing des données Arena
  public/data/
    llm-ranking.json           — Classement complet (378 modèles)
    llm-history.json           — Historique des scores (5 snapshots)
```

## Démarrage local

```bash
# Cloner
git clone https://github.com/AtmanTest/LMMRANK.git
cd LMMRANK

# Générer les données
python3 scripts/arena_importer.py

# Servir localement
python3 -m http.server 8000
# → http://localhost:8000
```

## Fonctionnalités

- **378 modèles** · 26 providers · scores Elo réels
- **Source** : Chatbot Arena (LMSYS) — données de préférence humaine
- **Filtres** : provider, recherche texte, tri (rang, score, votes, prix, contexte)
- **Score Elo** avec intervalle de confiance à 95%
- **Marquage préliminaire** pour les modèles avec &lt;10K votes
- **Prix** : entrée/sortie par million de tokens
- **Contexte** : taille maximale en tokens
- **Responsive** : desktop, tablette, mobile
- **Accessible** : navigation clavier, contrastes WCAG, reduced motion

## Source des données

Les données sont extraites de [Chatbot Arena](https://arena.ai/leaderboard/text/overall) — le plus grand benchmark de modèles IA basé sur les préférences humaines, géré par LMSYS. Mise à jour au 21 juillet 2026.

## Licence

Propriétaire — Tous droits réservés.
