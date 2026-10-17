/**
 * PAINEL MUNICIPAL & ELEITORAL BRASIL
 * Lógica Interativa, Mapa Leaflet com Drilldown Geográfico, Gráficos e Estúdio de Cards para Redes Sociais
 */

let APP_DATA = null;
let GEOJSON_ESTADOS = null;
let leafletMap = null;
let geoJsonLayer = null;
let markersLayer = null;

let currentElection = '2026_1t'; // '2026_1t', '2022_1t', '2022_2t'
let drilldownState = {
  level: 'brasil', // 'brasil', 'regiao', 'estado'
  selectedRegion: null,
  selectedState: null
};

// Configurações do Estúdio de Cards
let studioConfig = {
  format: 'feed', // 'feed' (1:1) ou 'story' (9:16)
  theme: 'municipio', // 'municipio', 'perfil', 'nacional', 'eleitoral'
  selectedCity: null,
  selectedProfile: null
};

// Instâncias de Gráficos Chart.js
let chartVotosPerfil = null;
let chartPesoPerfil = null;
let chartAbstencao = null;
let chartSeriesHistoricas = null;
let currentSeriesMetric = 'poder_compra';

// Mapeamento código IBGE de 2 dígitos (codarea no GeoJSON) para Sigla do Estado
const codareaToUf = {
  '11': 'RO', '12': 'AC', '13': 'AM', '14': 'RR', '15': 'PA', '16': 'AP', '17': 'TO',
  '21': 'MA', '22': 'PI', '23': 'CE', '24': 'RN', '25': 'PB', '26': 'PE', '27': 'AL', '28': 'SE', '29': 'BA',
  '31': 'MG', '32': 'ES', '33': 'RJ', '35': 'SP',
  '41': 'PR', '42': 'SC', '43': 'RS',
  '50': 'MS', '51': 'MT', '52': 'GO', '53': 'DF'
};

// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
  try {
    await carregarDados();
    configurarEventosGlobais();
    renderizarRibbonEleitoral();
    initMap();
    renderizarDrilldown(true);
    renderizarGraficos();
    renderizarSeriesHistoricas();
    configurarEstudioCards();
  } catch (error) {
    console.error("Erro ao inicializar dashboard:", error);
  }
});

/**
 * 1. Carregamento dos Dados e GeoJSON
 */
async function carregarDados() {
  const [respData, respGeo] = await Promise.all([
    fetch('data/dashboard_data.json'),
    fetch('data/brasil_estados.json')
  ]);
  
  APP_DATA = await respData.json();
  GEOJSON_ESTADOS = await respGeo.json();
  
  // Define cidade padrão para o estúdio de cards
  const petrolina = APP_DATA.municipios.find(m => m.nm === 'Petrolina' && m.uf === 'PE') || APP_DATA.municipios[0];
  studioConfig.selectedCity = petrolina;
  studioConfig.selectedProfile = Object.keys(APP_DATA.perfis)[0];
}

/**
 * 2. Eventos Globais e Filtro de Busca
 */
function configurarEventosGlobais() {
  // Toggle de Eleições
  document.querySelectorAll('.pill-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.pill-btn').forEach(b => b.classList.remove('active'));
      const target = e.currentTarget;
      target.classList.add('active');
      currentElection = target.getAttribute('data-election');
      
      const titulos = {
        '2026_1t': 'Eleição Presidencial 2026 • 1º Turno',
        '2022_1t': 'Eleição Presidencial 2022 • 1º Turno',
        '2022_2t': 'Eleição Presidencial 2022 • 2º Turno'
      };
      document.getElementById('selected-election-title').textContent = titulos[currentElection];
      
      renderizarRibbonEleitoral();
      renderizarDrilldown(false); // atualiza sem animação agressiva
      atualizarGraficoVotos();
      atualizarPreviewCard();
    });
  });

  // Autocomplete de Busca Discreta por Município
  const searchInput = document.getElementById('city-search-input');
  const searchDropdown = document.getElementById('search-dropdown');

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim().toLowerCase();
    if (query.length < 2) {
      searchDropdown.classList.add('hidden');
      return;
    }

    const matches = APP_DATA.municipios
      .filter(m => m.nm.toLowerCase().includes(query) || (m.nm + " " + m.uf).toLowerCase().includes(query))
      .slice(0, 8);

    if (matches.length === 0) {
      searchDropdown.innerHTML = '<div style="padding: 12px; font-size: 0.85rem; color: #64748B;">Nenhum município encontrado.</div>';
    } else {
      searchDropdown.innerHTML = matches.map(m => {
        const perfilInfo = APP_DATA.perfis[m.pf] || {};
        const cor = perfilInfo.cor || '#4B5563';
        return `
          <div class="search-item" onclick="abrirModalMunicipio('${m.id}')">
            <div>
              <span class="search-item-title">${m.nm}</span>
              <span class="search-item-uf">(${m.uf})</span>
            </div>
            <span class="search-item-badge" style="background-color: ${cor}15; color: ${cor}; border: 1px solid ${cor}40;">
              ${m.pf}
            </span>
          </div>
        `;
      }).join('');
    }
    searchDropdown.classList.remove('hidden');
  });

  // Fechar dropdown ao clicar fora
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-wrapper')) {
      searchDropdown.classList.add('hidden');
    }
  });

  // Tecla ESC limpa busca e fecha modais
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      searchDropdown.classList.add('hidden');
      fecharModalMunicipio();
      fecharEstudioCards();
    }
  });

  // Modal Fechamento
  document.getElementById('btn-close-city-modal').addEventListener('click', fecharModalMunicipio);
  document.getElementById('city-modal').addEventListener('click', (e) => {
    if (e.target.id === 'city-modal') fecharModalMunicipio();
  });

  // Botão Estúdio de Cards
  document.getElementById('btn-open-cards-studio').addEventListener('click', abrirEstudioCards);
  document.getElementById('btn-close-studio').addEventListener('click', fecharEstudioCards);
  document.getElementById('cards-studio-modal').addEventListener('click', (e) => {
    if (e.target.id === 'cards-studio-modal') fecharEstudioCards();
  });
}

/**
 * 3. Ribbon do Cenário Eleitoral Selecionado
 */
function renderizarRibbonEleitoral() {
  const ribbonEl = document.getElementById('election-ribbon');
  const eleicao = APP_DATA.eleicoes_info[currentElection];
  if (!eleicao) return;

  const candidatosHtml = eleicao.candidatos.map(c => `
    <div class="ribbon-candidate">
      <span class="ribbon-color-dot" style="background-color: ${c.cor};"></span>
      <span class="ribbon-name">${c.nome}</span>
      <span class="ribbon-pct">${c.pct.toFixed(2)}%</span>
      <span class="ribbon-votes">(${formatarNumero(c.votos)} votos)</span>
    </div>
  `).join('');

  ribbonEl.innerHTML = `
    ${candidatosHtml}
    <div class="ribbon-divider"></div>
    <div class="ribbon-stat">Votos Válidos: <strong>${formatarNumero(eleicao.votos_validos)}</strong></div>
    <div class="ribbon-stat">Abstenção Média: <strong>${eleicao.abstencao_pct.toFixed(2)}%</strong></div>
  `;
}

/**
 * 4. Inicialização do Mapa Leaflet
 */
function initMap() {
  if (leafletMap) return;

  leafletMap = L.map('interactive-map', {
    center: [-14.235, -51.9253],
    zoom: 4,
    zoomSnap: 0.25,
    zoomDelta: 0.5,
    attributionControl: false,
    maxBounds: [[-40, -85], [10, -25]]
  });

  // Basemap Esri Light Gray Canvas - 100% gratuito, sem necessidade de API Key, neutro e executivo
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 16,
    opacity: 0.95
  }).addTo(leafletMap);

  // Rótulos de referência geográfica suaves (fronteiras e cidades de apoio)
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 16,
    opacity: 0.7
  }).addTo(leafletMap);

  geoJsonLayer = L.geoJSON(null).addTo(leafletMap);
  markersLayer = L.layerGroup().addTo(leafletMap);
}

/**
 * 5. Navegador Hierárquico Geográfico com Mapa (Fade-in e Zoom Suave)
 */
function renderizarDrilldown(animate = true) {
  if (!leafletMap) initMap();

  atualizarBreadcrumb();
  atualizarPainelLateral(animate);
  atualizarMapa(animate);
  renderizarLegendaMapa();
}

/**
 * Atualiza as camadas do mapa conforme o nível de drilldown
 */
