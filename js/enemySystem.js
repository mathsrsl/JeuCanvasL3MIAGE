/*
    Sert à gérer les spawns d'ennemis : timing, positions, formations, patterns de mouvement, etc.
    Se base sur les paramètres définis dans le levelConfig pour chaque niveau.
    Décomposé en fonctions pour rendre le jeu plus modulable avec levelConfig
 */

import Ennemi from "./ennemi.js";
import Projectile from "./projectile.js";
import { loadedAssets } from "./script.js";


/* ##### Helpers génériques ##### */

// générer un nombre aléatoire entre min et max
function randBetween(min, max) {
    return min + Math.random() * (max - min);
}

// choisir un élément aléatoire dans une liste
function randChoice(list) {
    return list[Math.floor(Math.random() * list.length)];
}

// limiter une valeur entre un minimum et un maximum
// si value < min, retourne min ; si value > max, retourne max ; sinon retourne value
function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}


/* ##### Helpers de pondération / sélection ##### */

// choisir un élément en fonction de son poids (propriété "weight" ds l'objet)
// utile pr choisir le type d'ennemi ou la formation à spawn selon les probabilités dans le levelConfig
function pickWeighted(list) {
    // calcul poids total
    const total = list.reduce((sum, item) => sum + (item.weight ?? 1), 0);

    // nombre aléatoire entre 0 et total
    let r = Math.random() * total;

    // parcourir la liste et soustraire le poids de chaque item de r
    // premier item où r <= 0 -> item choisi
    for (const item of list) {
        r -= (item.weight ?? 1);
        if (r <= 0) return item;
    }

    // sinon retourne dernier item
    return list[list.length - 1];
}

// choisir la configuration d'ennemi à spawn pour ce niveau (unique ou mix)
function pickEnemyConfig(levelConfig) {
    // si plusieurs types d'ennemis possibles, choisir en fonction des poids
    if (levelConfig.enemyMix && levelConfig.enemyMix.length > 0) {
        return pickWeighted(levelConfig.enemyMix).enemy;
    }

    // sinon ennemi unique du niveau
    return levelConfig.enemy;
}

// choisir le type de formation à spawn
function pickFormationType(levelConfig) {
    // si pas de formations définies -> spawn simple
    if (!levelConfig.spawn.formations || levelConfig.spawn.formations.length === 0) {
        return "single";
    }

    // sinon choisir en fonction des poids
    return pickWeighted(levelConfig.spawn.formations).type ?? "single";
}


/* ##### Spawning : timing et planification ##### */

// "planifier" le prochain spawn en fonction de l'intervalle défini dans le levelConfig
function scheduleNextSpawn(spawnState, levelConfig) {
    const [minInterval, maxInterval] = levelConfig.spawn.intervalMs;

    // + délai aléatoire entre les spawns pour éviter patterns trop réguliers
    spawnState.nextSpawnAt = performance.now() + randBetween(minInterval, maxInterval);
}


/* ##### Spawning : positions et formations ##### */

// calculer position de spawn selon le bord choisi (top, bottom, left, right)
function getSpawnPosition(edge, size, canvas) {
    // marge pour éviter les spanws trop collés aux bords
    const margin = size / 2; // en fct de taille ennemie

    // position aléatoire le long du bord choisi, avec marge
    if (edge === "top") {
        return { x: randBetween(margin, canvas.width - margin), y: -margin };
    }
    if (edge === "bottom") {
        return { x: randBetween(margin, canvas.width - margin), y: canvas.height + margin };
    }
    if (edge === "left") {
        return { x: -margin, y: randBetween(margin, canvas.height - margin) };
    }
    if (edge === "right") {
        return { x: canvas.width + margin, y: randBetween(margin, canvas.height - margin) };
    }

    // par défaut, spawn en haut
    return { x: randBetween(margin, canvas.width - margin), y: -margin };
}

// calculer positions de spawn pour une formation donnée (single, square ou line)
// en fonction de la position de base et de la taille des ennemis
function getFormation(type, size) {
    // espacement entre ennemis
    const gap = size * 1.2;

    // formation en carré
    if (type === "square") {
        return [
            { x: -gap / 2, y: 0 },      // haut gauche
            { x: gap / 2, y: 0 },       // haut droit
            { x: -gap / 2, y: gap },    // bas gauche
            { x: gap / 2, y: gap }      // bas droit
        ];
    }

    // formation en ligne (horizontale)
    if (type === "line") {
        const count = 5; // 5 par défaut (peut être défini dans le levelConfig)
        const start = -((count - 1) / 2) * gap; // centrer la ligne sur la position de base

        return Array.from({ length: count }, (_, i) => ({ x: start + i * gap, y: 0 }));
    }

    // par défaut, spawn simple (single)
    return [{ x: 0, y: 0 }];
}

