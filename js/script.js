import Player from "./player.js";
import Ennemi from "./ennemi.js";
import { defineListeners, inputStates, clearInput } from "./ecouteurs.js";
import { circRectsOverlapFromCenter } from "./collisionUtils.js";
import { initStars, updateStars, drawDecoration } from "./decoration.js";
import { loadAssets } from "./assetLoader.js";
import { getLevelConfig, getMaxLevel } from "./levelConfig.js";


/* ###### Initialisation du jeu ###### */

window.onload = init;


/* ###### Variables globales ###### */

let canvas, ctx;

let player, ennemis = [];

let etat, niveau, score, nbVies;
const GAMEOVER_COOLDOWN_MS = 600; // durée du cooldown en ms
let gameOverCooldownUntil = 0;

let projectiles = [];
let levelConfig = null;
const spawnState = {
    spawned: 0,
    nextSpawnAt: 0
};

const assetsToLoadURLs = {
    spaceShip: {url: './assets/spaceShip.png'},

    logo1: {url: "https://mainline.i3s.unice.fr/mooc/SkywardBound/assets/images/SkywardWithoutBalls.png"},

    plop: {
        url: 'https://mainline.i3s.unice.fr/mooc/SkywardBound/assets/sounds/plop.mp3',
        buffer: false,
        loop: false,
        volume: 1.0
    },
    humbug: {
        url: 'https://mainline.i3s.unice.fr/mooc/SkywardBound/assets/sounds/humbug.mp3',
        buffer: true,
        loop: true,
        volume: 1.0,
        isPlaying: undefined
    },
};
let loadedAssets;

/* Flags pour gestion propre des touches / boucle */
let awaitingKeyRelease = false;
let gameOverKeyListenerAttached = false;
let loopStarted = false;


/* ###### Méthodes principales du jeu ###### */

async function init() {
    /* Récupération du canvas et du contexte graphique 2D */
    canvas = document.querySelector("#monCanvas");
    ctx = canvas.getContext("2d");


    /* Chargement des assets */
    console.log("Chargement des assets...");
    loadedAssets = await loadAssets(assetsToLoadURLs);
    console.log("Assets chargés :", loadedAssets);

    /* Création des objets du jeu */

    // création joueur
    player = new Player(250, 450, loadedAssets.spaceShip);

    // définir listeners de gameplay (idempotent)
    defineListeners();

    /* Démarrage du jeu — boucle d'animation */
    startGame();
}


function startGame(goToHome = true) {
    console.log("Démarrage du jeu");

    // initialisation des variables du jeu
    score = 0;
    nbVies = 3;

    // reset en cas de game over ou redémarrage
    ennemis = [];
    projectiles = [];

    // reset input tenu (important si touche était maintenue)
    clearInput();

    // reset état du joueur
    if (player) {
        player.x = 250;
        player.y = 450;
        if (typeof player.lastShotAt !== "undefined") player.lastShotAt = 0;
    }

    // initialiser le niveau et sa configuration
    initLevel(1);

    // musique de fond si pas déjà lancée
    if (loadedAssets && loadedAssets.humbug && !loadedAssets.humbug.isPlaying) {
        loadedAssets.humbug.play();
        loadedAssets.humbug.isPlaying = true;
    }

    etat = goToHome ? "HOME" : "RUNNING";

    // Lance la boucle d'animation
    if (!loopStarted) {
        loopStarted = true;
        requestAnimationFrame(gameLoop);
    }
}

function gameLoop() {
    // 1 - on efface le canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 2 - on dessine tous les objets du jeu en fonction de l'état du jeu
    if (etat === "HOME") {
        drawMenuAccueil();
    } else if (etat === "RUNNING") {
        drawJeu();
    } else if (etat === "GAMEOVER") {
        drawGameOver();
    }

    // 3 - on met à jour l'état du jeu (position des objets, etc.)
    // en fonction de l'état du clavier, souris, gamepad etc.
    // des collisions, etc.
    // éventuellement on change l'état du jeu (ex: plus de vies => GAMEOVER)
    // Dernière étape - on demande la prochaine image
    updateGameState();

    requestAnimationFrame(gameLoop);
}


/* ###### Dessin des différents écrans du jeu ###### */

function drawMenuAccueil() {
    // on sauvegarde le contexte graphique
    ctx.save();
    
    ctx.fillStyle = "black";
    ctx.font = "30px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Bienvenue dans Shooter 2D vertical!", canvas.width / 2, canvas.height / 2 - 50);
    ctx.font = "20px Arial";
    ctx.fillText("Appuyez sur une touche pour commencer", canvas.width / 2, canvas.height / 2 + 20);

    ctx.drawImage(loadedAssets.logo1, canvas.width / 2 - 150, canvas.height / 2 + 50, 300, 100);

    // démarrage au premier appui (listener retiré ensuite)
    const onHomeKey = () => {
        // vider les entrées au cas où
        clearInput();
        etat = "RUNNING";
        window.removeEventListener('keydown', onHomeKey);
    };
    window.addEventListener('keydown', onHomeKey, { once: true });

    // restaure le contexte graphique -> revient à l'état avant le ctx.save()
    ctx.restore();
}