function atualizarMapa(animate = true) {
  geoJsonLayer.clearLayers();
  markersLayer.clearLayers();

  const drawer = document.getElementById('state-municipality-drawer');

  if (drilldownState.level === 'brasil') {
    drawer.classList.add('hidden');

    // Nível 1: Estados coloridos pelo Perfil Predominante da Região
    geoJsonLayer.addData(GEOJSON_ESTADOS);
    geoJsonLayer.eachLayer(layer => {
      const cod = layer.feature.properties.codarea;
      const uf = codareaToUf[cod];
      const regiaoNome = APP_DATA.estados[uf]?.regiao;
      const regiaoObj = APP_DATA.regioes[regiaoNome];

      if (regiaoObj) {
        layer.setStyle({
          fillColor: regiaoObj.cor_predominante,
          weight: 1.5,
          opacity: 1,
          color: '#FFFFFF',
          fillOpacity: 0.75
        });

        layer.bindTooltip(`
          <div style="font-size: 0.82rem;">
            <strong>Região ${regiaoNome}</strong><br>
            <span style="color: #CBD5E1;">Perfil Mais Frequente:</span><br>
            <strong style="color: #FEF08A;">● ${regiaoObj.perfil_predominante}</strong> (${regiaoObj.perfil_predominante_pct}% das cidades)<br>
            <small style="color: #93C5FD; margin-top: 4px; display: inline-block;">Clique para aproximar esta região ➔</small>
          </div>
        `, { className: 'leaflet-tooltip-custom', sticky: true });

        layer.on('mouseover', () => {
          layer.setStyle({ weight: 3, color: '#FFFFFF', fillOpacity: 0.92 });
          layer.bringToFront();
        });

        layer.on('mouseout', () => {
          layer.setStyle({ weight: 1.5, color: '#FFFFFF', fillOpacity: 0.75 });
        });

        layer.on('click', () => {
          selecionarRegiao(regiaoNome);
        });
      }
    });

    // Zoom suave para o Brasil inteiro
    leafletMap.flyToBounds([[-33.75, -73.98], [5.27, -34.79]], {
      duration: animate ? 1.0 : 0,
      easeLinearity: 0.25
    });

  } else if (drilldownState.level === 'regiao') {
    drawer.classList.add('hidden');

    const regiaoNome = drilldownState.selectedRegion;
    const regiaoObj = APP_DATA.regioes[regiaoNome];
    const ufsDaRegiao = new Set(regiaoObj.estados);

    geoJsonLayer.addData(GEOJSON_ESTADOS);
    const boundsArray = [];

    geoJsonLayer.eachLayer(layer => {
      const cod = layer.feature.properties.codarea;
      const uf = codareaToUf[cod];

      if (ufsDaRegiao.has(uf)) {
        const ufObj = APP_DATA.estados[uf];
        boundsArray.push(layer.getBounds());

        // Colorido pelo perfil predominante do próprio estado!
        layer.setStyle({
          fillColor: ufObj.cor_predominante,
          weight: 2,
          opacity: 1,
          color: '#FFFFFF',
          fillOpacity: 0.85
        });

        const eleicao = ufObj.eleicoes[currentElection] || {};
        const opositorNome = currentElection.includes('2026') ? 'Flávio' : 'Bolsonaro';
        const opositorPct = currentElection.includes('2026') ? eleicao.flavio_pct : eleicao.bolsonaro_pct;

        layer.bindTooltip(`
          <div style="font-size: 0.82rem;">
            <strong>${ufObj.nome} (${uf})</strong><br>
            <span style="color: #CBD5E1;">Perfil Mais Frequente:</span><br>
            <strong style="color: #FEF08A;">● ${ufObj.perfil_predominante}</strong> (${ufObj.perfil_predominante_pct}%)<br>
            <span style="font-size: 0.75rem;">Lula: <strong>${eleicao.lula_pct || 0}%</strong> | ${opositorNome}: <strong>${opositorPct || 0}%</strong></span><br>
            <small style="color: #93C5FD; margin-top: 4px; display: inline-block;">Clique para ver os municípios ➔</small>
          </div>
        `, { className: 'leaflet-tooltip-custom', sticky: true });

        layer.on('mouseover', () => {
          layer.setStyle({ weight: 3.5, color: '#FFFFFF', fillOpacity: 0.95 });
          layer.bringToFront();
        });

        layer.on('mouseout', () => {
          layer.setStyle({ weight: 2, color: '#FFFFFF', fillOpacity: 0.85 });
        });

        layer.on('click', () => {
          selecionarEstado(uf);
        });
      } else {
        // Estados fora da região ficam em tom neutro e suave
        layer.setStyle({
          fillColor: '#E2E8F0',
          weight: 1,
          opacity: 0.7,
          color: '#CBD5E1',
          fillOpacity: 0.25
        });
      }
    });

    if (boundsArray.length > 0) {
      const combinedBounds = boundsArray.reduce((acc, b) => acc.extend(b), L.latLngBounds(boundsArray[0]));
      leafletMap.flyToBounds(combinedBounds, {
        padding: [30, 30],
        duration: animate ? 1.0 : 0
      });
    }

  } else if (drilldownState.level === 'estado') {
    const ufSigla = drilldownState.selectedState;
    const ufObj = APP_DATA.estados[ufSigla];
    const municipiosDoEstado = APP_DATA.municipios.filter(m => m.uf === ufSigla);

    geoJsonLayer.addData(GEOJSON_ESTADOS);
    let stateBounds = null;

    geoJsonLayer.eachLayer(layer => {
      const cod = layer.feature.properties.codarea;
      const uf = codareaToUf[cod];

      if (uf === ufSigla) {
        stateBounds = layer.getBounds();
        layer.setStyle({
          fillColor: ufObj.cor_predominante,
          weight: 3,
          opacity: 1,
          color: ufObj.cor_predominante,
          fillOpacity: 0.12
        });
      } else {
        layer.setStyle({
          fillColor: '#F1F5F9',
          weight: 0.8,
          opacity: 0.4,
          color: '#CBD5E1',
          fillOpacity: 0.15
        });
      }
    });

    // Adiciona os círculos de cada município com fade-in
    municipiosDoEstado.forEach(m => {
      if (!m.lat || !m.lng) return;

      const corPerfil = (APP_DATA.perfis[m.pf] || {}).cor || '#4B5563';
      const eleic = currentElection === '2026_1t' ? m.e26 : (currentElection === '2022_1t' ? m.e22_1t : m.e22_2t);
      const lulaPct = eleic.lula || 0;
      const opositorPct = currentElection.includes('2026') ? (eleic.flavio || 0) : (eleic.bolsonaro || 0);

      // Raio ajustado suavemente pelo porte populacional
      const raio = Math.min(11, Math.max(4.5, Math.log10(Math.max(1000, m.pop)) * 1.8));

      const marker = L.circleMarker([m.lat, m.lng], {
        radius: raio,
        fillColor: corPerfil,
        fillOpacity: 0.82,
        color: '#FFFFFF',
        weight: 1.2
      });

      marker.bindTooltip(`
        <div style="font-size: 0.82rem;">
          <strong>${m.nm}</strong> (${formatarNumero(m.pop)} hab)<br>
          <span style="color: #CBD5E1;">Perfil:</span> <strong style="color: #FEF08A;">● ${m.pf}</strong><br>
          <span style="font-size: 0.75rem;">Lula: <strong>${lulaPct.toFixed(1)}%</strong> | ${currentElection.includes('2026') ? 'Flávio' : 'Bolsonaro'}: <strong>${opositorPct.toFixed(1)}%</strong></span><br>
          <small style="color: #93C5FD; margin-top: 3px; display: inline-block;">Clique para abrir Raio-X completo ➔</small>
        </div>
      `, { className: 'leaflet-tooltip-custom', sticky: true });

      marker.on('mouseover', () => {
        marker.setStyle({ radius: raio + 2, weight: 2.5, fillOpacity: 1 });
        marker.bringToFront();
      });

      marker.on('mouseout', () => {
        marker.setStyle({ radius: raio, weight: 1.2, fillOpacity: 0.82 });
      });

      marker.on('click', () => {
        abrirModalMunicipio(m.id);
      });

      markersLayer.addLayer(marker);
    });

    if (stateBounds) {
      leafletMap.flyToBounds(stateBounds, {
        padding: [35, 35],
        duration: animate ? 1.0 : 0
      });
    }

    // Exibe tabela de municípios do estado abaixo do mapa
    renderizarTabelaMunicipiosEstado(ufObj, municipiosDoEstado);
  }
}

/**
 * Atualiza o Painel Lateral com Fade-in Suave
 */
