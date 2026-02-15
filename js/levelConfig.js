
// configuration des niveaux du jeu
// ennemis, spawn, scoring, etc.
const LEVEL_CONFIGS = {
    // niveau 1
    1: {
        enemy: {
            useImage: true,
            imageName: "ennemi_1",
            size: 30,
            pattern: "straight" // pattern de déplacement simple (ligne droite)
        },
        spawn: { // spawn simple
            intervalMs: [350, 800],     // temps entre les spawns (min, max)
            initialDelayMs: 0,          // délai avant le premier spawn
            maxAlive: 8,                // nombre max d'ennemis à l'écran en même temps
            totalToSpawn: 45,
            edges: ["top"],             // apparition que par le haut
            speed: [1.3, 2.3],
            driftX: [-0.5, 0.5]         // légère dérive sur les côtés
        },
        scoring: {
            hitPoints: 10,              // points gagnés par ennemi touché
            missPenalty: 5              // points perdus par ennemi échappé
        },
        escapeSides: ["bottom"]         // perte de points si l'ennemi sort par le bas
    },
    // niveau 2
    2: {
        enemy: {
            useImage: true,
            imageName: "ennemi_2",
            size: 28,
            pattern: "straight"
        },
        spawn: { // spawn par vagues et formations
            intervalMs: [420, 900],
            initialDelayMs: 0,
            maxAlive: 8,
            totalToSpawn: 40,
            edges: ["top"],
            speed: [1.2, 2.0],
            driftX: [-0.4, 0.4],
            formations: [
                { type: "single", weight: 50 }, // 50% chance de spawn simple
                { type: "square", weight: 25 }, // 25% chance de spawn en formation carrée
                { type: "line", weight: 25 }    // 25% chance de spawn en formation linéaire
            ]
        },
        scoring: {
            hitPoints: 15,
            missPenalty: 7
        },
        escapeSides: ["bottom"]
    },
    // niveau 3
    3: {
        // plusieurs types d'ennemis avec patterns de déplacement différents
        enemyMix: [
            // 70% de chance : ennemi qui zigzag
            {
                weight: 70,
                enemy: {
                    useImage: true,
                    imageName: "ennemi_3",
                    size: 28,
                    pattern: "zigzag",
                    zigzag: {
                        amplitude: 28,
                        frequency: 0.08,
                        axis: "x" // horizontalement
                    }
                }
            },
            // 30% de chance : ennemi simple + tire des projectiles
            {
                weight: 30,
                enemy: {
                    useImage: true,
                    imageName: "ennemi_4",
                    size: 26,
                    pattern: "straight",
                    canShoot: true,
                    shotCooldownMs: 1500, // tire toutes les 1.5 sec
                    projectileSpeed: 3.8,
                    projectileColor: "#FF0000", // rouge
                    homingStrength: 0.035
                }
            }
        ],
        spawn: {
            intervalMs: [320, 720],
            initialDelayMs: 0,
            maxAlive: 9,
            totalToSpawn: 55,
            edges: ["top"],
            speed: [1.5, 2.6],
            driftX: [-0.3, 0.3]
        },
        scoring: {
            hitPoints: 20,
            missPenalty: 10
        },
        escapeSides: ["bottom"]
    }
};

// obtenir liste des niveaux dispo (order croissant)
const LEVEL_ORDER = Object.keys(LEVEL_CONFIGS)
    .map(Number)
    .sort((a, b) => a - b);

// fonction pour récupérer la config d'un niveau
export function getLevelConfig(level) {
    return LEVEL_CONFIGS[level] || LEVEL_CONFIGS[LEVEL_ORDER[0]];
}

// fonction pour obtenir le prochain niveau
export function getMaxLevel() {
    return LEVEL_ORDER[LEVEL_ORDER.length - 1] || 1;
}


export { LEVEL_CONFIGS };
