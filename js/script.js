import Player from "./player.js";
import { defineListeners, inputStates, clearInput } from "./ecouteurs.js";
import { circRectsOverlapFromCenter } from "./collisionUtils.js";
import { initStars, updateStars, drawDecoration } from "./decoration.js";
import { loadAssets } from "./assetLoader.js";
import { getLevelConfig, getMaxLevel } from "./levelConfig.js";
import {
    resetEnemyState,
    updateSpawning,
    updateEnemyProjectiles,
    drawEnemyProjectiles,
    enemyShoot,
    isEnemyOffscreen,
    isEnemyEscaped
} from "./enemySystem.js";


/* ###### Initialisation du jeu ###### */

window.onload = init;


/* ###### Variables globales ###### */

// éléments graphiques globaux
let canvas, ctx;

// objets du jeu
let player, ennemis = [];

// état du jeu
let etat, score, niveau, nbVies, temps;
const GAMEOVER_COOLDOWN_MS = 1000; // durée du cooldown en ms (éviter appuis involontaires)
let gameOverCooldownUntil = 0;

// éléments de jeu (en listes)
let projectiles = [];       // projectiles du joueur
let enemyProjectiles = [];  // projectiles ennemis (séparés pour faciliter gestion et collisions)
let levelConfig = null;      // configuration du niveau en cours (spawn, scoring, etc.) chargé depuis levelConfig.js
const spawnState = {    // état de la génération d'ennemis pour le niveau en cours
    spawned: 0,
    nextSpawnAt: 0
};

// Assets du jeu
var assetsToLoadURLs = { // TODO: @Maxime - mettre sons et images + chercher si pref local ou URL distant ?
    // Images
    press_start: { url: './assets/images/press_start.jpg' },
    vaisseau: { url: './assets/images/vaisseau.png' },
    ennemi: { url: './assets/images/ennemi.png' },

    // Sons
    plop: { url: 'https://mainline.i3s.unice.fr/mooc/SkywardBound/assets/sounds/plop.mp3', buffer: false, loop: false, volume: 1.0 },
    humbug: { url: 'https://mainline.i3s.unice.fr/mooc/SkywardBound/assets/sounds/humbug.mp3', buffer: true, loop: true, volume: 1.0, isPlaying: undefined },
};
export let loadedAssets;

// Flags pour gestion propre des touches (éviter rebonds au game over, etc.)
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
    player = new Player(250, 450, loadedAssets.vaisseau);

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
    enemyProjectiles = [];

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
    
    // On dessine l'image de fond du menu d'accueil
    if (loadedAssets && loadedAssets.press_start) {
        const img = loadedAssets.press_start;

        // On conserve le ratio de l'image et on la fait rentrer dans le canvas
        const scale = Math.min(canvas.width / img.width/2, canvas.height / img.height/2);
        const w = img.width * scale;
        const h = img.height * scale;

        const x = (canvas.width - w) / 2;
        const y = (canvas.height - h) / 2;

        ctx.drawImage(img, x, y, w, h);
    }

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
    ctx.fillText("Appuyez sur une touche pour quitter", canvas.width / 2, canvas.height / 2 + 50);

    // Attacher le mécanisme keyup -> keydown une seule fois
    if (!gameOverKeyListenerAttached) {
        awaitingKeyRelease = true;
        window.addEventListener('keyup', onGameOverKeyUp, { once: true });
        gameOverKeyListenerAttached = true;
    }

    ctx.restore();
}

function drawMenuVictoire() {
    // TODO: @Maxime Gérer écran de win avec réaffichage score et temps, stats, etc.
}

function drawJeu() {
    // dessiner décor (étoiles, etc.)
    drawDecoration(ctx, player, niveau, canvas);

    // dessiner infos (score, vies, niveau, temps)
    // après pour mettre au-dessus du décor
    drawInfo();

    // draw player
    player.draw(ctx);
    // draw projectiles
    projectiles.forEach(p => p.draw(ctx));

    // draw ennemis
    ennemis.forEach(ennemi => {
        ennemi.draw(ctx);
    });
    // draw projectiles ennemis
    drawEnemyProjectiles(enemyProjectiles, ctx);
}


/* ###### Dessin des différents éléments du jeu ###### */

