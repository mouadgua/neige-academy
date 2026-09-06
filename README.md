# Neige Academy — site vitrine

Site vitrine du Discord **Neige Academy**, académie Rocket League francophone :
coaching individuel sur ticket, analyse de replay, salons de coaching en vocal,
training packs classés et recherche de coéquipiers.

## Stack

Aucune dépendance, aucun build. HTML + CSS + JavaScript natif.

```
index.html      structure + sprite SVG (logo flocon et icônes, aucun emoji)
css/style.css   palette glaciale, grille éditoriale, responsive
js/main.js      découpage typographique, scroll horizontal épinglé, neige canvas,
                curseur aimanté, compteurs, accordéon
```

## Développement

```bash
python3 -m http.server 4321
```

Puis ouvrir http://localhost:4321

## À personnaliser

- **Lien d'invitation Discord** : remplacer `https://discord.gg/neigeacademy`
  (présent dans la nav, le menu mobile, la section Parcours, le CTA final et le footer).
- **Lien TikTok** dans le footer (`href="#"`).
- Chiffres du hero (`data-to` sur les `.count`), noms des coachs et témoignages.

Non affilié à Psyonix / Epic Games.
