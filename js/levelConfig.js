const LEVEL_CONFIGS = {
    1: {
        enemy: {
            shape: "triangle",
            color: "#e74c3c",
            size: 30,
            pattern: "straight"
        },
        spawn: {
            intervalMs: [400, 900],
            initialDelayMs: 0,
            maxAlive: 6,
            totalToSpawn: 20,
            edges: ["top"],
            speed: [1.2, 2.0],
            driftX: [-0.4, 0.4]
        },
        scoring: {
            hitPoints: 10,
            missPenalty: 5
        },
        escapeSides: ["bottom"]
    },
    2: {
        enemy: {
            shape: "square",
            color: "#3498db",
            size: 28,
            pattern: "straight"
        },
        spawn: {
            intervalMs: [350, 800],
            initialDelayMs: 0,
            maxAlive: 7,
            totalToSpawn: 24,
            edges: ["left", "right"],
            speed: [1.3, 2.3],
            driftY: [0.2, 0.8]
        },
        scoring: {
            hitPoints: 15,
            missPenalty: 7
        },
        escapeSides: ["left", "right"]
    },
    3: {
        enemy: {
            shape: "circle",
            color: "#2ecc71",
            size: 26,
            pattern: "zigzag",
            zigzag: {
                amplitude: 35,
                frequency: 0.08,
                axis: "x"
            }
        },
        spawn: {
            intervalMs: [300, 700],
            initialDelayMs: 0,
            maxAlive: 8,
            totalToSpawn: 30,
            edges: ["top"],
            speed: [1.4, 2.6],
            driftX: [-0.3, 0.3]
        },
        scoring: {
            hitPoints: 20,
            missPenalty: 10
        },
        escapeSides: ["bottom"]
    }
};

const LEVEL_ORDER = Object.keys(LEVEL_CONFIGS)
    .map(Number)
    .sort((a, b) => a - b);

export function getLevelConfig(level) {
    return LEVEL_CONFIGS[level] || LEVEL_CONFIGS[LEVEL_ORDER[0]];
}

export function getMaxLevel() {
    return LEVEL_ORDER[LEVEL_ORDER.length - 1] || 1;
}

export { LEVEL_CONFIGS };
