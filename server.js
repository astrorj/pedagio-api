require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const { geocode } = require('./api/geocode');
const { getRoutePoints } = require('./api/route');
const { calculateTolls } = require('./api/maplink');
const { getVeiculoByPlaca } = require('./api/placa');
const freeflow = require('./api/freeflow');

const app = express();
app.use(cors());
app.use(express.json());

// Servir front estático (index.html, css, js)
app.use(express.static(path.join(__dirname, '.'), { index: 'index.html' }));

// Pasta assets (banner etc.) em /assets
const assetsPath = path.join(__dirname, 'assets');
app.use('/assets', express.static(assetsPath));

const PORT = process.env.PORT || 3000;

/**
 * GET /api/veiculo/:placa
 * Retorna tipo/categoria do veículo pela placa (se Infosimples configurado).
 */
app.get('/api/veiculo/:placa', async (req, res) => {
  try {
    const placa = req.params.placa.replace(/\s/g, '').toUpperCase();
    if (placa.length < 7) {
      return res.status(400).json({ erro: 'Placa inválida.' });
    }
    const veiculo = await getVeiculoByPlaca(placa);
    if (!veiculo) {
      return res.status(404).json({
        mensagem: 'Consulta por placa não configurada ou placa não encontrada. Use categoria manual no formulário.',
        placa,
      });
    }
    res.json(veiculo);
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

/**
 * POST /api/consulta-pedagio
 * Body: { placa?, origem, destino, categoria? }
 * - Se placa for informada e Infosimples estiver configurado, usa categoria do veículo.
 * - Senão, usa categoria (1-5) informada no body (obrigatório nesse caso).
 * - origem e destino: endereços (ex: "São Paulo, SP") ou coordenadas { lat, lng }.
 * Retorna: valor total real (Maplink), lista de praças e tipo de veículo.
 */
app.post('/api/consulta-pedagio', async (req, res) => {
  try {
    const { placa, origem, destino, categoria: categoriaBody } = req.body;

    let categoria = categoriaBody != null ? parseInt(categoriaBody, 10) : null;
    if (placa && !categoria) {
      const veiculo = await getVeiculoByPlaca(placa);
      if (veiculo && veiculo.categoria) categoria = veiculo.categoria;
    }
    if (!categoria || categoria < 1 || categoria > 5) {
      return res.status(400).json({
        erro: 'Informe a placa (com Infosimples configurado) ou a categoria do veículo (1 a 5).',
      });
    }

    let coordOrigem, coordDestino;
    if (typeof origem === 'object' && origem.latitude != null && origem.longitude != null) {
      coordOrigem = { latitude: origem.latitude, longitude: origem.longitude };
    } else {
      const geoOrigem = await geocode(origem);
      if (!geoOrigem) return res.status(400).json({ erro: 'Origem não encontrada.' });
      coordOrigem = { latitude: geoOrigem.latitude, longitude: geoOrigem.longitude };
    }
    if (typeof destino === 'object' && destino.latitude != null && destino.longitude != null) {
      coordDestino = { latitude: destino.latitude, longitude: destino.longitude };
    } else {
      const geoDestino = await geocode(destino);
      if (!geoDestino) return res.status(400).json({ erro: 'Destino não encontrado.' });
      coordDestino = { latitude: geoDestino.latitude, longitude: geoDestino.longitude };
    }

    const points = await getRoutePoints(coordOrigem, coordDestino);
    const tollResult = await calculateTolls(points, categoria, { freeFlow: true });

    const totalCost = tollResult.totalCost != null ? tollResult.totalCost : 0;
    const legs = tollResult.legs || [];
    const tolls = legs[0] ? (legs[0].tolls || []) : [];
    const agora = new Date();
    const atualizadoEm = [
      String(agora.getDate()).padStart(2, '0'),
      String(agora.getMonth() + 1).padStart(2, '0'),
      agora.getFullYear(),
    ].join('/') + ', ' + [
      String(agora.getHours()).padStart(2, '0'),
      String(agora.getMinutes()).padStart(2, '0'),
      String(agora.getSeconds()).padStart(2, '0'),
    ].join(':');

    const tipoDebito = (type) => {
      if (!type) return 'Praça de pedágio';
      const t = String(type).toUpperCase();
      if (t.includes('GANTRY') || t.includes('EXIT') || t.includes('ENTRY')) return 'Free Flow';
      return 'Praça de pedágio';
    };

    const dataPassagem = [
      String(agora.getDate()).padStart(2, '0'),
      String(agora.getMonth() + 1).padStart(2, '0'),
      agora.getFullYear(),
    ].join('/');

    const debitos = tolls.length
      ? tolls.map((t, i) => ({
          id: t.id || `debito-${i + 1}`,
          identificacao: placa ? String(placa).replace(/\s/g, '').toUpperCase() : null,
          data: dataPassagem,
          tipo: tipoDebito(t.type),
          valor: t.price != null ? Number(t.price) : 0,
          valorFormatado: `R$ ${Number(t.price != null ? t.price : 0).toFixed(2).replace('.', ',')}`,
          selecionado: true,
          nome: t.name || null,
        }))
      : [
          {
            id: 'debito-0',
            identificacao: placa ? String(placa).replace(/\s/g, '').toUpperCase() : null,
            data: dataPassagem,
            tipo: 'Nenhuma praça no trajeto',
            valor: 0,
            valorFormatado: 'R$ 0,00',
            selecionado: true,
            nome: null,
          },
        ];

    const praças = tolls.map((t) => ({
      id: t.id,
      nome: t.name,
      endereco: t.address,
      cidade: t.city,
      valor: t.price,
      tipo: t.type,
    }));

    res.json({
      valorTotal: totalCost,
      valorTotalFormatado: `R$ ${Number(totalCost).toFixed(2).replace('.', ',')}`,
      categoriaVeiculo: categoria,
      quantidadePracas: praças.length,
      pracas: praças,
      placa: placa ? String(placa).replace(/\s/g, '').toUpperCase() : null,
      atualizadoEm,
      debitos,
      totalAPagar: totalCost,
      totalAPagarFormatado: `R$ ${Number(totalCost).toFixed(2).replace('.', ',')}`,
    });
  } catch (e) {
    if (e.message.includes('MAPLINK') || e.message.includes('obrigatórios')) {
      return res.status(503).json({
        erro: 'Serviço de pedágio (Maplink) não configurado. Configure MAPLINK_CLIENT_ID e MAPLINK_CLIENT_SECRET no .env.',
      });
    }
    res.status(500).json({ erro: e.message });
  }
});

app.get('/api/health', (req, res) => {
  const maplinkOk = !!(process.env.MAPLINK_CLIENT_ID && process.env.MAPLINK_CLIENT_SECRET);
  res.json({
    ok: true,
    maplinkConfigurado: maplinkOk,
    infosimplesConfigurado: !!(process.env.INFOSIMPLES_TOKEN && process.env.INFOSIMPLES_EMAIL),
  });
});

/* ========== API Free Flow – cobrança de pedágio ========== */

/** Lista pórticos Free Flow disponíveis */
app.get('/api/freeflow/porticos', (req, res) => {
  try {
    res.json(freeflow.listarPorticos());
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

/** Registra passagem em um pórtico (simula leitura de tag/placa) */
app.post('/api/freeflow/passagem', (req, res) => {
  try {
    const { placa, gantryId, categoria } = req.body;
    if (!placa || !gantryId) {
      return res.status(400).json({ erro: 'Envie placa e gantryId no body.' });
    }
    const passagem = freeflow.registerPassagem(placa, gantryId, categoria || 2);
    res.status(201).json(passagem);
  } catch (e) {
    res.status(400).json({ erro: e.message });
  }
});

/** Consulta débitos em aberto de um veículo pela placa */
app.get('/api/freeflow/debitos/:placa', (req, res) => {
  try {
    const placa = req.params.placa.replace(/\s/g, '').toUpperCase();
    if (placa.length < 7) {
      return res.status(400).json({ erro: 'Placa inválida.' });
    }
    const resultado = freeflow.getDebitos(placa);
    res.json(resultado);
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

/** Marca débitos como pagos (body: { debitoIds?: string[] } - se omitir, paga todos da placa) */
app.post('/api/freeflow/pagamento/:placa', (req, res) => {
  try {
    const placa = req.params.placa.replace(/\s/g, '').toUpperCase();
    const { debitoIds } = req.body || {};
    const resultado = freeflow.marcarComoPago(placa, debitoIds);
    res.json(resultado);
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

// Qualquer outra rota: servir o front (para SPA / refresh na consulta)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n  Site e API: http://localhost:${PORT}`);
  console.log('  Abra esse endereço no navegador para ver o Pedágio Digital.');
  console.log(`  Banner: coloque a imagem em: ${path.join(__dirname, 'assets', 'banner.jpg')}`);
  console.log('  Teste: http://localhost:' + PORT + '/assets/banner.jpg\n');
  console.log('Endpoints: GET /api/veiculo/:placa, POST /api/consulta-pedagio, GET /api/health');
  console.log('Free Flow: GET /api/freeflow/porticos, POST /api/freeflow/passagem, GET /api/freeflow/debitos/:placa, POST /api/freeflow/pagamento/:placa');
});
