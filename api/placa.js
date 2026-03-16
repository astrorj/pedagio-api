/**
 * Consulta tipo/categoria de veículo pela placa.
 * Opção 1: Infosimples API ANTT/Veículo (RNTRC).
 * Opção 2: Sem API externa, retorna null e usa categoria informada pelo usuário.
 * Doc: https://infosimples.com/consultas/antt-veiculo/
 */

const fetch = require('node-fetch');

const INFOSIMPLES_URL = 'https://api.infosimples.com/api/v2/consultas/antt/veiculo';

function mapTipoToCategoria(tipoVeiculo) {
  if (!tipoVeiculo) return null;
  const t = String(tipoVeiculo).toLowerCase();
  if (t.includes('moto')) return 1;
  if (t.includes('automóvel') || t.includes('carro') || t.includes('caminhonete')) return 2;
  if (t.includes('2 eixos') || t.includes('dois eixos')) return 3;
  if (t.includes('3 eixos') || t.includes('três eixos')) return 4;
  if (t.includes('4') || t.includes('quatro') || t.includes('eixos')) return 5;
  return 2;
}

async function getVeiculoByPlaca(placa) {
  const token = process.env.INFOSIMPLES_TOKEN;
  const email = process.env.INFOSIMPLES_EMAIL;
  if (!token || !email) return null;

  const normalized = String(placa).replace(/\s/g, '').toUpperCase();
  if (normalized.length < 7) return null;

  const params = new URLSearchParams({ token, placa: normalized });
  const res = await fetch(`${INFOSIMPLES_URL}?${params}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) return null;
  const data = await res.json();
  if (!data || data.sucesso !== true || !data.dados) return null;

  const veiculo = data.dados;
  const tipo = veiculo.tipo_veiculo || veiculo.tipo || veiculo.categoria;
  const categoria = mapTipoToCategoria(tipo);

  return {
    placa: normalized,
    categoria: categoria || 2,
    tipo: tipo || 'Não informado',
    tag: veiculo.tag || null,
    ...veiculo,
  };
}

module.exports = { getVeiculoByPlaca, mapTipoToCategoria };
