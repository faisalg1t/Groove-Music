/**
 * Database Models Index
 * Initializes all models and sets up associations
 */

const sequelize = require('../sequelize');
const Favorite = require('./Favorite');
const Playlist = require('./Playlist');
const PlaylistTrack = require('./PlaylistTrack');
const NoPrefix = require('./NoPrefix');


const models = {
    Favorite,
    Playlist,
    PlaylistTrack,
    NoPrefix,
    sequelize
};


Object.values(models).forEach(model => {
    if (model.associate && typeof model.associate === 'function') {
        model.associate(models);
    }
});



sequelize.sync({ alter: false }).catch(() => {
    
});

module.exports = models;

/*
 * Project: Groove Music
 * Author: faisalg1t (Faisal)
 * Organization: Eleone Hub
 * GitHub: https://github.com/faisalg1t
 * License: MIT
 * © 2026 Eleone Hub. All rights reserved.
 */
