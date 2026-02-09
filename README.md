# JeuCanvasL3MIAGE

## L3 MIAGE 2026

- Mathieu ROSSEL TD1 TP1
- Maxime JOURDANNEY TD1 TP2

---

## TODO

> Documenter jeu
> Présenter/documenter ressources externes utilisées
> Indiquer outils IA utilisés

---

## Shooter 2D Vertical

Jeu **Space MIAGE** développé en **JavaScript** avec **HTML5 Canvas**.
Le joueur contrôle un vaisseau et doit détruire des ennemis qui apparaissent en continu.

### Gameplay

* Déplacement du vaisseau en 2D (gauche/droite/haut/bas) grâce aux touches directionnelles
* Tir de projectiles vers le haut (espace) pour détruire les ennemis
* Collision avec un ennemi ou un projectile ennemi -> perte d’une vie
* Ennemi qui sort par le bas (non détruit)
* Fin de partie lorsque toutes les vies sont perdues ou niveau suivant lorsque les vagues d’ennemis sont terminées

### Score

* Des points sont gagnés en détruisant les ennemis
* Une pénalité est appliquée si un ennemi s’échappe par le bas
* Les meilleurs scores sont sauvegardés localement et consultables via un écran dédié (localStorage)

### Niveaux

Le jeu comporte **3 niveaux** à difficulté croissante :

1. Ennemis lents, apparition uniquement par le haut
2. Ennemis plus rapides, formations semi‑aléatoires (single, carré, ligne)
3. Mix d’ennemis (≈70% type niveau 2 + ≈30% type niveau 3) avec zigzag, tirs ennemis et comportement à "tête-chercheuse" léger

### États du jeu

* Menu principal avec règles et Hi-Scores
* Jeu
* Game Over
* Win

Chaque état est géré par une machine à états et rendu à **60 FPS** avec `requestAnimationFrame`.

### Technologies

* JavaScript
* HTML5 Canvas
* `requestAnimationFrame`
* `localStorage`