function drawGameOver() {
    ctx.save();

    ctx.fillStyle = "red";
    ctx.font = "48px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Game Over", canvas.width / 2, canvas.height / 2 - 50);
    ctx.font = "24px Arial";
    ctx.fillText("Appuyez sur une touche pour rejouer", canvas.width / 2, canvas.height / 2 + 20);

    // Attacher le mécanisme keyup -> keydown une seule fois
    if (!gameOverKeyListenerAttached) {
        awaitingKeyRelease = true;
        window.addEventListener('keyup', onGameOverKeyUp, { once: true });
        gameOverKeyListenerAttached = true;
    }

    ctx.restore();
}

function drawJeu() {
    // dessiner décor (étoiles etc.)
    drawDecoration(ctx, player, niveau, canvas);

    // dessiner infos (score, vies, niveau, temps)
    // après pour mettre au-dessus du décor
    drawInfo();

    // draw player
    player.draw(ctx);

    // draw projectiles
    projectiles.forEach(p => p.draw(ctx));

    // draw ennemis
    drawEnemies();
}


/* ###### Dessin des différents éléments du jeu ###### */

function drawInfo() {
    ctx.save();

    // TODO : utiliser plutot avec le CSS pour une meilleure interface (z-index etc.)

    ctx.fillStyle = "white";
    ctx.font = "24px Arial";
    ctx.textAlign = "left";

    ctx.fillText("Niveau : " + niveau, 10, 60);
    ctx.fillText("Score : " + score, 10, 30);
    ctx.fillText("Vies : " + nbVies, 10, 90);

    ctx.textAlign = "right";
    ctx.fillText("Temps : " + Math.floor(performance.now() / 1000) + " s", canvas.width - 10, 30);

    ctx.restore();
}

function drawEnemies() {
    ennemis.forEach(ennemi => {
        ennemi.draw(ctx);
    });
}

function initLevel(level) {
    niveau = level;
    levelConfig = getLevelConfig(level);
    ennemis = [];
    spawnState.spawned = 0;
    spawnState.nextSpawnAt = performance.now() + (levelConfig.spawn.initialDelayMs ?? 0);
    initStars(niveau, canvas);
}

function randBetween(min, max) {
    return min + Math.random() * (max - min);
}

function randChoice(list) {
    return list[Math.floor(Math.random() * list.length)];
}

function scheduleNextSpawn() {
    const [minInterval, maxInterval] = levelConfig.spawn.intervalMs;
    spawnState.nextSpawnAt = performance.now() + randBetween(minInterval, maxInterval);
}

function getSpawnPosition(edge, size) {
    const margin = size / 2;
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
    return { x: randBetween(margin, canvas.width - margin), y: -margin };
}

function spawnEnemyFromConfig(config) {
    const edge = randChoice(config.spawn.edges);
    const size = config.enemy.size;
    const { x, y } = getSpawnPosition(edge, size);

    const speed = randBetween(config.spawn.speed[0], config.spawn.speed[1]);
    const driftX = config.spawn.driftX ?? [0, 0];
    const driftY = config.spawn.driftY ?? [0, 0];

    let vx = 0;
    let vy = 0;
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

    const options = {
        ...config.enemy,
        vx,
        vy
    };
    ennemis.push(new Ennemi(x, y, options));
}

function updateSpawning() {
    if (!levelConfig) return;
    const totalToSpawn = levelConfig.spawn.totalToSpawn ?? Infinity;
    if (spawnState.spawned >= totalToSpawn) return;
    if (ennemis.length >= levelConfig.spawn.maxAlive) return;

    const now = performance.now();
    if (now >= spawnState.nextSpawnAt) {
        spawnEnemyFromConfig(levelConfig);
        spawnState.spawned += 1;
        scheduleNextSpawn();
    }
}

function isEnemyOffscreen(ennemi) {
    const margin = Math.max(ennemi.width, ennemi.height);
    return (
        ennemi.x < -margin ||
        ennemi.x > canvas.width + margin ||
        ennemi.y < -margin ||
        ennemi.y > canvas.height + margin
    );
}

function isEnemyEscaped(ennemi, escapeSides) {
    if (!escapeSides || escapeSides.length === 0) return false;
    const margin = Math.max(ennemi.width, ennemi.height);
    const escaped = {
        left: ennemi.x + margin < 0,
        right: ennemi.x - margin > canvas.width,
        top: ennemi.y + margin < 0,
        bottom: ennemi.y - margin > canvas.height
    };
    return escapeSides.some(side => escaped[side]);
}

function handleLevelProgress() {
    if (etat !== "RUNNING") return;
    if (!levelConfig) return;
    const totalToSpawn = levelConfig.spawn.totalToSpawn ?? Infinity;
    if (spawnState.spawned < totalToSpawn) return;
    if (ennemis.length > 0) return;

    const maxLevel = getMaxLevel();
    if (niveau < maxLevel) {
        console.log("Niveau suivant : " + (niveau + 1));
        initLevel(niveau + 1);
    } else {
        startGameOverSequence();
        console.log("Vous avez gagné !");
    }
}


