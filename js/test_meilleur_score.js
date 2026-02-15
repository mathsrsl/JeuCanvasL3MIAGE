console.log("=== TEST MEILLEUR SCORE ===");

// Test 1: Lecture du meilleur score
const meilleurScore = parseInt(localStorage.getItem('meilleurScore')) || 0;
console.log("Meilleur score actuel:", meilleurScore);

// Test 2: Affichage
const element = document.querySelector('.meilleur-score-valeur');
console.log("Element trouvé:", element ? "OUI" : "NON");
console.log("Valeur affichée:", element ? element.textContent : "N/A");

// Test 3: Mise à jour
function testerMiseAJour(nouveauScore) {
    const ancien = parseInt(localStorage.getItem('meilleurScore')) || 0;
    if (nouveauScore > ancien) {
        localStorage.setItem('meilleurScore', nouveauScore);
        console.log(`Score mis à jour: ${ancien} → ${nouveauScore}`);
        return true;
    } else {
        console.log(`Score pas mis à jour: ${nouveauScore} <= ${ancien}`);
        return false;
    }
}

// Test 4: Reset (pour debug)
function resetMeilleurScore() {
    localStorage.removeItem('meilleurScore');
    console.log("Meilleur score réinitialisé");
}

// Exporter pour utilisation dans la console
window.testScore = {
    afficher: () => console.log("Meilleur score:", localStorage.getItem('meilleurScore')),
    tester: testerMiseAJour,
    reset: resetMeilleurScore
};

console.log("Tapez 'testScore.afficher()' pour voir le score");
console.log("Tapez 'testScore.tester(100)' pour tester une mise à jour");
console.log("Tapez 'testScore.reset()' pour réinitialiser");
