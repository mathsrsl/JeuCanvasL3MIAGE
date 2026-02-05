import Player from "./player.js";
import Ennemi from "./ennemi.js";
import { defineListeners, inputStates } from "./ecouteurs.js";
import { circRectsOverlapFromCenter } from "./collisionUtils.js";
import { initStars, updateStars, drawDecoration } from "./decoration.js";
import { loadAssets } from "./assetLoader.js";

/* ###### Initialisation du jeu ###### */

window.onload = init;

/* ###### Variables globales ###### */

let canvas, ctx;
let player, ennemis = [];
let etat, niveau, score, nbVies;

let projectiles = [];

var assetsToLoadURLs = {
    // Images
    press_start: { url: './assets/images/press_start.jpg' },
    vaisseau: { url: './assets/images/vaisseau.png' },
    ennemi: { url: './assets/images/ennemi.png' },

    // Sons
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
    player = new Player(250, 450, loadedAssets.vaisseau);

    //TODO: créer ennemis pour le niveau 1
    // (ici ou ailleurs car plusieurs niveaux ?)

    for (let i = 0; i < 5; i++) {
        const x = Math.random() * (canvas.width - 40) + 20; // éviter les bords
        const y = Math.random() * (canvas.height / 2) + 20;
        const color = "red";
        const size = 30;
        ennemis.push(new Ennemi(x, y, color, size, niveau));
    }


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

    // initialiser les étoiles pour le niveau courant
    initStars(niveau, canvas);

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
    
    // Démarrage du jeu au premier appui sur une touche
    window.onkeydown = () => {
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
    ctx.fillText("Appuyez sur une touche pour quitter", canvas.width / 2, canvas.height / 2 + 50);

    // On écoute les touches pour redémarrer le jeu
    window.onkeydown = () => {
        startGame();
        window.onkeydown = null; // on enlève l'écouteur pour ne pas redémarrer le jeu
    };

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

/* ###### Mise à jour de l'état du jeu ###### */

// javascript
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

        // collision projectile-ennemi
        // itération arrière sur ennemis pour pouvoir supprimer sans problème d'index
        for (let ei = ennemis.length - 1; ei >= 0; ei--) {
            const ennemi = ennemis[ei];

            // déplacer l'ennemi (conserve le comportement existant)
            ennemi.move(canvas.width, canvas.height);

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
                    score += 10;
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
                    etat = "GAMEOVER";
                    console.log("Game Over !");
                }

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
        }
    }
}

// TODO: Gestion des tirs du joueur (touche espace ou up arrow)

// TODO: A déplacer dans Player.js ??