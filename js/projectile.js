import ObjetGraphique from "./objetGraphique.js";

export default class Projectile extends ObjetGraphique {
    constructor(x, y, width = 6, height = 12, speed = 6, color = "yellow") {
        super(x, y, width, height, color);

        this.speedY = -Math.abs(speed); // vers le haut
        this.active = true;
    }

    update(canvas) {
        this.y += this.speedY;
        if (this.y + this.height / 2 < 0) {
            this.active = false;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.fillStyle = this.color;

        // dessiner centré sur (x,y)
        ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
        ctx.restore();
    }
}