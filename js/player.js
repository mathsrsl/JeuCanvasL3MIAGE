import ObjetGraphique from "./objetGraphique.js";

export default class Player extends ObjetGraphique {
    constructor(x, y, illustration, size = 32) {
        if (!illustration) {
            throw new Error("Player requires an illustration (image).");
        }

        super(x, y, size, size, "black", illustration);
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
}