function atualizarPainelLateral(animate = true) {
  const panel = document.getElementById('territory-side-panel');
  panel.classList.remove('visible');

  let html = '';

  if (drilldownState.level === 'brasil') {
    // Visão Nacional (5 Regiões)
    const regioes = Object.values(APP_DATA.regioes);
    const eleicaoNacional = APP_DATA.eleicoes_info[currentElection];

    html = `
      <div class="panel-header">
        <span class="panel-eyebrow">VISÃO NACIONAL BRASIL</span>
        <h3 class="panel-title">Distribuição Regional</h3>
        <p class="panel-subtitle">5 Regiões • 27 Unidades da Federação • 5.571 Municípios</p>
      </div>

      <div class="panel-stat-grid">
        <div class="panel-stat-box">
          <span class="panel-stat-num">5.571</span>
          <span class="panel-stat-lbl">Municípios Catalogados</span>
        </div>
        <div class="panel-stat-box">
          <span class="panel-stat-num">${formatarNumero(APP_DATA.totais_nacionais.populacao_total)}</span>
          <span class="panel-stat-lbl">População Brasileira</span>
        </div>
      </div>

      <div class="panel-profile-distrib-title">Perfil Mais Frequente por Região:</div>
      <div class="panel-profile-list">
        ${regioes.map(r => `
          <div class="panel-profile-row" style="cursor: pointer; padding: 6px 8px; border-radius: 6px; transition: background 0.15s;" onclick="selecionarRegiao('${r.nome}')" onmouseover="this.style.background='#F1F5F9'" onmouseout="this.style.background='transparent'">
            <span class="panel-profile-name">
              <span class="panel-profile-dot" style="background-color: ${r.cor_predominante};"></span>
              <strong>${r.nome}</strong>: ${r.perfil_predominante}
            </span>
            <span style="font-weight: 700; color: var(--gov-blue-dark);">${r.perfil_predominante_pct}%</span>
          </div>
        `).join('')}
      </div>

      <div class="panel-hint-box">
        <span class="panel-hint-icon">💡</span>
        <span><strong>Navegação no Mapa:</strong> Clique em qualquer região no mapa ao lado para aproximar os estados com zoom suave.</span>
      </div>
    `;
  } else if (drilldownState.level === 'regiao') {
    // Visão da Região Selecionada
    const reg = APP_DATA.regioes[drilldownState.selectedRegion];
    const eleic = reg.eleicoes[currentElection];
    const opositorNome = currentElection.includes('2026') ? 'Flávio Bolsonaro' : 'Jair Bolsonaro';
    const opositorPct = currentElection.includes('2026') ? eleic.flavio_pct : eleic.bolsonaro_pct;

    html = `
      <div class="panel-header">
        <span class="panel-eyebrow">REGIÃO SELECIONADA</span>
        <h3 class="panel-title">Região ${reg.nome}</h3>
        <p class="panel-subtitle">${reg.total_municipios} municípios • Estados: ${reg.estados.join(', ')}</p>
      </div>

      <div class="panel-predominant-card">
        <span class="predominant-label">Perfil Predominante na Região</span>
        <div class="predominant-value" style="color: ${reg.cor_predominante};">
          ● ${reg.perfil_predominante}
        </div>
        <span class="predominant-pct">${reg.perfil_predominante_pct}% das cidades da região ${reg.nome} pertencem a este agrupamento.</span>
      </div>

      <div class="panel-stat-grid">
        <div class="panel-stat-box">
          <span class="panel-stat-num">${formatarNumero(reg.populacao_total)}</span>
          <span class="panel-stat-lbl">População Total</span>
        </div>
        <div class="panel-stat-box">
          <span class="panel-stat-num">${formatarNumero(reg.eleitores_aptos)}</span>
          <span class="panel-stat-lbl">Eleitores Aptos</span>
        </div>
      </div>

      <!-- Barra Eleitoral na Região -->
      <div style="margin-bottom: 16px;">
        <div style="display: flex; justify-content: space-between; font-size: 0.8rem; font-weight: 600; margin-bottom: 6px;">
          <span style="color: var(--eleitoral-lula);">Lula: ${eleic.lula_pct}%</span>
          <span style="color: var(--eleitoral-bolsonaro);">${opositorNome}: ${opositorPct}%</span>
        </div>
        ${gerarMiniBarraEleitoral(eleic)}
      </div>

      <div class="panel-profile-distrib-title">Composição de Perfis nesta Região:</div>
      <div class="panel-profile-list">
        ${reg.distribuicao_perfis.map(dp => `
          <div class="panel-profile-row">
            <span class="panel-profile-name">
              <span class="panel-profile-dot" style="background-color: ${dp.cor};"></span>
              ${dp.perfil}
            </span>
            <span style="font-weight: 600; color: var(--text-secondary);">${dp.qtd} (${dp.pct}%)</span>
          </div>
        `).join('')}
      </div>

      <div class="panel-hint-box">
        <span class="panel-hint-icon">📍</span>
        <span>Clique em um estado no mapa para visualizar a malha com todos os municípios.</span>
      </div>
    `;
  } else if (drilldownState.level === 'estado') {
    // Visão do Estado Selecionado
    const uf = APP_DATA.estados[drilldownState.selectedState];
    const eleic = uf.eleicoes[currentElection];
    const opositorNome = currentElection.includes('2026') ? 'Flávio Bolsonaro' : 'Jair Bolsonaro';
    const opositorPct = currentElection.includes('2026') ? eleic.flavio_pct : eleic.bolsonaro_pct;

    html = `
      <div class="panel-header">
        <span class="panel-eyebrow">${uf.regiao} • ESTADO</span>
        <h3 class="panel-title">${uf.nome} (${uf.sigla})</h3>
        <p class="panel-subtitle">${uf.total_municipios} municípios catalogados</p>
      </div>

      <div class="panel-predominant-card">
        <span class="predominant-label">Perfil Predominante no Estado</span>
        <div class="predominant-value" style="color: ${uf.cor_predominante};">
          ● ${uf.perfil_predominante}
        </div>
        <span class="predominant-pct">${uf.perfil_predominante_pct}% dos municípios de ${uf.nome} têm este perfil socioeconômico.</span>
      </div>

      <div class="panel-stat-grid">
        <div class="panel-stat-box">
          <span class="panel-stat-num">${formatarNumero(uf.populacao_total)}</span>
          <span class="panel-stat-lbl">População Total</span>
        </div>
        <div class="panel-stat-box">
          <span class="panel-stat-num">${formatarNumero(eleic.votos_validos || 0)}</span>
          <span class="panel-stat-lbl">Votos Válidos</span>
        </div>
      </div>

      <!-- Barra Eleitoral no Estado -->
      <div style="margin-bottom: 16px;">
        <div style="display: flex; justify-content: space-between; font-size: 0.8rem; font-weight: 600; margin-bottom: 6px;">
          <span style="color: var(--eleitoral-lula);">Lula: ${eleic.lula_pct}%</span>
          <span style="color: var(--eleitoral-bolsonaro);">${opositorNome}: ${opositorPct}%</span>
        </div>
        ${gerarMiniBarraEleitoral(eleic)}
      </div>

      <div class="panel-profile-distrib-title">Distribuição de Perfis em ${uf.sigla}:</div>
      <div class="panel-profile-list">
        ${uf.distribuicao_perfis.map(dp => `
          <div class="panel-profile-row">
            <span class="panel-profile-name">
              <span class="panel-profile-dot" style="background-color: ${dp.cor};"></span>
              ${dp.perfil}
            </span>
            <span style="font-weight: 600; color: var(--text-secondary);">${dp.qtd} (${dp.pct}%)</span>
          </div>
        `).join('')}
      </div>

      <div class="panel-hint-box">
        <span class="panel-hint-icon">🔍</span>
        <span>Passe o mouse ou clique em qualquer ponto no mapa para inspecionar os indicadores do município.</span>
      </div>
    `;
  }

  panel.innerHTML = html;

  // Animação de fade-in
  requestAnimationFrame(() => {
    panel.classList.add('visible');
  });
}

/**
 * Tabela de Municípios exibida abaixo do mapa no nível de Estado
 */
function renderizarTabelaMunicipiosEstado(ufObj, municipios) {
  const drawer = document.getElementById('state-municipality-drawer');
  drawer.classList.remove('hidden');

  drawer.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; flex-wrap: wrap; gap: 12px;">
      <div>
        <h4 style="font-family: var(--font-display); font-size: 1.15rem; color: var(--gov-blue-dark);">
          Municípios de ${ufObj.nome} (${municipios.length} cidades)
        </h4>
        <span style="font-size: 0.8rem; color: var(--text-muted);">
          Clique em uma linha para abrir o Raio-X completo e exportar cards para redes sociais.
        </span>
      </div>

      <div style="display: flex; gap: 10px;">
        <input type="text" id="filter-state-mun-input" placeholder="Filtrar município de ${ufObj.sigla}..." style="padding: 6px 12px; font-size: 0.82rem; border: 1px solid var(--border-strong); border-radius: 6px; outline: none;">
      </div>
    </div>

    <div class="mun-table-container">
      <table class="mun-table">
        <thead>
          <tr>
            <th>Município</th>
            <th>Perfil Socioeconômico</th>
            <th>População</th>
            <th>Lula %</th>
            <th>${currentElection.includes('2026') ? 'Flávio %' : 'Bolsonaro %'}</th>
            <th>Farmácia Popular</th>
            <th>Pé-de-Meia</th>
            <th>Aposentadorias RGPS</th>
            <th>CLT / 100 hab</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody id="state-mun-tbody">
          ${renderizarLinhasMunicipios(municipios)}
        </tbody>
      </table>
    </div>
  `;

  // Filtro interativo na tabela
  document.getElementById('filter-state-mun-input').addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase().trim();
    const filtrados = municipios.filter(m => m.nm.toLowerCase().includes(q));
    document.getElementById('state-mun-tbody').innerHTML = renderizarLinhasMunicipios(filtrados);
  });
}

function renderizarLinhasMunicipios(lista) {
  return lista.map(m => {
    const eleic = currentElection === '2026_1t' ? m.e26 : (currentElection === '2022_1t' ? m.e22_1t : m.e22_2t);
    const lulaPct = eleic.lula || 0;
    const opositorPct = currentElection.includes('2026') ? (eleic.flavio || 0) : (eleic.bolsonaro || 0);
    const corPerfil = (APP_DATA.perfis[m.pf] || {}).cor || '#4B5563';

    return `
      <tr onclick="abrirModalMunicipio('${m.id}')">
        <td style="font-weight: 700;">${m.nm}</td>
        <td>
          <span class="mun-profile-pill" style="background-color: ${corPerfil}15; color: ${corPerfil}; border: 1px solid ${corPerfil}30;">
            ${m.pf}
          </span>
        </td>
        <td>${formatarNumero(m.pop)}</td>
        <td style="font-weight: 700; color: var(--eleitoral-lula);">${lulaPct.toFixed(1)}%</td>
        <td style="font-weight: 700; color: var(--eleitoral-bolsonaro);">${opositorPct.toFixed(1)}%</td>
        <td>${m.ind.fp.toFixed(1)} / 100 hab</td>
        <td>${m.ind.pdm.toFixed(1)}%</td>
        <td>${m.ind.apos.toFixed(1)} / 100 hab</td>
        <td>${m.ind.clt.toFixed(1)} / 100 hab</td>
        <td>
          <button class="btn-primary" style="padding: 4px 10px; font-size: 0.74rem;" onclick="event.stopPropagation(); abrirModalMunicipio('${m.id}')">
            Raio-X
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

/**
 * Legenda flutuante sobre o mapa
 */
function renderizarLegendaMapa() {
  const overlay = document.getElementById('map-legend-overlay');
  const perfis = Object.values(APP_DATA.perfis);

  overlay.innerHTML = `
    <div class="legend-title">Perfis Socioeconômicos</div>
    <div class="legend-list">
      ${perfis.map(p => `
        <div class="legend-item">
          <span class="legend-color-dot" style="background-color: ${p.cor};"></span>
          <span>${truncarTexto(p.nome, 28)}</span>
        </div>
      `).join('')}
    </div>
  `;
}

/**
 * Mini Barra de Votação para Cards e Painel
 */
function gerarMiniBarraEleitoral(eleicao) {
  if (!eleicao) return '';
  const lulaPct = eleicao.lula_pct || 0;
  const opositorPct = currentElection.includes('2026') ? (eleicao.flavio_pct || 0) : (eleicao.bolsonaro_pct || 0);
  const outrosPct = Math.max(0, 100 - lulaPct - opositorPct);

  return `
    <div class="territory-election-bar">
      <div class="bar-segment" style="width: ${lulaPct}%; background: var(--eleitoral-lula);"></div>
      <div class="bar-segment" style="width: ${opositorPct}%; background: var(--eleitoral-bolsonaro);"></div>
      <div class="bar-segment" style="width: ${outrosPct}%; background: var(--eleitoral-outros);"></div>
    </div>
    <div class="territory-election-labels">
      <span style="color: var(--eleitoral-lula)">Lula: ${lulaPct.toFixed(1)}%</span>
      <span style="color: var(--eleitoral-bolsonaro)">${currentElection.includes('2026') ? 'Flávio' : 'Bolsonaro'}: ${opositorPct.toFixed(1)}%</span>
    </div>
  `;
}

/**
 * Navegação do Breadcrumb
 */
function atualizarBreadcrumb() {
  const breadcrumb = document.getElementById('drilldown-breadcrumb');
  let html = `
    <button class="crumb-btn ${drilldownState.level === 'brasil' ? 'active' : ''}" onclick="navegarParaNivel('brasil')">
      <svg class="crumb-icon" viewBox="0 0 20 20" fill="currentColor">
        <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
      </svg>
      Brasil (5 Regiões)
    </button>
  `;

  if (drilldownState.selectedRegion) {
    html += `
      <span class="crumb-separator">/</span>
      <button class="crumb-btn ${drilldownState.level === 'regiao' ? 'active' : ''}" onclick="navegarParaNivel('regiao')">
        Região ${drilldownState.selectedRegion}
      </button>
    `;
  }

  if (drilldownState.selectedState) {
    const ufObj = APP_DATA.estados[drilldownState.selectedState];
    html += `
      <span class="crumb-separator">/</span>
      <button class="crumb-btn active" onclick="navegarParaNivel('estado')">
        ${ufObj ? ufObj.nome : drilldownState.selectedState} (${drilldownState.selectedState})
      </button>
    `;
  }

  breadcrumb.innerHTML = html;
}

function selecionarRegiao(nomeRegiao) {
  drilldownState.level = 'regiao';
  drilldownState.selectedRegion = nomeRegiao;
  drilldownState.selectedState = null;
  renderizarDrilldown(true);
}

function selecionarEstado(siglaUf) {
  drilldownState.level = 'estado';
  drilldownState.selectedState = siglaUf;
  renderizarDrilldown(true);
}

function navegarParaNivel(nivel) {
  if (nivel === 'brasil') {
    drilldownState.level = 'brasil';
    drilldownState.selectedRegion = null;
    drilldownState.selectedState = null;
  } else if (nivel === 'regiao') {
    drilldownState.level = 'regiao';
    drilldownState.selectedState = null;
  }
  renderizarDrilldown(true);
}

/**
 * 6. Gráficos Principais (Chart.js)
 */
function renderizarGraficos() {
  renderizarGraficoVotosPorPerfil();
  renderizarGraficoPesoPerfil();
  renderizarGraficoAbstencao();
}

function renderizarGraficoVotosPorPerfil() {
  const ctx = document.getElementById('chart-votos-perfil').getContext('2d');
  const perfis = Object.values(APP_DATA.perfis);
  const labels = perfis.map(p => truncarTexto(p.nome, 25));

  const lulaData = perfis.map(p => p.eleicoes[currentElection].lula_pct);
  const opositorData = perfis.map(p => {
    return currentElection.includes('2026') 
      ? p.eleicoes[currentElection].flavio_pct 
      : p.eleicoes[currentElection].bolsonaro_pct;
  });

  const opositorNome = currentElection.includes('2026') ? 'Flávio Bolsonaro' : 'Jair Bolsonaro';

  chartVotosPerfil = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Lula (%)',
          data: lulaData,
          backgroundColor: '#B84A39',
          borderRadius: 6
        },
        {
          label: `${opositorNome} (%)`,
          data: opositorData,
          backgroundColor: '#1E40AF',
          borderRadius: 6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top', labels: { boxWidth: 12, font: { family: 'Inter', size: 12, weight: 600 } } },
        tooltip: {
          callbacks: {
            title: (items) => perfis[items[0].dataIndex].nome,
            label: (item) => ` ${item.dataset.label}: ${item.raw.toFixed(2)}%`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: { callback: v => v + '%' }
        },
        x: {
          ticks: { font: { size: 10 } }
        }
      }
    }
  });
}

