const {recordIdempotency, handleExisting} = require('./idempotency');
const { hashRequest, canonicalRequest } = require('../utils/common-utils');
const { acceptedBody } = require('../utils/response-helper');
const { AuctionModel, BidModel, IdempotencyKeyModel } = require('../models')
// const { sequelize } = require('../db/sequelize');
const db = require('../db/sequelize');



/**
 * Place a bid on an auction.
 *
 * @param {Object} input
 * @param {string} input.idempotencyKey  Client-supplied key. Required.
 * @param {number} input.auctionId
 * @param {number} input.userId
 * @param {number} input.amount          Minor units. Must be > 0.
 * @returns {Promise<{ status: number, body: object, replayed?: boolean }>}
 */
async function placeBid({ idempotencyKey, auctionId, userId, amount }) {
  if (!idempotencyKey) {
    const err = new Error("IDEMPOTENCY_KEY_REQUIRED");
    err.status = 400;
    throw err;
  }
  if (!Number.isInteger(amount) || amount <= 0) {
    const err = new Error("INVALID_AMOUNT");
    err.status = 400;
    throw err;
  }

  const requestHash = hashRequest({ auctionId, userId, amount });

  // Capture arrival time once, before any waiting. This is what the
  // close-time rule is evaluated against, so a request that arrived
  // before close is not unfairly rejected because it waited on a lock.
  const receivedAt = new Date();

  try {
    return await db.getSequelize().transaction(async (t) => {
      // 1. Pre-lock idempotency check. Cheap if the key was seen before.
      const pre = await IdempotencyKeyModel.findByPk(idempotencyKey, {
        transaction: t,
      });
      if (pre) return handleExisting(pre, requestHash);

      // 2. Lock the auction row. All bid writes for this auction
      //    serialize here.
      const auction = await AuctionModel.findByPk(auctionId, {
        lock: t.LOCK.UPDATE,
        transaction: t,
      });
      if (!auction) {
        const err = new Error("AUCTION_NOT_FOUND");
        err.status = 404;
        throw err;
      }

      // 3. Re-check idempotency now that we hold the lock. Another
      //    transaction may have written it while we waited.
      const post = await IdempotencyKeyModel.findByPk(idempotencyKey, {
        transaction: t,
      });
      if (post) return handleExisting(post, requestHash);

      // 4. Close-time rule. ends_at is exclusive.
      if (receivedAt >= auction.endsAt) {
        const body = { error: "AUCTION_CLOSED" };
        await recordIdempotency(
          {
            idempotencyKey,
            userId,
            auctionId,
            requestHash,
            status: 409,
            body,
          },
          t,
        );
        return { status: 409, body };
      }

      // 5. Strictly-higher rule.
      const top = auction.currentTopAmount;
      if (top !== null && amount <= top) {
        const body = { error: "BID_NOT_HIGHER", current_top_amount: top };
        await recordIdempotency(
          {
            idempotencyKey,
            userId,
            auctionId,
            requestHash,
            status: 409,
            body,
          },
          t,
        );
        return { status: 409, body };
      }

      // 6. Accept the bid.
      const bid = await BidModel.create(
        {
          auctionId,
          userId,
          amount,
          status: "accepted",
          rejectionReason: null,
          receivedAt,
        },
        { transaction: t },
      );

      await auction.update(
        {
          currentTopBidId: bid.id,
          currentTopBidderId: userId,
          currentTopAmount: amount,
        },
        { transaction: t },
      );

      const body = acceptedBody({ bid, auction, auctionId, userId, amount });

      await recordIdempotency(
        {
          idempotencyKey,
          userId,
          auctionId,
          requestHash,
          status: 201,
          body,
        },
        t,
      );

      return { status: 201, body };
    });
  } catch (err) {
    throw err;
  }
}

module.exports = {
  placeBid   
}