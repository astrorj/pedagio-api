/**
 * Serviço Maplink: token OAuth e Toll API (valores reais de pedágio).
 * Documentação: https://developers.maplink.global/
 */

const fetch = require('node-fetch');

const TOKEN_URL = 'https://api.maplink.global/oauth/client_credential/accesstoken?grant_type=client_credentials';
const TOLL_URL = 'https://api.maplink.global/toll/v1/calculations';

// Mapeamento categoria ANTT (1-5) / seleção front → vehicleType Maplink
const MAPLINK_VEHICLE_TYPES = {
  1: 'MOTORCYCLE',
  2: 'CAR',
  3: 'TRUCK_WITH_TWO_SINGLE_AXIS',
  4: 'TRUCK_WITH_TWO_DOUBLE_AXLES',
  5: 'TRUCK_WITH_FOUR_DOUBLE_AXLES',
};

let cachedToken = null;
let tokenExpiry = 0;

async function getAccessToken() {
  const clientId = process.env.MAPLINK_CLIENT_ID;
  const clientSecret = process.env.MAPLINK_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('MAPLINK_CLIENT_ID e MAPLINK_CLIENT_SECRET são obrigatórios no .env');
  }
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }
  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
  });
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Maplink token falhou: ${res.status} ${text}`);
  }
  const data = await res.json();
  cachedToken = data.access_token;
  tokenExpiry = Date.now() + (parseInt(data.expires_in, 10) * 1000) - 60000;
  return cachedToken;
}

/**
 * Calcula pedágios para uma rota (lista de pontos { latitude, longitude }).
 */
async function calculateTolls(points, vehicleType, options = {}) {
  if (!points || points.length < 2) {
    throw new Error('São necessários pelo menos 2 pontos (origem e destino) na rota.');
  }
  const token = await getAccessToken();
  const body = {
    legs: [
      {
        points: points.map((p) => ({ latitude: p.latitude, longitude: p.longitude })),
        vehicleType: MAPLINK_VEHICLE_TYPES[vehicleType] || vehicleType,
        condition: {
          billingType: options.billingType || 'NORMAL',
          period: options.period || 'NORMAL',
        },
      },
    ],
    billing: options.freeFlow ? 'FREE_FLOW' : 'DEFAULT',
    transponderOperators: ['SEM_PARAR', 'CONECTCAR'],
  };
  const res = await fetch(TOLL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Maplink Toll API falhou: ${res.status} ${text}`);
  }
  return res.json();
}

module.exports = { getAccessToken, calculateTolls, MAPLINK_VEHICLE_TYPES };
