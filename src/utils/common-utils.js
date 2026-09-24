const crypto = require('crypto')

function canonicalRequest({ auctionId, userId, amount }) {
  // Deterministic: sorted keys, no whitespace, only the fields that matter.
  return JSON.stringify({ auctionId, userId, amount });
}

function hashRequest(payload) {
  return crypto
    .createHash("sha256")
    .update(canonicalRequest(payload))
    .digest("hex");
}

module.exports = {
  canonicalRequest,
  hashRequest
}