function drawInfo() {
    ctx.save();

    // Affichages des infos du jeu : score, vies, niveau, temps
    const tabP = document.getElementsByClassName("infos-jeu");

    const scoreP = tabP[0];
    const viesP = tabP[1];
    const niveauP = tabP[2];
    const tempsP = tabP[3];

    scoreP.textContent = "Score : " + score;
    viesP.textContent = "Vies : " + nbVies;
    niveauP.textContent = "Niveau : " + niveau;
    tempsP.textContent = "Temps : " + Math.floor(performance.now() / 1000) + " s";

    ctx.restore();
}

// Initialise le niveau : configuration, état de spawn, étoiles, etc.
// depuis levelConfig.js et enemySystem.js
function initLevel(level) {
    niveau = level;
    levelConfig = getLevelConfig(level);
    resetEnemyState(ennemis, enemyProjectiles, spawnState, levelConfig);
    initStars(niveau, canvas);
}

// vérifier si le niveau est terminé (ennemis générés et éliminés)
// et passer au suivant ou game over
function handleLevelProgress() {
    if (etat !== "RUNNING") return; // ne rien faire si pas en cours de jeu
    if (!levelConfig) return; // ne rien faire si pas de config

    // vérifier si tous les ennemis à générer ont été générés et éliminés
    const totalToSpawn = levelConfig.spawn.totalToSpawn ?? Infinity;
    if (spawnState.spawned < totalToSpawn) return;
    if (ennemis.length > 0) return;

    // niveau terminé, passer au suivant ou win si c'était le dernier
    const maxLevel = getMaxLevel();
    if (niveau < maxLevel) {
        console.log("Niveau suivant : " + (niveau + 1));
        initLevel(niveau + 1);
    } else {
        startGameOverSequence(); // TODO: @Maxime Gérer écran de win avec réaffichage score et temps (stats)
        console.log("Vous avez gagné !");
    }
}


/* ###### Mise à jour de l'état du jeu ###### */

//TODO: @Mathieu méthode à optimisé/découper
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

        // mettre à jour les projectiles ennemis
        updateEnemyProjectiles(enemyProjectiles, canvas);

        // générer des ennemis de manière continue selon le niveau
        updateSpawning({ ennemis, spawnState, levelConfig, canvas });

        // définir points selon le niveau
        const hitPoints = levelConfig?.scoring?.hitPoints ?? 10;
        const missPenalty = levelConfig?.scoring?.missPenalty ?? 5;


        // collision projectile-ennemi
        // itération arrière sur ennemis pour pouvoir supprimer sans problème d'index
        for (let ei = ennemis.length - 1; ei >= 0; ei--) {
            const ennemi = ennemis[ei];

            // déplacer l'ennemi (conserve le comportement existant)
            ennemi.move({ x: player.x, y: player.y });

            // tir ennemi (si capacité)
            enemyShoot(ennemi, enemyProjectiles);

            // si l'ennemi sort de l'écran -> pénalité et suppression
            if (isEnemyOffscreen(ennemi, canvas)) {
                console.log("Ennemi sorti de l'écran !");

                // retirer l'ennemi et appliquer pénalité selon le niveau
                if (isEnemyEscaped(ennemi, canvas, levelConfig?.escapeSides)) {
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

        // collisions projectiles ennemis -> joueur
        for (let epi = enemyProjectiles.length - 1; epi >= 0; epi--) {
            const p = enemyProjectiles[epi];
            if (circRectsOverlapFromCenter(
                p.x, p.y, p.width / 2, p.height / 2,
                player.x, player.y, player.width / 2, player.height / 2
            )) {
                enemyProjectiles.splice(epi, 1);
                nbVies -= 1;
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

    // demander d'abord un keyup (pr libération de la touche déjà maintenue)
    window.addEventListener('keyup', onGameOverKeyUp, { once: true });
}

function onGameOverKeyUp() {
    // libération touche -> on écoute keydown mais ignore tant que cooldown non écoulé
    awaitingKeyRelease = false;
    window.removeEventListener('keyup', onGameOverKeyUp);

    // sans { once: true } pour filtrer les keydown prématurés
    window.addEventListener('keydown', onGameOverKeyDown);
}

function onGameOverKeyDown() {
    // si cooldown toujours actif -> on ignore l'appui
    if (performance.now() < gameOverCooldownUntil) {
        return;
    }

    // keydown valide : cleanup et redémarrage
    window.removeEventListener('keydown', onGameOverKeyDown);
    gameOverKeyListenerAttached = false;
    clearInput();
    startGame(false);
}
