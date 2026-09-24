CREATE TABLE auctions (
  id                     bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title                  text NOT NULL,
  starts_at              timestamptz NOT NULL DEFAULT now(),
  ends_at                timestamptz NOT NULL,

  current_top_bid_id     bigint,
  current_top_bidder_id  bigint,
  current_top_amount     bigint,

  created_at             timestamptz NOT NULL DEFAULT now(),

  CHECK (ends_at > starts_at),
  CHECK (current_top_amount IS NULL OR current_top_amount > 0),
  CHECK (
    (current_top_bid_id IS NULL
     AND current_top_bidder_id IS NULL
     AND current_top_amount IS NULL)
    OR
    (current_top_bid_id IS NOT NULL
     AND current_top_bidder_id IS NOT NULL
     AND current_top_amount IS NOT NULL)
  )
);


CREATE TABLE bids (
  id                bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  auction_id        bigint NOT NULL REFERENCES auctions(id),
  user_id           bigint NOT NULL,
  amount            bigint NOT NULL CHECK (amount > 0),
  status            text NOT NULL CHECK (status IN ('accepted', 'rejected')),
  rejection_reason  text,
  received_at       timestamptz NOT NULL,
  created_at        timestamptz NOT NULL DEFAULT now(),

  CHECK (
    (status = 'accepted' AND rejection_reason IS NULL)
    OR
    (status = 'rejected' AND rejection_reason IS NOT NULL)
  )
);

CREATE UNIQUE INDEX bids_unique_accepted_amount
  ON bids (auction_id, amount)
  WHERE status = 'accepted';

CREATE INDEX bids_auction_created_idx
  ON bids (auction_id, created_at DESC);


CREATE TABLE idempotency_keys (
  key              text PRIMARY KEY,
  user_id          bigint NOT NULL,
  auction_id       bigint NOT NULL REFERENCES auctions(id),
  request_hash     text NOT NULL, -- (method + path + auction_id + user_id + amount).

  response_status  integer NOT NULL,
  response_body    jsonb NOT NULL,

  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idempotency_keys_auction_idx
  ON idempotency_keys (auction_id, created_at DESC);