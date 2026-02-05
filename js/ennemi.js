import ObjetGraphique  from "./objetGraphique.js";

export default class Ennemi extends ObjetGraphique {
    constructor(x, y, options = {}) {
        // Déterminer la taille et la couleur de base (en fonction du niveau ou des options)
        const size = options.size ?? 30;
        const color = options.color ?? "red";
        super(x, y, size, size, color);

        // forme et pattern de mouvement (en fonction du niveau ou des options)
        this.shape = options.shape ?? "triangle";
        this.pattern = options.pattern ?? "straight";

        // Vitesse de base (en fonction du niveau ou des options)
        this.vx = options.vx ?? 0;
        this.vy = options.vy ?? 1.5;

        // Paramètres spécifiques pour le pattern zigzag
        this.zigzag = {
            amplitude: options.zigzag?.amplitude ?? 25,
            frequency: options.zigzag?.frequency ?? 0.08,
            axis: options.zigzag?.axis ?? "x",
            phase: options.zigzag?.phase ?? Math.random() * Math.PI * 2
        };

        // paramètres pour le mouvement zigzag
        this.baseX = this.x;
        this.baseY = this.y;
        this.ticks = 0;
    }

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

    move() {
        if (this.pattern === "zigzag") {
            // paramètres de base pour le mouvement zigzag
            this.ticks += 1;
            this.baseX += this.vx;
            this.baseY += this.vy;
            if (this.zigzag.axis === "y") {
                this.x = this.baseX;
                this.y = this.baseY + Math.sin(this.ticks * this.zigzag.frequency + this.zigzag.phase) * this.zigzag.amplitude;
            } else {
                this.x = this.baseX + Math.sin(this.ticks * this.zigzag.frequency + this.zigzag.phase) * this.zigzag.amplitude;
                this.y = this.baseY;
            }
        } else { // mouvement droit (straight) (par défaut)
            this.x += this.vx;
            this.y += this.vy;
        }
    }

    // TODO : Gérer tirs ennemis et + (pas niveau 1)
}