function atualizarGraficoVotos() {
  if (!chartVotosPerfil) return;
  const perfis = Object.values(APP_DATA.perfis);
  const opositorNome = currentElection.includes('2026') ? 'Flávio Bolsonaro' : 'Jair Bolsonaro';

  chartVotosPerfil.data.datasets[0].data = perfis.map(p => p.eleicoes[currentElection].lula_pct);
  chartVotosPerfil.data.datasets[1].label = `${opositorNome} (%)`;
  chartVotosPerfil.data.datasets[1].data = perfis.map(p => {
    return currentElection.includes('2026') 
      ? p.eleicoes[currentElection].flavio_pct 
      : p.eleicoes[currentElection].bolsonaro_pct;
  });
  chartVotosPerfil.update();

  const titulos = {
    '2026_1t': '2026 • 1º Turno',
    '2022_1t': '2022 • 1º Turno',
    '2022_2t': '2022 • 2º Turno'
  };
  document.getElementById('chart1-tag').textContent = titulos[currentElection];
}

function renderizarGraficoPesoPerfil() {
  const ctx = document.getElementById('chart-peso-perfil').getContext('2d');
  const perfis = Object.values(APP_DATA.perfis);
  const labels = perfis.map(p => truncarTexto(p.nome, 25));
  const cores = perfis.map(p => p.cor);

  const pesoEleitores = perfis.map(p => p.pct_eleitorado_nacional);

  chartPesoPerfil = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: '% do Eleitorado Nacional',
          data: pesoEleitores,
          backgroundColor: cores,
          borderRadius: 6
        }
      ]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: (items) => perfis[items[0].dataIndex].nome,
            label: (item) => ` ${item.dataset.label}: ${item.raw.toFixed(2)}% do Brasil`
          }
        }
      },
      scales: {
        x: {
          ticks: { callback: v => v + '%' }
        }
      }
    }
  });
}

function renderizarGraficoAbstencao() {
  const ctx = document.getElementById('chart-abstencao-historica').getContext('2d');
  const perfis = Object.values(APP_DATA.perfis);
  const anos = ['2010', '2014', '2018', '2022', '2026'];

  const datasets = perfis.map(p => ({
    label: p.nome,
    data: anos.map(ano => p.historico_abstencao[ano] || 0),
    borderColor: p.cor,
    backgroundColor: p.cor,
    borderWidth: 2.5,
    tension: 0.25,
    pointRadius: 4,
    pointHoverRadius: 6
  }));

  chartAbstencao = new Chart(ctx, {
    type: 'line',
    data: {
      labels: anos.map(a => `Eleição ${a}`),
      datasets: datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { boxWidth: 12, font: { family: 'Inter', size: 11 } }
        },
        tooltip: {
          callbacks: {
            label: (item) => ` ${item.dataset.label}: ${item.raw.toFixed(2)}% abstenção`
          }
        }
      },
      scales: {
        y: {
          ticks: { callback: v => v + '%' },
          title: { display: true, text: 'Taxa de Abstenção Média' }
        }
      }
    }
  });
}

/**
 * 6B. Séries Históricas & Poder de Compra (2016 – 2026)
 */
function renderizarSeriesHistoricas() {
  if (!APP_DATA || !APP_DATA.series_historicas) return;

  // Configura botões de abas
  document.querySelectorAll('.series-tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.series-tab-btn').forEach(b => b.classList.remove('active'));
      const target = e.currentTarget;
      target.classList.add('active');
      currentSeriesMetric = target.getAttribute('data-metric');
      atualizarGraficoSeriesHistoricas();
    });
  });

  atualizarGraficoSeriesHistoricas();
}

