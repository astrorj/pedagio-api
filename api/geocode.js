/**
 * Geocoding com Nominatim (OpenStreetMap) - uso gratuito.
 */

const fetch = require('node-fetch');

const NOMINATIM = 'https://nominatim.openstreetmap.org/search';

async function geocode(endereco) {
  const params = new URLSearchParams({
    q: endereco,
    format: 'json',
    limit: '1',
  });
  const res = await fetch(`${NOMINATIM}?${params}`, {
    headers: { 'User-Agent': 'PedagioDigital/1.0 (contato@rodoviaspedagiadas.in.net)' },
  });
  if (!res.ok) throw new Error(`Geocoding falhou: ${res.status}`);
  const data = await res.json();
  if (!data || data.length === 0) return null;
  const r = data[0];
  return {
    latitude: parseFloat(r.lat),
    longitude: parseFloat(r.lon),
    displayName: r.display_name,
  };
}

module.exports = { geocode };
