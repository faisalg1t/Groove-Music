const { DataTypes } = require('sequelize');
const sequelize = require('../sequelize');
const BaseModel = require('../BaseModel');

class NoPrefix extends BaseModel {
    static init(sequelize) {
        super.init(
            {
                id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
                userId: { type: DataTypes.STRING, allowNull: false, unique: true },
                username: { type: DataTypes.STRING, allowNull: false },
                grantedBy: { type: DataTypes.STRING, allowNull: false },
                grantedByUsername: { type: DataTypes.STRING, allowNull: false },
                expiresAt: { type: DataTypes.DATE, allowNull: true },
                duration: { type: DataTypes.STRING, allowNull: false },
            },
            {
                sequelize,
                modelName: 'NoPrefix',
                tableName: 'no_prefix',
                timestamps: true,
            }
        );

        return this;
    }

    static async isNoPrefixUser(userId) {
        const record = await this.findOne({ where: { userId } });
        if (!record) return false;
        
        if (record.expiresAt && new Date() > new Date(record.expiresAt)) {
            await record.destroy();
            return false;
        }
        
        return true;
    }
}

NoPrefix.init(sequelize);

module.exports = NoPrefix;