function atualizarGraficoSeriesHistoricas() {
  const chartCanvas = document.getElementById('chart-series-historicas');
  if (!chartCanvas) return;
  const ctx = chartCanvas.getContext('2d');
  const dados = APP_DATA.series_historicas.nacional;
  const anos = dados.map(d => d.ano);

  const titleEl = document.getElementById('series-chart-title');
  const subtitleEl = document.getElementById('series-chart-subtitle');
  const tagEl = document.getElementById('series-chart-tag');
  const highlightsEl = document.getElementById('series-highlights-grid');

  let datasets = [];
  let yAxisConfig = {};
  let highlightsHtml = '';

  if (currentSeriesMetric === 'poder_compra') {
    titleEl.textContent = 'Custo de Bens Essenciais em % do Salário Mínimo';
    subtitleEl.textContent = 'Proporção da renda mínima necessária para adquirir Cesta Básica e Botijão de Gás';
    tagEl.textContent = 'DIEESE / ANP / BCB';

    highlightsHtml = `
      <div class="series-highlight-box" style="border-left: 4px solid #1A56DB;">
        <span class="series-highlight-title">Cesta Básica (% Salário Mínimo)</span>
        <div class="series-highlight-val">54,5% <span style="font-size: 0.8rem; color: #0E9F6E; font-weight: 700;">▼ -8.4 p.p.</span></div>
        <span class="series-highlight-sub">No pico de 2022 consumia 62,9% do salário mínimo; em 2026 caiu para 54,5%.</span>
      </div>
      <div class="series-highlight-box" style="border-left: 4px solid #0E9F6E;">
        <span class="series-highlight-title">Botijão de Gás GLP 13kg</span>
        <div class="series-highlight-val">6,7% <span style="font-size: 0.8rem; color: #0E9F6E; font-weight: 700;">▼ -2.4 p.p.</span></div>
        <span class="series-highlight-sub">Chegou a consumir 9,1% do salário mínimo em 2022; agora exige 6,7%.</span>
      </div>
      <div class="series-highlight-box" style="border-left: 4px solid #D97706;">
        <span class="series-highlight-title">1 Litro de Gasolina Comum</span>
        <div class="series-highlight-val">0,41% <span style="font-size: 0.8rem; color: #0E9F6E; font-weight: 700;">▼ -0.12 p.p.</span></div>
        <span class="series-highlight-sub">Em 2022, 1L de gasolina exigia 0,53% do salário mínimo; agora exige 0,41%.</span>
      </div>
      <div class="series-highlight-box" style="border-left: 4px solid #7E3AF2;">
        <span class="series-highlight-title">Salário Mínimo Nominal</span>
        <div class="series-highlight-val">R$ 1.518 <span style="font-size: 0.8rem; color: #1A56DB; font-weight: 700;">▲ +72.5%</span></div>
        <span class="series-highlight-sub">Evoluiu de R$ 880 (2016) e R$ 1.212 (2022) para R$ 1.518 com ganho real.</span>
      </div>
    `;

    datasets = [
      {
        label: 'Cesta Básica (% do Salário Mínimo)',
        data: dados.map(d => d.cesta_basica_pct_sm),
        borderColor: '#1A56DB',
        backgroundColor: 'rgba(26, 86, 219, 0.08)',
        borderWidth: 3,
        tension: 0.25,
        fill: true,
        pointRadius: 4
      },
      {
        label: 'Botijão de Gás (% do Salário Mínimo)',
        data: dados.map(d => d.gas_glp_pct_sm),
        borderColor: '#0E9F6E',
        backgroundColor: 'rgba(14, 159, 110, 0.08)',
        borderWidth: 3,
        tension: 0.25,
        pointRadius: 4
      }
    ];

    yAxisConfig = {
      ticks: { callback: v => v + '%' },
      title: { display: true, text: 'Comprometimento da Renda Mínima (%)' }
    };

  } else if (currentSeriesMetric === 'veiculos') {
    titleEl.textContent = 'Venda e Transferência de Veículos no Brasil (2016 – 2026)';
    subtitleEl.textContent = 'Volume anual de licenciamentos de novos (0 km) e transferências de usados (milhões de unidades)';
    tagEl.textContent = 'ANFAVEA / FENAUTO / BCB';

    highlightsHtml = `
      <div class="series-highlight-box" style="border-left: 4px solid #0E9F6E;">
        <span class="series-highlight-title">Veículos Usados e Seminovos</span>
        <div class="series-highlight-val">12,85 M <span style="font-size: 0.8rem; color: #0E9F6E; font-weight: 700;">▲ Recorde</span></div>
        <span class="series-highlight-sub">Volume anual de transferências no mercado formal (era 10,38M em 2022).</span>
      </div>
      <div class="series-highlight-box" style="border-left: 4px solid #1A56DB;">
        <span class="series-highlight-title">Veículos Novos (0 km)</span>
        <div class="series-highlight-val">2,65 M <span style="font-size: 0.8rem; color: #1A56DB; font-weight: 700;">▲ Retomada</span></div>
        <span class="series-highlight-sub">Licenciamentos anuais de automóveis e comerciais leves.</span>
      </div>
      <div class="series-highlight-box" style="border-left: 4px solid #D97706;">
        <span class="series-highlight-title">Razão Usados por Novo</span>
        <div class="series-highlight-val">4,80x</div>
        <span class="series-highlight-sub">Para cada 1 carro 0 km vendido no Brasil, giram 4,8 carros usados.</span>
      </div>
      <div class="series-highlight-box" style="border-left: 4px solid #7E3AF2;">
        <span class="series-highlight-title">Crédito Automotivo</span>
        <div class="series-highlight-val">+22,4%</div>
        <span class="series-highlight-sub">Expansão na concessão de financiamentos para aquisição de veículos.</span>
      </div>
    `;

    datasets = [
      {
        label: 'Veículos Usados Vendidos (Milhões)',
        data: dados.map(d => d.veiculos_usados_milhoes),
        backgroundColor: '#0E9F6E',
        borderRadius: 6,
        type: 'bar'
      },
      {
        label: 'Veículos Novos Licenciados (Milhões)',
        data: dados.map(d => d.veiculos_novos_milhoes),
        backgroundColor: '#1A56DB',
        borderRadius: 6,
        type: 'bar'
      }
    ];

    yAxisConfig = {
      ticks: { callback: v => v + ' M' },
      title: { display: true, text: 'Milhões de Veículos' }
    };

  } else if (currentSeriesMetric === 'habitacao') {
    titleEl.textContent = 'Financiamento Habitacional (SBPE) e Mercado Imobiliário';
    subtitleEl.textContent = 'Unidades financiadas pela poupança SBPE e valor médio do aluguel residencial';
    tagEl.textContent = 'ABECIP / BCB / FipeZAP';

    highlightsHtml = `
      <div class="series-highlight-box" style="border-left: 4px solid #1A56DB;">
        <span class="series-highlight-title">Imóveis Financiados SBPE</span>
        <div class="series-highlight-val">182 mil <span style="font-size: 0.8rem; color: #1A56DB; font-weight: 700;">▲ 2,4x vs 2016</span></div>
        <span class="series-highlight-sub">Evoluiu de 73,5 mil unidades em 2016 para mais de 180 mil ao ano.</span>
      </div>
      <div class="series-highlight-box" style="border-left: 4px solid #7E3AF2;">
        <span class="series-highlight-title">Crédito Habitacional PF</span>
        <div class="series-highlight-val">R$ 230 Bi</div>
        <span class="series-highlight-sub">Volume total anual de empréstimos imobiliários concedidos via SBPE.</span>
      </div>
      <div class="series-highlight-box" style="border-left: 4px solid #0E9F6E;">
        <span class="series-highlight-title">Aluguel Médio Residencial</span>
        <div class="series-highlight-val">R$ 2.670 <span style="font-size: 0.8rem; color: #4B5563; font-weight: 700;">FipeZAP</span></div>
        <span class="series-highlight-sub">Valor de referência para imóvel padrão (60m²) nas capitais monitoradas.</span>
      </div>
      <div class="series-highlight-box" style="border-left: 4px solid #D97706;">
        <span class="series-highlight-title">Faturamento do Comércio</span>
        <div class="series-highlight-val">R$ 4,1 Tri</div>
        <span class="series-highlight-sub">Faturamento anual do comércio varejista ampliado (PMC / IBGE).</span>
      </div>
    `;

    datasets = [
      {
        label: 'Unidades Financiadas SBPE (Milhares)',
        data: dados.map(d => d.imoveis_sbpe_unidades),
        borderColor: '#1A56DB',
        backgroundColor: 'rgba(26, 86, 219, 0.1)',
        borderWidth: 3,
        tension: 0.25,
        fill: true,
        pointRadius: 4
      }
    ];

    yAxisConfig = {
      ticks: { callback: v => v + ' mil' },
      title: { display: true, text: 'Milhares de Unidades' }
    };

  } else if (currentSeriesMetric === 'trabalho_agro') {
    titleEl.textContent = 'Mercado Formal, Empreendedorismo e Balança do Agronegócio';
    subtitleEl.textContent = 'Evolução de empregos com carteira (CLT), MEIs cadastrados e superávit do Agro';
    tagEl.textContent = 'MTE / RFB / MAPA';

    highlightsHtml = `
      <div class="series-highlight-box" style="border-left: 4px solid #1A56DB;">
        <span class="series-highlight-title">Empregos Formais CLT</span>
        <div class="series-highlight-val">102,7 M <span style="font-size: 0.8rem; color: #0E9F6E; font-weight: 700;">▲ +6,7 M vs 2022</span></div>
        <span class="series-highlight-sub">Passou de 96,0M em 2022 para 102,7M de pessoas com carteira assinada.</span>
      </div>
      <div class="series-highlight-box" style="border-left: 4px solid #D97706;">
        <span class="series-highlight-title">Microempreendedores MEI</span>
        <div class="series-highlight-val">16,94 M <span style="font-size: 0.8rem; color: #D97706; font-weight: 700;">▲ 2,6x vs 2016</span></div>
        <span class="series-highlight-sub">Passou de 6,55M em 2016 para 16,9M de microempreendedores ativos.</span>
      </div>
      <div class="series-highlight-box" style="border-left: 4px solid #0E9F6E;">
        <span class="series-highlight-title">Saldo Exportador do Agro</span>
        <div class="series-highlight-val">US$ 140,5 Bi <span style="font-size: 0.8rem; color: #0E9F6E; font-weight: 700;">▲ Quase 2x</span></div>
        <span class="series-highlight-sub">Superávit comercial líquido do agronegócio (era US$ 71,3 Bi em 2016).</span>
      </div>
      <div class="series-highlight-box" style="border-left: 4px solid #7E3AF2;">
        <span class="series-highlight-title">Abertura de Empresas</span>
        <div class="series-highlight-val">3,95 M/ano</div>
        <span class="series-highlight-sub">Novos CNPJs abertos por ano em todo o território nacional.</span>
      </div>
    `;

    datasets = [
      {
        label: 'Trabalhadores CLT (Milhões)',
        data: dados.map(d => d.clt_milhoes),
        borderColor: '#1A56DB',
        backgroundColor: '#1A56DB',
        borderWidth: 3,
        tension: 0.25,
        pointRadius: 4
      },
      {
        label: 'Saldo Agro (US$ Bi)',
        data: dados.map(d => d.agro_saldo_usd_bi),
        borderColor: '#0E9F6E',
        backgroundColor: '#0E9F6E',
        borderWidth: 3,
        tension: 0.25,
        pointRadius: 4
      }
    ];

    yAxisConfig = {
      title: { display: true, text: 'Volume de Atividade' }
    };
  }

  highlightsEl.innerHTML = highlightsHtml;

  if (chartSeriesHistoricas) {
    chartSeriesHistoricas.destroy();
  }

  chartSeriesHistoricas = new Chart(ctx, {
    type: 'line',
    data: {
      labels: anos.map(a => `${a}`),
      datasets: datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: { boxWidth: 12, font: { family: 'Inter', size: 12, weight: 600 } }
        },
        tooltip: {
          callbacks: {
            title: (items) => `Ano: ${items[0].label}`,
            label: (item) => ` ${item.dataset.label}: ${item.raw.toLocaleString('pt-BR')}`
          }
        }
      },
      scales: {
        y: yAxisConfig,
        x: {
          grid: { display: false }
        }
      }
    }
  });
}

/**
 * 7. Modal de Raio-X do Município
 */
