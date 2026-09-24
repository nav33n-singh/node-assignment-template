const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../db');
const Auction = require('./auction');

class Bid extends Model {}

Bid.init(
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    auctionId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: 'auction_id',
      references: { model: 'auctions', key: 'id' },
    },
    userId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: 'user_id',
    },
    amount: {
      type: DataTypes.BIGINT,
      allowNull: false,
      validate: { min: 1 },
    },
    status: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: { isIn: [['accepted', 'rejected']] },
    },
    rejectionReason: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'rejection_reason',
    },
    receivedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'received_at',
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
    modelName: 'Bid',
    tableName: 'bids',
    timestamps: false,
    indexes: [
      {
        name: 'bids_unique_accepted_amount',
        unique: true,
        fields: ['auction_id', 'amount'],
        where: { status: 'accepted' },
      },
      {
        name: 'bids_auction_created_idx',
        fields: ['auction_id', { name: 'created_at', order: 'DESC' }],
      },
    ],
  },
);

Auction.hasMany(Bid, { foreignKey: 'auctionId', as: 'bids' });
Bid.belongsTo(Auction, { foreignKey: 'auctionId', as: 'auction' });

module.exports = Bid;