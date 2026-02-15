import ObjetGraphique  from "./objetGraphique.js";
import { loadedAssets } from "./script.js";

export default class Ennemi extends ObjetGraphique {
    constructor(x, y, options = {}) {

        // déterminer taille et couleur de base (en fonction du niveau ou des options)
        const size = options.size ?? 30;
        
        // récupérer l'image si spécifiée
        const illustration = (options.useImage && options.imageName && loadedAssets) 
            ? loadedAssets[options.imageName] 
            : null;
        
        super(x, y, size, size, illustration);

        // forme et pattern de mouvement (en fonction du niveau ou des options)
        this.shape = options.shape ?? "triangle";
        this.pattern = options.pattern ?? "straight";

        // Vitesse de base (en fonction du niveau ou des options)
        this.vx = options.vx ?? 0;
        this.vy = options.vy ?? 1.5;

        // paramètres de tir (en fonction du niveau ou des options)
        this.canShoot = options.canShoot ?? false;
        this.shotCooldownMs = options.shotCooldownMs ?? 1400;
        this.lastShotAt = options.lastShotAt ?? 0;
        this.projectileSpeed = options.projectileSpeed ?? 4.5;
        this.projectileColor = options.projectileColor ?? "#FF0000"; // rouge par défaut
        this.homingStrength = options.homingStrength ?? 0; // 0 = pas de homing, plus c'est élevé, plus les projectiles corrigent leur trajectoire vers le joueur
        this.speedLimit = options.speedLimit ?? Math.max(0.1, Math.hypot(this.vx, this.vy));

        // paramètres spécifiques pour le pattern zigzag
        this.zigzag = {
            amplitude: options.zigzag?.amplitude ?? 25,
            frequency: options.zigzag?.frequency ?? 0.08,
            axis: options.zigzag?.axis ?? "x", // horizontal par défaut
            phase: options.zigzag?.phase ?? Math.random() * Math.PI * 2
        };
        this.baseX = this.x;
        this.baseY = this.y;
        this.ticks = 0; // compteur interne (pr variation du zigzag)
    }

    // dessiner l'ennemi selon le type
    draw(ctx) {
        // Si une image est disponible, utiliser la méthode de la classe parente
        if (this.illustration) {
            super.draw(ctx);
        }
    }

    // mettre à jour la position de l'ennemi selon son pattern de mouvement
    move(target = null) {
        // si homing, ajuster la direction vers le joueur
        if (this.homingStrength > 0 && target) {
            // calculer le vecteur direction vers le joueur
            const dx = target.x - this.x;
            const dy = target.y - this.y;
            const dist = Math.hypot(dx, dy) || 1;
            this.vx += (dx / dist) * this.homingStrength;
            this.vy += (dy / dist) * this.homingStrength;

            // limiter la vitesse (éviter niveaux trop difficiles)
            const speed = Math.hypot(this.vx, this.vy);
            if (speed > this.speedLimit) {
                const scale = this.speedLimit / speed;
                this.vx *= scale;
                this.vy *= scale;
            }
        }

        // appliquer le pattern de mouvement si présent
        if (this.pattern === "zigzag") {
            this.ticks += 1;
            this.baseX += this.vx;
            this.baseY += this.vy;

            // effet de zigzag vertical ou horizontal
            if (this.zigzag.axis === "y") { // zigzag vertical
                this.x = this.baseX;
                this.y = this.baseY + Math.sin(this.ticks * this.zigzag.frequency + this.zigzag.phase) * this.zigzag.amplitude;
            } else { // zigzag horizontal (par défaut)
                this.x = this.baseX + Math.sin(this.ticks * this.zigzag.frequency + this.zigzag.phase) * this.zigzag.amplitude;
                this.y = this.baseY;
            }
        } else { // mouvement droit (straight) (par défaut si pas de pattern)
            this.x += this.vx;
            this.y += this.vy;
        }
    }
}
