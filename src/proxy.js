import fetch from 'node-fetch';
import express from 'express';
import { get, set } from './cache.js';
import { timerEnd, timerStart } from './time.js';

export const router = express.Router();

function USGSUrl(type, period) {
  return new URL(
    `https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/${type}_${period}.geojson`,
  ).href;
}

async function fetchFromUSGS(url) {
  const data = await fetch(url);
  const jsonData = await data.json();

  return jsonData;
}

async function getData(req, res) {
  const { type, period } = req.query;

  const url = USGSUrl(type, period);
  const cachedKey = `type:${type}-period:${period}`;
  const timer = timerStart();

  let earthquakes;

  const cached = await get(cachedKey);

  if (cached) {
    earthquakes = cached;
  } else {
    earthquakes = await fetchFromUSGS(url);
    set(cachedKey, earthquakes, 60);
  }

  const elapsed = timerEnd(timer);

  const result = {
    data: earthquakes,
    info: {
      elapsed,
      cache: cached != null,
    },
  };

  return res.json(result);
}

// get().catch((err) => console.error(err));

router.get('/', getData);
