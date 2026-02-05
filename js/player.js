import ObjetGraphique from "./objetGraphique.js";
import Projectile from "./projectile.js";

export default class Player extends ObjetGraphique {
    constructor(x, y, illustration, size = 32) {
        if (!illustration) {
            throw new Error("Player requires an illustration (image).");
        }

        super(x, y, size, size, "black", illustration);

        this.speed = 5; // Vitesse de déplacement du joueur

        this.shotCooldown = 300;    // ms, temps minimum entre deux tirs
        this.lastShotAt = 0;        // timestamp du dernier tir
        this.projectileSpeed = 8;   // vitesse projectiles tirés
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

    // Retourne un Projectile si tir, sinon null
    updateFromInput(inputStates, canvas) {
        const radius = this.width / 2;

        // Gérer les déplacements horizontaux et empêcher de sortir du canvas
        if (inputStates.left) {
            this.x = Math.max(radius, this.x - this.speed);
        }
        if (inputStates.right) {
            this.x = Math.min(canvas.width - radius, this.x + this.speed);
        }

        // Gérer les tirs
        const now = performance.now();

        const wantsToShoot = inputStates.space || inputStates.up;
        if (wantsToShoot && now - this.lastShotAt >= this.shotCooldown) {
            console.log("Tir du joueur !");

            this.lastShotAt = now;
            // positionner le projectile juste au-dessus du joueur
            const projX = this.x;
            const projY = this.y - this.height / 2 - 6;
            return new Projectile(projX, projY, 6, 12, this.projectileSpeed, "white");
        }

        return null;
    }
}