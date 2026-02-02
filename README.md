# JeuCanvasL3MIAGE

## L3 MIAGE 2026

- Mathieu ROSSEL TD1 TP1

---

## TODO

> Documenter jeu
> Présenter/documenter ressources externes utilisées
> Indiquer outils IA utilisés


---

## Shooter 2D Vertical

Jeu **Shooter 2D vertical** développé en **JavaScript** avec **HTML5 Canvas**.
Le joueur contrôle un vaisseau en bas de l’écran et doit détruire des ennemis descendant depuis le haut.

### Gameplay

* Déplacement horizontal du vaisseau (gauche/droite)
* Tir de projectiles pour éliminer les ennemis (haut ou espace)
* Collision avec un ennemi ou ennemi atteignant le bas de l’écran : perte d’une vie
* Fin de partie lorsque toutes les vies sont perdues

### Score et Hi-Scores

* Des points sont gagnés en détruisant les ennemis
* Les meilleurs scores sont sauvegardés localement et consultables via un écran dédié

### Niveaux

Le jeu comporte **3 niveaux** à difficulté croissante :

1. Ennemis lents et peu nombreux
2. Ennemis plus rapides et plus fréquents
3. Ennemis très rapides et vagues continues

### États du jeu

* Menu principal
* Jeu
* Game Over
* Hi-Scores

Chaque état est géré par une machine à états et rendu à **60 FPS** avec `requestAnimationFrame`.

### Technologies

* JavaScript
* HTML5 Canvas
* `requestAnimationFrame`
* `localStorage`
