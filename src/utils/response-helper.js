function acceptedBody({ bid, auction, auctionId, userId, amount }) {
  return {
    bid_id: bid.id,
    auction_id: auctionId,
    user_id: userId,
    amount,
    status: "accepted",
    current_top_bid: {
      bid_id: bid.id,
      user_id: userId,
      amount,
    },
    auction_ends_at: auction.endsAt,
  };
}

module.exports = {
    acceptedBody
}