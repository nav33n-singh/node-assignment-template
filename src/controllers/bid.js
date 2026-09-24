const { placeBid } = require('../services/bid')

async function bid(req, res) {
  try {
    const idempotencyKey = req.get("Idempotency-Key");
    const { auction_id, user_id, amount } = req.body || {};

    const result = await placeBid({
      idempotencyKey,
      auctionId: auction_id,
      userId: user_id,
      amount,
    });

    if (result.replayed) {
      res.set("Idempotency-Replayed", "true");
    }
    res.status(result.status).json(result.body);
  } catch (e) {
    console.log(e)
    const status = e.status || 500
    const msg = e.status || e.message || 'Internal server error occured'
    return res.status(status).json({
        status, 
        error: msg
    })
  }
}

module.exports = {
  bid
};