// calculer les positions de spawn pour une formation, en fonction de :
// type de formation ; position de base ; taille des ennemis ; taille du canvas
function buildFormationPositions(levelConfig, enemyConfig, base, edge, canvas) {
    // si pas de spawn par le haut, pas de formations spéciales
    if (edge !== "top") {
        return [base];
    }

    // définir la formation à spawn selon le levelConfig
    const type = pickFormationType(levelConfig);
    const formation = getFormation(type, enemyConfig.size);
    const margin = enemyConfig.size / 2;

    // calculer positions finales pr chaque ennemi de la formation
    return formation.map(offset => ({
        x: clamp(base.x + offset.x, margin, canvas.width - margin),
        y: base.y + offset.y
    }));
}


/* ##### Spawning : mouvement et vélocité ##### */

// calculer la vélocité de l'ennemi en fonction des paramètres de vitesse/dérive du levelConfig
// utile pour tête chercheuses et ennemis avec dérive sur les côtés
function getVelocity(edge, levelConfig) {
    // vitesse de base aléatoire dans l'intervalle donné dans levelConfig
    const speed = randBetween(levelConfig.spawn.speed[0], levelConfig.spawn.speed[1]);

    // recup intervalle de dérive sur X et Y depuis levelConfig
    const driftX = levelConfig.spawn.driftX ?? [0, 0];
    const driftY = levelConfig.spawn.driftY ?? [0, 0];

    // calculer dérive en fct du bord de spawn
    let vx = 0; // vitesse horizontale (dérive)
    let vy = 0; // vitesse verticale (vitesse de base)
    if (edge === "top") {
        vx = randBetween(driftX[0], driftX[1]);
        vy = speed;
    } else if (edge === "bottom") {
        vx = randBetween(driftX[0], driftX[1]);
        vy = -speed;
    } else if (edge === "left") {
        vx = speed;
        vy = randBetween(driftY[0], driftY[1]);
    } else if (edge === "right") {
        vx = -speed;
        vy = randBetween(driftY[0], driftY[1]);
    }
    // par défaut, spawn par le haut
    return { vx, vy, speed };
}


/* ##### Spawning : création d'ennemis ##### */

// fonction principale pr spawn
// créer un ou plusieurs ennemis selon la configuration du niveau
function spawnEnemyFromConfig(ennemis, levelConfig, canvas, maxToSpawn = Infinity) {
    const enemyConfig = pickEnemyConfig(levelConfig); // unique ou mix (selon le levelConfig)
    const edge = randChoice(levelConfig.spawn.edges); // bord de spawn
    const base = getSpawnPosition(edge, enemyConfig.size, canvas); // position de spawn de base
    const positions = buildFormationPositions(levelConfig, enemyConfig, base, edge, canvas); // positions de spawn pour formation


    let spawned = 0; // compteur pr respecter maxToSpawn

    // créer les ennemis à partir des positions + config en cours
    for (const pos of positions) {
        if (spawned >= maxToSpawn) break;

        // calculer vélocité si dérive
        const { vx, vy, speed } = getVelocity(edge, levelConfig);

        // config de l'ennemi à spawn
        const options = {
            ...enemyConfig,
            vx,
            vy,
            speedLimit: enemyConfig.speedLimit ?? speed
        };
        if (options.canShoot) { // rajout du tir si dispo avec cooldown
            options.lastShotAt = performance.now();
        }

        // créer et ajouter l'ennemi à la liste
        ennemis.push(new Ennemi(pos.x, pos.y, options));
        spawned += 1;
    }

    return spawned;
}


/* ##### API publique : reset et game loop (déporté de script.js pour lisibilité) ##### */

// reset l'état des ennemis (+ ses projectiles) à chaque nouveau niveau/redémarrage
export function resetEnemyState(ennemis, enemyProjectiles, spawnState, levelConfig) {
    ennemis.length = 0;
    enemyProjectiles.length = 0;
    spawnState.spawned = 0;
    spawnState.nextSpawnAt = performance.now() + (levelConfig.spawn.initialDelayMs ?? 0);
}

