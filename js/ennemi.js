import ObjetGraphique  from "./objetGraphique.js";

export default class Ennemi extends ObjetGraphique {
    constructor(x, y, options = {}) {

        // déterminer taille et couleur de base (en fonction du niveau ou des options)
        const size = options.size ?? 30;
        const color = options.color ?? "red";
        super(x, y, size, size, color);

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
        ctx.save();

        ctx.translate(this.x, this.y);
        if (this.shape === "triangle") { // triangle pointant vers la direction du mouvement
            const angle = Math.atan2(this.vy, this.vx) - Math.PI / 2;
            ctx.rotate(angle);
            ctx.beginPath();
            ctx.moveTo(0, this.height / 2);
            ctx.lineTo(-this.height / 2, -this.height / 2);
            ctx.lineTo(this.height / 2, -this.height / 2);
            ctx.closePath();
            ctx.fillStyle = this.color;
            ctx.fill();
        } else if (this.shape === "square") { // carré centré sur (x, y)
            ctx.fillStyle = this.color;
            ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        } else if (this.shape === "circle") { // cercle centré sur (x, y)
            ctx.beginPath();
            ctx.fillStyle = this.color;
            ctx.arc(0, 0, Math.min(this.width, this.height) / 2, 0, 2 * Math.PI);
            ctx.fill();
        } else { // par défaut, carré
            ctx.fillStyle = this.color;
            ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        }

        ctx.restore();
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