function abrirModalMunicipio(idIbge) {
  const m = APP_DATA.municipios.find(c => c.id === idIbge);
  if (!m) return;

  const perfil = APP_DATA.perfis[m.pf] || {};
  const corPerfil = perfil.cor || '#4B5563';
  const eleic = currentElection === '2026_1t' ? m.e26 : (currentElection === '2022_1t' ? m.e22_1t : m.e22_2t);
  const lulaPct = eleic.lula || 0;
  const opositorPct = currentElection.includes('2026') ? (eleic.flavio || 0) : (eleic.bolsonaro || 0);

  const modalBody = document.getElementById('city-modal-body');
  modalBody.innerHTML = `
    <div class="city-detail-header">
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <h2 class="city-detail-title">${m.nm}</h2>
        <span class="city-detail-badge" style="background-color: ${corPerfil}20; color: ${corPerfil}; border: 1px solid ${corPerfil}50;">
          ${m.pf}
        </span>
      </div>
      <div class="city-detail-meta">
        <span style="font-weight: 600; color: var(--text-secondary);">${m.uf} • Região ${m.reg}</span>
        <span style="color: var(--text-muted);">•</span>
        <span style="color: var(--text-muted);">${formatarNumero(m.pop)} habitantes</span>
        <span style="color: var(--text-muted);">•</span>
        <span style="color: var(--text-muted);">${formatarNumero(eleic.vtot || 0)} votos válidos</span>
      </div>
      <p style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 10px; line-height: 1.4;">
        ${perfil.descricao || ''}
      </p>
    </div>

    <!-- Indicadores do Município -->
    <h4 style="font-size: 0.95rem; font-weight: 700; color: var(--gov-blue-dark); margin-bottom: 12px;">
      Indicadores Socioeconômicos & Programas
    </h4>
    <div class="city-indicators-grid">
      <div class="indicator-box">
        <span class="indicator-box-label">Farmácia Popular</span>
        <div class="indicator-box-val">${m.ind.fp.toFixed(1)}</div>
        <span class="indicator-box-sub">beneficiários por 100 hab</span>
      </div>
      <div class="indicator-box">
        <span class="indicator-box-label">Pé-de-Meia (Cobertura)</span>
        <div class="indicator-box-val">${m.ind.pdm.toFixed(1)}%</div>
        <span class="indicator-box-sub">jovens do EM com poupança</span>
      </div>
      <div class="indicator-box">
        <span class="indicator-box-label">Aposentadorias RGPS</span>
        <div class="indicator-box-val">${m.ind.apos.toFixed(1)}</div>
        <span class="indicator-box-sub">aposentados por 100 hab</span>
      </div>
      <div class="indicator-box">
        <span class="indicator-box-label">Dependência Fundeb</span>
        <div class="indicator-box-val">${m.ind.fundeb.toFixed(1)}%</div>
        <span class="indicator-box-sub">complementação da União</span>
      </div>
      <div class="indicator-box">
        <span class="indicator-box-label">Empregos CLT</span>
        <div class="indicator-box-val">${m.ind.clt.toFixed(1)}</div>
        <span class="indicator-box-sub">postos formais por 100 hab</span>
      </div>
      <div class="indicator-box">
        <span class="indicator-box-label">Bolsa Família</span>
        <div class="indicator-box-val">${m.ind.bf.toFixed(1)}</div>
        <span class="indicator-box-sub">famílias por 100 hab</span>
      </div>
    </div>

    <!-- Votação Eleitoral do Município -->
    <h4 style="font-size: 0.95rem; font-weight: 700; color: var(--gov-blue-dark); margin-bottom: 12px;">
      Desempenho Eleitoral no Município
    </h4>
    <div class="city-election-breakdown">
      <div style="display: flex; justify-content: space-between; font-size: 0.82rem; font-weight: 600; margin-bottom: 8px;">
        <span style="color: var(--eleitoral-lula);">Lula: ${lulaPct.toFixed(1)}%</span>
        <span style="color: var(--eleitoral-bolsonaro);">${currentElection.includes('2026') ? 'Flávio' : 'Bolsonaro'}: ${opositorPct.toFixed(1)}%</span>
      </div>
      <div class="territory-election-bar" style="height: 10px;">
        <div class="bar-segment" style="width: ${lulaPct}%; background: var(--eleitoral-lula);"></div>
        <div class="bar-segment" style="width: ${opositorPct}%; background: var(--eleitoral-bolsonaro);"></div>
        <div class="bar-segment" style="width: ${Math.max(0, 100 - lulaPct - opositorPct)}%; background: var(--eleitoral-outros);"></div>
      </div>
    </div>

    <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; flex-wrap: wrap;">
      <button class="social-share-btn btn-whatsapp" style="padding: 10px 16px; font-size: 0.85rem;" onclick="compartilharMunicipioDiretoWhatsApp('${m.id}')">
        <svg viewBox="0 0 24 24" fill="currentColor" class="social-icon">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.05 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
        </svg>
        WhatsApp
      </button>

      <button class="btn-primary" onclick="carregarMunicipioNoEstudio('${m.id}')">
        <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <polyline points="21 15 16 10 5 21"></polyline>
        </svg>
        Gerar Card para Redes Sociais
      </button>
    </div>
  `;

  document.getElementById('city-modal').classList.remove('hidden');
}

function fecharModalMunicipio() {
  document.getElementById('city-modal').classList.add('hidden');
}

/**
 * 8. Estúdio Gerador de Cards para Redes Sociais & Exportação PNG
 */
function configurarEstudioCards() {
  // Preencher Select de Perfis
  const perfilSelect = document.getElementById('studio-profile-select');
  perfilSelect.innerHTML = Object.keys(APP_DATA.perfis).map(p => `<option value="${p}">${p}</option>`).join('');

  // Troca de Formato (Feed 1:1 vs Story 9:16)
  document.getElementById('format-btn-feed').addEventListener('click', () => {
    document.getElementById('format-btn-feed').classList.add('active');
    document.getElementById('format-btn-story').classList.remove('active');
    studioConfig.format = 'feed';
    document.getElementById('card-render-stage').className = 'card-render-stage format-feed';
    atualizarPreviewCard();
  });

  document.getElementById('format-btn-story').addEventListener('click', () => {
    document.getElementById('format-btn-story').classList.add('active');
    document.getElementById('format-btn-feed').classList.remove('active');
    studioConfig.format = 'story';
    document.getElementById('card-render-stage').className = 'card-render-stage format-story';
    atualizarPreviewCard();
  });

  // Troca de Tema
  document.getElementById('studio-theme-select').addEventListener('change', (e) => {
    studioConfig.theme = e.target.value;
    const ctrlCity = document.getElementById('ctrl-group-select-city');
    const ctrlProfile = document.getElementById('ctrl-group-select-profile');

    if (studioConfig.theme === 'municipio') {
      ctrlCity.classList.remove('hidden');
      ctrlProfile.classList.add('hidden');
    } else if (studioConfig.theme === 'perfil') {
      ctrlCity.classList.add('hidden');
      ctrlProfile.classList.remove('hidden');
    } else {
      ctrlCity.classList.add('hidden');
      ctrlProfile.classList.add('hidden');
    }
    atualizarPreviewCard();
  });

  // Busca de Cidade no Estúdio
  const cityInput = document.getElementById('studio-city-input');
  const cityResults = document.getElementById('studio-city-results');

  cityInput.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase().trim();
    if (q.length < 2) {
      cityResults.classList.add('hidden');
      return;
    }
    const matches = APP_DATA.municipios.filter(m => (m.nm + " " + m.uf).toLowerCase().includes(q)).slice(0, 6);
    cityResults.innerHTML = matches.map(m => `
      <div class="studio-city-item" onclick="selecionarCidadeEstudio('${m.id}')">
        <strong>${m.nm}</strong> (${m.uf}) • <span style="color: #64748B;">${m.pf}</span>
      </div>
    `).join('');
    cityResults.classList.remove('hidden');
  });

  perfilSelect.addEventListener('change', (e) => {
    studioConfig.selectedProfile = e.target.value;
    atualizarPreviewCard();
  });

  // Botão Download PNG via html2canvas
  document.getElementById('btn-download-card').addEventListener('click', exportarCardPNG);

  // Botões de Compartilhamento em Redes Sociais
  document.getElementById('btn-share-whatsapp').addEventListener('click', compartilharWhatsApp);
  document.getElementById('btn-copy-card-img').addEventListener('click', copiarImagemCard);
  document.getElementById('btn-native-share').addEventListener('click', compartilharNativo);
  document.getElementById('btn-share-x').addEventListener('click', compartilharX);
  document.getElementById('btn-share-telegram').addEventListener('click', compartilharTelegram);
  document.getElementById('btn-share-linkedin').addEventListener('click', compartilharLinkedIn);
}

function selecionarCidadeEstudio(id) {
  const m = APP_DATA.municipios.find(c => c.id === id);
  if (!m) return;
  studioConfig.selectedCity = m;
  document.getElementById('studio-city-input').value = `${m.nm} (${m.uf})`;
  document.getElementById('studio-city-results').classList.add('hidden');
  atualizarPreviewCard();
}

function carregarMunicipioNoEstudio(id) {
  fecharModalMunicipio();
  selecionarCidadeEstudio(id);
  studioConfig.theme = 'municipio';
  document.getElementById('studio-theme-select').value = 'municipio';
  document.getElementById('ctrl-group-select-city').classList.remove('hidden');
  document.getElementById('ctrl-group-select-profile').classList.add('hidden');
  abrirEstudioCards();
}

function abrirEstudioCards() {
  document.getElementById('cards-studio-modal').classList.remove('hidden');
  atualizarPreviewCard();
}

function fecharEstudioCards() {
  document.getElementById('cards-studio-modal').classList.add('hidden');
}

/**
 * Renderização em Tempo Real do Card no Estúdio
 */
