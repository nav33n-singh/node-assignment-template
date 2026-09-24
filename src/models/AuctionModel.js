const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../db/sequelize');

class Auction extends Model {}

Auction.init(
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    startsAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'starts_at',
    },
    endsAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'ends_at',
    },
    currentTopBidId: {
      type: DataTypes.BIGINT,
      allowNull: true,
      field: 'current_top_bid_id',
    },
    currentTopBidderId: {
      type: DataTypes.BIGINT,
      allowNull: true,
      field: 'current_top_bidder_id',
    },
    currentTopAmount: {
      type: DataTypes.BIGINT,
      allowNull: true,
      field: 'current_top_amount',
      validate: {
        min: 1,
      },
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
    modelName: 'Auction',
    tableName: 'auctions',
    timestamps: false,
  },
);

module.exports = Auction;