import Player from "./player.js";
import { defineListeners, inputStates } from "./ecouteurs.js";
import { circleCollide, rectsOverlap, rectsOverlapFromCenter,
         circRectsOverlap, circRectsOverlapFromCenter } from "./collisionUtils.js";    
import { loadAssets } from "./assetLoader.js";

import Ennemi from "./ennemi.js";
import EnnemiQuiTremble from "./ennemiQuiTremble.js";

/* ###### Initialisation du jeu ###### */

window.onload = init;


/* ###### Variables globales ###### */

let canvas, ctx;
let player, ennemis = [];
let etat, niveau, score, nbVies;

var assetsToLoadURLs = {
    spaceShip: { url: './assets/spaceShip.png' },
    backgroundImage: { url: 'https://mainline.i3s.unice.fr/mooc/SkywardBound/assets/images/background.png' }, // http://www.clipartlord.com/category/weather-clip-art/winter-clip-art/

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
    player = new Player(250, 400, loadedAssets.spaceShip);




    /* Démarrage du jeu — boucle d'animation */
    startGame();
}

function startGame() {
    console.log("Démarrage du jeu");

    etat = "HOME";

    // initialisation des variables du jeu
    niveau = 1;
    score = 0;
    nbVies = 3;


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
    drawInfo();
    drawDecoration();
    drawPlayer();
    drawEnemies();
}


/* ###### Dessin des différents éléments du jeu ###### */

function drawInfo() {
    ctx.save();

    // TODO : jouer plutot avec le CSS pour une meilleure interface

    ctx.fillStyle = "black";
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
    // dessin du fond
    if (loadedAssets.backgroundImage) {
        ctx.drawImage(loadedAssets.backgroundImage, 0, 0, canvas.width, canvas.height);
    }
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

// TODO: Exemple cours non modifié, à adapter
function updateGameState() {
    // On regarde l'état du clavier par exemple
    if (etat === "RUNNING") {
        deplacerJoueur();
        deplacerEnnemis();

        // detecter collisions joueur-ennemis
        ennemis.forEach(ennemi => {
            // pour le joueur on a un cercle, pour l'ennemi un rectangle
            // la largeur du joueur = deux fois le rayon, on passe donc la moitié de la largeur
            // comme rayon.
            if(circRectsOverlapFromCenter(player.x, player.y, player.largeur/2, player.hauteur/2,
                ennemi.x, ennemi.y, ennemi.largeur, ennemi.hauteur)) {
                console.log("Collision joueur-ennemi détectée !");
                // on tue l'ennemi, on le retire du tableau
                ennemis.splice(ennemis.indexOf(ennemi), 1);
                // et on augmente le score
                score += 10;
                console.log("Score : " + score);

                // on joue le son décompressé en mémoire
                loadedAssets.plop.play();

                // si plus d'ennemis, on passe au niveau suivant
                if(ennemis.length === 0) {
                    if(niveau == 1) {
                        niveau += 1;
                        console.log("Niveau suivant : " + niveau);
                        // on crée plus d'ennemis
                        for (let i = 0; i < niveau * 5; i++) {
                            let x = Math.random() * (canvas.width - 30);
                            let y = Math.random() * (canvas.height - 30);
                            // couleur au hasard
                            let couleurs = ["green", "blue", "purple", "orange"];
                            let couleur = couleurs[Math.floor(Math.random() * couleurs.length)];
                            let ennemi = new Ennemi(x, y, couleur, 30, 30);
                            ennemis.push(ennemi);
                        }
                    } else {
                        etat = "GAMEOVER";
                        console.log("Vous avez gagné !");
                    }
                }
            }
        });
    }
}

// TODO: Exemple cours non modifié, à adapter
function deplacerJoueur() {
    if (inputStates.left) {
        player.x -= player.speed;
    }
    if (inputStates.right) {
        player.x += player.speed;
    }
    if (inputStates.up) {
        player.y -= player.speed;
    }
    if (inputStates.down) {
        player.y += player.speed;
    }

    // tester les collisions avec les murs, bords du canvas, etc.
    // TODO !
}

// TODO: Exemple cours non modifié, à adapter
function deplacerEnnemis() {
    ennemis.forEach(ennemi => {
        ennemi.move(canvas.width, canvas.height);
    });
}