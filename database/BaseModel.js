const { Model } = require('sequelize');

class BaseModel extends Model {
    static setupParentTouch(foreignKey, ParentModel, parentField = 'updatedAt') {
        const updateParent = async (instance) => {
            if (instance[foreignKey]) {
                await ParentModel.update(
                    { [parentField]: new Date() },
                    { where: { id: instance[foreignKey] } }
                );
            }
        };

        this.addHook('afterCreate', 'updateParentTimestamp', updateParent);
        this.addHook('afterUpdate', 'updateParentTimestamp', updateParent);
        this.addHook('afterDestroy', 'updateParentTimestamp', updateParent);
    }

    static CACHE_KEYS = [];
}

module.exports = BaseModel;

/*
 * Project: Groove Music
 * Author: faisaljs (Faisal)
 * Organization: Eleone Hub
 * GitHub: https://github.com/faisaljs
 * License: MIT
 * © 2026 Eleone Hub. All rights reserved.
 */
