import ObjetGraphique from "./objetGraphique.js";

export default class Player extends ObjetGraphique {
    constructor(x, y, illustration, size = 32) {
        if (!illustration) {
            throw new Error("Player requires an illustration (image).");
        }

        super(x, y, size, size, "black", illustration);

        this.speed = 5; // Vitesse de déplacement du joueur
    }

    draw(ctx) {
        // Dessin de base (image via ObjetGraphique)
        super.draw(ctx);

        // Rajouter légère ombre ou effet de halo
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.width / 2 + 4, 0, 2 * Math.PI);
        ctx.fillStyle = "rgba(230, 230, 230, 0.2)";
        ctx.fill();
        ctx.restore();
    }

    updateFromInput(inputStates, canvas) {
        const radius = this.width / 2;

        // Gérer les déplacements horizontaux et empêcher de sortir du canvas
        if (inputStates.left) {
            this.x = Math.max(radius, this.x - this.speed);
        }
        if (inputStates.right) {
            this.x = Math.min(canvas.width - radius, this.x + this.speed);
        }

        // possibilité d'ajouter vertical, boost, limites supplémentaires ici
    }
}