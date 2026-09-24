const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../db/sequelize');
const Auction = require('./AuctionModel');

class IdempotencyKey extends Model {}

IdempotencyKey.init(
  {
    key: {
      type: DataTypes.TEXT,
      primaryKey: true,
      allowNull: false,
      validate: {
        len: [1, 255],
      },
    },
    userId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: 'user_id',
    },
    auctionId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: 'auction_id',
      references: { model: 'auctions', key: 'id' },
    },
    requestHash: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'request_hash',
    },
    responseStatus: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'response_status',
    },
    responseBody: {
      type: DataTypes.JSONB,
      allowNull: false,
      field: 'response_body',
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at',
    },
  },
  {
    sequelize,
    modelName: 'IdempotencyKey',
    tableName: 'idempotency_keys',
    timestamps: false,
    indexes: [
      {
        name: 'idempotency_keys_auction_idx',
        fields: ['auction_id', { name: 'created_at', order: 'DESC' }],
      },
    ],
  },
);

Auction.hasMany(IdempotencyKey, { foreignKey: 'auctionId' });
IdempotencyKey.belongsTo(Auction, { foreignKey: 'auctionId', as: 'auction' });

module.exports = IdempotencyKey;