let inputStates = {};

function defineListeners() {

    /* Ecouteurs pour le clavier */

    // keydown
    document.onkeydown = (event) => {
        if (event.key === "ArrowLeft") {
            inputStates.left = true;
        } else if (event.key === "ArrowRight") {
            inputStates.right = true;
        } else if (event.key === "ArrowUp") {
            inputStates.up = true;
        } else if (event.key === " ") {
            inputStates.space = true;
        }
    };

    // keyup
    document.onkeyup = (event) => {
        if (event.key === "ArrowLeft") {
            inputStates.left = false;
        } else if (event.key === "ArrowRight") {
            inputStates.right = false;
        } else if (event.key === "ArrowUp") {
            inputStates.up = false;
        } else if (event.key === " ") {
            inputStates.space = false;
        }
    };
}

export { defineListeners, inputStates };