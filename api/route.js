/**
 * Rota entre dois pontos usando OSRM. Retorna lista de coordenadas da rota.
 */

const fetch = require('node-fetch');

const OSRM_BASE = 'https://router.project-osrm.org/route/v1/driving';

async function getRoutePoints(origin, destination) {
  const coords = `${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}`;
  const url = `${OSRM_BASE}/${coords}?overview=full&geometries=geojson`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Rota falhou: ${res.status}`);
  const data = await res.json();
  if (data.code !== 'Ok' || !data.routes || !data.routes[0]) {
    throw new Error('Rota não encontrada entre origem e destino.');
  }
  const coordinates = data.routes[0].geometry.coordinates;
  return coordinates.map(([lon, lat]) => ({ latitude: lat, longitude: lon }));
}

module.exports = { getRoutePoints };