function atualizarPreviewCard() {
  const stage = document.getElementById('card-render-stage');
  const eleicNome = currentElection === '2026_1t' ? 'Eleição 2026' : (currentElection === '2022_1t' ? '2022 (1ºT)' : '2022 (2ºT)');

  if (studioConfig.theme === 'municipio') {
    const m = studioConfig.selectedCity || APP_DATA.municipios[0];
    const perfil = APP_DATA.perfis[m.pf] || {};
    const eleic = currentElection === '2026_1t' ? m.e26 : (currentElection === '2022_1t' ? m.e22_1t : m.e22_2t);
    const lulaPct = eleic.lula || 0;
    const opositorPct = currentElection.includes('2026') ? (eleic.flavio || 0) : (eleic.bolsonaro || 0);

    stage.innerHTML = `
      <div class="card-export-header">
        <div class="card-export-brand"><span class="brand-pill">BRASIL</span> <span>Inteligência Municipal</span></div>
        <span class="card-export-tag">RAIO-X MUNICIPAL</span>
      </div>

      <div class="card-export-title">${m.nm} • ${m.uf}</div>
      <div class="card-export-subtitle">Perfil: <strong>${m.pf}</strong> • ${formatarNumero(m.pop)} hab</div>

      <div class="card-export-stats-grid">
        <div class="card-export-stat-box">
          <span class="card-export-stat-val">${m.ind.fp.toFixed(1)}</span>
          <span class="card-export-stat-lbl">Farmácia Popular (benef./100 hab)</span>
        </div>
        <div class="card-export-stat-box">
          <span class="card-export-stat-val">${m.ind.pdm.toFixed(1)}%</span>
          <span class="card-export-stat-lbl">Pé-de-Meia (Poupança Jovens)</span>
        </div>
        <div class="card-export-stat-box">
          <span class="card-export-stat-val">${m.ind.apos.toFixed(1)}</span>
          <span class="card-export-stat-lbl">Aposentados RGPS / 100 hab</span>
        </div>
        <div class="card-export-stat-box">
          <span class="card-export-stat-val">${m.ind.clt.toFixed(1)}</span>
          <span class="card-export-stat-lbl">Empregos Formais CLT / 100 hab</span>
        </div>
      </div>

      <div class="card-export-election-box">
        <div class="card-export-election-header">
          <span>Resultado ${eleicNome}</span>
          <span>${formatarNumero(eleic.vtot || 0)} votos</span>
        </div>
        <div class="card-export-election-bars">
          <div class="card-export-cand-pill">
            <span style="color: #F87171; font-weight: 700;">Lula</span>
            <span style="font-weight: 800;">${lulaPct.toFixed(1)}%</span>
          </div>
          <div class="card-export-cand-pill">
            <span style="color: #93C5FD; font-weight: 700;">${currentElection.includes('2026') ? 'Flávio' : 'Bolsonaro'}</span>
            <span style="font-weight: 800;">${opositorPct.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      <div class="card-export-footer">
        <span class="card-export-seal">✔ DADOS OFICIAIS CONSOLIDADOS</span>
        <span>TSE • IBGE • MINISTÉRIOS</span>
      </div>
    `;
  } else if (studioConfig.theme === 'perfil') {
    const pNome = studioConfig.selectedProfile || Object.keys(APP_DATA.perfis)[0];
    const perfil = APP_DATA.perfis[pNome];
    const eleic = perfil.eleicoes[currentElection];
    const opositorNome = currentElection.includes('2026') ? 'Flávio' : 'Bolsonaro';
    const opositorPct = currentElection.includes('2026') ? eleic.flavio_pct : eleic.bolsonaro_pct;

    stage.innerHTML = `
      <div class="card-export-header">
        <div class="card-export-brand"><span class="brand-pill">BRASIL</span> <span>Inteligência Municipal</span></div>
        <span class="card-export-tag">PERFIL SOCIOECONÔMICO</span>
      </div>

      <div class="card-export-title">${perfil.nome}</div>
      <div class="card-export-subtitle">${perfil.total_cidades} municípios • ${perfil.pct_eleitorado_nacional}% do eleitorado nacional</div>

      <div class="card-export-stats-grid">
        <div class="card-export-stat-box">
          <span class="card-export-stat-val">${perfil.indicadores_medios.farmacia_popular_100_hab}</span>
          <span class="card-export-stat-lbl">Farmácia Pop. / 100 hab</span>
        </div>
        <div class="card-export-stat-box">
          <span class="card-export-stat-val">${perfil.indicadores_medios.pe_de_meia_pct}%</span>
          <span class="card-export-stat-lbl">Cobertura Pé-de-Meia</span>
        </div>
        <div class="card-export-stat-box">
          <span class="card-export-stat-val">${perfil.indicadores_medios.aposentados_100_hab}</span>
          <span class="card-export-stat-lbl">Aposentados / 100 hab</span>
        </div>
        <div class="card-export-stat-box">
          <span class="card-export-stat-val">${perfil.indicadores_medios.clt_100_hab}</span>
          <span class="card-export-stat-lbl">Trabalhadores CLT / 100 hab</span>
        </div>
      </div>

      <div class="card-export-election-box">
        <div class="card-export-election-header">
          <span>Média Eleitoral no Perfil (${eleicNome})</span>
          <span>Abstenção: ${eleic.taxa_abstencao}%</span>
        </div>
        <div class="card-export-election-bars">
          <div class="card-export-cand-pill">
            <span style="color: #F87171; font-weight: 700;">Lula</span>
            <span style="font-weight: 800;">${eleic.lula_pct.toFixed(1)}%</span>
          </div>
          <div class="card-export-cand-pill">
            <span style="color: #93C5FD; font-weight: 700;">${opositorNome}</span>
            <span style="font-weight: 800;">${opositorPct.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      <div class="card-export-footer">
        <span class="card-export-seal">✔ DADOS OFICIAIS CONSOLIDADOS</span>
        <span>IBGE • TSE • MINISTÉRIOS</span>
      </div>
    `;
  } else if (studioConfig.theme === 'nacional') {
    const tot = APP_DATA.totais_nacionais;

    stage.innerHTML = `
      <div class="card-export-header">
        <div class="card-export-brand"><span class="brand-pill">BRASIL</span> <span>Inteligência Municipal</span></div>
        <span class="card-export-tag">GRANDES PRIORIDADES</span>
      </div>

      <div class="card-export-title">O Brasil nos 5.571 Municípios</div>
      <div class="card-export-subtitle">Impacto direto das políticas públicas na vida das pessoas</div>

      <div class="card-export-stats-grid">
        <div class="card-export-stat-box" style="border-left: 4px solid var(--gov-green-brasil);">
          <span class="card-export-stat-val">12,96 M</span>
          <span class="card-export-stat-lbl">Pessoas no Farmácia Popular</span>
        </div>
        <div class="card-export-stat-box" style="border-left: 4px solid var(--gov-blue-light);">
          <span class="card-export-stat-val">R$ 10,53 Bi</span>
          <span class="card-export-stat-lbl">Investidos no Pé-de-Meia</span>
        </div>
        <div class="card-export-stat-box" style="border-left: 4px solid #7E3AF2;">
          <span class="card-export-stat-val">R$ 606,2 Bi</span>
          <span class="card-export-stat-lbl">Aposentadorias RGPS ao ano</span>
        </div>
        <div class="card-export-stat-box" style="border-left: 4px solid var(--gov-yellow-ouro);">
          <span class="card-export-stat-val">49,66 M</span>
          <span class="card-export-stat-lbl">Empregos Formais CLT</span>
        </div>
      </div>

      <div class="card-export-footer">
        <span class="card-export-seal">✔ DADOS OFICIAIS CONSOLIDADOS</span>
        <span>MINISTÉRIOS DA SAÚDE, EDUCAÇÃO E PREVIDÊNCIA</span>
      </div>
    `;
  } else if (studioConfig.theme === 'eleitoral') {
    const el = APP_DATA.eleicoes_info[currentElection];

    stage.innerHTML = `
      <div class="card-export-header">
        <div class="card-export-brand"><span class="brand-pill">BRASIL</span> <span>Inteligência Municipal</span></div>
        <span class="card-export-tag">PANORAMA ELEITORAL</span>
      </div>

      <div class="card-export-title">${el.nome_exibicao}</div>
      <div class="card-export-subtitle">${formatarNumero(el.votos_validos)} votos válidos em 5.571 municípios</div>

      <div class="card-export-stats-grid" style="grid-template-columns: 1fr;">
        ${el.candidatos.slice(0, 3).map(c => `
          <div class="card-export-stat-box" style="flex-direction: row; justify-content: space-between; align-items: center;">
            <div>
              <span style="font-weight: 700; font-size: 1.1rem; color: #FFFFFF;">${c.nome}</span>
              <span style="font-size: 0.76rem; color: #94A3B8; margin-left: 6px;">(${c.partido})</span>
            </div>
            <span style="font-family: var(--font-display); font-size: 1.4rem; font-weight: 800; color: #FFFFFF;">
              ${c.pct.toFixed(2)}%
            </span>
          </div>
        `).join('')}
      </div>

      <div class="card-export-footer">
        <span class="card-export-seal">✔ APURAÇÃO OFICIAL TSE</span>
        <span>COMPARECIMENTO E ABSTENÇÃO</span>
      </div>
    `;
  } else if (studioConfig.theme === 'poder_compra') {
    const s = (APP_DATA.series_historicas && APP_DATA.series_historicas.nacional) || null;

    stage.innerHTML = `
      <div class="card-export-header">
        <div class="card-export-brand"><span class="brand-pill">BRASIL</span> <span>Inteligência Municipal</span></div>
        <span class="card-export-tag">PODER DE COMPRA & CONSUMO</span>
      </div>

      <div class="card-export-title">Evolução do Poder de Compra das Famílias</div>
      <div class="card-export-subtitle">Comparativo Histórico 2022 vs 2026 • DIEESE, ANP, MTE e MDIC</div>

      <div class="card-export-stats-grid">
        <div class="card-export-stat-box" style="border-left: 4px solid var(--gov-green-brasil);">
          <span class="card-export-stat-val">54,5%</span>
          <span class="card-export-stat-lbl">Cesta Básica no SM (era 62,9% em 2022 • -8,4 p.p.)</span>
        </div>
        <div class="card-export-stat-box" style="border-left: 4px solid var(--gov-blue-light);">
          <span class="card-export-stat-val">6,7%</span>
          <span class="card-export-stat-lbl">Gás 13kg no SM (era 9,1% em 2022 • -2,4 p.p.)</span>
        </div>
        <div class="card-export-stat-box" style="border-left: 4px solid var(--gov-yellow-ouro);">
          <span class="card-export-stat-val">R$ 1.621</span>
          <span class="card-export-stat-lbl">Salário Mínimo (R$ 1.212 em 2022 • Ganho Real)</span>
        </div>
        <div class="card-export-stat-box" style="border-left: 4px solid #7E3AF2;">
          <span class="card-export-stat-val">102,7 M</span>
          <span class="card-export-stat-lbl">Empregos Formais CLT (+6,7M vagas desde 2022)</span>
        </div>
      </div>

      <div class="card-export-election-box">
        <div class="card-export-election-header">
          <span>Destaques Macroeconômicos</span>
          <span>Série 2016 - 2026</span>
        </div>
        <div class="card-export-election-bars" style="flex-direction: column; gap: 8px;">
          <div style="display: flex; justify-content: space-between; font-size: 0.85rem;">
            <span style="color: #94A3B8;">Gasolina no Salário Mínimo:</span>
            <span style="font-weight: 700; color: #4ADE80;">0,41% do SM (era 0,53% em 2022)</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 0.85rem;">
            <span style="color: #94A3B8;">MEIs e Empreendedores Ativos:</span>
            <span style="font-weight: 700; color: #60A5FA;">16,9 Milhões (crescimento contínuo)</span>
          </div>
        </div>
      </div>

      <div class="card-export-footer">
        <span class="card-export-seal">✔ DADOS ECONÔMICOS CONSOLIDADOS</span>
        <span>DIEESE • ANP • CAGED/MTE • BANCO CENTRAL</span>
      </div>
    `;
  }
}

/**
 * 9. Exportação do Card para PNG em 2x Retina
 */
