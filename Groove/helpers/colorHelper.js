function hexToDecimal(hex) {
    hex = hex.replace(/^#/, '');
    return parseInt(hex, 16);
}

function discordColorToDecimal(colorName) {
    const colors = {
        'Red': 0xED4245,
        'Green': 0x57F287,
        'Blue': 0x5865F2,
        'Yellow': 0xFEE75C,
        'Purple': 0x5865F2,
        'White': 0xFFFFFF
    };
    return colors[colorName] || 0x5865F2;
}

module.exports = { hexToDecimal, discordColorToDecimal };

/*
 * Project: Groove Music
 * Author: faisaljs (Faisal)
 * Organization: Eleone Hub
 * GitHub: https://github.com/faisaljs
 * License: MIT
 * © 2026 Eleone Hub. All rights reserved.
 */
