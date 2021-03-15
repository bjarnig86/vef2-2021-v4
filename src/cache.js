import redis from 'redis';
import util from 'util';
import dotenv from 'dotenv';
import express from 'express';

dotenv.config();

const { REDIS_URL: redisURL } = process.env;

// TODO útfæra redis cache

export const router = express.Router();

let client;
let asyncGet;
let asyncSet;

if (redisURL) {
  client = redis.createClient({ url: redisURL });
  asyncGet = util.promisify(client.get).bind(client);
  asyncSet = util.promisify(client.mset).bind(client);
}

/**
 * Returns cached data or null if not cached.
 * @param {string} cacheKey Cache key to for data for
 * @returns {object} Data as the cached object, otherwise null
 */
export async function get(cacheKey) {
  // Slökkt á client
  if (!client || !asyncGet) {
    return console.error('Slökkt á client');
  }

  let cached;

  try {
    cached = await asyncGet(cacheKey);
  } catch (e) {
    console.warn(`Gat ekki frkv. get frá cache, ${cacheKey}, ${e.message}`);
  }

  if (!cached) {
    return console.error('ekkert cached');
  }

  let result;

  try {
    result = JSON.parse(cached);
  } catch (e) {
    console.warn(`gat ekki parsað cached data, ${cacheKey}, ${e.message}`);
    return null;
  }

  return result;
}

/**
 * Cache data for a specific time under a cacheKey.
 *
 * @param {string} cacheKey Cache key to cache data under
 * @param {object} data Data to cache
 * @param {number} ttl Time-to-live of cache
 * @returns {Promise<boolean>} true if data cached, otherwise false
 */
export async function set(cacheKey, data, ttl) {
  if (!client || !asyncSet) {
    return false;
  }

  try {
    const serialized = JSON.stringify(data);
    await asyncSet(cacheKey, serialized, 'EX', ttl);
  } catch (e) {
    console.warn('unable to set cache for ', cacheKey);
    return false;
  }

  return true;
}
