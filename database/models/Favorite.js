/**
 * @namespace: addons/music/database/models/Favorite.js
 * @type: Database Model
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.9.9-beta-rc.5
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../sequelize');
const BaseModel = require('../BaseModel');

class Favorite extends BaseModel {
    static CACHE_KEYS = [['userId']];
    static init(sequelize) {
        super.init(
            {
                id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
                userId: { type: DataTypes.STRING, allowNull: false, comment: 'Discord User ID of the owner.' },
                identifier: { type: DataTypes.STRING, allowNull: false },
                title: { type: DataTypes.STRING, allowNull: false },
                author: { type: DataTypes.STRING, allowNull: false },
                length: { type: DataTypes.BIGINT, allowNull: false },
                uri: { type: DataTypes.STRING, allowNull: false },
            },
            {
                sequelize,
                modelName: 'Favorite',
                tableName: 'favorites',
                timestamps: true,
                indexes: [
                    {
                        unique: true,
                        fields: ['userId', 'identifier'],
                    },
                ],
            }
        );
        return this;
    }
}

Favorite.init(sequelize);

module.exports = Favorite;

/*
 * Project: Groove Music
 * Author: faisalg1t (Faisal)
 * Organization: Eleone Hub
 * GitHub: https://github.com/faisalg1t
 * License: MIT
 * © 2026 Eleone Hub. All rights reserved.
 */