async function exportarCardPNG() {
  const stage = document.getElementById('card-render-stage');
  const btn = document.getElementById('btn-download-card');
  const originalText = btn.innerHTML;

  try {
    btn.innerHTML = '<span>Gerando imagem em alta resolução...</span>';
    btn.disabled = true;

    // Renderiza canvas com escala 2x para nitidez perfeita em redes sociais
    const canvas = await html2canvas(stage, {
      scale: 2,
      useCORS: true,
      backgroundColor: null,
      logging: false
    });

    const link = document.createElement('a');
    const nomeArquivo = `card-brasil-${studioConfig.theme}-${Date.now()}.png`;
    link.download = nomeArquivo;
    link.href = canvas.toDataURL('image/png');
    link.click();
  } catch (err) {
    console.error('Erro ao gerar card PNG:', err);
    alert('Não foi possível gerar a imagem. Verifique o console.');
  } finally {
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
}

/**
 * 10. Compartilhamento em Redes Sociais
 */
function gerarTextoCompartilhamento() {
  const eleicNome = currentElection === '2026_1t' ? '2026 (1ºT)' : (currentElection === '2022_1t' ? '2022 (1ºT)' : '2022 (2ºT)');
  const urlPainel = window.location.href;

  if (studioConfig.theme === 'municipio') {
    const m = studioConfig.selectedCity || APP_DATA.municipios[0];
    const eleic = currentElection === '2026_1t' ? m.e26 : (currentElection === '2022_1t' ? m.e22_1t : m.e22_2t);
    const lulaPct = (eleic.lula || 0).toFixed(1);
    const opositorNome = currentElection.includes('2026') ? 'Flávio' : 'Bolsonaro';
    const opositorPct = (currentElection.includes('2026') ? (eleic.flavio || 0) : (eleic.bolsonaro || 0)).toFixed(1);

    return `🇧🇷 *Raio-X Municipal: ${m.nm} (${m.uf})*\n` +
      `📌 Perfil: *${m.pf}*\n` +
      `👥 População: ${formatarNumero(m.pop)} habitantes\n` +
      `💊 Farmácia Popular: ${m.ind.fp.toFixed(1)} benef./100 hab\n` +
      `🎓 Pé-de-Meia: ${m.ind.pdm.toFixed(1)}% dos estudantes\n` +
      `👴 Aposentadorias RGPS: ${m.ind.apos.toFixed(1)} / 100 hab\n` +
      `💼 Empregos CLT: ${m.ind.clt.toFixed(1)} / 100 hab\n` +
      `🗳️ Eleição ${eleicNome}: Lula ${lulaPct}% | ${opositorNome} ${opositorPct}%\n\n` +
      `Confira a análise dos 5.571 municípios: ${urlPainel}`;
  } else if (studioConfig.theme === 'perfil') {
    const pNome = studioConfig.selectedProfile || Object.keys(APP_DATA.perfis)[0];
    const perfil = APP_DATA.perfis[pNome];
    const eleic = perfil.eleicoes[currentElection];
    const opositorNome = currentElection.includes('2026') ? 'Flávio' : 'Bolsonaro';
    const opositorPct = currentElection.includes('2026') ? eleic.flavio_pct : eleic.bolsonaro_pct;

    return `🇧🇷 *Perfil Socioeconômico: ${perfil.nome}*\n` +
      `🏛️ Abrangência: ${perfil.total_cidades} cidades (${perfil.pct_eleitorado_nacional}% do eleitorado nacional)\n` +
      `💊 Farmácia Popular: ${perfil.indicadores_medios.farmacia_popular_100_hab} / 100 hab\n` +
      `🎓 Pé-de-Meia: ${perfil.indicadores_medios.pe_de_meia_pct}% de cobertura\n` +
      `💼 Empregos CLT: ${perfil.indicadores_medios.clt_100_hab} / 100 hab\n` +
      `🗳️ Média Eleitoral (${eleicNome}): Lula ${eleic.lula_pct}% | ${opositorNome} ${opositorPct}%\n\n` +
      `Acesse os dados oficiais: ${urlPainel}`;
  } else if (studioConfig.theme === 'nacional') {
    return `🇧🇷 *O Brasil nos 5.571 Municípios | Prioridades Nacionais*\n` +
      `💊 Farmácia Popular: 12,96 M atendidos com medicamentos 100% gratuitos\n` +
      `🎓 Pé-de-Meia: R$ 10,53 Bi para 4,08 M de estudantes\n` +
      `👴 Previdência RGPS: R$ 606,2 Bi/ano injetados nos municípios\n` +
      `💼 Trabalho Formal: 49,66 M empregos CLT e 16,9M de MEIs\n\n` +
      `Explore o mapa interativo: ${urlPainel}`;
  } else if (studioConfig.theme === 'poder_compra') {
    return `🇧🇷 *Evolução do Poder de Compra: Brasil 2022 vs 2026*\n` +
      `🛒 Cesta Básica: comprometia 62,9% do Salário Mínimo em 2022 ➔ caiu para 54,5% em 2026 (-8,4 p.p.)\n` +
      `🔥 Botijão de Gás: custava 9,1% do SM ➔ caiu para 6,7% do SM (-2,4 p.p.)\n` +
      `💵 Salário Mínimo: de R$ 1.212 em 2022 para R$ 1.621 em 2026 (ganho real consistente)\n` +
      `💼 Empregos CLT: +6,7 Milhões de postos de trabalho formais (96,0M ➔ 102,7M)\n\n` +
      `Veja a série histórica completa e o mapa dos 5.571 municípios: ${urlPainel}`;
  } else {
    const el = APP_DATA.eleicoes_info[currentElection];
    const c1 = el.candidatos[0];
    const c2 = el.candidatos[1];
    return `🗳️ *Panorama Eleitoral: ${el.nome_exibicao}*\n` +
      `Total de Votos Válidos: ${formatarNumero(el.votos_validos)}\n` +
      `1º: ${c1.nome} (${c1.pct}%)\n` +
      `2º: ${c2.nome} (${c2.pct}%)\n` +
      `Abstenção: ${el.abstencao_pct}%\n\n` +
      `Veja o cruzamento completo com perfis socioeconômicos: ${urlPainel}`;
  }
}

function compartilharWhatsApp() {
  const texto = encodeURIComponent(gerarTextoCompartilhamento());
  window.open(`https://api.whatsapp.com/send?text=${texto}`, '_blank');
}

function compartilharMunicipioDiretoWhatsApp(idIbge) {
  const m = APP_DATA.municipios.find(c => c.id === idIbge);
  if (!m) return;
  const eleicNome = currentElection === '2026_1t' ? '2026 (1ºT)' : (currentElection === '2022_1t' ? '2022 (1ºT)' : '2022 (2ºT)');
  const eleic = currentElection === '2026_1t' ? m.e26 : (currentElection === '2022_1t' ? m.e22_1t : m.e22_2t);
  const lulaPct = (eleic.lula || 0).toFixed(1);
  const opositorNome = currentElection.includes('2026') ? 'Flávio' : 'Bolsonaro';
  const opositorPct = (currentElection.includes('2026') ? (eleic.flavio || 0) : (eleic.bolsonaro || 0)).toFixed(1);

  const texto = `🇧🇷 *Raio-X Municipal: ${m.nm} (${m.uf})*\n` +
    `📌 Perfil: *${m.pf}*\n` +
    `👥 População: ${formatarNumero(m.pop)} habitantes\n` +
    `💊 Farmácia Popular: ${m.ind.fp.toFixed(1)} benef./100 hab\n` +
    `🎓 Pé-de-Meia: ${m.ind.pdm.toFixed(1)}% dos estudantes\n` +
    `👴 Aposentadorias RGPS: ${m.ind.apos.toFixed(1)} / 100 hab\n` +
    `💼 Empregos CLT: ${m.ind.clt.toFixed(1)} / 100 hab\n` +
    `🗳️ Votação ${eleicNome}: Lula ${lulaPct}% | ${opositorNome} ${opositorPct}%\n\n` +
    `Acesse o painel completo: ${window.location.href}`;

  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(texto)}`, '_blank');
}

function compartilharX() {
  const texto = encodeURIComponent(gerarTextoCompartilhamento());
  window.open(`https://twitter.com/intent/tweet?text=${texto}`, '_blank');
}

function compartilharTelegram() {
  const texto = encodeURIComponent(gerarTextoCompartilhamento());
  window.open(`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${texto}`, '_blank');
}

function compartilharLinkedIn() {
  const url = encodeURIComponent(window.location.href);
  window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
}

async function copiarImagemCard() {
  const stage = document.getElementById('card-render-stage');
  const btn = document.getElementById('btn-copy-card-img');
  const originalHtml = btn.innerHTML;

  try {
    btn.innerHTML = '<span>Copiando...</span>';
    btn.disabled = true;

    const canvas = await html2canvas(stage, {
      scale: 2,
      useCORS: true,
      backgroundColor: null,
      logging: false
    });

    canvas.toBlob(async (blob) => {
      try {
        if (navigator.clipboard && navigator.clipboard.write) {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          mostrarToast('✔ Imagem copiada! Cole com Ctrl+V no WhatsApp, Instagram ou Telegram!');
        } else {
          mostrarToast('Dica: Use o botão verde para baixar o PNG.');
        }
      } catch (err) {
        console.warn('Clipboard write fallback:', err);
        mostrarToast('Dica: Use o botão verde para baixar o arquivo PNG.');
      } finally {
        btn.innerHTML = originalHtml;
        btn.disabled = false;
      }
    }, 'image/png');
  } catch (err) {
    console.error('Erro ao copiar imagem:', err);
    btn.innerHTML = originalHtml;
    btn.disabled = false;
  }
}

async function compartilharNativo() {
  const stage = document.getElementById('card-render-stage');
  const texto = gerarTextoCompartilhamento();

  try {
    const canvas = await html2canvas(stage, {
      scale: 2,
      useCORS: true,
      backgroundColor: null,
      logging: false
    });

    canvas.toBlob(async (blob) => {
      const file = new File([blob], `card-brasil-${Date.now()}.png`, { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            title: 'Painel Municipal & Eleitoral Brasil',
            text: texto,
            files: [file]
          });
        } catch (e) {
          if (e.name !== 'AbortError') console.error(e);
        }
      } else if (navigator.share) {
        try {
          await navigator.share({
            title: 'Painel Municipal & Eleitoral Brasil',
            text: texto,
            url: window.location.href
          });
        } catch (e) {
          if (e.name !== 'AbortError') console.error(e);
        }
      } else {
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(texto);
          mostrarToast('✔ Resumo copiado! Cole na sua rede social preferida.');
        }
      }
    }, 'image/png');
  } catch (err) {
    console.error('Erro ao compartilhar:', err);
  }
}

function mostrarToast(mensagem) {
  const toast = document.getElementById('share-toast');
  if (!toast) return;
  toast.textContent = mensagem;
  toast.classList.remove('hidden');
  setTimeout(() => {
    toast.classList.add('hidden');
  }, 3500);
}

/**
 * Funções Auxiliares
 */
function formatarNumero(num) {
  if (num === null || num === undefined) return '0';
  return Number(num).toLocaleString('pt-BR');
}

function truncarTexto(str, max) {
  if (!str) return '';
  return str.length > max ? str.substring(0, max) + '...' : str;
}
