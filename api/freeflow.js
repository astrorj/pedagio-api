/**
 * API Free Flow – cobrança de pedágio por passagem em pórticos.
 * Armazena passagens e débitos em memória (reinicia com o servidor).
 */

// Pórticos Free Flow com tarifa por categoria (1=moto, 2=carro, 3=caminhão 2eixos, 4=3eixos, 5=4+eixos)
const GANTRIES = {
  FF001: { nome: 'Free Flow - BR-116 Km 10', valor: { 1: 2.5, 2: 5.0, 3: 8.0, 4: 12.0, 5: 18.0 } },
  FF002: { nome: 'Free Flow - BR-116 Km 45', valor: { 1: 2.5, 2: 5.0, 3: 8.0, 4: 12.0, 5: 18.0 } },
  FF003: { nome: 'Free Flow - BR-101 Sul', valor: { 1: 3.0, 2: 6.0, 3: 9.5, 4: 14.0, 5: 21.0 } },
  FF004: { nome: 'Free Flow - Via Lagos', valor: { 1: 2.0, 2: 4.5, 3: 7.0, 4: 10.5, 5: 15.0 } },
  FF005: { nome: 'Free Flow - Anel Rodoviário', valor: { 1: 1.8, 2: 4.0, 3: 6.5, 4: 9.5, 5: 14.0 } },
};

const passages = [];
let idCounter = 1;

function nextId() {
  return `FF-${Date.now()}-${idCounter++}`;
}

function formatDate(d) {
  const x = d instanceof Date ? d : new Date(d);
  return [
    String(x.getDate()).padStart(2, '0'),
    String(x.getMonth() + 1).padStart(2, '0'),
    x.getFullYear(),
  ].join('/');
}

function formatDateTime(d) {
  const x = d instanceof Date ? d : new Date(d);
  return (
    formatDate(x) +
    ', ' +
    [
      String(x.getHours()).padStart(2, '0'),
      String(x.getMinutes()).padStart(2, '0'),
      String(x.getSeconds()).padStart(2, '0'),
    ].join(':')
  );
}

/**
 * Registra uma passagem Free Flow (veículo passou no pórtico).
 * @param {string} placa
 * @param {string} gantryId - ID do pórtico (ex: FF001)
 * @param {number} categoria - 1 a 5
 * @returns {object} passagem criada
 */
function registerPassagem(placa, gantryId, categoria = 2) {
  const normalized = String(placa).replace(/\s/g, '').toUpperCase();
  if (normalized.length < 7) throw new Error('Placa inválida.');
  const gantry = GANTRIES[gantryId];
  if (!gantry) throw new Error('Pórtico não encontrado: ' + gantryId);
  const cat = Math.min(5, Math.max(1, parseInt(categoria, 10) || 2));
  const valor = gantry.valor[cat] != null ? gantry.valor[cat] : gantry.valor[2];
  const now = new Date();
  const pass = {
    id: nextId(),
    placa: normalized,
    gantryId,
    gantryNome: gantry.nome,
    data: formatDate(now),
    dataHora: now.toISOString(),
    categoria: cat,
    valor: Number(valor.toFixed(2)),
    pago: false,
  };
  passages.push(pass);
  return pass;
}

/**
 * Retorna débitos em aberto (passagens não pagas) de um veículo.
 */
function getDebitos(placa) {
  const normalized = String(placa).replace(/\s/g, '').toUpperCase();
  const lista = passages.filter((p) => p.placa === normalized && !p.pago);
  const agora = new Date();
  const atualizadoEm = formatDateTime(agora);
  let total = 0;
  const debitos = lista.map((p) => {
    total += p.valor;
    return {
      id: p.id,
      identificacao: p.placa,
      data: p.data,
      tipo: 'Free Flow',
      valor: p.valor,
      valorFormatado: `R$ ${p.valor.toFixed(2).replace('.', ',')}`,
      selecionado: true,
      nome: p.gantryNome,
      gantryId: p.gantryId,
    };
  });
  return {
    placa: normalized,
    atualizadoEm,
    debitos,
    totalAPagar: Number(total.toFixed(2)),
    totalAPagarFormatado: `R$ ${total.toFixed(2).replace('.', ',')}`,
  };
}

/**
 * Marca débitos como pagos (por id ou todos da placa).
 */
function marcarComoPago(placa, debitoIds = null) {
  const normalized = String(placa).replace(/\s/g, '').toUpperCase();
  const ids = Array.isArray(debitoIds) ? debitoIds : debitoIds ? [debitoIds] : null;
  let count = 0;
  passages.forEach((p) => {
    if (p.placa !== normalized || p.pago) return;
    if (ids === null || ids.includes(p.id)) {
      p.pago = true;
      count++;
    }
  });
  return { placa: normalized, registrosPagos: count };
}

/**
 * Lista pórticos disponíveis para registro de passagem.
 */
function listarPorticos() {
  return Object.entries(GANTRIES).map(([id, g]) => ({
    id,
    nome: g.nome,
    categorias: g.valor,
  }));
}

module.exports = {
  registerPassagem,
  getDebitos,
  marcarComoPago,
  listarPorticos,
  GANTRIES,
};
