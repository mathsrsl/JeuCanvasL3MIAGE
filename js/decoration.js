
// paramètres des étoiles filantes en fonction du niveau
export let stars = [];
export const STAR_CONFIG = {
  counts: { 1: 60, 2: 100, 3: 160 },
  baseSpeeds: { 1: 0.4, 2: 1.2, 3: 2.4 },
  trailBases: { 1: 3, 2: 12, 3: 28 }, // utilisé pour l'allongement visuel
  playerInfluence: { 1: 0.01, 2: 0.03, 3: 0.06 } // influence joueur -> plus niveau élevé, plus le joueur influence la vitesse des étoiles
};

// initialiser les étoiles (positions, tailles et vitesses aléatoires)
export function initStars(niveau, canvas) {
  // charger les paramètres du niveau (sinon valeurs par défaut)
  const count = STAR_CONFIG.counts[niveau] || STAR_CONFIG.counts[1];

  // gérer défilement aléatoire (et en fonction du niveau)
  stars = [];
  for (let i = 0; i < count; i++) {
    // vitesse et longueur de traînée (+ variation)
    const baseSpeed = STAR_CONFIG.baseSpeeds[niveau] * (0.6 + Math.random() * 0.9);
    const trailBase = STAR_CONFIG.trailBases[niveau] * (0.6 + Math.random() * 0.9);

    // position et taille aléatoires
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 1.6 + 0.6,
      baseSpeed,
      trailBase,
      vy: baseSpeed
    });
  }
}

// mettre à jour la position des étoiles
export function updateStars(player, niveau, canvas) {
  const maxY = canvas.height; // pr reset les étoiles quand elles sortent du bas
  const pInfluence = STAR_CONFIG.playerInfluence[niveau] || STAR_CONFIG.playerInfluence[1]; // influence de la vitesse du joueur sur les étoiles

  stars.forEach(star => {
    // calcul vitesse verticale : vitesse de base + influence du joueur (si défini)
    const extraFromPlayer = (player && player.speed) ? player.speed * pInfluence : 0;
    star.vy = star.baseSpeed + extraFromPlayer;
    star.y += star.vy;

    // si étoile sort du bas -> réinitialiser en haut avec de nouvelles caractéristiques aléatoires
    if (star.y > maxY + 10) {
      star.y = -10 - Math.random() * 20;
      star.x = Math.random() * canvas.width;
      star.size = Math.random() * 1.6 + 0.6;
      star.baseSpeed = STAR_CONFIG.baseSpeeds[niveau] * (0.6 + Math.random() * 0.9);
      star.trailBase = STAR_CONFIG.trailBases[niveau] * (0.6 + Math.random() * 0.9);
      star.vy = star.baseSpeed;
    }
  });
}

// dessiner les étoiles filantes avec effet de traînée
export function drawDecoration(ctx, player, niveau, canvas) {
  // fond noir
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();

  stars.forEach(star => {
    // paramètres de traînée en fonction de la vitesse
    const speedFactor = Math.min(2.5, star.vy / 0.6); // 2.5 = max
    const minElong = 3; // min
    const length = Math.max(
      minElong,
      star.trailBase * (0.8 + 0.6 * speedFactor) + star.vy * 0.6 // influence de la vitesse ici
    );
    const width = Math.max(1, star.size); // largeur en fonction de la taille de l'étoile
    const topY = star.y - length; // position du haut de la traînée
    const grad = ctx.createLinearGradient(star.x, star.y, star.x, topY); // gradient pour effet estompé

    // de blanc à transparent
    grad.addColorStop(0, "rgba(255,255,255,1)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(star.x - width / 2, topY, width, length);

    // dessiner une tête brillante pr l'étoile
    ctx.fillStyle = "rgba(255,255,255,1)";
    ctx.beginPath();
    ctx.arc(star.x, star.y - Math.max(0, Math.min(1.2, width / 2)), Math.max(0.6, width / 1.5), 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.restore();
}