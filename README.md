# JeuCanvasL3MIAGE

## L3 MIAGE 2026

- Mathieu ROSSEL TD1 TP1
- Maxime JOURDANNEY TD1 TP2

---

## Space MIAGE

Jeu **Space MIAGE** développé en **JavaScript** avec **HTML5 Canvas**.
Le joueur contrôle un vaisseau et doit détruire des ennemis qui apparaissent en continu.

### Lancer le jeu

* Ouvrir `index.html` dans un navigateur (aucun build requis)
* Le jeu est également disponible en ligne : https://tp-canvas.kayuu.fr/

### Contrôles

* Flèches : déplacement du vaisseau
* Espace : tir vers le haut

### Règles du jeu

* Collision avec un ennemi ou un projectile ennemi -> perte d’une vie
* Ennemi qui sort par le bas -> pénalité de score
* Fin de partie quand toutes les vies sont perdues
* Passage au niveau suivant quand la vague est terminée

### Score

* Des points sont gagnés en détruisant les ennemis
* Une pénalité est appliquée si un ennemi s’échappe par le bas
* Les meilleurs scores sont sauvegardés localement et consultables à tout moment (par localStorage)

### Niveaux (logique de progression)

Le jeu comporte **3 niveaux** à difficulté croissante. Les paramètres sont centralisés dans `js/levelConfig.js` :

* `spawn.intervalMs`, `maxAlive`, `totalToSpawn` : rythme et durée des vagues
* `edges`, `speed`, `driftX` : directions et vitesses de déplacement
* `enemyMix` : répartition d’ennemis par type (niveau 3)
* `formations` : patterns semi‑aléatoires (niveau 1)

Résumé des niveaux :

1. Ennemis lents, apparition par le haut
2. Ennemis plus rapides, formations semi‑aléatoires (single, carré, ligne)
3. Mix d’ennemis (≈70% type niveau 2 + ≈30% type niveau 3) avec zigzag, tirs ennemis et homing léger (suit le joueur)

### Architecture technique

Le code est découpé en plusieurs fichiers JS avec un **game loop** central et des systèmes dédiés :

* `js/script.js` : boucle principale, états du jeu (`HOME`, `RUNNING`, `GAMEOVER`), collisions, scoring
* `js/enemySystem.js` : génération des ennemis, formations, tirs ennemis, et règles générales de déplacement
* `js/levelConfig.js` : configuration par niveau (spawn, scoring, patterns). Modification facile pour ajuster la difficulté ou les paramètres de jeu
* `js/player.js` : création et déplacement joueur + tir
* `js/ennemi.js` : création et comportement ennemi (zigzag, homing, tir)
* `js/projectile.js` : gestion projectiles joueur ou ennemi
* `js/ecouteurs.js` : gestion des entrées clavier
* `js/collisionUtils.js` : fonctions de collision (issue de l'exemple de cours)
* `js/decoration.js` : gestion du décor (étoiles) en arrière‑plan qui varie en fonction du niveau
* `js/assetLoader.js` : chargement des assets (images + sons) (issue de l'exemple de cours)

### Bonnes pratiques mises en place

* Configuration des niveaux centralisée pour ajuster la difficulté sans toucher au gameplay *(levelConfig.js)*
* Boucle de jeu stable via `requestAnimationFrame` et non `setInterval`
* Suppression sécurisée des éléments via itérations inverses (pour éviter les problèmes d’index lors de la suppression d’ennemis ou projectiles)
* Séparation claire entre logique (spawn, collisions) et rendu (draw)

### Technologies

* JavaScript
* HTML5 Canvas
* `requestAnimationFrame`

### Ressources externes

**TODO:** @Maxime - à actualiser une fois fini (meme si les fichiers sont en local)

* Sons :
  * plop.mp3 : https://mainline.i3s.unice.fr/mooc/SkywardBound/assets/sounds/plop.mp3
  * humbug.mp3 : https://mainline.i3s.unice.fr/mooc/SkywardBound/assets/sounds/humbug.mp3
* Bibliothèque audio :
  * Howler.js (CDN) : https://cdnjs.cloudflare.com/ajax/libs/howler/2.2.1/howler.min.js
