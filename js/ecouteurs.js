export const inputStates = {
    left: false,
    right: false,
    up: false,
    down: false,
    space: false
};

// flag pour éviter les appuis accidentels (ex: qd game over)
let listenersAttached = false;

export function defineListeners() {
    if (listenersAttached) return;
    listenersAttached = true;


    /* Ecouteurs pour le clavier */

    // keydown
    window.addEventListener('keydown', (e) => {
        switch (e.code) {
            case 'ArrowLeft': case 'KeyA': inputStates.left = true; break;
            case 'ArrowRight': case 'KeyD': inputStates.right = true; break;
            case 'ArrowUp': case 'KeyW': inputStates.up = true; break;
            case 'ArrowDown': case 'KeyS': inputStates.down = true; break;
            case 'Space': inputStates.space = true; break;
        }
    });

    // keyup
    window.addEventListener('keyup', (e) => {
        switch (e.code) {
            case 'ArrowLeft': case 'KeyA': inputStates.left = false; break;
            case 'ArrowRight': case 'KeyD': inputStates.right = false; break;
            case 'ArrowUp': case 'KeyW': inputStates.up = false; break;
            case 'ArrowDown': case 'KeyS': inputStates.down = false; break;
            case 'Space': inputStates.space = false; break;
        }
    });
}

// réinitialiser tous les états d'entrée à false (ex: qd game over)
export function clearInput() {
    for (const k in inputStates) {
        if (Object.prototype.hasOwnProperty.call(inputStates, k)) inputStates[k] = false;
    }
}