import ObjetGraphique  from "./objetGraphique.js";

export default class Ennemi extends ObjetGraphique {
    constructor(x, y, color, size, niveau = 1) {
        super(x, y, size, size, color);

        // définir une vitesse en fonction du niveau
        const speedMagnitude = 1 + niveau * 0.5;
        const angle = Math.random() * 2 * Math.PI;

        // vitesse random en fonction du niveau
        // direction de bas en haut forcée
        this.speedY = Math.abs(speedMagnitude * Math.sin(angle)) + 0.5;
    }

    draw(ctx) {
        ctx.save();

        // Triangle pointant vers la direction du mouvement

        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle + Math.PI / 2); // +90 degrés pour que le triangle pointe vers le bas

        ctx.beginPath();
        ctx.moveTo(0, this.height / 2);
        ctx.lineTo(-this.height / 2, -this.height / 2);
        ctx.lineTo(this.height / 2, -this.height / 2);
        ctx.closePath();

        ctx.fillStyle = this.color;
        ctx.fill();

        ctx.restore();
    }

    move(largeurCanvas, hauteurCanvas) {
        // Déplacement de haut en bas
        this.y += this.speedY;
    }

    // TODO : Gérer tirs ennemis et + (pas niveau 1)
}