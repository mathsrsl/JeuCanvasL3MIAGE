import Player from "./player.js";
import { defineListeners, inputStates } from "./ecouteurs.js";
import { circleCollide, rectsOverlap, rectsOverlapFromCenter,
         circRectsOverlap, circRectsOverlapFromCenter } from "./collisionUtils.js";    
import { loadAssets } from "./assetLoader.js";

import Ennemi from "./ennemi.js";


/* ###### Initialisation du jeu ###### */

window.onload = init;


/* ###### Variables globales ###### */

let canvas, ctx;
let player, ennemis = [];
let etat, niveau, score, nbVies;

// Décoration étoilée
let stars = [];
const STAR_CONFIG = {
    counts: { 1: 60, 2: 100, 3: 160 },
    baseSpeeds: { 1: 0.4, 2: 1.2, 3: 2.4 },
    trailBases: { 1: 0, 2: 6, 3: 14 }, // utilisé pour l'allongement visuel
    playerInfluence: { 1: 0.01, 2: 0.03, 3: 0.06 } // influence sur la vitesse verticale
};

var assetsToLoadURLs = {
    spaceShip: { url: './assets/spaceShip.png' },

    logo1: { url: "https://mainline.i3s.unice.fr/mooc/SkywardBound/assets/images/SkywardWithoutBalls.png" },

    plop: { url: 'https://mainline.i3s.unice.fr/mooc/SkywardBound/assets/sounds/plop.mp3', buffer: false, loop: false, volume: 1.0 },
    humbug: { url: 'https://mainline.i3s.unice.fr/mooc/SkywardBound/assets/sounds/humbug.mp3', buffer: true, loop: true, volume: 1.0 },
};
let loadedAssets;


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

    //TODO: créer ennemis pour le niveau 1
    // (ici ou ailleurs car plusieurs niveaux ?)




    /* Démarrage du jeu — boucle d'animation */
    startGame();
}

// Initialiser les étoiles en fonction du niveau
function initStars() {
    const count = STAR_CONFIG.counts[niveau] || STAR_CONFIG.counts[1];
    stars = [];
    for (let i = 0; i < count; i++) {
        const baseSpeed = STAR_CONFIG.baseSpeeds[niveau] * (0.6 + Math.random() * 0.9);
        const trailBase = STAR_CONFIG.trailBases[niveau] * (0.6 + Math.random() * 0.9);
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 1.6 + 0.6, // largeur visuelle
            baseSpeed,                        // vitesse verticale de base
            trailBase,                        // paramètre d'allongement
            vy: baseSpeed                     // vitesse effective
        });
    }
}

function startGame() {
    console.log("Démarrage du jeu");

    etat = "HOME";

    // initialisation des variables du jeu
    niveau = 1;
    score = 0;
    nbVies = 3;

    // initialiser les étoiles pour le niveau courant
    initStars();

    loadedAssets.humbug.play();
    defineListeners();

    // Lance la boucle d'animation
    requestAnimationFrame(gameLoop);
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
    
    // Démarrage du jeu au premier appui sur une touche
    window.onkeydown = (event) => {
        etat = "RUNNING";
        window.onkeydown = null;
    };

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

    // On écoute les touches pour redémarrer le jeu
    window.onkeydown = (event) => {
        startGame();
        window.onkeydown = null; // on enlève l'écouteur pour ne pas redémarrer le jeu
    };

    ctx.restore();
}

