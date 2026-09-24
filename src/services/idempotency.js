const { IdempotencyKeyModel } = require('../models')

async function recordIdempotency(
  { idempotencyKey, userId, auctionId, requestHash, status, body },
  transaction,
) {
  await IdempotencyKeyModel.create(
    {
      key: idempotencyKey,
      userId,
      auctionId,
      requestHash,
      responseStatus: status,
      responseBody: body,
    },
    { transaction },
  );
}

// Replay or conflict-check an existing idempotency row.
function handleExisting(existing, requestHash) {
  if (existing.requestHash !== requestHash) {
    const err = new Error("IDEMPOTENCY_KEY_REUSED");
    err.status = 409;
    throw err;
  }
  return {
    status: existing.responseStatus,
    body: existing.responseBody,
    replayed: true,
  };
}

module.exports = {
    recordIdempotency,
    handleExisting
}