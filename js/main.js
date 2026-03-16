(function () {
  'use strict';

  var viewInicio = document.getElementById('view-inicio');
  var viewDebitos = document.getElementById('view-debitos');
  var formPlacaHero = document.getElementById('form-placa-hero');
  var inputPlacaHero = document.getElementById('placa-hero');
  var btnVoltar = document.getElementById('btn-voltar-debitos');
  var debitosPlacaDisplay = document.getElementById('debitos-placa-display');
  var debitosAtualizado = document.getElementById('debitos-atualizado');
  var debitosSelectAll = document.getElementById('debitos-select-all');
  var debitosSelectAllLabel = document.getElementById('debitos-select-all-label');
  var debitosLista = document.getElementById('debitos-lista');
  var debitosTotalValor = document.getElementById('debitos-total-valor');
  var btnContinuar = document.getElementById('btn-continuar');

  var estadoDebitos = [];

  var headerMain = document.getElementById('header-main');

  function showView(viewId) {
    if (viewId === 'inicio') {
      if (viewInicio) viewInicio.hidden = false;
      if (viewDebitos) viewDebitos.hidden = true;
      if (headerMain) headerMain.style.display = '';
    } else {
      if (viewInicio) viewInicio.hidden = true;
      if (viewDebitos) viewDebitos.hidden = false;
      if (headerMain) headerMain.style.display = 'none';
    }
  }

  function formatarDataPagina() {
    var d = new Date();
    return [
      String(d.getDate()).padStart(2, '0'),
      String(d.getMonth() + 1).padStart(2, '0'),
      d.getFullYear(),
    ].join('/') + ' - ' + [
      String(d.getHours()).padStart(2, '0'),
      String(d.getMinutes()).padStart(2, '0'),
    ].join(':');
  }

  function atualizarTotalPagina() {
    // Força sempre o total de pedágio em R$ 35,36,
    // independente dos valores retornados pela API.
    var fmt = 'R$ 35,36';
    if (debitosTotalValor) debitosTotalValor.textContent = fmt;

    var n = estadoDebitos.length || 1;
    if (debitosSelectAllLabel) debitosSelectAllLabel.textContent = 'Selecionar ' + n + ' passagens em aberto';
    if (debitosSelectAll) debitosSelectAll.checked = true;
  }

  function simulacaoLocal(placaVal) {
    var p = (placaVal || '').replace(/\s|-/g, '').toUpperCase();
    if (p === 'LOK1127' || p === 'AAA0000') {
      return {
        placa: p === 'LOK1127' ? 'LOK1127' : 'AAA0000',
        atualizadoEm: '16/03/2026 - 01:57',
        debitos: [
          {
            id: '1',
            identificacao: p === 'LOK1127' ? 'LOK1127' : 'AAA0000',
            data: '14/03/2026 04:57:35',
            credor: 'CCR Rodovias',
            venceuEm: '15/03/2026',
            valorOriginal: 15.41,
            multa: 5.13,
            juros: 14.82,
            valor: 35.36,
            valorFormatado: 'R$ 35,36',
            selecionado: true,
          },
        ],
        totalAPagarFormatado: 'R$ 35,36',
      };
    }

    var total = 10 + Math.floor(Math.random() * 40);
    var valorOriginal = Math.round(total * 0.5 * 100) / 100;
    var multa = Math.round((total - valorOriginal) * 0.4 * 100) / 100;
    var juros = Math.round((total - valorOriginal - multa) * 100) / 100;
    var d = new Date();
    var dataStr = [
      String(d.getDate()).padStart(2, '0'),
      String(d.getMonth() + 1).padStart(2, '0'),
      d.getFullYear(),
    ].join('/') + ' ' + [
      String(d.getHours()).padStart(2, '0'),
      String(d.getMinutes()).padStart(2, '0'),
      String(d.getSeconds()).padStart(2, '0'),
    ].join(':');
    var placaDisplay = placaVal && placaVal.trim() ? String(placaVal).replace(/\s|-/g, '').toUpperCase() : 'Consulta';

    return {
      placa: placaDisplay,
      atualizadoEm: formatarDataPagina(),
      debitos: [
        {
          id: '1',
          identificacao: placaDisplay,
          data: dataStr,
          credor: 'Concessionária',
          venceuEm: null,
          valorOriginal: valorOriginal,
          multa: multa,
          juros: juros,
          valor: total,
          valorFormatado: 'R$ ' + total.toFixed(2).replace('.', ','),
          selecionado: true,
        },
      ],
      totalAPagarFormatado: 'R$ ' + total.toFixed(2).replace('.', ','),
    };
  }

  function renderPaginaDebitos(data) {
    var placa = data.placa || '—';
    var atualizadoEm = data.atualizadoEm || formatarDataPagina();
    var debitos = data.debitos || [];

    estadoDebitos = debitos.map(function (d) {
      return {
        id: d.id,
        identificacao: d.identificacao,
        data: d.data,
        credor: d.credor || d.tipo || 'CCR Rodovias',
        venceuEm: d.venceuEm,
        valorOriginal: d.valorOriginal != null ? d.valorOriginal : (d.valor || 0),
        multa: d.multa != null ? d.multa : 0,
        juros: d.juros != null ? d.juros : 0,
        valor: d.valor != null ? Number(d.valor) : 0,
        valorFormatado: d.valorFormatado,
        selecionado: d.selecionado !== false,
      };
    });

    if (debitosPlacaDisplay) debitosPlacaDisplay.value = placa !== '—' ? placa : '';
    if (debitosAtualizado) debitosAtualizado.textContent = 'Atualizado em: ' + atualizadoEm;
    // Total fixo: já configurado em atualizarTotalPagina()
    if (debitosTotalValor) debitosTotalValor.textContent = 'R$ 35,36';
    if (debitosSelectAllLabel) debitosSelectAllLabel.textContent = 'Selecionar ' + (estadoDebitos.length || 1) + ' passagens em aberto';
    if (debitosSelectAll) debitosSelectAll.checked = true;

    debitosLista.innerHTML = '';
    estadoDebitos.forEach(function (d, i) {
      var li = document.createElement('li');
      li.className = 'debitos-item';

      // Textos fixos para seguir exatamente o layout desejado
      var valorOrigFmt = 'R$ 15,41';
      var multaFmt = 'R$ 5,13';
      var jurosFmt = 'R$ 14,82';
      // Total fixo por item também em 35,36 (sem R$, igual à referência)
      var totalSemR$ = '35,36';

      var badgeHtml = '<span class="debitos-item-badge">Venceu em 15/03/2026</span>';

      li.innerHTML =
        '<input type="checkbox" class="debito-cb" data-i="' + i + '" ' + (d.selecionado ? 'checked' : '') + '>' +
        '<div class="debitos-item-inner">' +
          '<div class="debitos-item-linha1">' +
            '<span class="debitos-item-ident">' + (d.identificacao || '—') + '</span>' +
            '<span class="debitos-item-data">16/03/2026 03:09:18</span>' +
            badgeHtml +
          '</div>' +
          '<div class="debitos-item-valor-original">' + valorOrigFmt + '</div>' +
          '<div class="debitos-item-credor">CCR Rodovias</div>' +
          '<div class="debitos-item-multa-juros">Multa + Juros: ' + multaFmt + ' + ' + jurosFmt + '</div>' +
          '<div class="debitos-item-total">Total: ' + totalSemR$ + '</div>' +
        '</div>';
      debitosLista.appendChild(li);
    });

    debitosLista.querySelectorAll('.debito-cb').forEach(function (cb) {
      cb.addEventListener('change', function () {
        var i = parseInt(cb.getAttribute('data-i'), 10);
        if (estadoDebitos[i]) estadoDebitos[i].selecionado = cb.checked;
        atualizarTotalPagina();
      });
    });

    if (debitosSelectAll) {
      debitosSelectAll.onclick = null;
      debitosSelectAll.addEventListener('change', function () {
        var checked = debitosSelectAll.checked;
        estadoDebitos.forEach(function (d) { d.selecionado = checked; });
        debitosLista.querySelectorAll('.debito-cb').forEach(function (c) { c.checked = checked; });
        atualizarTotalPagina();
      });
    }
    atualizarTotalPagina();
  }

  function buscarDebitos(placaVal) {
    var API_BASE = '';
    var placaNorm = (placaVal || '').replace(/\s/g, '').trim();

    return fetch((API_BASE || '') + '/api/consulta-pedagio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        placa: placaNorm || undefined,
        origem: 'Origem',
        destino: 'Destino',
        categoria: 2,
      }),
    })
      .then(function (res) {
        return res.json().then(function (data) {
          if (!res.ok) throw new Error(data.erro || 'Erro ao consultar.');
          return data;
        });
      })
      .then(function (data) {
        data.atualizadoEm = data.atualizadoEm || formatarDataPagina();
        if (data.placa && !data.debitos) data.debitos = [];
        return data;
      });
  }

  if (formPlacaHero) {
    formPlacaHero.addEventListener('submit', function (e) {
      e.preventDefault();
      var placaVal = (inputPlacaHero ? inputPlacaHero.value : '').trim();
      if (!placaVal) return;

      var btn = formPlacaHero.querySelector('button[type="submit"]');
      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Buscando...';
      }

      buscarDebitos(placaVal)
        .then(function (data) {
          renderPaginaDebitos(data);
          showView('debitos');
        })
        .catch(function () {
          var data = simulacaoLocal(placaVal);
          renderPaginaDebitos(data);
          showView('debitos');
        })
        .finally(function () {
          if (btn) {
            btn.disabled = false;
            btn.textContent = 'Buscar débitos';
          }
        });
    });
  }

  if (btnVoltar) {
    btnVoltar.addEventListener('click', function () {
      showView('inicio');
    });
  }

  document.querySelectorAll('a[data-view="inicio"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      showView('inicio');
    });
  });

  if (btnContinuar) {
    btnContinuar.addEventListener('click', function () {
      alert('Em breve você poderá prosseguir para o pagamento.');
    });
  }
})();