/* ###### Mise à jour de l'état du jeu ###### */

//TODO: méthode à optimisé/découper
function updateGameState() {
    if (etat === "RUNNING") {
        // mettre à jour les étoiles
        updateStars(player, niveau, canvas);

        // mettre à jour état du joueur et ennemis (position, tirs, etc.)
        const newProj = player.updateFromInput(inputStates, canvas);
        if (newProj) {
            projectiles.push(newProj);
        }

        // mettre à jour les projectiles
        // on met à jour et on purge en une passe (itération arrière pour pouvoir splice)
        for (let pi = projectiles.length - 1; pi >= 0; pi--) {
            const p = projectiles[pi];
            p.update(canvas);
            if (!p.active) {
                projectiles.splice(pi, 1);
            }
        }

        // générer des ennemis de manière continue selon le niveau
        updateSpawning();

        // définir points selon le niveau
        const hitPoints = levelConfig?.scoring?.hitPoints ?? 10;
        const missPenalty = levelConfig?.scoring?.missPenalty ?? 5;


        // collision projectile-ennemi
        // itération arrière sur ennemis pour pouvoir supprimer sans problème d'index
        for (let ei = ennemis.length - 1; ei >= 0; ei--) {
            const ennemi = ennemis[ei];

            // déplacer l'ennemi (conserve le comportement existant)
            ennemi.move();

            // si l'ennemi sort de l'écran -> pénalité éventuelle et suppression
            if (isEnemyOffscreen(ennemi)) {
                console.log("Ennemi sorti de l'écran !");

                // retirer l'ennemi et appliquer pénalité selon le niveau
                if (isEnemyEscaped(ennemi, levelConfig?.escapeSides)) {
                    score -= missPenalty;
                    if (score < 0) score = 0;
                }
                ennemis.splice(ei, 1);

                continue; // ennemi traité, passer au suivant
            }

            // vérifier collision avec projectiles (itération arrière sur projectiles pour splice sûr)
            let touched = false;
            for (let pi = projectiles.length - 1; pi >= 0; pi--) {
                const p = projectiles[pi];
                if (!p.active) continue;
                if (circRectsOverlapFromCenter(
                    p.x, p.y, p.width / 2, p.height / 2,
                    ennemi.x, ennemi.y, ennemi.width, ennemi.height
                )) {
                    // désactiver projectile et supprimer ennemi
                    p.active = false;
                    projectiles.splice(pi, 1);
                    ennemis.splice(ei, 1);
                    touched = true;

                    // jouer son, ajouter score
                    if (loadedAssets && loadedAssets.plop) loadedAssets.plop.play();
                    score += hitPoints;

                    break;
                }
            }
            if (touched) continue; // ennemi déjà retiré, passer au suivant

            // detecter collisions joueur-ennemis
            // pour le joueur on a un cercle, pour l'ennemi un rectangle
            // la largeur du joueur = deux fois le rayon, on passe donc la moitié de la largeur
            // comme rayon.
            if (circRectsOverlapFromCenter(player.x, player.y, player.width/2, player.height/2,
                ennemi.x, ennemi.y, ennemi.width, ennemi.height)) {
                console.log("Collision joueur-ennemi détectée !");

                // jouer son de collision
                loadedAssets.plop.play();

                // Tuer l'ennemi (retirer de la liste)
                ennemis.splice(ei, 1);

                // Décrémenter le nombre de vies
                nbVies -= 1;

                // si plus de vies, GAMEOVER
                if (nbVies <= 0) {
                    startGameOverSequence();
                    console.log("Game Over !");
                }
            }
        }

        // vérifier si le niveau est terminé
        handleLevelProgress();
    }
}

function startGameOverSequence() {
    if (gameOverKeyListenerAttached) return; // déjà en attente
    // poser l'état et préparer le cooldown
    etat = "GAMEOVER";
    gameOverCooldownUntil = performance.now() + GAMEOVER_COOLDOWN_MS;
    awaitingKeyRelease = true;
    gameOverKeyListenerAttached = true;

    // vider les entrées immédiatement pour éviter rebonds
    clearInput();

    // demander d'abord un keyup (libération de la touche déjà maintenue)
    window.addEventListener('keyup', onGameOverKeyUp, { once: true });
}

function onGameOverKeyUp() {
    // libération détectée : maintenant on écoute keydown mais on ignore tant que cooldown non écoulé
    awaitingKeyRelease = false;
    window.removeEventListener('keyup', onGameOverKeyUp);
    // on attache sans { once: true } pour pouvoir filtrer les keydown prématurés
    window.addEventListener('keydown', onGameOverKeyDown);
}

function onGameOverKeyDown() {
    // si cooldown toujours actif, on ignore l'appui
    if (performance.now() < gameOverCooldownUntil) {
        return;
    }

    // keydown valide : cleanup et redémarrage
    window.removeEventListener('keydown', onGameOverKeyDown);
    gameOverKeyListenerAttached = false;
    clearInput();
    startGame(false);
}