// mettre à jour le spawn des ennemis
// cad vérifier si c'est le moment de spawn, et créer les ennemis selon la config du niveau (levelConfig)
export function updateSpawning({ ennemis, spawnState, levelConfig, canvas }) {
    // si pas de config de spawn pour ce niveau, ne rien faire
    if (!levelConfig) return;

    // si quota de spawn atteint, ne rien faire
    const totalToSpawn = levelConfig.spawn.totalToSpawn ?? Infinity;
    if (spawnState.spawned >= totalToSpawn) return;

    // si nombre max d'ennemis vivants atteint, ne rien faire (éviter surplus)
    const availableSlots = levelConfig.spawn.maxAlive - ennemis.length;
    if (availableSlots <= 0) return;

    // sinon, calculer cmb d'ennemis on peut encore spawn (en respectant la config)
    const remaining = totalToSpawn === Infinity ? availableSlots : Math.max(0, totalToSpawn - spawnState.spawned);
    const maxToSpawn = Math.min(availableSlots, remaining);
    if (maxToSpawn <= 0) return; // si 0, ne rien faire

    // sinon, si on peut spawn (quota pas atteint) -> créer ennemis selon config du niveau
    const now = performance.now();
    if (now >= spawnState.nextSpawnAt) {
        const created = spawnEnemyFromConfig(ennemis, levelConfig, canvas, maxToSpawn);
        spawnState.spawned += created; // incrémenter le compteur

        // planifier le prochain spawn
        scheduleNextSpawn(spawnState, levelConfig);
    }
}

// mettre à jour les projectiles ennemis -> retirer si inactifs ou hors écran
export function updateEnemyProjectiles(enemyProjectiles, canvas) {
    for (let epi = enemyProjectiles.length - 1; epi >= 0; epi--) {
        const p = enemyProjectiles[epi];

        p.update(canvas);

        // si hors écran ou collision, retirer
        if (!p.active) {
            enemyProjectiles.splice(epi, 1);
        }
    }
}

// dessiner les projectiles ennemis
export function drawEnemyProjectiles(enemyProjectiles, ctx) {
    enemyProjectiles.forEach(p => p.draw(ctx));
}

// faire tirer un ennemi (si possible et cooldown écoulé
export function enemyShoot(ennemi, enemyProjectiles) {
    // vérifications
    if (!ennemi.canShoot) return;
    const now = performance.now();
    if (now - ennemi.lastShotAt < ennemi.shotCooldownMs) return;

    // tirer
    ennemi.lastShotAt = now;    // update timestamp du dernier tir
    
    // jouer son de tir ennemi
    if (loadedAssets && loadedAssets.tir) loadedAssets.tir.play();
    
    const projX = ennemi.x;
    const projY = ennemi.y + ennemi.height / 2 + 6; // tir depuis centre de l'ennemi
    const projectile = new Projectile( // créer le projectile avec paramètres de l'ennemi
        projX,
        projY,
        6,
        12,
        ennemi.projectileSpeed,
        ennemi.projectileColor,
        1
    );

    enemyProjectiles.push(projectile);
}

// vérifier si un ennemi est complètement hors écran (pour retirer de la liste)
export function isEnemyOffscreen(ennemi, canvas) {
    const margin = Math.max(ennemi.width, ennemi.height);
    return (
        ennemi.x < -margin ||
        ennemi.x > canvas.width + margin ||
        ennemi.y < -margin ||
        ennemi.y > canvas.height + margin
    );
}

// vérifier si un ennemi a "échappé" le joueur (par un côté défini le levelConfig) -> pénalité de score
export function isEnemyEscaped(ennemi, canvas, escapeSides) {
    // si pas de côtés définis, ne rien faire
    if (!escapeSides || escapeSides.length === 0) return false;

    // calculer les conditions sortie (en fct de position et taille)
    const margin = Math.max(ennemi.width, ennemi.height);
    const escaped = {
        left: ennemi.x + margin < 0,
        right: ennemi.x - margin > canvas.width,
        top: ennemi.y + margin < 0,
        bottom: ennemi.y - margin > canvas.height
    };

    // true si échappé par un des bords
    return escapeSides.some(side => escaped[side]);
}
