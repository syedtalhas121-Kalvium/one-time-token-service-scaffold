// token-service.js
// A single-use, expiring token service backed by Redis.

import crypto from "node:crypto";
import Redis from "ioredis";
import "dotenv/config";

const redis = new Redis(process.env.REDIS_URL);
const keyFor = (id) => "token:" + id;

/**
 * Issue a single-use token that expires after ttlSeconds.
 * The key, value, and expiry are written atomically.
 */
export async function issueToken(payload, ttlSeconds) {
  if (!Number.isInteger(ttlSeconds) || ttlSeconds <= 0) {
    throw new TypeError("ttlSeconds must be a positive integer");
  }

  const tokenId = crypto.randomBytes(16).toString("hex");
  const value = JSON.stringify(payload);
  const stored = await redis.set(keyFor(tokenId), value, "EX", ttlSeconds, "NX");

  // A collision is extraordinarily unlikely, but never return an id that wasn't stored.
  if (stored !== "OK") {
    throw new Error("Could not issue token");
  }

  return tokenId;
}

/**
 * Consume a token exactly once using Redis' atomic GETDEL command.
 */
export async function consumeToken(tokenId) {
  const value = await redis.getdel(keyFor(tokenId));

  if (value === null) {
    return { ok: false, reason: "invalid" };
  }

  return { ok: true, payload: JSON.parse(value) };
}

// Allow other files to close the connection cleanly (used by test.js).
export function closeRedis() {
  return redis.quit();
}