function drawJeu() {
    drawDecoration();
    drawInfo();
    drawPlayer();
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

function drawDecoration() {
    /* fond noir */
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    /* étoiles avec traînées */

    ctx.save();

    stars.forEach(star => {
        // normaliser la contribution de la vitesse pour calculer l'allongement
        const speedFactor = Math.min(2.5, star.vy / 0.6);
        // longueur verticale de l'étoile (au moins minElong pour éviter le carré)
        const minElong = 3; // allongement minimal en px (niveau 1 aura au moins ceci)
        const length = Math.max(
            minElong,
            star.trailBase * (0.8 + 0.6 * speedFactor) + star.vy * 0.6
        );

        // largeur du rectangle (petite, proportionnelle à star.size)
        const width = Math.max(1, star.size);

        // dessin avec dégradé vertical : tête opaque -> queue transparente
        const topY = star.y - length;
        const grad = ctx.createLinearGradient(star.x, star.y, star.x, topY);
        grad.addColorStop(0, "rgba(255,255,255,1)");   // tête
        grad.addColorStop(1, "rgba(255,255,255,0)");   // queue

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.fillRect(star.x - width / 2, topY, width, length);

        // Optionnel : accentuer la tête avec un petit rond plus lumineux
        ctx.fillStyle = "rgba(255,255,255,1)";
        ctx.beginPath();
        ctx.arc(star.x, star.y - Math.max(0, Math.min(1.2, width / 2)), Math.max(0.6, width / 1.5), 0, Math.PI * 2);
        ctx.fill();
    });

    ctx.restore();
}


function drawPlayer() {
    player.draw(ctx);
}

function drawEnemies() {
    ennemis.forEach(ennemi => {
        ennemi.draw(ctx);
    });
}


/* ###### Mise à jour de l'état du jeu ###### */

function updateGameState() {
    if (etat === "RUNNING") {
        // mettre à jour les étoiles
        updateStars();

        // déplacer joueur et ennemis
        deplacerJoueur();
        deplacerEnnemis();

        // detecter collisions joueur-ennemis
        ennemis.forEach(ennemi => {
            // pour le joueur on a un cercle, pour l'ennemi un rectangle
            // la largeur du joueur = deux fois le rayon, on passe donc la moitié de la largeur
            // comme rayon.
            if(circRectsOverlapFromCenter(player.x, player.y, player.width/2, player.height/2,
                ennemi.x, ennemi.y, ennemi.width, ennemi.height)) {
                console.log("Collision joueur-ennemi détectée !");

                // jouer son de collision
                loadedAssets.plop.play();

                // Tuer l'ennemi (retirer de la liste)
                ennemis.splice(ennemis.indexOf(ennemi), 1);

                // Décrémenter le nombre de vies
                nbVies -= 1;


                // si plus d'ennemis, on passe au niveau suivant
                if(ennemis.length === 0) {
                    if(niveau === 1) {
                        niveau += 1;

                        console.log("Niveau suivant : " + niveau);

                        //TODO: Créer de nouveaux ennemis pour le niveau 2
                        // (peut etre à déporter autre part dans le code ?)

                    } else {
                        //TODO: gérer écran de victoire d'un niveau donné
                        etat = "GAMEOVER";
                        console.log("Vous avez gagné !");
                    }
                }
            }
        });
    }
}

// Mettre à jour les étoiles (appelé chaque frame quand RUNNING)
function updateStars() {
    const maxY = canvas.height;
    const pInfluence = STAR_CONFIG.playerInfluence[niveau] || STAR_CONFIG.playerInfluence[1];

    stars.forEach(star => {
        // vitesse verticale = base + influence de la vitesse du joueur
        const extraFromPlayer = (player && player.speed) ? player.speed * pInfluence : 0;
        star.vy = star.baseSpeed + extraFromPlayer;

        // mouvement vertical uniquement (ne pas modifier star.x)
        star.y += star.vy;

        // réapparition en haut quand dépasse le bas (recréer caractéristiques)
        if (star.y > maxY + 10) {
            star.y = -10 - Math.random() * 20;
            star.x = Math.random() * canvas.width;
            star.size = Math.random() * 1.6 + 0.6;
            star.baseSpeed = STAR_CONFIG.baseSpeeds[niveau] * (0.6 + Math.random() * 0.9);
            star.trailBase = STAR_CONFIG.trailBases[niveau] * (0.6 + Math.random() * 0.9);
            star.vy = star.baseSpeed;
            star.drift = (Math.random() - 0.5) * 0.6;
            star.spagFactor = 0.6 + Math.random() * 0.8;
        }
    });
}

function deplacerJoueur() {
    const radius = player.width / 2;

    // Gérer les déplacements horizontaux et empêcher de sortir du canvas
    if (inputStates.left) {
        player.x = Math.max(radius, player.x - player.speed);
    }
    if (inputStates.right) {
        player.x = Math.min(canvas.width - radius, player.x + player.speed);
    }
}

function deplacerEnnemis() {
    ennemis.forEach(ennemi => {
        ennemi.move(canvas.width, canvas.height);
    });
}

// TODO: Gestion des tirs du joueur (touche espace ou up arrow)

// TODO: A déplacer dans Player.js ??