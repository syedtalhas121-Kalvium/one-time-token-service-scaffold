# One-Time Token Service

A single-use, expiring token service backed by Redis.

## Setup

```bash
npm install
cp .env.example .env
# Set REDIS_URL in .env to your Redis connection URL.
docker start redis-m4
```

## Implementation

- `issueToken(payload, ttlSeconds)` generates a cryptographically random 128-bit token ID, JSON-serializes the payload, and stores it with atomic `SET ... EX ... NX`.
- `consumeToken(tokenId)` uses atomic `GETDEL`, returning `{ ok: true, payload }` for a valid token or `{ ok: false, reason: "invalid" }` for a missing, expired, or already-consumed token.
- `test.js` fires five consumers concurrently with `Promise.all` and asserts that exactly one succeeds.

## Run the test

```bash
npm test
```

Expected result when run against a working Redis instance:

```
winners: 1
PASS: token was single-use.
```

The test must be run with Redis available; the expected output above is not a claim that a remote Redis run has already been performed.
