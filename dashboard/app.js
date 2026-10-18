/**
 * PAINEL MUNICIPAL & ELEITORAL BRASIL
 * Lógica Interativa, Filtro Cruzado Territorial, Mapa Leaflet, Gráficos Estratégicos e Estúdio de Cards
 */

let APP_DATA = null;
let GEOJSON_ESTADOS = null;
let leafletMap = null;
let geoJsonLayer = null;
let markersLayer = null;

let currentElection = '2026_1t'; // '2026_1t', '2022_2t', '2022_1t', '2018_2t' (Dados Oficiais Reais do TSE)

// Estado Central de Filtragem Territorial
let filtroTerritorial = {
  nivel: 'brasil', // 'brasil', 'regiao', 'estado', 'municipio'
  id: null,
  nome: 'Brasil Inteiro',
  perfil: 'Polos Regionais de Emprego e Serviços'
};

// Configurações do Estúdio de Cards
let studioConfig = {
  format: 'feed', // 'feed' (1:1) ou 'story' (9:16)
  theme: 'municipio', // 'municipio', 'perfil', 'nacional', 'eleitoral'
  selectedCity: null,
  selectedProfile: null
};

// Cidade Ativa para o Raio-X no painel
let activeRaioXCity = null;

// Tabela de Municípios - Estado de Ordenação e Paginação
let tableSortState = {
  col: 'pop',
  asc: false
};
let tablePageLimit = 60;
let tableSearchQuery = '';
let tableFilterRegiao = '';
let tableFilterUf = '';
let narrativasData = null;

// Instâncias de Gráficos Chart.js
let chartPesoPerfil = null;
let chartDesempenhoAbstencao = null;
let chartDispersao = null;
let chartSeriesHistoricas = null;
let chartModalOrcamento = null;

let currentScatterMetricX = 'indice_composto';
let currentScatterRegion = 'todas';
let currentSeriesMetric = 'poder_compra';
let currentOrcamentoMode = 'real'; // 'real' (corrigido IPCA) ou 'nominal' (gastos da época)

// Mapeamento de Códigos IBGE de 2 dígitos (codarea no GeoJSON) para Sigla do Estado
const codareaToUf = {
  '11': 'RO', '12': 'AC', '13': 'AM', '14': 'RR', '15': 'PA', '16': 'AP', '17': 'TO',
  '21': 'MA', '22': 'PI', '23': 'CE', '24': 'RN', '25': 'PB', '26': 'PE', '27': 'AL', '28': 'SE', '29': 'BA',
  '31': 'MG', '32': 'ES', '33': 'RJ', '35': 'SP',
  '41': 'PR', '42': 'SC', '43': 'RS',
  '50': 'MS', '51': 'MT', '52': 'GO', '53': 'DF'
};

// Metadados Ricos e Assuntos de Maior Impacto por Perfil Socioeconômico
const PERFIS_IMPACTO = {
  'Polos Agroindustriais': {
    cor: '#0E9F6E',
    icone: '🌾',
    resumo: 'Polo do agronegócio e cooperativas, menor dependência de transferências sociais e alta geração de MEIs e empregos privados.',
    assuntos_impacto: [
      'Plano Safra & Crédito Rural subsidiado',
      'Seguro agrícola e escoamento da produção',
      'Preço do Óleo Diesel e logística de transporte',
      'Desoneração da folha, MEI e simplificação tributária'
    ]
  },
  'Cidades de Aposentados': {
    cor: '#7E3AF2',
    icone: '👴',
    resumo: 'Forte concentração de idosos e pensionistas, onde os benefícios da Previdência Social superam o FPM e movimentam o comércio local.',
    assuntos_impacto: [
      'Reajuste real do Salário Mínimo e Aposentadorias RGPS',
      'Expansão da gratuidade de remédios na Farmácia Popular',
      'Rede de atenção básica de saúde e hospitais filantrópicos',
      'Combate ao endividamento abusivo de consignados'
    ]
  },
  'Grandes Cidades Atípicas': {
    cor: '#374151',
    icone: '🏙️',
    resumo: 'Grandes centros urbanos com dinâmica socioeconômica e densidade atípicas, concentrando desafios metropolitanos complexos de serviços e habitação.',
    assuntos_impacto: [
      'Geração de emprego formal CLT e renda média familiar',
      'Mobilidade urbana, transporte público e PAC Cidades Sustentáveis',
      'Custo da alimentação e inflação da cesta básica',
      'Crédito imobiliário (Faixa 3 e Minha Casa Minha Vida)'
    ]
  },
  'Metrópoles & Capitais': {
    cor: '#374151',
    icone: '🏙️',
    resumo: 'Grandes centros urbanos com dinâmica socioeconômica e densidade atípicas, concentrando desafios metropolitanos complexos de serviços e habitação.',
    assuntos_impacto: [
      'Geração de emprego formal CLT e renda média familiar',
      'Mobilidade urbana, transporte público e PAC Cidades Sustentáveis',
      'Custo da alimentação e inflação da cesta básica',
      'Crédito imobiliário (Faixa 3 e Minha Casa Minha Vida)'
    ]
  },
  'Jovens & Apoio Social': {
    cor: '#F59E0B',
    icone: '🎒',
    resumo: 'População jovem com alta cobertura de programas sociais federais, demandando retenção escolar e oportunidades de qualificação profissional.',
    assuntos_impacto: [
      'Poupança Pé-de-Meia para estudantes do ensino médio público',
      'Continuidade e valor médio do Bolsa Família',
      'Complementação da União no Novo FUNDEB (VAAF/VAAT)',
      'Programas de primeiro emprego e ensino técnico profissionalizante'
    ]
  },
  'Seguridade & Repasses': {
    cor: '#E05252',
    icone: '🤝',
    resumo: 'Municípios vulneráveis cuja economia local é altamente sustentada por benefícios de transferência de renda, BPC e aposentadorias rurais.',
    assuntos_impacto: [
      'Pontualidade e ampliação do Bolsa Família e Auxílio Gás',
      'Benefício de Prestação Continuada (BPC/LOAS) a idosos e PCDs',
      'Repasses do FPM (Fundo de Participação dos Municípios)',
      'Cisternas, obras de saneamento básico e saúde comunitária'
    ]
  },
  'Funcionalismo Público': {
    cor: '#C026D3', // Magenta / Fúcsia Executivo (totalmente distinto de Polos Agroindustriais #0E9F6E)
    icone: '🏛️',
    resumo: 'Cidades pequenas onde a prefeitura e os serviços públicos municipais/estaduais são os maiores empregadores e sustentadores da renda.',
    assuntos_impacto: [
      'Equilíbrio fiscal do FPM e transferências constitucionais',
      'Piso salarial nacional da Educação (professores) e Enfermagem',
      'Consórcios públicos de saúde e infraestrutura regional',
      'Concursos públicos locais e previdência própria (RPPS)'
    ]
  },
  'Polos de Emprego & Serviços': {
    cor: '#1A56DB',
    icone: '🏬',
    resumo: 'Centros regionais do interior que concentram comércio, atendimento médico regional, faculdades e forte dinamismo em pequenas empresas.',
    assuntos_impacto: [
      'Apoio ao micro e pequeno empresário (MEI e Pronampe)',
      'Poder de compra do trabalhador assalariado no comércio',
      'Expansão de cursos técnicos e universidades federais/estaduais',
      'Infraestrutura de transportes, rodovias e logística regional'
    ]
  }
};

// Mapeamento Estratégico de Políticas Públicas e Assuntos por Indicador (Quando Acima da Mediana)
const MAPA_INDICADORES_PAUTA = {
  apos: {
    icone: '👴',
    nome: 'Aposentados RGPS',
    temaCurto: 'Aposentados RGPS',
    pauta: 'Reajuste do Salário Mínimo e Previdência',
    sufixo: '/100 hab'
  },
  bpc: {
    icone: '♿',
    nome: 'BPC / LOAS',
    temaCurto: 'BPC / LOAS',
    pauta: 'Amparo social a idosos e PCDs em vulnerabilidade',
    sufixo: '/100 hab'
  },
  fp: {
    icone: '💊',
    nome: 'Farmácia Popular',
    temaCurto: 'Farmácia Popular',
    pauta: 'Remédios gratuitos (hipertensão, diabetes e asma)',
    sufixo: '/100 hab'
  },
  bf: {
    icone: '🤝',
    nome: 'Bolsa Família',
    temaCurto: 'Bolsa Família',
    pauta: 'Segurança alimentar e transferência de renda',
    sufixo: '/100 hab'
  },
  pdm: {
    icone: '🎓',
    nome: 'Pé-de-Meia',
    temaCurto: 'Pé-de-Meia',
    pauta: 'Incentivo à conclusão do Ensino Médio público',
    sufixo: '%'
  },
  clt: {
    icone: '💼',
    nome: 'Emprego CLT',
    temaCurto: 'Emprego CLT',
    pauta: 'Vagas com carteira assinada, salários e qualificação',
    sufixo: '/100 hab'
  },
  mei: {
    icone: '🏪',
    nome: 'MEI Formal',
    temaCurto: 'MEI Formal',
    pauta: 'Crédito produtivo orientado e apoio ao pequeno negócio',
    sufixo: '/100 hab'
  },
  serv: {
    icone: '🏛️',
    nome: 'Servidores Públicos',
    temaCurto: 'Servidores Públicos',
    pauta: 'Pisos da Educação/Saúde e capacidade fiscal local',
    sufixo: '/100 hab'
  }
};

// Indicadores primários típicos de cada perfil (para identificar alertas que vão além do arquétipo)
const PERFIL_INDICADORES_PRIMARIOS = {
  'Jovens & Apoio Social': ['pdm', 'bf'],
  'Cidades de Aposentados': ['apos', 'fp'],
  'Polos Agroindustriais': ['clt', 'mei'],
  'Polos de Emprego & Serviços': ['clt', 'mei'],
  'Seguridade & Repasses': ['bf', 'bpc', 'apos'],
  'Funcionalismo Público': ['serv'],
  'Grandes Cidades Atípicas': ['clt', 'pdm'],
  'Metrópoles & Capitais': ['clt', 'pdm']
};

// Inicialização Geral ao carregar a página
document.addEventListener('DOMContentLoaded', async () => {
  try {
    await carregarDados();
    configurarEventosGlobais();
    initMap();
    configurarTabelaOrdenavel();
    
    // Inicializa todos os componentes com visão Brasil
    aplicarFiltroTerritorial('brasil', null, { inicial: true });
    
    renderizarSeriesHistoricas();
    configurarEstudioCards();
  } catch (error) {
    console.error("Erro ao inicializar dashboard:", error);
  }
});

/**
 * 1. Carregamento dos Dados JSON e GeoJSON
 */
async function carregarDados() {
  const [respData, respGeo] = await Promise.all([
    fetch('data/dashboard_data.json'),
    fetch('data/brasil_estados.json')
  ]);
  
  APP_DATA = await respData.json();
  GEOJSON_ESTADOS = await respGeo.json();
  
  // Padrão nacional: nível Brasil consolidado como inicial no Raio-X
  activeRaioXCity = null;
  studioConfig.selectedCity = APP_DATA.municipios[0];
  studioConfig.selectedProfile = Object.keys(APP_DATA.perfis)[0];
}

/**
 * 2. Eventos Globais, Switcher de Eleição no Cabeçalho e Busca
 */
function configurarEventosGlobais() {
  // Toggle de Eleições no Cabeçalho
  document.querySelectorAll('.header-toggle-pill-group .pill-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.header-toggle-pill-group .pill-btn').forEach(b => b.classList.remove('active'));
      const target = e.currentTarget;
      target.classList.add('active');
      currentElection = target.getAttribute('data-election');
      
      const titulos = {
        '2026_1t': '2026 • 1º Turno (Oficial)',
        '2022_2t': '2022 • 2º Turno (Oficial)',
        '2022_1t': '2022 • 1º Turno (Oficial)',
        '2018_2t': '2018 • 2º Turno (Oficial - Haddad)'
      };
      
      const tagEl = document.getElementById('desempenho-abst-tag');
      if (tagEl) tagEl.textContent = titulos[currentElection] || titulos['2026_1t'];

      const thLula = document.getElementById('th-lula');
      if (thLula) {
        thLula.innerHTML = `${currentElection === '2018_2t' ? 'Haddad %' : 'Lula %'} <span class="sort-icon">⇅</span>`;
      }

      const thOpositor = document.getElementById('th-opositor');
      if (thOpositor) {
        thOpositor.innerHTML = `${currentElection.includes('2026') ? 'Flávio %' : 'Bolsonaro %'} <span class="sort-icon">⇅</span>`;
      }
      
      // Atualiza componentes conectados
      atualizarTopCharts();
      atualizarRaioXIntegrado();
      atualizarTabelaMunicipios();
      atualizarMapaVisual();
      if (chartDispersao) atualizarGraficoDispersao();
      atualizarPreviewCard();
    });
  });

  // Botão de Metodologia da Clusterização no Topo
  const btnMethod = document.getElementById('btn-cluster-methodology');
  if (btnMethod) {
    btnMethod.addEventListener('click', rolarParaMetodologiaClusterizacao);
  }

  // Autocomplete de Busca Discreta por Município no Topo
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
        const perfilInfo = PERFIS_IMPACTO[m.pf] || { cor: '#4B5563' };
        const cor = perfilInfo.cor;
        return `
          <div class="search-item" onclick="selecionarMunicipioPorId('${m.id}')">
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

  // Fechar dropdown ao clicar fora ou pressionar ESC
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-wrapper')) {
      searchDropdown.classList.add('hidden');
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      searchDropdown.classList.add('hidden');
      fecharTodosModais();
    }
  });

  // Fechar modais ao clicar no backdrop (fora do card)
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        fecharTodosModais();
      }
    });
  });

  // Botões de Modal
  document.getElementById('btn-open-cards-studio')?.addEventListener('click', abrirEstudioCards);
  document.getElementById('btn-close-studio')?.addEventListener('click', fecharEstudioCards);
  document.getElementById('btn-close-city-modal')?.addEventListener('click', fecharModalMunicipio);
  document.getElementById('btn-open-methodology')?.addEventListener('click', abrirModalMetodologia);
  document.getElementById('btn-open-scatter-modal')?.addEventListener('click', abrirModalCorrelacao);

  // Filtros avançados da tabela de municípios (Região, UF e Busca)
  const tableSearchInput = document.getElementById('filter-state-mun-input');
  if (tableSearchInput) {
    tableSearchInput.addEventListener('input', (e) => {
      tableSearchQuery = e.target.value.toLowerCase().trim();
      tablePageLimit = 60;
      atualizarTabelaMunicipios();
    });
  }

  const tableFilterRegiaoEl = document.getElementById('table-filter-regiao');
  if (tableFilterRegiaoEl) {
    tableFilterRegiaoEl.addEventListener('change', (e) => {
      tableFilterRegiao = e.target.value;
      tablePageLimit = 60;
      atualizarOpcoesUfTabela();
      atualizarTabelaMunicipios();
    });
  }

  const tableFilterUfEl = document.getElementById('table-filter-uf');
  if (tableFilterUfEl) {
    tableFilterUfEl.addEventListener('change', (e) => {
      tableFilterUf = e.target.value;
      tablePageLimit = 60;
      atualizarTabelaMunicipios();
    });
  }

  const btnExportCsv = document.getElementById('btn-export-csv');
  if (btnExportCsv) {
    btnExportCsv.addEventListener('click', baixarTabelaCSV);
  }
}

// Exposição explícita para chamadas inline HTML (onclick)
window.abrirModalCorrelacao = abrirModalCorrelacao;
window.fecharModalCorrelacao = fecharModalCorrelacao;
window.abrirModalMetodologia = abrirModalMetodologia;
window.fecharModalMetodologia = fecharModalMetodologia;
window.abrirModalPrioridade = abrirModalPrioridade;
window.fecharModalPrioridade = fecharModalPrioridade;
window.abrirModalMunicipio = abrirModalMunicipio;
window.fecharModalMunicipio = fecharModalMunicipio;
window.abrirModalTabelaMunicipios = abrirModalTabelaMunicipios;
window.fecharModalTabelaMunicipios = fecharModalTabelaMunicipios;
window.fecharTodosModais = fecharTodosModais;
window.abrirEstudioCards = abrirEstudioCards;
window.fecharEstudioCards = fecharEstudioCards;
window.resetarFiltroTerritorial = resetarFiltroTerritorial;
window.selecionarMunicipioPorId = selecionarMunicipioPorId;
window.abrirModalCidadeAtual = abrirModalCidadeAtual;
window.focarBuscaMunicipio = focarBuscaMunicipio;
window.carregarMaisMunicipios = carregarMaisMunicipios;
window.aplicarFiltroTerritorial = aplicarFiltroTerritorial;
window.selecionarCidadeEstudio = selecionarCidadeEstudio;
window.carregarMunicipioNoEstudio = carregarMunicipioNoEstudio;
window.compartilharMunicipioDiretoWhatsApp = compartilharMunicipioDiretoWhatsApp;
window.baixarTabelaCSV = baixarTabelaCSV;
window.copiarNarrativaMunicipio = copiarNarrativaMunicipio;

/**
 * 3. NÚCLEO DE FILTRO CRUZADO TERRITORIAL (INTERLIGAÇÃO TOTAL)
 * Conecta: Cabeçalho com cor do perfil, Cards de Prioridades, 2 Gráficos de Topo, Mapa, Tabela e Raio-X
 */
function aplicarFiltroTerritorial(nivel, id, opcoes = {}) {
  filtroTerritorial.nivel = nivel;
  filtroTerritorial.id = id;

  let perfilNomeAtivo = 'Polos Regionais de Emprego e Serviços';
  let tituloTerritorio = 'Visão Nacional: 5.571 Municípios Brasileiros';
  let cidadesTerritorio = APP_DATA.municipios;

  if (nivel === 'brasil') {
    filtroTerritorial.nome = 'Brasil Inteiro';
    perfilNomeAtivo = 'Polos Regionais de Emprego e Serviços';
    tituloTerritorio = 'Visão Nacional: 5.571 Municípios Brasileiros';
    cidadesTerritorio = APP_DATA.municipios;
    activeRaioXCity = null;
  } else if (nivel === 'regiao') {
    const regObj = APP_DATA.regioes[id];
    filtroTerritorial.nome = `Região ${id}`;
    perfilNomeAtivo = regObj ? regObj.perfil_predominante : 'Polos Regionais de Emprego e Serviços';
    tituloTerritorio = `Região ${id}: ${regObj ? regObj.total_municipios : 0} Municípios (${regObj ? regObj.estados.join(', ') : ''})`;
    cidadesTerritorio = APP_DATA.municipios.filter(m => m.reg === id);
    activeRaioXCity = null;
  } else if (nivel === 'estado') {
    const ufObj = APP_DATA.estados[id];
    filtroTerritorial.nome = ufObj ? `${ufObj.nome} (${id})` : id;
    perfilNomeAtivo = ufObj ? ufObj.perfil_predominante : 'Polos Regionais de Emprego e Serviços';
    tituloTerritorio = `Estado de ${ufObj ? ufObj.nome : id} (${id}): ${ufObj ? ufObj.total_municipios : 0} Municípios`;
    cidadesTerritorio = APP_DATA.municipios.filter(m => m.uf === id);
    activeRaioXCity = null; // Mostra consolidado estadual no Raio-X
  } else if (nivel === 'perfil') {
    const perfilNome = id;
    filtroTerritorial.nome = `Perfil: ${perfilNome}`;
    perfilNomeAtivo = perfilNome;
    cidadesTerritorio = APP_DATA.municipios.filter(m => m.pf === perfilNome);
    const popPerfil = cidadesTerritorio.reduce((acc, c) => acc + (c.pop || 0), 0);
    tituloTerritorio = `Cluster ${perfilNome}: ${cidadesTerritorio.length} Municípios (${formatarGrandeza(popPerfil)} hab)`;
    activeRaioXCity = null;
  } else if (nivel === 'municipio') {
    const m = APP_DATA.municipios.find(c => c.id === id);
    if (m) {
      activeRaioXCity = m;
      filtroTerritorial.nome = `${m.nm} (${m.uf})`;
      perfilNomeAtivo = m.pf;
      tituloTerritorio = `Município de ${m.nm} (${m.uf}) • População: ${formatarNumero(m.pop)} hab`;
      cidadesTerritorio = [m];
    }
  }

  filtroTerritorial.perfil = perfilNomeAtivo;

  // 1. Atualiza Cabeçalho e Banner de Contexto (cor, descrição e assuntos de impacto)
  atualizarBannerPerfilHeader(nivel, tituloTerritorio, perfilNomeAtivo, cidadesTerritorio);

  // 2. Atualiza os 4 Cards de Prioridades Nacionais para o território
  atualizarCardsPrioridades(cidadesTerritorio, nivel);

  // 3. Atualiza os 2 Gráficos de Topo (Peso Eleitoral & Desempenho com Abstenção)
  atualizarTopCharts(cidadesTerritorio);

  // 4. Atualiza o Mapa Leaflet
  atualizarMapaVisual(opcoes.inicial);

  // 5. Atualiza o Raio-X Integrado (comparando Lula 2022 vs 2026)
  atualizarRaioXIntegrado();

  // 6. Atualiza a Tabela de Municípios
  tablePageLimit = 60;
  atualizarTabelaMunicipios(cidadesTerritorio);

  // 7. Atualiza o Aviso de Granularidade
  atualizarAvisoGranularidade(nivel);

  // 8. Atualiza a Abertura por Número Municipal nas Séries Econômicas
  atualizarNumerosMunicipaisSeries(nivel === 'municipio' ? cidadesTerritorio[0] : (nivel === 'brasil' ? null : activeRaioXCity));
}

/**
 * Função para destacar interativamente um card no Raio-X a partir das pills do cabeçalho
 */
function destacarIndicadorRaioX(key) {
  const el = document.getElementById(`raiox-card-${key}`);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.remove('highlight-card-pulse');
    void el.offsetWidth;
    el.classList.add('highlight-card-pulse');
    setTimeout(() => el.classList.remove('highlight-card-pulse'), 3000);
  }
}
window.destacarIndicadorRaioX = destacarIndicadorRaioX;

/**
 * Atualiza o Cabeçalho com a cor, os temas de impacto do perfil econômico e os alertas de indicadores acima da mediana
 */
function atualizarBannerPerfilHeader(nivel, titulo, perfilNome, cidadesTerritorio = []) {
  const banner = document.getElementById('profile-context-banner');
  const dot = document.getElementById('context-profile-dot');
  const nameEl = document.getElementById('context-profile-name');
  const descEl = document.getElementById('context-profile-desc');
  const territoryTitleEl = document.getElementById('context-territory-title');
  const impactTopicsEl = document.getElementById('context-impact-topics');
  const resetBtn = document.getElementById('btn-reset-territory-filter');

  const infoPerfil = PERFIS_IMPACTO[perfilNome] || {
    cor: '#1A56DB',
    icone: '🇧🇷',
    resumo: 'Cluster socioeconômico brasileiro.',
    assuntos_impacto: ['Emprego Formal', 'Poder de Compra', 'Educação', 'Saúde']
  };

  const cor = infoPerfil.cor;

  // Aplica cor do perfil nas bordas e fundo sutil do banner do cabeçalho
  banner.style.borderBottomColor = cor;
  banner.style.backgroundColor = `${cor}0D`; // 5% de opacidade para elegância

  dot.style.backgroundColor = cor;
  nameEl.innerHTML = `<span style="color: ${cor}; font-weight: 800;">● ${infoPerfil.icone} ${perfilNome}</span>`;
  
  territoryTitleEl.innerHTML = `<span class="pulse-indicator" style="background-color: ${cor};"></span> <strong>${titulo}</strong>`;

  descEl.textContent = infoPerfil.resumo;

  // Cálculo e Identificação Dinâmica de Indicadores Acima da Mediana para este Território
  const medianas = APP_DATA.totais_nacionais?.medianas_municipais || {};
  let indValores = {};

  if (nivel === 'municipio' && activeRaioXCity?.ind) {
    indValores = activeRaioXCity.ind;
  } else if (cidadesTerritorio && cidadesTerritorio.length === 1 && cidadesTerritorio[0]?.ind) {
    indValores = cidadesTerritorio[0].ind;
  } else if (nivel === 'brasil' || !cidadesTerritorio || cidadesTerritorio.length === 0) {
    indValores = APP_DATA.totais_nacionais?.brasil_indicadores || {};
  } else {
    // Média ponderada pela população dos municípios que compõem o estado, região ou cluster
    const totPop = cidadesTerritorio.reduce((acc, c) => acc + (c.pop || 0), 0);
    if (totPop > 0) {
      ['clt', 'mei', 'serv', 'apos', 'bf', 'bpc', 'fp', 'pdm'].forEach(k => {
        const sumVal = cidadesTerritorio.reduce((acc, c) => acc + ((c.pop || 0) * (c.ind?.[k] || 0)), 0);
        indValores[k] = sumVal / totPop;
      });
    } else {
      indValores = APP_DATA.totais_nacionais?.brasil_indicadores || {};
    }
  }

  const primariosPerfil = PERFIL_INDICADORES_PRIMARIOS[perfilNome] || [];
  const itensAcimaMediana = [];

  ['apos', 'bpc', 'fp', 'bf', 'pdm', 'clt', 'mei', 'serv'].forEach(k => {
    const stat = medianas[k];
    if (!stat) return;
    const val = indValores[k] ?? 0;
    if (val > stat.mediana) {
      const diffPct = ((val - stat.mediana) / stat.mediana) * 100;
      const ehComplementar = !primariosPerfil.includes(k);
      const cfg = MAPA_INDICADORES_PAUTA[k] || {
        icone: '📊',
        nome: k,
        temaCurto: k.toUpperCase(),
        pauta: 'Prioridade estratégica local',
        sufixo: '/100 hab'
      };
      itensAcimaMediana.push({
        key: k,
        val,
        mediana: stat.mediana,
        diffPct,
        ehComplementar,
        ...cfg
      });
    }
  });

  // Ordena: primeiro os complementares (que vão além do perfil geral, como aposentados, bpc e farmácia popular em Recife!),
  // e dentro de cada grupo pelo maior excesso percentual sobre a mediana nacional
  itensAcimaMediana.sort((a, b) => {
    if (a.ehComplementar !== b.ehComplementar) {
      return a.ehComplementar ? -1 : 1;
    }
    return b.diffPct - a.diffPct;
  });

  let labelAcima = 'Alertas Territoriais (Acima da Mediana Nacional):';
  let escopoNome = 'no Território';
  if (nivel === 'municipio' && activeRaioXCity) {
    escopoNome = activeRaioXCity.nm;
    labelAcima = `Alertas Locais de ${activeRaioXCity.nm} (Acima da Mediana):`;
  } else if (nivel === 'estado') {
    escopoNome = filtroTerritorial.nome;
    labelAcima = `Alertas do Estado (${filtroTerritorial.nome}) • Acima da Mediana:`;
  } else if (nivel === 'regiao') {
    escopoNome = filtroTerritorial.nome;
    labelAcima = `Alertas da Região (${filtroTerritorial.nome}) • Acima da Mediana:`;
  } else if (nivel === 'perfil') {
    escopoNome = perfilNome;
    labelAcima = `Destaques do Cluster ${perfilNome} (Acima da Mediana):`;
  } else if (nivel === 'brasil') {
    escopoNome = 'Brasil';
    labelAcima = 'Prioridades Nacionais (Acima da Mediana dos Municípios):';
  }

  const pillsAcimaHtml = itensAcimaMediana.length > 0
    ? itensAcimaMediana.map(item => {
        const valTxt = item.key === 'pdm' ? `${item.val.toFixed(1)}%` : `${item.val.toFixed(1)}${item.sufixo}`;
        const medTxt = item.key === 'pdm' ? `${item.mediana}%` : `${item.mediana}${item.sufixo}`;
        const pillClass = item.ehComplementar ? 'impact-topic-pill pill-above-complementary' : 'impact-topic-pill pill-above-focus';
        const tagClass = item.ehComplementar ? 'stat-amber' : 'stat-green';
        const tagIcon = item.ehComplementar ? '⚡' : '▲';
        const tooltip = `${escopoNome} supera a mediana nacional em ${item.nome} (${valTxt} vs mediana ${medTxt}). Pauta prioritária: ${item.pauta}. Clique para destacar no Raio-X abaixo.`;

        return `
          <button class="${pillClass}" onclick="destacarIndicadorRaioX('${item.key}')" title="${tooltip}">
            <span class="pill-title-content">${tagIcon} ${item.icone} <strong>${item.nome}</strong></span>
            <span class="pill-stat-tag ${tagClass}">▲ ${valTxt} <span class="pill-med-ref">(med. ${medTxt})</span></span>
          </button>
        `;
      }).join('')
    : `<span class="impact-topic-pill pill-neutral">ℹ️ Indicadores dentro da faixa mediana dos municípios brasileiros</span>`;

  // Renderiza tópicos de maior impacto em duas linhas perfeitamente organizadas
  impactTopicsEl.innerHTML = `
    <div class="impact-topics-subrow">
      <span class="impact-label" style="color: ${cor};">📌 Eixo Estrutural (${perfilNome}):</span>
      <div class="impact-pills-wrap">
        ${infoPerfil.assuntos_impacto.map(t => `
          <span class="impact-topic-pill pill-archetype" style="border-color: ${cor}40; color: #0F172A;" title="Tema estrutural característico do perfil ${perfilNome}">
            ${t}
          </span>
        `).join('')}
      </div>
    </div>

    <div class="impact-topics-subrow impact-above-subrow">
      <span class="impact-label-above">
        <span class="pulse-chip-above">▲</span> ${labelAcima}
      </span>
      <div class="impact-pills-wrap">
        ${pillsAcimaHtml}
      </div>
    </div>
  `;

  // Exibe/oculta botão de limpar filtro
  if (nivel === 'brasil') {
    resetBtn.classList.add('hidden');
  } else {
    resetBtn.classList.remove('hidden');
  }

  // Atualiza Pill do Cabeçalho Superior (Sinalização Fixa no Topo)
  const headerPill = document.getElementById('header-territory-pill');
  const headerPillText = document.getElementById('header-territory-text');
  const headerPillClear = document.getElementById('header-territory-clear');

  if (headerPill && headerPillText) {
    if (nivel === 'brasil') {
      headerPillText.textContent = 'Brasil (Consolidado)';
      headerPill.classList.remove('active-filter');
      if (headerPillClear) headerPillClear.classList.add('hidden');
    } else {
      headerPillText.textContent = filtroTerritorial.nome;
      headerPill.classList.add('active-filter');
      if (headerPillClear) headerPillClear.classList.remove('hidden');
    }
  }

  // Atualiza Badges de Escopo dos Gráficos de Topo
  const badgePeso = document.getElementById('badge-scope-peso');
  const badgeDesemp = document.getElementById('badge-scope-desempenho');
  let scopeLabel = 'Visão Nacional';
  let scopeClass = 'chart-scope-badge scope-nacional';
  if (nivel === 'regiao') {
    scopeLabel = `Visão Regional (${filtroTerritorial.nome})`;
    scopeClass = 'chart-scope-badge scope-estadual';
  } else if (nivel === 'estado') {
    scopeLabel = `Visão Estadual (${filtroTerritorial.nome})`;
    scopeClass = 'chart-scope-badge scope-estadual';
  } else if (nivel === 'perfil') {
    scopeLabel = `Visão Agrupada (${filtroTerritorial.nome})`;
    scopeClass = 'chart-scope-badge scope-regional';
  } else if (nivel === 'municipio') {
    scopeLabel = `Visão Municipal (${activeRaioXCity?.nm || filtroTerritorial.nome})`;
    scopeClass = 'chart-scope-badge scope-municipal';
  }
  if (badgePeso) {
    badgePeso.textContent = scopeLabel;
    badgePeso.className = scopeClass;
  }
  if (badgeDesemp) {
    badgeDesemp.textContent = scopeLabel;
    badgeDesemp.className = scopeClass;
  }
}

function resetarFiltroTerritorial() {
  aplicarFiltroTerritorial('brasil', null);
}

function toggleBannerPerfil() {
  const banner = document.getElementById('profile-context-banner');
  if (!banner) return;
  const isCollapsed = banner.classList.toggle('collapsed');
  const icon = document.getElementById('btn-toggle-banner-icon');
  const text = document.getElementById('btn-toggle-banner-text');

  if (isCollapsed) {
    if (icon) icon.textContent = '▾';
    if (text) text.textContent = 'Ver Perfil';
  } else {
    if (icon) icon.textContent = '▴';
    if (text) text.textContent = 'Ocultar Perfil';
  }
}
window.toggleBannerPerfil = toggleBannerPerfil;

/**
 * Formata números com adaptação dinâmica de grandeza (x Mil, x Milhões, x Bi)
 */
function formatarGrandeza(valor, isMoeda = false) {
  if (valor === null || valor === undefined || isNaN(valor)) return isMoeda ? 'R$ 0' : '0';
  const prefixo = isMoeda ? 'R$ ' : '';
  const abs = Math.abs(valor);

  if (abs >= 1_000_000_000) {
    const val = (valor / 1_000_000_000).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 });
    return `${prefixo}${val} Bi`;
  }
  if (abs >= 1_000_000) {
    const val = (valor / 1_000_000).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 });
    if (isMoeda) {
      const isSingular = Math.abs(valor / 1_000_000 - 1.0) < 0.05;
      return `${prefixo}${val} ${isSingular ? 'Milhão' : 'Milhões'}`;
    }
    return `${val} M`;
  }
  if (abs >= 1_000) {
    const val = (valor / 1_000).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    return `${prefixo}${val} Mil`;
  }
  return `${prefixo}${Math.round(valor).toLocaleString('pt-BR')}`;
}
window.formatarGrandeza = formatarGrandeza;

/**
 * Atualiza os 5 Cards de Prioridades nos Municípios com grandezas adequadas
 * Utiliza o cálculo REAL dos indicadores municipais evitando discrepâncias.
 */
function atualizarCardsPrioridades(cidades, nivel) {
  const badge = document.getElementById('priority-territory-badge');
  badge.textContent = nivel === 'brasil' ? 'Consolidado Brasil' : `Filtro: ${filtroTerritorial.nome}`;

  if (nivel === 'brasil') {
    document.getElementById('card-val-saude').textContent = '12,96 M';
    document.getElementById('card-subval-saude-1').textContent = 'R$ 7,73 Bi';
    document.getElementById('card-subval-saude-2').textContent = '5.571';

    document.getElementById('card-val-educacao').textContent = 'R$ 10,53 Bi';
    document.getElementById('card-subval-educacao-1').textContent = '4,08 M';
    document.getElementById('card-subval-educacao-2').textContent = 'R$ 46,07 Bi';

    document.getElementById('card-val-previdencia').textContent = 'R$ 606,2 Bi';
    document.getElementById('card-subval-prev-1').textContent = '35,17 M';
    document.getElementById('card-subval-prev-2').textContent = '24,14 M (7,0M rural)';

    document.getElementById('card-val-trabalho').textContent = '49,66 M';
    document.getElementById('card-subval-trab-1').textContent = '16,94 M';
    document.getElementById('card-subval-trab-2').textContent = 'R$ 11,96 Bi';

    const agroEl = document.getElementById('card-val-agro');
    if (agroEl) {
      agroEl.textContent = 'R$ 1,51 Bi';
      document.getElementById('card-subval-agro-1').textContent = '40,5 M';
      document.getElementById('card-subval-agro-2').textContent = 'Mín. 30%';
    }

    const descSaude = document.getElementById('card-desc-saude');
    if (descSaude) descSaude.textContent = 'Gratuidade integral de remédios essenciais para diabetes, hipertensão e asma.';
    const descEdu = document.getElementById('card-desc-educacao');
    if (descEdu) descEdu.textContent = 'Jovens do ensino médio público com poupança e incentivo permanente à conclusão.';
    const descPrev = document.getElementById('card-desc-previdencia');
    if (descPrev) descPrev.textContent = 'R$ 606,2 Bi em aposentadorias (sendo R$ 121,4 Bi rurais), superando o FPM em 78% das cidades.';
    const descTrab = document.getElementById('card-desc-trabalho');
    if (descTrab) descTrab.textContent = 'Recorde de ocupação formal no país aliado ao suporte a 16,9M de MEIs.';
    const descAgro = document.getElementById('card-desc-agro');
    if (descAgro) descAgro.textContent = 'Repasse direto aos pequenos produtores rurais para garantir comida saudável na merenda.';

    return;
  }

  const totalCidades = cidades.length;
  const nomeTerritorio = filtroTerritorial.nome;

  // CÁLCULO REAL E EXATO BASEADO NOS INDICADORES MUNICIPAIS (Total consistência com o Raio-X)
  const cltVagas = cidades.reduce((sum, c) => sum + ((c.pop || 0) * (c.ind?.clt || 0) / 100), 0);
  const meiCad = cidades.reduce((sum, c) => sum + ((c.pop || 0) * (c.ind?.mei || 0) / 100), 0);
  const bfFamilias = cidades.reduce((sum, c) => sum + ((c.pop || 0) * (c.ind?.bf || 0) / 100), 0);
  const bfRepasse = bfFamilias * 575; // repasse médio mensal Bolsa Família (R$ 575/família)

  const fpAtendidos = cidades.reduce((sum, c) => sum + ((c.pop || 0) * (c.ind?.fp || 0) / 100), 0);
  const fpEconomia = fpAtendidos * 600; // ~R$ 600/ano per capita

  const prevBenef = cidades.reduce((sum, c) => sum + ((c.pop || 0) * (c.ind?.apos || 0) / 100), 0);
  const prevValor = prevBenef * 17235; // R$ 606,2 Bi / 35,17 M benefícios
  const prevApos = prevBenef * (24.14 / 35.17);
  const prevRural = prevBenef * (7.01 / 35.17);

  const pdmJovens = cidades.reduce((sum, c) => sum + ((c.pop || 0) * 0.03 * (c.ind?.pdm || 60) / 100), 0);
  const pdmInvest = pdmJovens * 2580;
  const fundebVaat = cidades.reduce((sum, c) => sum + ((c.pop || 0) * (c.ind?.fundeb || 15.9) / 100), 0) * 1420;

  const agroAlunos = cidades.reduce((sum, c) => sum + ((c.pop || 0) * 0.1995), 0);
  const agroValor = agroAlunos * 37.28;

  // Atualização dos 5 Cards de Prioridades com grandezas adaptadas
  document.getElementById('card-val-saude').textContent = formatarGrandeza(fpAtendidos);
  document.getElementById('card-subval-saude-1').textContent = formatarGrandeza(fpEconomia, true);
  document.getElementById('card-subval-saude-2').textContent = `${formatarNumero(totalCidades)} ${totalCidades === 1 ? 'cidade' : 'cidades'}`;

  document.getElementById('card-val-educacao').textContent = formatarGrandeza(pdmInvest, true);
  document.getElementById('card-subval-educacao-1').textContent = `${formatarGrandeza(pdmJovens)} estudantes`;
  document.getElementById('card-subval-educacao-2').textContent = `${formatarGrandeza(fundebVaat, true)} (VAAT)`;

  document.getElementById('card-val-previdencia').textContent = formatarGrandeza(prevValor, true);
  document.getElementById('card-subval-prev-1').textContent = `${formatarGrandeza(prevBenef)} benefícios`;
  document.getElementById('card-subval-prev-2').textContent = `${formatarGrandeza(prevApos)} (${formatarGrandeza(prevRural)} rural)`;

  document.getElementById('card-val-trabalho').textContent = formatarGrandeza(cltVagas);
  document.getElementById('card-subval-trab-1').textContent = `${formatarGrandeza(meiCad)} MEIs`;
  document.getElementById('card-subval-trab-2').textContent = `${formatarGrandeza(bfRepasse, true)}/mês`;

  const agroEl = document.getElementById('card-val-agro');
  if (agroEl) {
    agroEl.textContent = formatarGrandeza(agroValor, true);
    document.getElementById('card-subval-agro-1').textContent = `${formatarGrandeza(agroAlunos)} alunos`;
    document.getElementById('card-subval-agro-2').textContent = 'Mín. 30% local';
  }

  // Descrições Dinâmicas Contextualizadas com o Município/Território
  const descSaude = document.getElementById('card-desc-saude');
  if (descSaude) descSaude.textContent = `Em ${nomeTerritorio}, ${formatarGrandeza(fpAtendidos)} pessoas atendidas têm gratuidade em remédios essenciais de diabetes e hipertensão.`;

  const descEdu = document.getElementById('card-desc-educacao');
  if (descEdu) descEdu.textContent = `Em ${nomeTerritorio}, o Pé-de-Meia apoia ~${formatarGrandeza(pdmJovens)} estudantes do ensino público com poupança mensal contra a evasão.`;

  const descPrev = document.getElementById('card-desc-previdencia');
  if (descPrev) descPrev.textContent = `Em ${nomeTerritorio}, a injeção anual de ~${formatarGrandeza(prevValor, true)} em benefícios previdenciários supera o FPM e movimenta a economia local.`;

  const descTrab = document.getElementById('card-desc-trabalho');
  if (descTrab) descTrab.textContent = `Em ${nomeTerritorio}, são ${formatarGrandeza(cltVagas)} empregos formais CLT somados ao dinamismo de ${formatarGrandeza(meiCad)} microempreendedores (MEI).`;

  const descAgro = document.getElementById('card-desc-agro');
  if (descAgro) descAgro.textContent = `Em ${nomeTerritorio}, compras do PNAE fortalecem pequenos agricultores locais e garantem merenda de qualidade para ${formatarGrandeza(agroAlunos)} alunos.`;
}

/**
 * Rola a página suavemente até a seção de Metodologia de Clusterização
 */
function rolarParaMetodologiaClusterizacao() {
  const el = document.getElementById('secao-metodologia-clusterizacao');
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    el.classList.add('highlight-section-pulse');
    setTimeout(() => {
      el.classList.remove('highlight-section-pulse');
    }, 2200);
  }
}
window.rolarParaMetodologiaClusterizacao = rolarParaMetodologiaClusterizacao;

/**
 * 4. DOIS GRÁFICOS DE TOPO (LADO A LADO CONFORME O ESBOÇO)
 * - Esquerda: Peso Eleitoral por Perfil Socioeconômico
 * - Direita: Desempenho Eleitoral c/ Abstenção por Perfil
 */
function atualizarTopCharts(cidadesFiltradas) {
  const cidades = cidadesFiltradas || APP_DATA.municipios;
  const perfisNomes = Object.keys(APP_DATA.perfis);

  // Calcula total de eleitores no território
  let totalEleitoresTerritorio = 0;
  const eleitoresPorPerfil = {};
  const lulaPorPerfil = {};
  const opositorPorPerfil = {};
  const abstencaoPorPerfil = {};
  const contagemCidadesPerfil = {};

  perfisNomes.forEach(p => {
    eleitoresPorPerfil[p] = 0;
    lulaPorPerfil[p] = 0;
    opositorPorPerfil[p] = 0;
    abstencaoPorPerfil[p] = 0;
    contagemCidadesPerfil[p] = 0;
  });

  cidades.forEach(m => {
    const pf = m.pf;
    const eleic = currentElection === '2026_1t' ? m.e26 : (currentElection === '2022_1t' ? m.e22_1t : (currentElection === '2018_2t' ? m.e18 : m.e22_2t));
    const vtot = eleic?.vtot || Math.round(m.pop * 0.72);
    const lulaPct = currentElection === '2018_2t' ? (eleic?.haddad || 0) : (eleic?.lula || 0);
    const opositorPct = currentElection.includes('2026') ? (eleic?.flavio || 0) : (eleic?.bolsonaro || 0);
    const abstPct = eleic?.abst || (APP_DATA.perfis[pf]?.eleicoes[currentElection]?.taxa_abstencao || 20);

    totalEleitoresTerritorio += vtot;
    if (eleitoresPorPerfil[pf] !== undefined) {
      eleitoresPorPerfil[pf] += vtot;
      lulaPorPerfil[pf] += lulaPct * vtot;
      opositorPorPerfil[pf] += opositorPct * vtot;
      abstencaoPorPerfil[pf] += abstPct * vtot;
      contagemCidadesPerfil[pf]++;
    }
  });

  const divisorTotal = totalEleitoresTerritorio > 0 ? totalEleitoresTerritorio : 1;

  // Ordenação do Maior para o Menor por Peso Eleitoral (Requisito do Usuário)
  const perfisOrdenados = [...perfisNomes].sort((a, b) => {
    const pesoA = eleitoresPorPerfil[a] / divisorTotal;
    const pesoB = eleitoresPorPerfil[b] / divisorTotal;
    return pesoB - pesoA;
  });

  // Labels e Cores ordenados
  const labels = perfisOrdenados.map(p => truncarTexto(p, 26));
  const cores = perfisOrdenados.map(p => PERFIS_IMPACTO[p]?.cor || APP_DATA.perfis[p]?.cor || '#1A56DB');

  // Dados Gráfico 1: Peso Eleitoral (%) ordenados do maior para o menor
  const dadosPeso = perfisOrdenados.map(p => {
    return Math.round((eleitoresPorPerfil[p] / divisorTotal) * 1000) / 10;
  });

  // Dados Gráfico 2: Desempenho Eleitoral c/ Abstenção ordenados pela mesma hierarquia
  const dadosLula = perfisOrdenados.map(p => {
    const tot = eleitoresPorPerfil[p];
    return tot > 0 ? Math.round((lulaPorPerfil[p] / tot) * 10) / 10 : 0;
  });

  const dadosOpositor = perfisOrdenados.map(p => {
    const tot = eleitoresPorPerfil[p];
    return tot > 0 ? Math.round((opositorPorPerfil[p] / tot) * 10) / 10 : 0;
  });

  const dadosAbstencao = perfisOrdenados.map(p => {
    const tot = eleitoresPorPerfil[p];
    return tot > 0 ? Math.round((abstencaoPorPerfil[p] / tot) * 10) / 10 : (APP_DATA.perfis[p]?.eleicoes[currentElection]?.taxa_abstencao || 20);
  });

  // --- Renderização Gráfico 1: Peso Eleitoral (Horizontal com Rótulos Internos) ---
  const ctxPeso = document.getElementById('chart-peso-perfil').getContext('2d');
  if (chartPesoPerfil) chartPesoPerfil.destroy();

  chartPesoPerfil = new Chart(ctxPeso, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: '% do Eleitorado',
          data: dadosPeso,
          backgroundColor: cores,
          borderRadius: 6
        }
      ]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      onClick: (event, elements) => {
        if (elements && elements.length > 0) {
          const index = elements[0].index;
          const perfilSelecionado = perfisOrdenados[index];
          if (perfilSelecionado) {
            aplicarFiltroTerritorial('perfil', perfilSelecionado);
          }
        }
      },
      onHover: (event, chartElement) => {
        const target = event.native?.target || event.chart?.canvas;
        if (target) {
          target.style.cursor = chartElement && chartElement.length > 0 ? 'pointer' : 'default';
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: (items) => perfisOrdenados[items[0].dataIndex],
            label: (item) => [
              ` Peso Eleitoral: ${item.raw.toFixed(1)}% do eleitorado apto`,
              ` 👉 Clique para filtrar todos os municípios deste perfil`
            ]
          }
        }
      },
      scales: {
        x: {
          ticks: { callback: v => v + '%' },
          title: { display: true, text: 'Percentual do Eleitorado Apto (%)' }
        },
        y: {
          ticks: { font: { size: 10, weight: 600 } }
        }
      }
    },
    plugins: [{
      id: 'barLabelsPeso',
      afterDatasetsDraw(chart) {
        const { ctx } = chart;
        const meta = chart.getDatasetMeta(0);
        ctx.save();
        ctx.font = 'bold 11px Inter, sans-serif';
        ctx.textBaseline = 'middle';
        meta.data.forEach((bar, index) => {
          const val = chart.data.datasets[0].data[index];
          if (val === undefined || val === null) return;
          const labelText = `${val.toFixed(1)}%`;
          const barWidth = Math.abs(bar.x - bar.base);
          if (barWidth > 48) {
            ctx.fillStyle = '#FFFFFF';
            ctx.textAlign = 'right';
            ctx.fillText(labelText, bar.x - 8, bar.y);
          } else {
            ctx.fillStyle = '#1E293B';
            ctx.textAlign = 'left';
            ctx.fillText(labelText, bar.x + 6, bar.y);
          }
        });
        ctx.restore();
      }
    }]
  });

  // Labels multi-linha compactos no eixo X para evitar inclinação e nivelar a altura
  const labelsDireita = perfisOrdenados.map(p => {
    if (p.includes(' & ')) {
      const parts = p.split(' & ');
      return [parts[0], '& ' + parts[1]];
    }
    const words = p.split(' ');
    if (words.length >= 2) {
      const mid = Math.ceil(words.length / 2);
      return [words.slice(0, mid).join(' '), words.slice(mid).join(' ')];
    }
    return p;
  });

  // --- Renderização Gráfico 2: Desempenho Eleitoral c/ Abstenção (Amarelo e com Rótulos) ---
  const ctxDesemp = document.getElementById('chart-desempenho-abstencao').getContext('2d');
  if (chartDesempenhoAbstencao) chartDesempenhoAbstencao.destroy();

  const nomeOpositor = currentElection.includes('2026') ? 'Flávio' : 'Bolsonaro';
  const nomeCand1 = currentElection === '2018_2t' ? 'Haddad' : 'Lula';

  chartDesempenhoAbstencao = new Chart(ctxDesemp, {
    type: 'bar',
    data: {
      labels: labelsDireita,
      datasets: [
        {
          label: `${nomeCand1} (%)`,
          data: dadosLula,
          backgroundColor: '#B84A39',
          borderRadius: 4
        },
        {
          label: `${nomeOpositor} (%)`,
          data: dadosOpositor,
          backgroundColor: '#1E40AF',
          borderRadius: 4
        },
        {
          label: 'Abstenção (%)',
          data: dadosAbstencao,
          backgroundColor: '#F59E0B', // Amarelo conforme solicitado
          borderRadius: 4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: { boxWidth: 12, font: { family: 'Inter', size: 11, weight: 600 } },
          onClick: function(e, legendItem, legend) {
            const index = legendItem.datasetIndex;
            const ci = legend.chart;
            if (ci.isDatasetVisible(index)) {
              ci.hide(index);
              legendItem.hidden = true;
            } else {
              ci.show(index);
              legendItem.hidden = false;
            }
            ci.update();
          }
        },
        tooltip: {
          callbacks: {
            title: (items) => perfisOrdenados[items[0].dataIndex],
            label: (item) => ` ${item.dataset.label}: ${item.raw.toFixed(1)}%`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          min: 0,
          max: 100,
          ticks: {
            stepSize: 20,
            callback: v => v + '%'
          },
          title: { display: true, text: '% dos Votos e Abstenção', font: { weight: 'bold' } }
        },
        x: {
          ticks: { font: { family: 'Inter', size: 9.5, weight: 600 }, maxRotation: 0, minRotation: 0 },
          grid: { display: false }
        }
      }
    },
    plugins: [{
      id: 'barLabelsDesempenho',
      afterDatasetsDraw(chart) {
        const { ctx } = chart;
        ctx.save();
        ctx.font = 'bold 9px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        chart.data.datasets.forEach((dataset, datasetIndex) => {
          const meta = chart.getDatasetMeta(datasetIndex);
          if (meta.hidden || (chart.isDatasetVisible && !chart.isDatasetVisible(datasetIndex))) return;
          meta.data.forEach((bar, index) => {
            const val = dataset.data[index];
            if (val === undefined || val === null || val <= 0) return;
            ctx.fillStyle = '#334155';
            ctx.fillText(`${val.toFixed(0)}%`, bar.x, bar.y - 3);
          });
        });
        ctx.restore();
      }
    }]
  });
}

/**
 * 5. RAIO-X DO MUNICÍPIO INTEGRADO (COM COMPARATIVO LULA 2022 vs 2026)
 */
function atualizarRaioXIntegrado() {
  const isBrasil = !activeRaioXCity && (filtroTerritorial.nivel === 'brasil' || !filtroTerritorial.id);
  const isEstado = !activeRaioXCity && (filtroTerritorial.nivel === 'estado');
  const isPerfil = !activeRaioXCity && (filtroTerritorial.nivel === 'perfil');
  const m = activeRaioXCity;

  const titleEl = document.getElementById('raiox-current-city-title');
  const tagEl = document.getElementById('raiox-current-profile-tag');
  const deltaBadge = document.getElementById('raiox-delta-badge');
  const metaInfoEl = document.getElementById('raiox-city-meta-info');

  const getCandPct = (k) => {
    const el = APP_DATA?.eleicoes_info?.[k];
    if (!el) return 0;
    if (el.lula_pct !== undefined) return el.lula_pct;
    const c = el.candidatos?.find(cand => cand.nome === 'Lula' || cand.nome === 'Fernando Haddad');
    return c ? c.pct : 0;
  };

  let cand18 = 45.1;
  let cand22 = 50.9;
  let cand26 = 45.2;

  if (isBrasil) {
    titleEl.textContent = 'Diagnóstico: Brasil (Consolidado Nacional)';
    tagEl.textContent = '5.571 Municípios Brasileiros';
    tagEl.style.backgroundColor = '#1A56DB18';
    tagEl.style.color = '#1A56DB';
    tagEl.style.border = '1px solid #1A56DB40';

    if (metaInfoEl) {
      metaInfoEl.innerHTML = `👥 População: <strong>203,1 M</strong> &nbsp;|&nbsp; 💼 Empregos CLT: <strong>49,7 M</strong> &nbsp;|&nbsp; 🏪 MEIs: <strong>16,9 M</strong> &nbsp;|&nbsp; 🏛️ Servidores: <strong>13,8 M</strong>`;
    }

    cand18 = getCandPct('2018_2t') || 45.1;
    cand22 = getCandPct('2022_2t') || 50.9;
    cand26 = getCandPct('2026_1t') || 45.2;
  } else if (isEstado) {
    const ufId = filtroTerritorial.id;
    const ufObj = APP_DATA.estados[ufId];
    const ufNome = ufObj ? ufObj.nome : ufId;
    const corPerfil = ufObj?.cor_predominante || '#1A56DB';

    titleEl.textContent = `Diagnóstico: Estado de ${ufNome} (${ufId})`;
    tagEl.textContent = `${ufObj ? ufObj.total_municipios : 0} Municípios • ${ufObj?.perfil_predominante || 'Consolidado Estadual'}`;
    tagEl.style.backgroundColor = `${corPerfil}18`;
    tagEl.style.color = corPerfil;
    tagEl.style.border = `1px solid ${corPerfil}40`;

    const ufPop = ufObj?.populacao_total || 0;
    const ufEleit = ufObj?.eleitores_aptos || 0;
    if (metaInfoEl) {
      metaInfoEl.innerHTML = `👥 População: <strong>${formatarNumero(ufPop)} hab</strong> &nbsp;|&nbsp; 🗳️ Eleitores: <strong>${formatarNumero(ufEleit)}</strong> &nbsp;|&nbsp; 🏙️ Cidades: <strong>${ufObj?.total_municipios || 0}</strong>`;
    }

    cand18 = ufObj?.eleicoes?.['2018_2t']?.haddad_pct || ufObj?.eleicoes?.['2018_2t']?.lula_pct || 0;
    cand22 = ufObj?.eleicoes?.['2022_2t']?.lula_pct || 0;
    cand26 = ufObj?.eleicoes?.['2026_1t']?.lula_pct || 0;
  } else if (isPerfil) {
    const perfilNome = filtroTerritorial.perfil || filtroTerritorial.id.replace('Perfil: ', '');
    const corPerfil = PERFIS_IMPACTO[perfilNome]?.cor || '#C026D3';
    const cidadesPerfil = APP_DATA.municipios.filter(c => c.pf === perfilNome);
    const popPerfil = cidadesPerfil.reduce((acc, c) => acc + (c.pop || 0), 0);
    const cltTot = formatarGrandeza(cidadesPerfil.reduce((acc, c) => acc + ((c.pop || 0) * (c.ind?.clt || 0) / 100), 0));
    const meiTot = formatarGrandeza(cidadesPerfil.reduce((acc, c) => acc + ((c.pop || 0) * (c.ind?.mei || 0) / 100), 0));
    const servTot = formatarGrandeza(cidadesPerfil.reduce((acc, c) => acc + ((c.pop || 0) * (c.ind?.serv || 0) / 100), 0));

    titleEl.textContent = `Diagnóstico: Cluster ${perfilNome}`;
    tagEl.textContent = `${cidadesPerfil.length} Cidades • Consolidado do Perfil`;
    tagEl.style.backgroundColor = `${corPerfil}18`;
    tagEl.style.color = corPerfil;
    tagEl.style.border = `1px solid ${corPerfil}40`;

    if (metaInfoEl) {
      metaInfoEl.innerHTML = `👥 População: <strong>${formatarNumero(popPerfil)} hab</strong> &nbsp;|&nbsp; 💼 CLT: <strong>${cltTot}</strong> &nbsp;|&nbsp; 🏪 MEIs: <strong>${meiTot}</strong> &nbsp;|&nbsp; 🏛️ Servidores: <strong>${servTot}</strong>`;
    }

    const eleit18 = cidadesPerfil.reduce((acc, c) => acc + (c.e18?.vtot || c.pop * 0.72), 0) || 1;
    const eleit22 = cidadesPerfil.reduce((acc, c) => acc + (c.e22_2t?.vtot || c.pop * 0.72), 0) || 1;
    const eleit26 = cidadesPerfil.reduce((acc, c) => acc + (c.e26?.vtot || c.pop * 0.72), 0) || 1;
    const v18Tot = cidadesPerfil.reduce((acc, c) => acc + ((c.e18?.haddad || 0) * (c.e18?.vtot || c.pop * 0.72)), 0);
    const v22Tot = cidadesPerfil.reduce((acc, c) => acc + ((c.e22_2t?.lula || 0) * (c.e22_2t?.vtot || c.pop * 0.72)), 0);
    const v26Tot = cidadesPerfil.reduce((acc, c) => acc + ((c.e26?.lula || 0) * (c.e26?.vtot || c.pop * 0.72)), 0);

    cand18 = v18Tot / eleit18;
    cand22 = v22Tot / eleit22;
    cand26 = v26Tot / eleit26;
  } else if (m) {
    titleEl.textContent = `Diagnóstico: ${m.nm} (${m.uf})`;
    const corPerfil = PERFIS_IMPACTO[m.pf]?.cor || '#1A56DB';
    tagEl.textContent = m.pf;
    tagEl.style.backgroundColor = `${corPerfil}18`;
    tagEl.style.color = corPerfil;
    tagEl.style.border = `1px solid ${corPerfil}40`;

    const pop = m.pop || 0;
    const cltTot = formatarGrandeza(pop * (m.ind?.clt || 0) / 100);
    const meiTot = formatarGrandeza(pop * (m.ind?.mei || 0) / 100);
    const servTot = formatarGrandeza(pop * (m.ind?.serv || 0) / 100);

    if (metaInfoEl) {
      metaInfoEl.innerHTML = `👥 População: <strong>${formatarNumero(pop)} hab</strong> &nbsp;|&nbsp; 💼 CLT: <strong>${cltTot}</strong> &nbsp;|&nbsp; 🏪 MEIs: <strong>${meiTot}</strong> &nbsp;|&nbsp; 🏛️ Servidores: <strong>${servTot}</strong>`;
    }

    cand18 = m.e18?.haddad || 0;
    cand22 = m.e22_2t?.lula || 0;
    cand26 = m.e26?.lula || 0;
  }

  // Delta real entre 2026 (1ºT) e 2022 (2ºT)
  const delta = cand26 - cand22;
  if (deltaBadge) {
    if (delta >= 0) {
      deltaBadge.textContent = `▲ +${delta.toFixed(1)} pp vs 2022`;
      deltaBadge.style.backgroundColor = '#DCFCE7';
      deltaBadge.style.color = '#166534';
    } else {
      deltaBadge.textContent = `▼ ${Math.abs(delta).toFixed(1)} pp vs 2022`;
      deltaBadge.style.backgroundColor = '#FEE2E2';
      deltaBadge.style.color = '#991B1B';
    }
  }

  const el18 = document.getElementById('raiox-cand-18');
  if (el18) el18.textContent = `${cand18.toFixed(1)}%`;
  const bar18 = document.getElementById('raiox-bar-18');
  if (bar18) bar18.style.width = `${Math.min(100, cand18)}%`;

  const el22 = document.getElementById('raiox-cand-22');
  if (el22) el22.textContent = `${cand22.toFixed(1)}%`;
  const bar22 = document.getElementById('raiox-bar-22');
  if (bar22) bar22.style.width = `${Math.min(100, cand22)}%`;

  const el26 = document.getElementById('raiox-cand-26');
  if (el26) el26.textContent = `${cand26.toFixed(1)}%`;
  const bar26 = document.getElementById('raiox-bar-26');
  if (bar26) bar26.style.width = `${Math.min(100, cand26)}%`;

  // Renderização Dinâmica dos Cards com Range Bar, Mediana e Nome não-truncado
  const container = document.getElementById('raiox-indicators-grid');
  if (!container) return;

  const medianas = APP_DATA.totais_nacionais?.medianas_municipais || {};
  const brasilIndicadores = APP_DATA.totais_nacionais?.brasil_indicadores || {};

  const itensConfig = [
    { key: 'clt', icon: '💼', label: 'Emprego CLT' },
    { key: 'mei', icon: '🏪', label: 'MEI Formal' },
    { key: 'serv', icon: '🏛️', label: 'Servidores' },
    { key: 'apos', icon: '👴', label: 'Aposentados' },
    { key: 'bf', icon: '🤝', label: 'Bolsa Família' },
    { key: 'bpc', icon: '♿', label: 'BPC / LOAS' },
    { key: 'fp', icon: '💊', label: 'Farmácia Pop.' },
    { key: 'pdm', icon: '🎓', label: 'Pé-de-Meia' }
  ];

  const cidadesEstado = isEstado ? APP_DATA.municipios.filter(c => c.uf === filtroTerritorial.id) : [];
  const ufTotalPop = isEstado ? cidadesEstado.reduce((acc, c) => acc + (c.pop || 0), 0) : 0;

  container.innerHTML = itensConfig.map(cfg => {
    const stat = medianas[cfg.key] || { min: 0, mediana: 5, max: 20 };
    
    let val = 0;
    let volumeTxt = '';
    let taxaTxt = '';

    if (isBrasil) {
      val = brasilIndicadores[cfg.key] || stat.mediana;
      const volNac = {
        clt: '49,7 M vagas',
        mei: '16,9 M ativos',
        serv: '13,8 M servidores',
        apos: '24,1 M ativos',
        bf: '20,8 M famílias',
        bpc: '5,9 M benefícios',
        fp: '13,0 M atendidos',
        pdm: '4,1 M estudantes'
      };
      volumeTxt = volNac[cfg.key] || '';
      taxaTxt = cfg.key === 'pdm' ? `${val.toFixed(1)}% cobertura` : `${val.toFixed(1)} por 100 hab`;
    } else if (isEstado) {
      const sumVal = cidadesEstado.reduce((acc, c) => acc + ((c.pop || 0) * (c.ind?.[cfg.key] || 0) / 100), 0);
      val = ufTotalPop > 0 ? (sumVal / ufTotalPop) * 100 : stat.mediana;
      if (cfg.key === 'pdm') {
        const pdmJovens = formatarGrandeza(4080000 * ufTotalPop / 203000000);
        volumeTxt = `~${pdmJovens} jovens`;
        taxaTxt = `${val.toFixed(1)}% cobertura ensino médio`;
      } else {
        volumeTxt = `~${formatarGrandeza(sumVal)} total`;
        taxaTxt = `${val.toFixed(1)} por 100 hab`;
      }
    } else if (m?.pop) {
      val = m.ind?.[cfg.key] || 0;
      if (cfg.key === 'pdm') {
        const pdmJovens = formatarGrandeza(4080000 * m.pop / 203000000);
        volumeTxt = `~${pdmJovens} jovens`;
        taxaTxt = `${val.toFixed(1)}% cobertura ensino médio`;
      } else {
        const absVal = formatarGrandeza(m.pop * val / 100);
        volumeTxt = `~${absVal} total`;
        taxaTxt = `${val.toFixed(1)} por 100 hab`;
      }
    }

    const isAbove = val > stat.mediana;
    const min = stat.min;
    const max = stat.max;
    const med = stat.mediana;

    const pct = Math.max(0, Math.min(100, ((val - min) / (max - min || 1)) * 100));
    const medianPct = Math.max(0, Math.min(100, ((med - min) / (max - min || 1)) * 100));

    const cardClass = isAbove ? 'raiox-ind-pill card-above-median' : 'raiox-ind-pill';
    const badgeHtml = isAbove
      ? `<span class="median-status-chip chip-above" title="Acima da mediana nacional dos municípios (${med})">▲ Acima (${med})</span>`
      : `<span class="median-status-chip chip-below" title="Na ou abaixo da mediana nacional (${med})">▼ Mediana (${med})</span>`;

    return `
      <div class="${cardClass}" id="raiox-card-${cfg.key}">
        <div class="raiox-ind-top-row">
          <span class="raiox-ind-icon">${cfg.icon}</span>
          ${badgeHtml}
        </div>

        <div class="raiox-ind-title-row">
          <span class="raiox-ind-title" title="${cfg.label}">${cfg.label}</span>
        </div>

        <div class="raiox-ind-values-box">
          <div class="raiox-ind-main-val">${volumeTxt}</div>
          <div class="raiox-ind-rate-sub">${taxaTxt}</div>
        </div>

        <div class="range-bullet-wrap" title="Mínimo no Brasil: ${min} | Mediana: ${med} | Máximo: ${max}">
          <div class="range-bullet-track">
            <div class="range-median-mark" style="left: ${medianPct}%;"></div>
            <div class="range-bullet-dot ${isAbove ? 'dot-high' : ''}" style="left: ${pct}%;"></div>
          </div>
          <div class="range-bullet-sub">
            <span>${min}</span>
            <span style="color: #475569; font-weight: 700;">Mediana: ${med}</span>
            <span>${max}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function focarBuscaMunicipio() {
  const searchInput = document.getElementById('city-search-input');
  if (searchInput) {
    searchInput.focus();
    searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

function abrirModalCidadeAtual() {
  if (activeRaioXCity) {
    abrirModalMunicipio(activeRaioXCity.id);
  }
}

function selecionarMunicipioPorId(id) {
  const m = APP_DATA.municipios.find(c => c.id === id);
  if (!m) return;
  document.getElementById('search-dropdown').classList.add('hidden');
  aplicarFiltroTerritorial('municipio', m.id);
}

/**
 * 6. MAPA LEAFLET INTERATIVO COM DRILLDOWN
 */
function initMap() {
  const mapContainer = document.getElementById('interactive-map');
  if (!mapContainer || leafletMap) return;

  leafletMap = L.map('interactive-map', {
    zoomControl: true,
    scrollWheelZoom: false,
    attributionControl: false
  }).setView([-14.235, -51.925], 4);

  // Basemap Esri Canvas (Light Gray) - 100% livre de API Key, visual limpo executivo
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 16,
    attribution: 'Esri, HERE, Garmin, © OpenStreetMap'
  }).addTo(leafletMap);

  geoJsonLayer = L.geoJson(null).addTo(leafletMap);
  markersLayer = L.layerGroup().addTo(leafletMap);

  renderizarLegendaMapa();
}

function atualizarMapaVisual(isInit = false) {
  if (!leafletMap || !GEOJSON_ESTADOS) return;

  geoJsonLayer.clearLayers();
  markersLayer.clearLayers();

  atualizarBreadcrumb();

  const sidePanel = document.getElementById('territory-side-panel');

  if (filtroTerritorial.nivel === 'brasil') {
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
            <span style="color: #64748B;">Perfil Mais Frequente:</span><br>
            <strong style="color: ${regiaoObj.cor_predominante};">● ${regiaoObj.perfil_predominante}</strong> (${regiaoObj.perfil_predominante_pct}% cidades)<br>
            <small style="color: #1A56DB; font-weight: 700; margin-top: 4px; display: inline-block;">Clique para filtrar esta região ➔</small>
          </div>
        `, { className: 'leaflet-tooltip-custom', sticky: true });

        layer.on('mouseover', () => {
          layer.setStyle({ weight: 3, color: '#0F172A', fillOpacity: 0.92 });
          layer.bringToFront();
        });

        layer.on('mouseout', () => {
          layer.setStyle({ weight: 1.5, color: '#FFFFFF', fillOpacity: 0.75 });
        });

        layer.on('click', () => {
          aplicarFiltroTerritorial('regiao', regiaoNome);
        });
      }
    });

    if (isInit) {
      leafletMap.setView([-14.235, -51.925], 4);
    } else {
      leafletMap.flyToBounds([[-33.75, -73.98], [5.27, -34.79]], { duration: 0.8 });
    }

    renderizarPainelLateralTerritorio('brasil');

  } else if (filtroTerritorial.nivel === 'regiao') {
    const regiaoNome = filtroTerritorial.id;
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
        const cand1Nome = currentElection === '2018_2t' ? 'Haddad' : 'Lula';
        const cand1Pct = currentElection === '2018_2t' ? (eleicao.haddad_pct || eleicao.lula_pct || 0) : (eleicao.lula_pct || 0);

        layer.bindTooltip(`
          <div style="font-size: 0.82rem;">
            <strong>${ufObj.nome} (${uf})</strong><br>
            <strong style="color: ${ufObj.cor_predominante};">● ${ufObj.perfil_predominante}</strong> (${ufObj.perfil_predominante_pct}%)<br>
            <span>${cand1Nome}: <strong>${cand1Pct}%</strong> | ${opositorNome}: <strong>${opositorPct || 0}%</strong></span><br>
            <small style="color: #1A56DB; font-weight: 700; margin-top: 4px; display: inline-block;">Clique para filtrar este estado ➔</small>
          </div>
        `, { className: 'leaflet-tooltip-custom', sticky: true });

        layer.on('mouseover', () => {
          layer.setStyle({ weight: 3.5, color: '#0F172A', fillOpacity: 0.95 });
          layer.bringToFront();
        });

        layer.on('mouseout', () => {
          layer.setStyle({ weight: 2, color: '#FFFFFF', fillOpacity: 0.85 });
        });

        layer.on('click', () => {
          aplicarFiltroTerritorial('estado', uf);
        });
      } else {
        layer.setStyle({
          fillColor: '#F1F5F9',
          weight: 1,
          opacity: 0.6,
          color: '#E2E8F0',
          fillOpacity: 0.2
        });
      }
    });

    if (boundsArray.length > 0) {
      const combinedBounds = boundsArray.reduce((acc, b) => acc.extend(b), L.latLngBounds(boundsArray[0]));
      leafletMap.flyToBounds(combinedBounds, { padding: [25, 25], duration: 0.8 });
    }

    renderizarPainelLateralTerritorio('regiao', regiaoObj);

  } else if (filtroTerritorial.nivel === 'estado') {
    const ufSigla = filtroTerritorial.id;
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
          fillColor: '#F8FAFC',
          weight: 0.8,
          opacity: 0.4,
          color: '#CBD5E1',
          fillOpacity: 0.1
        });
      }
    });

    // Círculos interativos dos municípios
    municipiosDoEstado.forEach(m => {
      if (!m.lat || !m.lng) return;

      const corPerfil = PERFIS_IMPACTO[m.pf]?.cor || '#4B5563';
      const eleic = currentElection === '2026_1t' ? m.e26 : (currentElection === '2022_1t' ? m.e22_1t : (currentElection === '2018_2t' ? m.e18 : m.e22_2t));
      const lulaPct = currentElection === '2018_2t' ? (eleic?.haddad || 0) : (eleic?.lula || 0);
      const opositorPct = currentElection.includes('2026') ? (eleic?.flavio || 0) : (eleic?.bolsonaro || 0);

      const raio = Math.min(10, Math.max(4.5, Math.log10(Math.max(1000, m.pop)) * 1.8));

      const marker = L.circleMarker([m.lat, m.lng], {
        radius: raio,
        fillColor: corPerfil,
        fillOpacity: 0.85,
        color: '#FFFFFF',
        weight: 1.2
      });

      marker.bindTooltip(`
        <div style="font-size: 0.82rem;">
          <strong>${m.nm}</strong> (${formatarNumero(m.pop)} hab)<br>
          <strong style="color: ${corPerfil};">● ${m.pf}</strong><br>
          <span>${currentElection === '2018_2t' ? 'Haddad' : 'Lula'}: <strong>${lulaPct.toFixed(1)}%</strong> | ${currentElection.includes('2026') ? 'Flávio' : 'Bolsonaro'}: <strong>${opositorPct.toFixed(1)}%</strong></span><br>
          <small style="color: #1A56DB; font-weight: 700; margin-top: 3px; display: inline-block;">Clique para Raio-X ➔</small>
        </div>
      `, { className: 'leaflet-tooltip-custom', sticky: true });

      marker.on('click', () => {
        aplicarFiltroTerritorial('municipio', m.id);
      });

      markersLayer.addLayer(marker);
    });

    if (stateBounds) {
      leafletMap.flyToBounds(stateBounds, { padding: [25, 25], duration: 0.8 });
    }

    renderizarPainelLateralTerritorio('estado', ufObj);

  } else if (filtroTerritorial.nivel === 'municipio') {
    const m = activeRaioXCity;
    if (m && m.lat && m.lng) {
      leafletMap.flyTo([m.lat, m.lng], 10, { duration: 0.8 });

      const corPerfil = PERFIS_IMPACTO[m.pf]?.cor || '#1A56DB';
      const marker = L.circleMarker([m.lat, m.lng], {
        radius: 12,
        fillColor: corPerfil,
        fillOpacity: 0.95,
        color: '#0F172A',
        weight: 3
      }).addTo(markersLayer);

      marker.bindPopup(`
        <div style="font-size: 0.85rem; padding: 4px;">
          <h4 style="margin: 0; color: #0F172A;">${m.nm} (${m.uf})</h4>
          <span style="color: ${corPerfil}; font-weight: 700;">● ${m.pf}</span><br>
          <span>População: ${formatarNumero(m.pop)}</span>
        </div>
      `).openPopup();
    }
    renderizarPainelLateralTerritorio('municipio', m);
  } else if (filtroTerritorial.nivel === 'perfil') {
    const perfilNome = filtroTerritorial.perfil || filtroTerritorial.id.replace('Perfil: ', '');
    const corPerfil = PERFIS_IMPACTO[perfilNome]?.cor || '#C026D3';
    const cidadesDoPerfil = APP_DATA.municipios.filter(m => m.pf === perfilNome);

    geoJsonLayer.addData(GEOJSON_ESTADOS);
    geoJsonLayer.eachLayer(layer => {
      layer.setStyle({
        fillColor: '#F8FAFC',
        weight: 0.8,
        opacity: 0.4,
        color: '#CBD5E1',
        fillOpacity: 0.08
      });
    });

    cidadesDoPerfil.forEach(m => {
      if (!m.lat || !m.lng) return;
      const eleic = currentElection === '2026_1t' ? m.e26 : (currentElection === '2022_1t' ? m.e22_1t : (currentElection === '2018_2t' ? m.e18 : m.e22_2t));
      const lulaPct = currentElection === '2018_2t' ? (eleic?.haddad || 0) : (eleic?.lula || 0);
      const opositorPct = currentElection.includes('2026') ? (eleic?.flavio || 0) : (eleic?.bolsonaro || 0);
      const raio = Math.min(9, Math.max(4, Math.log10(Math.max(1000, m.pop)) * 1.6));

      const marker = L.circleMarker([m.lat, m.lng], {
        radius: raio,
        fillColor: corPerfil,
        fillOpacity: 0.85,
        color: '#FFFFFF',
        weight: 1
      });

      marker.bindTooltip(`
        <div style="font-size: 0.82rem;">
          <strong>${m.nm} (${m.uf})</strong> • ${formatarNumero(m.pop)} hab<br>
          <strong style="color: ${corPerfil};">● ${m.pf}</strong><br>
          <span>${currentElection === '2018_2t' ? 'Haddad' : 'Lula'}: <strong>${lulaPct.toFixed(1)}%</strong> | ${currentElection.includes('2026') ? 'Flávio' : 'Bolsonaro'}: <strong>${opositorPct.toFixed(1)}%</strong></span><br>
          <small style="color: #1A56DB; font-weight: 700; margin-top: 3px; display: inline-block;">Clique para abrir Raio-X ➔</small>
        </div>
      `, { className: 'leaflet-tooltip-custom', sticky: true });

      marker.on('click', () => {
        aplicarFiltroTerritorial('municipio', m.id);
      });

      markersLayer.addLayer(marker);
    });

    leafletMap.flyToBounds([[-33.75, -73.98], [5.27, -34.79]], { duration: 0.8 });
    renderizarPainelLateralTerritorio('perfil', { perfil: perfilNome, count: cidadesDoPerfil.length });
  }
}

function renderizarPainelLateralTerritorio(tipo, obj) {
  const panel = document.getElementById('territory-side-panel');
  if (!panel) return;

  if (tipo === 'brasil') {
    const regioes = Object.values(APP_DATA.regioes);
    panel.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <span style="font-size: 0.74rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">Perfis Mais Frequentes por Região</span>
        <span style="font-size: 0.72rem; color: var(--gov-blue-light); font-weight: 700;">Clique para aproximar</span>
      </div>
      <div style="display: flex; flex-wrap: wrap; gap: 8px;">
        ${regioes.map(r => `
          <button style="border: 1px solid var(--border-subtle); background: #F8FAFC; padding: 5px 10px; border-radius: 6px; font-size: 0.76rem; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: all 0.2s;" onclick="aplicarFiltroTerritorial('regiao', '${r.nome}')" onmouseover="this.style.borderColor='${r.cor_predominante}'" onmouseout="this.style.borderColor='var(--border-subtle)'">
            <span style="width: 8px; height: 8px; border-radius: 50%; background: ${r.cor_predominante};"></span>
            <strong>${r.nome}:</strong> ${r.perfil_predominante}
          </button>
        `).join('')}
      </div>
    `;
  } else if (tipo === 'regiao') {
    panel.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
        <div>
          <strong style="color: var(--gov-blue-dark); font-size: 0.88rem;">Região ${obj.nome}</strong> • 
          <span style="color: var(--text-muted); font-size: 0.8rem;">${obj.total_municipios} municípios</span>
        </div>
        <div style="display: flex; gap: 4px; flex-wrap: wrap;">
          ${obj.estados.map(uf => `
            <button style="background: #FFFFFF; border: 1px solid var(--border-strong); padding: 3px 8px; border-radius: 4px; font-size: 0.74rem; font-weight: 700; cursor: pointer;" onclick="aplicarFiltroTerritorial('estado', '${uf}')">
              ${uf}
            </button>
          `).join('')}
        </div>
      </div>
    `;
  } else if (tipo === 'estado') {
    panel.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
        <div>
          <strong style="color: var(--gov-blue-dark); font-size: 0.88rem;">${obj.nome} (${obj.sigla})</strong> • 
          <span style="color: var(--text-muted); font-size: 0.8rem;">${obj.total_municipios} municípios</span>
        </div>
        <span style="font-size: 0.78rem; font-weight: 700; color: ${obj.cor_predominante};">
          ● Perfil Predominante: ${obj.perfil_predominante} (${obj.perfil_predominante_pct}%)
        </span>
      </div>
    `;
  } else if (tipo === 'municipio') {
    panel.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
        <div>
          <strong style="color: var(--gov-blue-dark); font-size: 0.88rem;">${obj.nm} (${obj.uf})</strong> • 
          <span style="color: var(--text-muted); font-size: 0.8rem;">${formatarNumero(obj.pop)} habitantes</span>
        </div>
        <button class="btn-primary" style="padding: 4px 10px; font-size: 0.74rem;" onclick="abrirModalMunicipio('${obj.id}')">
          Abrir Raio-X Completo
        </button>
      </div>
    `;
  } else if (tipo === 'perfil') {
    const perfilNome = obj.perfil;
    const corPerfil = PERFIS_IMPACTO[perfilNome]?.cor || '#C026D3';
    panel.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
        <div>
          <strong style="color: var(--gov-blue-dark); font-size: 0.88rem;">${filtroTerritorial.nome}</strong> • 
          <span style="color: var(--text-muted); font-size: 0.8rem;">${obj.count} municípios mapeados</span>
        </div>
        <span style="font-size: 0.78rem; font-weight: 700; color: ${corPerfil};">
          ● Exibindo todas as cidades deste perfil socioeconômico
        </span>
      </div>
    `;
  }
}

function atualizarBreadcrumb() {
  const bc = document.getElementById('drilldown-breadcrumb');
  if (!bc) return;

  let html = `
    <button class="crumb-btn ${filtroTerritorial.nivel === 'brasil' ? 'active' : ''}" onclick="aplicarFiltroTerritorial('brasil', null)">
      <svg class="crumb-icon" viewBox="0 0 20 20" fill="currentColor">
        <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
      </svg>
      Brasil (5 Regiões)
    </button>
  `;

  if (filtroTerritorial.nivel === 'regiao') {
    html += `
      <span class="crumb-separator">/</span>
      <button class="crumb-btn active">Região ${filtroTerritorial.id}</button>
    `;
  } else if (filtroTerritorial.nivel === 'perfil') {
    html += `
      <span class="crumb-separator">/</span>
      <button class="crumb-btn active">${filtroTerritorial.nome}</button>
    `;
  } else if (filtroTerritorial.nivel === 'estado') {
    const uf = filtroTerritorial.id;
    const regiao = APP_DATA.estados[uf]?.regiao;
    if (regiao) {
      html += `
        <span class="crumb-separator">/</span>
        <button class="crumb-btn" onclick="aplicarFiltroTerritorial('regiao', '${regiao}')">Região ${regiao}</button>
      `;
    }
    html += `
      <span class="crumb-separator">/</span>
      <button class="crumb-btn active">${uf}</button>
    `;
  } else if (filtroTerritorial.nivel === 'municipio') {
    const m = activeRaioXCity;
    if (m) {
      html += `
        <span class="crumb-separator">/</span>
        <button class="crumb-btn" onclick="aplicarFiltroTerritorial('regiao', '${m.reg}')">${m.reg}</button>
        <span class="crumb-separator">/</span>
        <button class="crumb-btn" onclick="aplicarFiltroTerritorial('estado', '${m.uf}')">${m.uf}</button>
        <span class="crumb-separator">/</span>
        <button class="crumb-btn active">${m.nm}</button>
      `;
    }
  }

  bc.innerHTML = html;
}

function renderizarLegendaMapa() {
  const overlay = document.getElementById('map-legend-overlay');
  if (!overlay) return;
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
 * 7. TABELA DESCRITIVA POR MUNICÍPIO COM ORDENAÇÃO E NOVAS COLUNAS
 * Novas Colunas: MEI/100 hab, Servidores/100 hab, BPC/100 hab
 * Ordenação clicável nos cabeçalhos (menor pro maior / maior pro menor)
 */
function configurarTabelaOrdenavel() {
  document.querySelectorAll('.sortable-th').forEach(th => {
    th.addEventListener('click', (e) => {
      const col = e.currentTarget.getAttribute('data-col');
      if (tableSortState.col === col) {
        tableSortState.asc = !tableSortState.asc;
      } else {
        tableSortState.col = col;
        tableSortState.asc = false; // Primeiro clique decrescente (maior pro menor)
      }

      // Atualiza ícones dos cabeçalhos
      document.querySelectorAll('.sortable-th').forEach(h => {
        const icon = h.querySelector('.sort-icon');
        if (h.getAttribute('data-col') === col) {
          icon.textContent = tableSortState.asc ? '▲' : '▼';
          h.style.color = 'var(--gov-blue-light)';
        } else {
          icon.textContent = '⇅';
          h.style.color = '';
        }
      });

      atualizarTabelaMunicipios();
    });
  });
}

function getValorColuna(m, col) {
  const eleic = currentElection === '2026_1t' ? m.e26 : (currentElection === '2022_1t' ? m.e22_1t : (currentElection === '2018_2t' ? m.e18 : m.e22_2t));
  switch (col) {
    case 'nm': return m.nm.toLowerCase();
    case 'pf': return m.pf.toLowerCase();
    case 'pop': return m.pop || 0;
    case 'lula': return currentElection === '2018_2t' ? (eleic?.haddad || 0) : (eleic?.lula || 0);
    case 'opositor': return currentElection.includes('2026') ? (eleic?.flavio || 0) : (eleic?.bolsonaro || 0);
    case 'mei': return m.ind?.mei || 0;
    case 'serv': return m.ind?.serv || 0;
    case 'bpc': return m.ind?.bpc || 0;
    case 'fp': return m.ind?.fp || 0;
    case 'pdm': return m.ind?.pdm || 0;
    case 'apos': return m.ind?.apos || 0;
    default: return 0;
  }
}

function getMunicipiosFiltradosTabela() {
  let cidades = APP_DATA?.municipios || [];

  if (filtroTerritorial.nivel === 'regiao') {
    cidades = cidades.filter(m => m.reg === filtroTerritorial.id);
  } else if (filtroTerritorial.nivel === 'estado') {
    cidades = cidades.filter(m => m.uf === filtroTerritorial.id);
  } else if (filtroTerritorial.nivel === 'municipio') {
    cidades = cidades.filter(m => m.id === filtroTerritorial.id);
  } else if (filtroTerritorial.nivel === 'perfil') {
    const perfilNome = filtroTerritorial.perfil || filtroTerritorial.id.replace('Perfil: ', '');
    cidades = cidades.filter(m => m.pf === perfilNome);
  }

  // Filtro por Região selecionada no modal
  if (tableFilterRegiao) {
    cidades = cidades.filter(m => m.reg === tableFilterRegiao);
  }

  // Filtro por UF selecionada no modal
  if (tableFilterUf) {
    cidades = cidades.filter(m => m.uf === tableFilterUf);
  }

  // Filtra por termo de busca se digitado
  if (tableSearchQuery) {
    cidades = cidades.filter(m => 
      m.nm.toLowerCase().includes(tableSearchQuery) || 
      (m.nm + " " + m.uf).toLowerCase().includes(tableSearchQuery)
    );
  }

  return cidades;
}

function atualizarOpcoesUfTabela() {
  const ufSelect = document.getElementById('table-filter-uf');
  if (!ufSelect || !APP_DATA) return;

  let ufs = Object.keys(APP_DATA.estados || {}).sort();
  if (tableFilterRegiao) {
    const regiaoObj = APP_DATA.regioes[tableFilterRegiao];
    if (regiaoObj && regiaoObj.estados) {
      ufs = regiaoObj.estados.slice().sort();
    }
  }

  const valorAtual = ufSelect.value;
  ufSelect.innerHTML = '<option value="">Todos os Estados (UF)</option>' +
    ufs.map(uf => `<option value="${uf}">${uf} - ${APP_DATA.estados[uf]?.nome || uf}</option>`).join('');

  if (ufs.includes(valorAtual)) {
    ufSelect.value = valorAtual;
  } else {
    tableFilterUf = '';
    ufSelect.value = '';
  }
}

function baixarTabelaCSV() {
  const cidades = getMunicipiosFiltradosTabela();
  if (!cidades || cidades.length === 0) {
    alert('Nenhum município encontrado para exportação com os filtros atuais.');
    return;
  }

  const cabecalhos = [
    'Codigo_IBGE',
    'Municipio',
    'UF',
    'Regiao',
    'Perfil_Socioeconomico',
    'Populacao',
    'Votos_Validos_2026',
    'Lula_2026_Pct',
    'Flavio_2026_Pct',
    'Lula_2022_1T_Pct',
    'Bolsonaro_2022_1T_Pct',
    'Lula_2022_2T_Pct',
    'Bolsonaro_2022_2T_Pct',
    'MEI_por_100hab',
    'Servidores_por_100hab',
    'BPC_por_100hab',
    'Farmacia_Popular_por_100hab',
    'Pe_de_Meia_Pct',
    'Aposentadorias_RGPS_por_100hab'
  ];

  const linhas = [cabecalhos.join(';')];

  cidades.forEach(m => {
    const e26 = m.e26 || {};
    const e22_1t = m.e22_1t || {};
    const e22_2t = m.e22_2t || {};
    const ind = m.ind || {};

    const colunas = [
      m.id,
      `"${m.nm.replace(/"/g, '""')}"`,
      m.uf,
      `"${m.reg || ''}"`,
      `"${(m.pf || '').replace(/"/g, '""')}"`,
      m.pop || 0,
      e26.vtot || 0,
      (e26.lula || 0).toFixed(1).replace('.', ','),
      (e26.flavio || 0).toFixed(1).replace('.', ','),
      (e22_1t.lula || 0).toFixed(1).replace('.', ','),
      (e22_1t.bolsonaro || 0).toFixed(1).replace('.', ','),
      (e22_2t.lula || 0).toFixed(1).replace('.', ','),
      (e22_2t.bolsonaro || 0).toFixed(1).replace('.', ','),
      (ind.mei || 0).toFixed(1).replace('.', ','),
      (ind.serv || 0).toFixed(1).replace('.', ','),
      (ind.bpc || 0).toFixed(1).replace('.', ','),
      (ind.fp || 0).toFixed(1).replace('.', ','),
      (ind.pdm || 0).toFixed(1).replace('.', ','),
      (ind.apos || 0).toFixed(1).replace('.', ',')
    ];
    linhas.push(colunas.join(';'));
  });

  const csvContent = '\uFEFF' + linhas.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const timestamp = new Date().toISOString().slice(0, 10);
  const regiaoSufixo = tableFilterRegiao ? `_${tableFilterRegiao.toLowerCase().replace(/\s+/g, '_')}` : '';
  const ufSufixo = tableFilterUf ? `_${tableFilterUf}` : '';
  link.setAttribute('download', `municipios_base_completa${regiaoSufixo}${ufSufixo}_${timestamp}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function atualizarTabelaMunicipios(cidadesFiltradas) {
  let cidades = cidadesFiltradas || getMunicipiosFiltradosTabela();

  // Ordenação
  const col = tableSortState.col;
  const mult = tableSortState.asc ? 1 : -1;
  cidades.sort((a, b) => {
    const valA = getValorColuna(a, col);
    const valB = getValorColuna(b, col);
    if (typeof valA === 'string') {
      return valA.localeCompare(valB) * mult;
    }
    return (valA - valB) * mult;
  });

  const total = cidades.length;
  const fatiadas = cidades.slice(0, tablePageLimit);

  const tbody = document.getElementById('state-mun-tbody');
  const countEl = document.getElementById('table-record-count');
  const btnLoadMore = document.getElementById('btn-load-more-cities');

  if (countEl) {
    countEl.textContent = `Exibindo ${fatiadas.length} de ${formatarNumero(total)} municípios`;
  }

  if (btnLoadMore) {
    btnLoadMore.style.display = fatiadas.length >= total ? 'none' : 'inline-block';
  }

  tbody.innerHTML = fatiadas.map(m => {
    const eleic = currentElection === '2026_1t' ? m.e26 : (currentElection === '2022_1t' ? m.e22_1t : (currentElection === '2018_2t' ? m.e18 : m.e22_2t));
    const lulaPct = currentElection === '2018_2t' ? (eleic?.haddad || 0) : (eleic?.lula || 0);
    const opositorPct = currentElection.includes('2026') ? (eleic?.flavio || 0) : (eleic?.bolsonaro || 0);
    const corPerfil = PERFIS_IMPACTO[m.pf]?.cor || '#4B5563';

    return `
      <tr onclick="selecionarMunicipioPorId('${m.id}')">
        <td style="font-weight: 700;">${m.nm} <span style="font-weight: 500; color: #64748B;">(${m.uf})</span></td>
        <td>
          <span class="mun-profile-pill" style="background-color: ${corPerfil}15; color: ${corPerfil}; border: 1px solid ${corPerfil}30;">
            ${truncarTexto(m.pf, 22)}
          </span>
        </td>
        <td>${formatarNumero(m.pop)}</td>
        <td style="font-weight: 700; color: var(--eleitoral-lula);">${lulaPct.toFixed(1)}%</td>
        <td style="font-weight: 700; color: var(--eleitoral-bolsonaro);">${opositorPct.toFixed(1)}%</td>
        <td style="font-weight: 600; color: #0284C7;">${(m.ind?.mei || 0).toFixed(1)}</td>
        <td style="font-weight: 600; color: #7E3AF2;">${(m.ind?.serv || 0).toFixed(1)}</td>
        <td style="font-weight: 600; color: #D97706;">${(m.ind?.bpc || 0).toFixed(1)}</td>
        <td>${(m.ind?.fp || 0).toFixed(1)}</td>
        <td>${(m.ind?.pdm || 0).toFixed(1)}%</td>
        <td>${(m.ind?.apos || 0).toFixed(1)}</td>
        <td>
          <button class="btn-primary" style="padding: 3px 8px; font-size: 0.72rem;" onclick="event.stopPropagation(); abrirModalMunicipio('${m.id}')">
            Raio-X
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function carregarMaisMunicipios() {
  tablePageLimit += 60;
  atualizarTabelaMunicipios();
}

/**
 * 8. AVISO DE GRANULARIDADE DAS SÉRIES TEMPORAIS
 */
function atualizarAvisoGranularidade(nivel) {
  const notice = document.getElementById('granularity-notice');
  if (!notice) return;

  if (nivel === 'brasil') {
    notice.innerHTML = `
      <span class="granularity-icon">ℹ️</span>
      <span>Séries temporais consolidadas em nível nacional (Trajetória Oficial 2010 a 2026).</span>
    `;
  } else if (nivel === 'regiao') {
    notice.innerHTML = `
      <span class="granularity-icon">ℹ️</span>
      <span>Séries macroeconômicas nacionais ponderadas pela composição produtiva da Região ${filtroTerritorial.id}.</span>
    `;
  } else if (nivel === 'estado') {
    notice.innerHTML = `
      <span class="granularity-icon">ℹ️</span>
      <span>Dados em nível estadual (${filtroTerritorial.id}) e agregados macroeconômicos do DIEESE / ANP / BCB.</span>
    `;
  } else if (nivel === 'municipio') {
    notice.innerHTML = `
      <span class="granularity-icon">ℹ️</span>
      <span><strong>Granularidade Municipal:</strong> As séries temporais de consumo utilizam referências estaduais/nacionais; os indicadores da cidade estão abertos no card acima.</span>
    `;
  }
}

/**
 * 8b. ABERTURA POR NÚMERO MUNICIPAL DA ATIVIDADE ECONÔMICA
 */
function atualizarNumerosMunicipaisSeries(cidade) {
  const container = document.getElementById('mun-series-grid');
  const titleEl = document.getElementById('mun-series-title');
  const subEl = document.getElementById('mun-series-sub');
  if (!container) return;

  const m = cidade || (filtroTerritorial.nivel === 'municipio' ? APP_DATA.municipios.find(c => c.id === filtroTerritorial.id) : activeRaioXCity);
  const isBrasil = !m || filtroTerritorial.nivel === 'brasil';

  if (isBrasil) {
    if (titleEl) titleEl.textContent = 'Abertura por Número Municipal: Brasil (Consolidado)';
    if (subEl) subEl.textContent = 'Médias e totais nacionais dos 5.571 municípios. Selecione qualquer município no topo para abrir os números locais.';

    container.innerHTML = `
      <div class="mun-series-item">
        <div class="mun-series-lbl">Vagas Formais CLT</div>
        <div class="mun-series-val" style="color: #1A56DB;">49,66 M</div>
        <span style="font-size: 0.72rem; color: #64748B;">Recorde histórico nacional</span>
      </div>
      <div class="mun-series-item">
        <div class="mun-series-lbl">MEIs Cadastrados</div>
        <div class="mun-series-val" style="color: #0284C7;">16,94 M</div>
        <span style="font-size: 0.72rem; color: #64748B;">Microempreendedores ativos</span>
      </div>
      <div class="mun-series-item">
        <div class="mun-series-lbl">Aposentadorias RGPS</div>
        <div class="mun-series-val" style="color: #7E3AF2;">R$ 606,2 Bi</div>
        <span style="font-size: 0.72rem; color: #64748B;">35,17 M benefícios pagos</span>
      </div>
      <div class="mun-series-item">
        <div class="mun-series-lbl">Farmácia Popular</div>
        <div class="mun-series-val" style="color: #0E9F6E;">12,96 M</div>
        <span style="font-size: 0.72rem; color: #64748B;">R$ 7,73 Bi de economia</span>
      </div>
      <div class="mun-series-item">
        <div class="mun-series-lbl">Pé-de-Meia</div>
        <div class="mun-series-val" style="color: #F59E0B;">4,08 M</div>
        <span style="font-size: 0.72rem; color: #64748B;">Jovens do ensino médio</span>
      </div>
      <div class="mun-series-item">
        <div class="mun-series-lbl">Merenda / Agro Familiar</div>
        <div class="mun-series-val" style="color: #059669;">R$ 1,51 Bi</div>
        <span style="font-size: 0.72rem; color: #64748B;">Mín. 30% pequenos produtores</span>
      </div>
    `;
    return;
  }

  // Dados abertos para o município ativo
  if (titleEl) titleEl.textContent = `Abertura por Número Municipal: ${m.nm} (${m.uf})`;
  if (subEl) subEl.textContent = `Perfil: ${m.pf} • População: ${formatarNumero(m.pop)} hab • Região ${m.reg}`;

  const meiEstimado = Math.round((m.pop * (m.ind?.mei || 7.2)) / 100);
  const aposEstimados = Math.round((m.pop * (m.ind?.apos || 11.5)) / 100);
  const injeaoInssEstimada = ((aposEstimados * 1518 * 13) / 1000000).toFixed(1); // R$ Milhões/ano
  const fpBenef = Math.round((m.pop * (m.ind?.fp || 6.4)) / 100);
  const pnaeAgroEst = ((m.pop * 7.5) / 1000).toFixed(1); // R$ mil estimado para merenda agricultura familiar

  container.innerHTML = `
    <div class="mun-series-item">
      <div class="mun-series-lbl">MEIs no Município</div>
      <div class="mun-series-val" style="color: #0284C7;">${formatarNumero(meiEstimado)}</div>
      <span style="font-size: 0.72rem; color: #64748B;">${(m.ind?.mei || 0).toFixed(1)} MEIs / 100 hab</span>
    </div>
    <div class="mun-series-item">
      <div class="mun-series-lbl">Aposentados INSS</div>
      <div class="mun-series-val" style="color: #7E3AF2;">${formatarNumero(aposEstimados)}</div>
      <span style="font-size: 0.72rem; color: #64748B;">Injeção: ~R$ ${formatarNumero(injeaoInssEstimada)} M/ano</span>
    </div>
    <div class="mun-series-item">
      <div class="mun-series-lbl">Farmácia Popular</div>
      <div class="mun-series-val" style="color: #0E9F6E;">${formatarNumero(fpBenef)} hab</div>
      <span style="font-size: 0.72rem; color: #64748B;">${(m.ind?.fp || 0).toFixed(1)} atendidos / 100 hab</span>
    </div>
    <div class="mun-series-item">
      <div class="mun-series-lbl">Cobertura Pé-de-Meia</div>
      <div class="mun-series-val" style="color: #F59E0B;">${(m.ind?.pdm || 0).toFixed(1)}%</div>
      <span style="font-size: 0.72rem; color: #64748B;">Jovens do EM c/ poupança</span>
    </div>
    <div class="mun-series-item">
      <div class="mun-series-lbl">Merenda Escolar (PNAE)</div>
      <div class="mun-series-val" style="color: #059669;">Mín. 30% Local</div>
      <span style="font-size: 0.72rem; color: #64748B;">~R$ ${formatarNumero(pnaeAgroEst)} mil pequenos produtores</span>
    </div>
    <div class="mun-series-item">
      <div class="mun-series-lbl">Funcionalismo Público</div>
      <div class="mun-series-val" style="color: #C026D3;">${(m.ind?.serv || 0).toFixed(1)} / 100</div>
      <span style="font-size: 0.72rem; color: #64748B;">Servidores por 100 hab</span>
    </div>
  `;
}

/**
 * 9. SÉRIES HISTÓRICAS & PODER DE COMPRA (COM ABA DO ORÇAMENTO FEDERAL)
 */
function renderizarSeriesHistoricas() {
  if (!APP_DATA || !APP_DATA.series_historicas) return;

  document.querySelectorAll('.series-tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.series-tab-btn').forEach(b => b.classList.remove('active'));
      const target = e.currentTarget;
      target.classList.add('active');
      currentSeriesMetric = target.getAttribute('data-metric');
      atualizarGraficoSeriesHistoricas();
    });
  });

  // Botões de Alternância entre Valores Gastos (Nominais) e Corrigidos pela Inflação (Real)
  document.querySelectorAll('.orc-toggle-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.orc-toggle-btn').forEach(b => b.classList.remove('active'));
      const target = e.currentTarget;
      target.classList.add('active');
      currentOrcamentoMode = target.getAttribute('data-mode') || 'real';
      atualizarGraficoSeriesHistoricas();
    });
  });

  atualizarNumerosMunicipaisSeries(null);
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
  const orcToggleEl = document.getElementById('orcamento-mode-toggle');

  if (orcToggleEl) {
    orcToggleEl.style.display = currentSeriesMetric === 'orcamento_federal' ? 'inline-flex' : 'none';
  }

  let datasets = [];
  let yAxisConfig = {};
  let highlightsHtml = '';

  if (currentSeriesMetric === 'poder_compra') {
    titleEl.textContent = 'Custo de Bens Essenciais em % do Salário Mínimo';
    subtitleEl.textContent = 'Proporção da renda mínima necessária para adquirir Cesta Básica, Botijão de Gás e 1L de Gasolina';
    tagEl.textContent = 'DIEESE / ANP / BCB';

    highlightsHtml = `
      <div class="series-highlight-box" style="border-left: 4px solid #1A56DB;">
        <span class="series-highlight-title">Cesta Básica (% Salário Mínimo)</span>
        <div class="series-highlight-val">54,5% <span style="font-size: 0.8rem; color: #0E9F6E; font-weight: 700;">▼ -8.4 p.p. vs 2022</span></div>
        <span class="series-highlight-sub">No pico de 2022 consumia 62,9% do salário mínimo; em 2026 caiu para 54,5%.</span>
      </div>
      <div class="series-highlight-box" style="border-left: 4px solid #0E9F6E;">
        <span class="series-highlight-title">Botijão de Gás GLP 13kg</span>
        <div class="series-highlight-val">6,7% <span style="font-size: 0.8rem; color: #0E9F6E; font-weight: 700;">▼ -2.4 p.p. vs 2022</span></div>
        <span class="series-highlight-sub">Chegou a consumir 9,1% do salário mínimo em 2022; agora exige 6,7%.</span>
      </div>
      <div class="series-highlight-box" style="border-left: 4px solid #D97706;">
        <span class="series-highlight-title">1 Litro de Gasolina Comum</span>
        <div class="series-highlight-val">0,41% <span style="font-size: 0.8rem; color: #0E9F6E; font-weight: 700;">▼ -0.12 p.p. vs 2022</span></div>
        <span class="series-highlight-sub">Em 2022, 1L de gasolina consumia 0,53% do salário mínimo; agora exige 0,41%.</span>
      </div>
      <div class="series-highlight-box" style="border-left: 4px solid #7E3AF2;">
        <span class="series-highlight-title">Salário Mínimo Nominal</span>
        <div class="series-highlight-val">R$ 1.518 <span style="font-size: 0.8rem; color: #1A56DB; font-weight: 700;">▲ +25,2% vs 2022</span></div>
        <span class="series-highlight-sub">Evoluiu de R$ 1.212 (2022) para R$ 1.518 (2026) com valorização real acima da inflação.</span>
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
        label: 'Botijão de Gás GLP (% do Salário Mínimo)',
        data: dados.map(d => d.gas_glp_pct_sm),
        borderColor: '#0E9F6E',
        backgroundColor: 'rgba(14, 159, 110, 0.08)',
        borderWidth: 3,
        tension: 0.25,
        pointRadius: 4
      },
      {
        label: '1L Gasolina Comum (% do Salário Mínimo)',
        data: dados.map(d => d.gasolina_pct_sm || 0.41),
        borderColor: '#D97706',
        backgroundColor: 'rgba(217, 119, 6, 0.08)',
        borderWidth: 2.5,
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
        <div class="series-highlight-val">12,85 M <span style="font-size: 0.8rem; color: #0E9F6E; font-weight: 700;">▲ +23,8% vs 2022</span></div>
        <span class="series-highlight-sub">Volume anual de transferências no mercado formal (era 10,38M em 2022).</span>
      </div>
      <div class="series-highlight-box" style="border-left: 4px solid #1A56DB;">
        <span class="series-highlight-title">Veículos Novos (0 km)</span>
        <div class="series-highlight-val">2,65 M <span style="font-size: 0.8rem; color: #1A56DB; font-weight: 700;">▲ +26,2% vs 2022</span></div>
        <span class="series-highlight-sub">Licenciamentos anuais de automóveis e comerciais leves (era 2,10M em 2022).</span>
      </div>
      <div class="series-highlight-box" style="border-left: 4px solid #D97706;">
        <span class="series-highlight-title">Razão Usados por Novo</span>
        <div class="series-highlight-val">4,85x</div>
        <span class="series-highlight-sub">Para cada 1 carro 0 km vendido no Brasil, giram quase 5 carros usados.</span>
      </div>
      <div class="series-highlight-box" style="border-left: 4px solid #7E3AF2;">
        <span class="series-highlight-title">Crédito Automotivo</span>
        <div class="series-highlight-val">+22,4% vs 2022</div>
        <span class="series-highlight-sub">Expansão na concessão de financiamentos para aquisição de veículos.</span>
      </div>
    `;

    datasets = [
      {
        label: 'Veículos Usados Vendidos (Milhões)',
        data: dados.map(d => d.veiculos_usados_milhoes),
        backgroundColor: '#0E9F6E',
        borderRadius: 4,
        type: 'bar',
        stack: 'veiculos'
      },
      {
        label: 'Veículos Novos Licenciados (Milhões)',
        data: dados.map(d => d.veiculos_novos_milhoes),
        backgroundColor: '#1A56DB',
        borderRadius: 4,
        type: 'bar',
        stack: 'veiculos'
      }
    ];

    yAxisConfig = {
      stacked: true,
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
        <div class="series-highlight-val">194,8 mil <span style="font-size: 0.8rem; color: #0E9F6E; font-weight: 700;">▲ +25,3% vs 2022</span></div>
        <span class="series-highlight-sub">Evoluiu de 155,5 mil unidades em 2022 para o pico de 194,8 mil em 2024 (e 179,1 mil em 2025).</span>
      </div>
      <div class="series-highlight-box" style="border-left: 4px solid #7E3AF2;">
        <span class="series-highlight-title">Crédito Habitacional PF</span>
        <div class="series-highlight-val">R$ 187 Bi <span style="font-size: 0.8rem; color: #7E3AF2; font-weight: 700;">SBPE Poupança</span></div>
        <span class="series-highlight-sub">Volume financeiro de empréstimos concedidos aos adquirentes residenciais (ABECIP).</span>
      </div>
      <div class="series-highlight-box" style="border-left: 4px solid #0E9F6E;">
        <span class="series-highlight-title">Expansão Habitacional Popular</span>
        <div class="series-highlight-val">Recorde MCMV</div>
        <span class="series-highlight-sub">Novo Minha Casa Minha Vida ampliou subsídios e faixas de renda com recursos do FGTS.</span>
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
    titleEl.textContent = 'Mercado Formal de Trabalho e Empreendedorismo (CLT & MEI)';
    subtitleEl.textContent = 'Evolução de empregos com carteira assinada (CLT) e Microempreendedores Individuais (MEI)';
    tagEl.textContent = 'MTE / RFB / CAGED';

    highlightsHtml = `
      <div class="series-highlight-box" style="border-left: 4px solid #1A56DB;">
        <span class="series-highlight-title">Empregos Formais CLT</span>
        <div class="series-highlight-val">102,7 M <span style="font-size: 0.8rem; color: #0E9F6E; font-weight: 700;">▲ +7,0% vs 2022</span></div>
        <span class="series-highlight-sub">Passou de 96,0M em 2022 para 102,7M de carteiras assinadas ativas em 2026.</span>
      </div>
      <div class="series-highlight-box" style="border-left: 4px solid #D97706;">
        <span class="series-highlight-title">Microempreendedores MEI</span>
        <div class="series-highlight-val">16,94 M <span style="font-size: 0.8rem; color: #D97706; font-weight: 700;">▲ +17,2% vs 2022</span></div>
        <span class="series-highlight-sub">Passou de 14,45M em 2022 para 16,94M de MEIs cadastrados ativos em 2026.</span>
      </div>
      <div class="series-highlight-box" style="border-left: 4px solid #0E9F6E;">
        <span class="series-highlight-title">Total da Força Formal</span>
        <div class="series-highlight-val">119,6 M <span style="font-size: 0.8rem; color: #0E9F6E; font-weight: 700;">▲ Recorde</span></div>
        <span class="series-highlight-sub">Soma de empregados CLT e microempreendedores formalizados no Brasil.</span>
      </div>
      <div class="series-highlight-box" style="border-left: 4px solid #7E3AF2;">
        <span class="series-highlight-title">Massa Salarial em Alta</span>
        <div class="series-highlight-val">R$ 330 Bi/mês</div>
        <span class="series-highlight-sub">Massa de rendimento real habitualmente recebida por trabalhadores.</span>
      </div>
    `;

    datasets = [
      {
        label: 'Trabalhadores Formais CLT (Milhões)',
        data: dados.map(d => d.clt_milhoes),
        borderColor: '#1A56DB',
        backgroundColor: '#1A56DB',
        borderWidth: 3,
        tension: 0.25,
        pointRadius: 4
      },
      {
        label: 'Microempreendedores MEI (Milhões)',
        data: dados.map(d => d.meis_milhoes),
        borderColor: '#D97706',
        backgroundColor: '#D97706',
        borderWidth: 3,
        tension: 0.25,
        pointRadius: 4
      }
    ];

    yAxisConfig = {
      ticks: { callback: v => v + ' M' },
      title: { display: true, text: 'Milhões de Pessoas Formalizadas' }
    };

  } else if (currentSeriesMetric === 'orcamento_federal') {
    const isReal = currentOrcamentoMode === 'real';
    titleEl.textContent = 'Orçamento Executado dos Governos Federais (2010 – 2026)';
    subtitleEl.textContent = isReal
      ? 'Valores reais atualizados pelo IPCA a preços de 2026 em Saúde, Educação e Farmácia Popular'
      : 'Valores nominais desembolsados (gastos históricos sem correção pela inflação) em Saúde, Educação e Farmácia Popular';
    tagEl.textContent = isReal ? 'Tesouro Nacional (RTN) / SIAFI • Corrigido IPCA' : 'Tesouro Nacional (RTN) / SIAFI • Gasto Nominal';

    const orcDados = APP_DATA.series_historicas.orcamento_governos || [];

    if (isReal) {
      highlightsHtml = `
        <div class="series-highlight-box" style="border-left: 4px solid #0E9F6E;">
          <span class="series-highlight-title">Saúde Pública (Real 2026)</span>
          <div class="series-highlight-val">R$ 231,0 Bi <span style="font-size: 0.8rem; color: #0E9F6E; font-weight: 700;">▲ Recorde</span></div>
          <span class="series-highlight-sub">Orçamento executado na Saúde Pública em 2024 a preços de 2026.</span>
        </div>
        <div class="series-highlight-box" style="border-left: 4px solid #1A56DB;">
          <span class="series-highlight-title">Educação e FUNDEB (Real)</span>
          <div class="series-highlight-val">R$ 137,8 Bi <span style="font-size: 0.8rem; color: #1A56DB; font-weight: 700;">▲ +48%</span></div>
          <span class="series-highlight-sub">Expansão via Novo FUNDEB e implantação do Pé-de-Meia.</span>
        </div>
        <div class="series-highlight-box" style="border-left: 4px solid #DC2626;">
          <span class="series-highlight-title">Farmácia Popular (Real)</span>
          <div class="series-highlight-val">R$ 5,4 Bi <span style="font-size: 0.8rem; color: #0E9F6E; font-weight: 700;">▲ +116% vs 2022</span></div>
          <span class="series-highlight-sub">Orçamento integralmente garantido com gratuidade de 40 medicamentos essenciais.</span>
        </div>
        <div class="series-highlight-box" style="border-left: 4px solid #7E3AF2;">
          <span class="series-highlight-title">Economia das Famílias</span>
          <div class="series-highlight-val">R$ 7,73 Bi / ano</div>
          <span class="series-highlight-sub">Gasto do bolso evitado na compra direta de medicamentos contínuos.</span>
        </div>
      `;

      datasets = [
        {
          label: 'Saúde Real 2026 (R$ Bi)',
          data: orcDados.map(d => d.saude_real_2026_bi || d.saude_bi),
          borderColor: '#0E9F6E',
          backgroundColor: 'rgba(14, 159, 110, 0.1)',
          borderWidth: 3,
          tension: 0.25,
          fill: true,
          pointRadius: 4
        },
        {
          label: 'Educação Real 2026 (R$ Bi)',
          data: orcDados.map(d => d.educacao_real_2026_bi || d.educacao_bi),
          borderColor: '#1A56DB',
          borderWidth: 3,
          tension: 0.25,
          pointRadius: 4
        },
        {
          label: 'Farmácia Popular Real (R$ Bi)',
          data: orcDados.map(d => d.farmacia_popular_real_2026_bi || d.farmacia_popular_bi),
          borderColor: '#DC2626',
          backgroundColor: 'rgba(220, 38, 38, 0.08)',
          borderWidth: 2.5,
          tension: 0.25,
          pointRadius: 4
        }
      ];

      yAxisConfig = {
        ticks: { callback: v => 'R$ ' + v + ' Bi' },
        title: { display: true, text: 'R$ Bilhões (Preços de 2026)' }
      };
    } else {
      highlightsHtml = `
        <div class="series-highlight-box" style="border-left: 4px solid #0E9F6E;">
          <span class="series-highlight-title">Saúde Pública (Gasto Nominal)</span>
          <div class="series-highlight-val">R$ 203,9 Bi <span style="font-size: 0.8rem; color: #0E9F6E; font-weight: 700;">▲ 4x vs 2010</span></div>
          <span class="series-highlight-sub">Gasto nominal executado no Ministério da Saúde em 2024 (R$ 228,6 Bi em 2025 vs R$ 50,5 Bi em 2010).</span>
        </div>
        <div class="series-highlight-box" style="border-left: 4px solid #1A56DB;">
          <span class="series-highlight-title">Educação e FUNDEB (Gasto Nominal)</span>
          <div class="series-highlight-val">R$ 36,6 Bi <span style="font-size: 0.8rem; color: #1A56DB; font-weight: 700;">▲ +108% vs 2010</span></div>
          <span class="series-highlight-sub">Orçamento direto MEC em 2024 (R$ 41,2 Bi em 2025) somado a R$ 47,5 Bi de complementação Fundeb.</span>
        </div>
        <div class="series-highlight-box" style="border-left: 4px solid #DC2626;">
          <span class="series-highlight-title">Farmácia Popular (Gasto Nominal)</span>
          <div class="series-highlight-val">R$ 4,72 Bi <span style="font-size: 0.8rem; color: #0E9F6E; font-weight: 700;">▲ Recorde Histórico</span></div>
          <span class="series-highlight-sub">Execução orçamentária nominal em 2025 (vs R$ 2,74 Bi em 2024 e R$ 0,95 Bi em 2010).</span>
        </div>
        <div class="series-highlight-box" style="border-left: 4px solid #7E3AF2;">
          <span class="series-highlight-title">Economia das Famílias</span>
          <div class="series-highlight-val">R$ 7,73 Bi / ano</div>
          <span class="series-highlight-sub">Gasto do bolso evitado na compra direta de medicamentos essenciais.</span>
        </div>
      `;

      datasets = [
        {
          label: 'Saúde Nominal (R$ Bi)',
          data: orcDados.map(d => d.saude_bi),
          borderColor: '#0E9F6E',
          backgroundColor: 'rgba(14, 159, 110, 0.1)',
          borderWidth: 3,
          tension: 0.25,
          fill: true,
          pointRadius: 4
        },
        {
          label: 'Educação Nominal (R$ Bi)',
          data: orcDados.map(d => d.educacao_bi),
          borderColor: '#1A56DB',
          borderWidth: 3,
          tension: 0.25,
          pointRadius: 4
        },
        {
          label: 'Farmácia Popular Nominal (R$ Bi)',
          data: orcDados.map(d => d.farmacia_popular_bi),
          borderColor: '#DC2626',
          backgroundColor: 'rgba(220, 38, 38, 0.08)',
          borderWidth: 2.5,
          tension: 0.25,
          pointRadius: 4
        }
      ];

      yAxisConfig = {
        ticks: { callback: v => 'R$ ' + v + ' Bi' },
        title: { display: true, text: 'R$ Bilhões (Gasto Nominal à Época)' }
      };
    }

  } else if (currentSeriesMetric === 'comercio') {
    titleEl.textContent = 'Vendas do Comércio Varejista Ampliado (2016 – 2025)';
    subtitleEl.textContent = 'Volume total de faturamento do varejo brasileiro incluindo veículos, motos e materiais de construção';
    tagEl.textContent = 'Banco Central (Série 28544) / IBGE (PMC)';

    const dadosComercio = dados.filter(d => d.ano <= 2025);
    labels = dadosComercio.map(d => d.ano);

    highlightsHtml = `
      <div class="series-highlight-box" style="border-left: 4px solid #1A56DB;">
        <span class="series-highlight-title">Faturamento Varejista Ampliado (2025)</span>
        <div class="series-highlight-val">R$ 2,38 Tri <span style="font-size: 0.8rem; color: #0E9F6E; font-weight: 700;">▲ +20,2% vs 2022</span></div>
        <span class="series-highlight-sub">Evoluiu de R$ 1,98 Tri em 2022 para R$ 2,38 Tri ao ano em 2025.</span>
      </div>
      <div class="series-highlight-box" style="border-left: 4px solid #0E9F6E;">
        <span class="series-highlight-title">Massa de Renda Circulante</span>
        <div class="series-highlight-val">R$ 330 Bi/mês <span style="font-size: 0.8rem; color: #0E9F6E; font-weight: 700;">Recorde</span></div>
        <span class="series-highlight-sub">Aumento da massa salarial real impulsiona o consumo de bens duráveis e semiduráveis.</span>
      </div>
    `;

    datasets = [
      {
        label: 'Varejo Ampliado (R$ Trilhões)',
        data: dadosComercio.map(d => d.comercio_varejo_rs_tri),
        borderColor: '#1A56DB',
        backgroundColor: 'rgba(26, 86, 219, 0.1)',
        borderWidth: 3,
        tension: 0.25,
        fill: true,
        pointRadius: 4
      }
    ];

    yAxisConfig = {
      ticks: { callback: v => 'R$ ' + v + ' Tri' },
      title: { display: true, text: 'R$ Trilhões Correntes' }
    };

  } else if (currentSeriesMetric === 'gastos_exterior') {
    titleEl.textContent = 'Gastos de Brasileiros em Viagens no Exterior (2016 – 2026)';
    subtitleEl.textContent = 'Despesas de turistas e residentes brasileiros no exterior (Conta de Viagens Internacionais)';
    tagEl.textContent = 'Banco Central do Brasil (Série 22742)';

    highlightsHtml = `
      <div class="series-highlight-box" style="border-left: 4px solid #1A56DB;">
        <span class="series-highlight-title">Despesas no Exterior (2026)</span>
        <div class="series-highlight-val">US$ 18,7 Bi <span style="font-size: 0.8rem; color: #0E9F6E; font-weight: 700;">▲ +53,3% vs 2022</span></div>
        <span class="series-highlight-sub">Recuperação expressiva frente aos US$ 12,2 Bi de 2022 e pico pós-pandemia.</span>
      </div>
      <div class="series-highlight-box" style="border-left: 4px solid #DC2626;">
        <span class="series-highlight-title">Mínima Histórica (Pandemia)</span>
        <div class="series-highlight-val">US$ 5,3 Bi <span style="font-size: 0.8rem; color: #DC2626; font-weight: 700;">2021</span></div>
        <span class="series-highlight-sub">Queda abrupta de 71% durante o fechamento de fronteiras na crise sanitária.</span>
      </div>
      <div class="series-highlight-box" style="border-left: 4px solid #0E9F6E;">
        <span class="series-highlight-title">Passageiros em Voos Internacionais</span>
        <div class="series-highlight-val">24,5 Milhões</div>
        <span class="series-highlight-sub">Movimentação anual nos aeroportos brasileiros (ANAC).</span>
      </div>
      <div class="series-highlight-box" style="border-left: 4px solid #D97706;">
        <span class="series-highlight-title">Câmbio Médio de Referência</span>
        <div class="series-highlight-val">R$ 5,35 / US$</div>
        <span class="series-highlight-sub">Nível da taxa de câmbio nominal PTAX anual.</span>
      </div>
    `;

    datasets = [
      {
        label: 'Gastos no Exterior (US$ Bilhões)',
        data: dados.map(d => d.gastos_exterior_usd_bi),
        borderColor: '#7E3AF2',
        backgroundColor: 'rgba(126, 58, 242, 0.1)',
        borderWidth: 3,
        tension: 0.25,
        fill: true,
        pointRadius: 4
      }
    ];

    yAxisConfig = {
      ticks: { callback: v => 'US$ ' + v + ' Bi' },
      title: { display: true, text: 'US$ Bilhões' }
    };
  }

  highlightsEl.innerHTML = highlightsHtml;

  if (chartSeriesHistoricas) {
    chartSeriesHistoricas.destroy();
  }

  const chartLabels = currentSeriesMetric === 'orcamento_federal' 
    ? (APP_DATA.series_historicas.orcamento_governos || []).map(d => d.ano)
    : anos;

  chartSeriesHistoricas = new Chart(ctx, {
    type: 'line',
    data: {
      labels: chartLabels.map(a => `${a}`),
      datasets: datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: { boxWidth: 12, font: { family: 'Inter', size: 12, weight: 600 } },
          onClick: function(e, legendItem, legend) {
            const index = legendItem.datasetIndex;
            const ci = legend.chart;
            if (ci.isDatasetVisible(index)) {
              ci.hide(index);
              legendItem.hidden = true;
            } else {
              ci.show(index);
              legendItem.hidden = false;
            }
            ci.update();
          }
        },
        tooltip: {
          callbacks: {
            title: (items) => `Ano: ${items[0].label}`,
            label: (item) => {
              if (currentSeriesMetric === 'orcamento_federal') {
                const modo = currentOrcamentoMode === 'real' ? 'Real 2026' : 'Gasto Nominal';
                return ` ${item.dataset.label}: R$ ${typeof item.raw === 'number' ? item.raw.toFixed(1) : item.raw} Bi (${modo})`;
              }
              return ` ${item.dataset.label}: ${item.raw.toLocaleString('pt-BR')}`;
            }
          }
        }
      },
      scales: {
        y: yAxisConfig,
        x: {
          stacked: currentSeriesMetric === 'veiculos',
          grid: { display: false }
        }
      }
    },
    plugins: [{
      id: 'seriesDataLabels',
      afterDatasetsDraw(chart) {
        const { ctx } = chart;
        ctx.save();
        ctx.font = 'bold 9px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';

        if (currentSeriesMetric === 'veiculos') {
          // No gráfico de veículos, desenha a soma total (novos + seminovos) acima da barra empilhada
          const metaTop = chart.getDatasetMeta(chart.data.datasets.length - 1);
          if (metaTop && !metaTop.hidden && (chart.isDatasetVisible && chart.isDatasetVisible(chart.data.datasets.length - 1))) {
            metaTop.data.forEach((point, index) => {
              const usados = chart.data.datasets[0]?.data[index] || 0;
              const novos = chart.data.datasets[1]?.data[index] || 0;
              const total = usados + novos;
              if (total <= 0) return;
              ctx.fillStyle = '#0F172A';
              ctx.font = 'bold 10px Inter, sans-serif';
              ctx.fillText(`${total.toFixed(2)} M`, point.x, point.y - 6);
            });
          }
        } else {
          // Em todos os gráficos de linha e coluna, exibe o rótulo de dados em cada ponto sem pular
          chart.data.datasets.forEach((dataset, datasetIndex) => {
            const meta = chart.getDatasetMeta(datasetIndex);
            if (meta.hidden || (chart.isDatasetVisible && !chart.isDatasetVisible(datasetIndex))) return;
            meta.data.forEach((point, index) => {
              const val = dataset.data[index];
              if (val === undefined || val === null) return;
              ctx.fillStyle = dataset.borderColor || dataset.backgroundColor || '#1E293B';
              let text = '';
              if (typeof val === 'number') {
                if (val >= 1000) text = formatarNumero(Math.round(val));
                else if (val >= 100) text = Math.round(val).toString();
                else text = val.toFixed(1);
              } else {
                text = val;
              }
              const yOffset = datasetIndex > 0 ? (datasetIndex * 11) + 5 : 5;
              ctx.fillText(`${text}`, point.x, point.y - yOffset);
            });
          });
        }
        ctx.restore();
      }
    }]
  });
}

/**
 * 10. MODAL DE CORRELAÇÃO: Voto Presidencial vs. Dependência de Políticas Públicas
 * Abre em modal garantindo renderização nítida e sem distorções no Chart.js
 */
const METRICAS_DISPERSAO = {
  indice_composto: {
    nome: 'Índice de Dependência Pública',
    unidade: ' pts',
    minX: 0,
    maxX: 100,
    getValue: (m) => calcularIndiceDependencia(m)
  },
  bf: {
    nome: 'Famílias no Bolsa Família',
    unidade: ' / 100 hab',
    minX: 0,
    maxX: 50,
    getValue: (m) => (m.ind?.bf !== undefined ? m.ind.bf : 0)
  },
  apos: {
    nome: 'Aposentados RGPS / INSS',
    unidade: ' / 100 hab',
    minX: 0,
    maxX: 35,
    getValue: (m) => (m.ind?.apos !== undefined ? m.ind.apos : 0)
  },
  pdm: {
    nome: 'Cobertura Pé-de-Meia',
    unidade: '%',
    minX: 0,
    maxX: 100,
    getValue: (m) => (m.ind?.pdm !== undefined ? m.ind.pdm : 0)
  },
  fundeb: {
    nome: 'Dependência do Fundeb da União',
    unidade: '%',
    minX: 0,
    maxX: 80,
    getValue: (m) => (m.ind?.fundeb !== undefined ? m.ind.fundeb : 0)
  },
  serv: {
    nome: 'Servidores Públicos',
    unidade: ' / 100 hab',
    minX: 0,
    maxX: 25,
    getValue: (m) => (m.ind?.serv !== undefined ? m.ind.serv : 0)
  },
  bpc: {
    nome: 'Beneficiários BPC / LOAS',
    unidade: ' / 100 hab',
    minX: 0,
    maxX: 15,
    getValue: (m) => (m.ind?.bpc !== undefined ? m.ind.bpc : 0)
  },
  fp: {
    nome: 'Farmácia Popular',
    unidade: ' / 100 hab',
    minX: 0,
    maxX: 25,
    getValue: (m) => (m.ind?.fp !== undefined ? m.ind.fp : 0)
  },
  prev_pib: {
    nome: 'Peso das Aposentadorias no PIB',
    unidade: '%',
    minX: 0,
    maxX: 40,
    getValue: (m) => (m.ind?.prev_pib !== undefined ? m.ind.prev_pib : 0)
  }
};

function calcularIndiceDependencia(m) {
  if (!m || !m.ind) return 0;
  const bf = Math.min(100, ((m.ind.bf || 0) / 35) * 100) * 0.28;
  const apos = Math.min(100, ((m.ind.apos || 0) / 25) * 100) * 0.22;
  const bpc = Math.min(100, ((m.ind.bpc || 0) / 8) * 100) * 0.14;
  const fundeb = Math.min(100, ((m.ind.fundeb || 0) / 65) * 100) * 0.12;
  const pdm = Math.min(100, ((m.ind.pdm || 0) / 85) * 100) * 0.10;
  const serv = Math.min(100, ((m.ind.serv || 0) / 15) * 100) * 0.08;
  const fp = Math.min(100, ((m.ind.fp || 0) / 18) * 100) * 0.06;
  return Math.min(100, Math.max(0, Math.round((bf + apos + bpc + fundeb + pdm + serv + fp) * 10) / 10));
}

function calcularRaioBolha(pop) {
  if (!pop || pop <= 0) return 3.5;
  return Math.min(22, Math.max(3.2, Math.pow(pop, 0.27) * 0.52));
}

function calcularRegressaoLinear(pontos) {
  const n = pontos.length;
  if (n < 2) return null;
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  for (let i = 0; i < n; i++) {
    const x = pontos[i].x;
    const y = pontos[i].y;
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
  }
  const meanX = sumX / n;
  const meanY = sumY / n;
  const denominador = sumXX - sumX * meanX;
  if (denominador === 0) return null;
  const slope = (sumXY - sumX * meanY) / denominador;
  const intercept = meanY - slope * meanX;
  return { slope, intercept };
}

function hexToRgba(hex, alpha = 0.5) {
  if (!hex || typeof hex !== 'string') return `rgba(100, 116, 139, ${alpha})`;
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  const num = parseInt(c, 16);
  if (isNaN(num)) return `rgba(100, 116, 139, ${alpha})`;
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function abrirModalCorrelacao() {
  document.getElementById('modal-correlacao').classList.remove('hidden');

  // Adiciona listeners dos controles se ainda não adicionados
  const metricSelect = document.getElementById('scatter-metric-x');
  const regionSelect = document.getElementById('scatter-region-filter');

  metricSelect.onchange = (e) => {
    currentScatterMetricX = e.target.value;
    atualizarGraficoDispersao();
  };

  regionSelect.onchange = (e) => {
    currentScatterRegion = e.target.value;
    atualizarGraficoDispersao();
  };

  // Renderiza após 100ms para pegar dimensões reais do modal
  setTimeout(() => {
    atualizarGraficoDispersao();
  }, 100);
}

function fecharModalCorrelacao() {
  document.getElementById('modal-correlacao').classList.add('hidden');
}

function atualizarGraficoDispersao() {
  const canvas = document.getElementById('chart-dispersao-municipios');
  if (!canvas || !APP_DATA) return;
  const ctx = canvas.getContext('2d');

  const configX = METRICAS_DISPERSAO[currentScatterMetricX] || METRICAS_DISPERSAO.indice_composto;
  const opositorNome = currentElection.includes('2026') ? 'Flávio' : 'Bolsonaro';
  const cand1Nome = currentElection === '2018_2t' ? 'Haddad' : 'Lula';

  let listaMunicipios = APP_DATA.municipios;
  if (currentScatterRegion && currentScatterRegion !== 'todas') {
    listaMunicipios = listaMunicipios.filter(m => m.reg === currentScatterRegion);
  }

  const badgeScatter = document.getElementById('badge-scope-scatter');
  if (badgeScatter) {
    if (currentScatterRegion && currentScatterRegion !== 'todas') {
      badgeScatter.textContent = `Visão Regional: ${currentScatterRegion} (${listaMunicipios.length} cidades)`;
      badgeScatter.className = 'chart-scope-badge scope-estadual';
    } else {
      badgeScatter.textContent = 'Visão Nacional (5.571 Cidades)';
      badgeScatter.className = 'chart-scope-badge scope-nacional';
    }
  }

  const perfis = Object.values(APP_DATA.perfis);
  const datasets = [];
  const todosPontos = [];

  perfis.forEach(p => {
    const cidadesDoPerfil = listaMunicipios.filter(m => m.pf === p.nome);
    const dataPoints = [];

    cidadesDoPerfil.forEach(m => {
      const eleic = currentElection === '2026_1t' ? m.e26 : (currentElection === '2022_1t' ? m.e22_1t : (currentElection === '2018_2t' ? m.e18 : m.e22_2t));
      const lulaPct = currentElection === '2018_2t' ? (eleic?.haddad || 0) : (eleic?.lula || 0);
      const xVal = configX.getValue(m);

      if (xVal !== null && xVal !== undefined && !isNaN(xVal) && !isNaN(lulaPct)) {
        const rVal = calcularRaioBolha(m.pop);
        dataPoints.push({
          x: Math.round(xVal * 100) / 100,
          y: Math.round(lulaPct * 100) / 100,
          r: rVal,
          cidade: m
        });
        todosPontos.push({ x: xVal, y: lulaPct });
      }
    });

    const corHex = p.cor || '#4B5563';
    datasets.push({
      type: 'bubble',
      label: p.nome,
      data: dataPoints,
      backgroundColor: hexToRgba(corHex, 0.55),
      borderColor: hexToRgba(corHex, 0.95),
      borderWidth: 1.2,
      hoverBorderWidth: 3,
      hoverBackgroundColor: hexToRgba(corHex, 0.85),
      order: 3
    });
  });

  let minX = configX.minX;
  let maxX = configX.maxX;
  if (todosPontos.length > 0) {
    const xVals = todosPontos.map(p => p.x);
    minX = Math.floor(Math.min(...xVals));
    maxX = Math.ceil(Math.max(...xVals));
  }

  // Linha 50% dos votos (Escurecida e destacada conforme solicitado)
  datasets.push({
    type: 'line',
    label: 'Patamar 50% dos Votos (Maioria Absoluta)',
    data: [{ x: minX, y: 50 }, { x: maxX, y: 50 }],
    borderColor: '#0F172A',
    borderWidth: 2.2,
    borderDash: [5, 5],
    pointRadius: 0,
    pointHoverRadius: 0,
    fill: false,
    order: 0
  });

  if (chartDispersao) {
    chartDispersao.destroy();
  }

  chartDispersao = new Chart(ctx, {
    type: 'bubble',
    data: { datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 300 },
      onClick: (e, elements) => {
        if (elements && elements.length > 0) {
          const el = elements[0];
          const dataset = chartDispersao.data.datasets[el.datasetIndex];
          if (dataset && dataset.data && dataset.data[el.index]?.cidade) {
            const cid = dataset.data[el.index].cidade;
            fecharModalCorrelacao();
            abrirModalMunicipio(cid.id);
          }
        }
      },
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            boxWidth: 12,
            boxHeight: 12,
            usePointStyle: true,
            font: { family: 'Inter', size: 11, weight: 600 },
            padding: 12
          }
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          titleFont: { family: 'Inter', size: 13, weight: 700 },
          bodyFont: { family: 'Inter', size: 12 },
          padding: 12,
          cornerRadius: 8,
          callbacks: {
            title: (items) => {
              const pt = items[0].dataset.data[items[0].dataIndex];
              return pt && pt.cidade ? `${pt.cidade.nm} (${pt.cidade.uf})` : items[0].dataset.label;
            },
            label: (item) => {
              const pt = item.dataset.data[item.dataIndex];
              if (!pt || !pt.cidade) return `${item.dataset.label}: ${item.parsed.y.toFixed(1)}%`;
              const cid = pt.cidade;
              const eleic = currentElection === '2026_1t' ? cid.e26 : (currentElection === '2022_1t' ? cid.e22_1t : (currentElection === '2018_2t' ? cid.e18 : cid.e22_2t));
              const cand1Pct = currentElection === '2018_2t' ? (eleic?.haddad || 0) : (eleic?.lula || 0);
              const cand2Pct = currentElection.includes('2026') ? (eleic?.flavio || 0) : (eleic?.bolsonaro || 0);
              return [
                `● Perfil: ${cid.pf}`,
                `👥 População: ${formatarNumero(cid.pop)} hab`,
                `📊 ${configX.nome}: ${pt.x.toFixed(1)}${configX.unidade}`,
                `🗳️ Votos ${cand1Nome}: ${cand1Pct.toFixed(1)}%`,
                `🗳️ Votos ${opositorNome}: ${cand2Pct.toFixed(1)}%`,
                `🔍 Clique para ver o Raio-X completo`
              ];
            }
          }
        }
      },
      scales: {
        x: {
          type: 'linear',
          position: 'bottom',
          title: {
            display: true,
            text: `${configX.nome} (${configX.unidade.trim()})`,
            font: { family: 'Inter', size: 12, weight: 700 },
            color: '#1E293B',
            padding: { top: 8 }
          },
          grid: { color: '#F1F5F9' },
          ticks: { color: '#64748B', font: { family: 'Inter', size: 11 } }
        },
        y: {
          min: 0,
          max: 100,
          title: {
            display: true,
            text: `% de Votos em ${cand1Nome}`,
            font: { family: 'Inter', size: 12, weight: 700 },
            color: '#1E293B',
            padding: { bottom: 8 }
          },
          grid: { color: '#F1F5F9' },
          ticks: { callback: (v) => v + '%', color: '#64748B', font: { family: 'Inter', size: 11 } }
        }
      }
    }
  });
}

/**
 * 11. MODAL DE METODOLOGIA DO CÁLCULO
 */
function abrirModalMetodologia() {
  document.getElementById('modal-metodologia').classList.remove('hidden');
}

function fecharModalMetodologia() {
  document.getElementById('modal-metodologia').classList.add('hidden');
}

/**
 * Obtém o escopo territorial ativo para aplicação nos Modais de Prioridades
 */
function obterEscopoTerritorialModal() {
  const nivel = filtroTerritorial.nivel || 'brasil';
  const isBrasil = (nivel === 'brasil' || !filtroTerritorial.id) && !activeRaioXCity;
  let nomeTerritorio = 'Brasil (Consolidado)';
  let cidades = (APP_DATA && APP_DATA.municipios) ? APP_DATA.municipios : [];

  if (activeRaioXCity) {
    cidades = [activeRaioXCity];
    nomeTerritorio = `${activeRaioXCity.nm} (${activeRaioXCity.uf})`;
  } else if (nivel === 'regiao') {
    cidades = cidades.filter(m => m.reg === filtroTerritorial.id);
    nomeTerritorio = `Região ${filtroTerritorial.id}`;
  } else if (nivel === 'estado') {
    cidades = cidades.filter(m => m.uf === filtroTerritorial.id);
    const ufObj = APP_DATA?.estados?.[filtroTerritorial.id];
    nomeTerritorio = ufObj ? `${ufObj.nome} (${filtroTerritorial.id})` : filtroTerritorial.id;
  } else if (nivel === 'perfil') {
    const pfKey = filtroTerritorial.perfil || filtroTerritorial.id.replace('Perfil: ', '');
    cidades = cidades.filter(m => m.pf === pfKey);
    nomeTerritorio = filtroTerritorial.nome || `Perfil: ${pfKey}`;
  } else if (nivel === 'municipio') {
    const m = cidades.find(c => c.id === filtroTerritorial.id);
    if (m) {
      cidades = [m];
      nomeTerritorio = `${m.nm} (${m.uf})`;
    }
  }

  return {
    isBrasil,
    nivel: activeRaioXCity ? 'municipio' : nivel,
    nomeTerritorio,
    cidades,
    totalCidades: cidades.length
  };
}

function gerarTabelaHistoricoOrcamento(tipo) {
  const escopo = obterEscopoTerritorialModal();
  const nomeLoc = escopo.isBrasil ? 'Brasil (Consolidado Nacional)' : escopo.nomeTerritorio;

  if (tipo === 'saude') {
    let sde = {};
    if (escopo.isBrasil) {
      sde = APP_DATA.saude_nacional || {};
    } else if (escopo.totalCidades === 1) {
      sde = escopo.cidades[0].sde || {};
    } else {
      sde = escopo.cidades.reduce((acc, c) => {
        const cs = c.sde || {};
        acc.hip = (acc.hip || 0) + (cs.hip || 0);
        acc.amb = (acc.amb || 0) + (cs.amb || 0);
        acc.diab = (acc.diab || 0) + (cs.diab || 0);
        acc.asma = (acc.asma || 0) + (cs.asma || 0);
        acc.tot = (acc.tot || 0) + (cs.tot || 0);
        acc.ac = (acc.ac || 0) + (cs.ac || 0);
        acc.quim = (acc.quim || 0) + (cs.quim || 0);
        acc.rad = (acc.rad || 0) + (cs.rad || 0);
        acc.b_min = (acc.b_min || 0) + (cs.b_min || 0);
        acc.b_med = (acc.b_med || 0) + (cs.b_med || 0);
        return acc;
      }, {});
    }

    const hipTot = sde.fp_so_hipertensao || sde.hip || 0;
    const ambTot = sde.fp_hipertensao_e_diabetes || sde.amb || 0;
    const diabTot = sde.fp_so_diabetes || sde.diab || 0;
    const asmaTot = sde.fp_asma || sde.asma || 0;
    const fpTotal = sde.fp_total || sde.tot || (hipTot + ambTot + diabTot + asmaTot) || 12957809;

    const acTot = sde.alto_custo || sde.ac || 0;
    const quimTot = sde.quimioterapia || sde.quim || 0;
    const radTot = sde.radioterapia || sde.rad || 0;

    const bMin = sde.bolso_minimo || sde.b_min || Math.round(fpTotal * 360);
    const bMed = sde.bolso_mediano || sde.b_med || Math.round(fpTotal * 600);

    return `
      <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #E2E8F0;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 8px;">
          <h4 style="font-family: var(--font-display); font-size: 1.05rem; font-weight: 800; color: var(--gov-blue-dark); margin: 0;">
            🩺 Assistência Farmacêutica e Linhas de Cuidado SUS • ${nomeLoc}
          </h4>
          <span style="font-size: 0.72rem; background: #DCFCE7; color: #166534; padding: 4px 10px; border-radius: 6px; font-weight: 700;">
            Fonte: saude-municipios.web.app / MS / DATASUS
          </span>
        </div>
        <p style="font-size: 0.78rem; color: #64748B; margin-bottom: 14px; line-height: 1.4;">
          Decomposição oficial de pacientes beneficiados pelo programa Farmácia Popular por patologia crônica e linhas de cuidado de alta complexidade do SUS em ${nomeLoc}.
        </p>

        <!-- Banner de Economia no Bolso das Famílias -->
        <div style="background: linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%); border: 1px solid #86EFAC; border-radius: 10px; padding: 14px 18px; margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
          <div>
            <span style="font-size: 0.72rem; font-weight: 800; color: #166534; text-transform: uppercase;">💰 Gasto do Bolso Evitado (Economia Familiar Direta)</span>
            <div style="font-size: 1.25rem; font-weight: 800; color: #14532D; margin-top: 2px;">
              ${formatarGrandeza(bMed, true)} / ano
            </div>
            <span style="font-size: 0.74rem; color: #166534;">
              Estimativa mediana do valor que as famílias de ${nomeLoc} deixaram de pagar em farmácias privadas para tratar hipertensão, diabetes e asma. Faixa conservadora: ${formatarGrandeza(bMin, true)}.
            </span>
          </div>
          <div style="background: #FFFFFF; border-radius: 8px; padding: 8px 14px; text-align: center; border: 1px solid #BBF7D0;">
            <span style="font-size: 0.70rem; color: #64748B; font-weight: 700;">TOTAL ATENDIDOS FP</span>
            <div style="font-size: 1.15rem; font-weight: 800; color: #166534;">${formatarNumero(fpTotal)}</div>
          </div>
        </div>

        <div class="budget-history-table-wrap">
          <table class="budget-history-table">
            <thead>
              <tr>
                <th>Linha de Cuidado / Patologia</th>
                <th>Programa SUS</th>
                <th>Pacientes Atendidos</th>
                <th>% do Total FP</th>
                <th>Itens / Cobertura</th>
                <th>Impacto no Território</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="font-weight: 700;">Hipertensão Arterial isolada</td>
                <td><span class="gov-badge gov-lula">Farmácia Popular</span></td>
                <td style="font-weight: 700; color: #1A56DB;">${formatarNumero(hipTot)}</td>
                <td>${((hipTot / (fpTotal || 1)) * 100).toFixed(1)}%</td>
                <td>Losartana, Atenolol, Hidroclorotiazida</td>
                <td style="font-size: 0.72rem; color: #166534;">100% Gratuito • Redução de AVC e infarto</td>
              </tr>
              <tr>
                <td style="font-weight: 700;">Hipertensão + Diabetes (Comorbidade)</td>
                <td><span class="gov-badge gov-lula">Farmácia Popular</span></td>
                <td style="font-weight: 700; color: #7E3AF2;">${formatarNumero(ambTot)}</td>
                <td>${((ambTot / (fpTotal || 1)) * 100).toFixed(1)}%</td>
                <td>Anti-hipertensivos + Antidiabéticos Orais</td>
                <td style="font-size: 0.72rem; color: #166534;">100% Gratuito • Pacientes de maior custo clínico</td>
              </tr>
              <tr>
                <td style="font-weight: 700;">Diabetes Mellitus isolada</td>
                <td><span class="gov-badge gov-lula">Farmácia Popular</span></td>
                <td style="font-weight: 700; color: #0E9F6E;">${formatarNumero(diabTot)}</td>
                <td>${((diabTot / (fpTotal || 1)) * 100).toFixed(1)}%</td>
                <td>Metformina, Glibenclamida, Insulinas</td>
                <td style="font-size: 0.72rem; color: #166534;">100% Gratuito • Prevenção de nefropatias</td>
              </tr>
              <tr>
                <td style="font-weight: 700;">Asma Crônica</td>
                <td><span class="gov-badge gov-lula">Farmácia Popular</span></td>
                <td style="font-weight: 700; color: #D97706;">${formatarNumero(asmaTot)}</td>
                <td>${((asmaTot / (fpTotal || 1)) * 100).toFixed(1)}%</td>
                <td>Salbutamol, Beclometasona, Ipratrópio</td>
                <td style="font-size: 0.72rem; color: #166534;">100% Gratuito • Redução de internações pediátricas</td>
              </tr>
              <tr style="background: #F8FAFC;">
                <td style="font-weight: 700;">Medicamentos de Alto Custo (Especializado)</td>
                <td><span class="gov-badge gov-temer">SUS Especializado</span></td>
                <td style="font-weight: 700; color: #1E40AF;">${formatarNumero(acTot)}</td>
                <td>—</td>
                <td>Protocolos Clínicos e Diretrizes Terapêuticas (PCDT)</td>
                <td style="font-size: 0.72rem; color: #64748B;">Fornecimento federal direto aos estados</td>
              </tr>
              <tr style="background: #F8FAFC;">
                <td style="font-weight: 700;">Tratamento Oncológico: Quimioterapia</td>
                <td><span class="gov-badge gov-bolsonaro">Oncologia SUS</span></td>
                <td style="font-weight: 700; color: #DC2626;">${formatarNumero(quimTot)}</td>
                <td>—</td>
                <td>Quimioterapia Ambulatorial e Hospitalar</td>
                <td style="font-size: 0.72rem; color: #64748B;">Hospitais habilitados e CACON/UNACON</td>
              </tr>
              <tr style="background: #F8FAFC;">
                <td style="font-weight: 700;">Tratamento Oncológico: Radioterapia</td>
                <td><span class="gov-badge gov-bolsonaro">Oncologia SUS</span></td>
                <td style="font-weight: 700; color: #DC2626;">${formatarNumero(radTot)}</td>
                <td>—</td>
                <td>Aceleradores lineares e expansão federal</td>
                <td style="font-size: 0.72rem; color: #64748B;">Plano de Expansão da Radioterapia no SUS</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  if (tipo === 'educacao') {
    const etiNac = APP_DATA.eti_nacional || { total_fomento: 2134201430, total_matriculas: 406400, total_redes: 4107 };
    const etiUfList = APP_DATA.eti_por_uf || [];

    // Se um estado estiver filtrado, exibe as cidades desse estado
    let linhasTabela = '';
    let cabecalhoCol1 = 'Unidade Federativa (UF)';
    let bannerFomento = `R$ ${(etiNac.total_fomento / 1000000000).toFixed(2)} Bilhões Pactuados`;
    let bannerSub = `Total de <strong>${formatarNumero(etiNac.total_matriculas)} matrículas integrais</strong> financiadas em <strong>${formatarNumero(etiNac.total_redes)} redes municipais</strong> de todo o Brasil.`;

    if (!escopo.isBrasil && escopo.nivel === 'estado') {
      cabecalhoCol1 = `Municípios de ${escopo.nomeTerritorio}`;
      const cidadesEti = escopo.cidades.filter(c => (c.eti?.fom || 0) > 0 || (c.eti?.mat || 0) > 0)
        .sort((a,b) => (b.eti?.fom || 0) - (a.eti?.fom || 0));
      const totalFomEst = cidadesEti.reduce((s, c) => s + (c.eti?.fom || 0), 0);
      const totalMatEst = cidadesEti.reduce((s, c) => s + (c.eti?.mat || 0), 0);
      bannerFomento = `${formatarGrandeza(totalFomEst, true)} Pactuados`;
      bannerSub = `Total de <strong>${formatarNumero(totalMatEst)} matrículas integrais</strong> financiadas em <strong>${formatarNumero(cidadesEti.length)} redes municipais</strong> do estado.`;

      linhasTabela = (cidadesEti.length > 0 ? cidadesEti.slice(0, 20) : escopo.cidades.slice(0, 20)).map((c, idx) => {
        const isTop5 = idx < 5 ? 'style="font-weight: 700;"' : '';
        const fom = c.eti?.fom || 0;
        const mat = c.eti?.mat || 0;
        return `
          <tr ${isTop5}>
            <td style="font-weight: 700;">${c.nm} (${c.uf})</td>
            <td style="font-weight: 700; color: #1A56DB;">${fom > 0 ? formatarGrandeza(fom, true) : '—'}</td>
            <td style="font-weight: 700; color: #047857;">${mat > 0 ? formatarNumero(mat) + ' vagas' : '—'}</td>
            <td>${mat > 0 ? 'R$ ' + Math.round(fom / mat).toLocaleString('pt-BR') : '—'}</td>
            <td><span class="gov-badge gov-lula">Pactuação ETI</span></td>
          </tr>
        `;
      }).join('');
    } else {
      linhasTabela = etiUfList.map((uf, idx) => {
        const isTop5 = idx < 5 ? 'style="font-weight: 700;"' : '';
        return `
          <tr ${isTop5}>
            <td style="font-weight: 700;">${uf.nome} (${uf.uf})</td>
            <td style="font-weight: 700; color: #1A56DB;">R$ ${(uf.fomento / 1000000).toFixed(2)} Mi</td>
            <td style="font-weight: 700; color: #047857;">${formatarNumero(uf.matriculas)} vagas</td>
            <td>R$ ${Math.round(uf.fomento / (uf.matriculas || 1)).toLocaleString('pt-BR')}</td>
            <td><span class="gov-badge gov-lula">Pactuação 2024–2026</span></td>
          </tr>
        `;
      }).join('');
    }

    return `
      <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #E2E8F0;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 8px;">
          <h4 style="font-family: var(--font-display); font-size: 1.05rem; font-weight: 800; color: var(--gov-blue-dark); margin: 0;">
            🎓 Programa Escola em Tempo Integral (ETI) • Fomento e Pactuação Federal
          </h4>
          <span style="font-size: 0.72rem; background: #EEF2FF; color: #1E40AF; padding: 4px 10px; border-radius: 6px; font-weight: 700;">
            Fonte: MEC / FNDE / Lei nº 14.640/2023
          </span>
        </div>
        <p style="font-size: 0.78rem; color: #64748B; margin-bottom: 14px; line-height: 1.4;">
          Dados oficiais da pactuação de novas matrículas e repasses federais diretos da União às redes municipais de educação para expansão da jornada integral (mínimo de 7 horas diárias).
        </p>

        <!-- Banner de Destaques do Programa ETI -->
        <div style="background: linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%); border: 1px solid #93C5FD; border-radius: 10px; padding: 14px 18px; margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
          <div>
            <span style="font-size: 0.72rem; font-weight: 800; color: #1E40AF; text-transform: uppercase;">Aporte Federal Direto às Redes Municipais</span>
            <div style="font-size: 1.25rem; font-weight: 800; color: #1E3A8A; margin-top: 2px;">
              ${bannerFomento}
            </div>
            <span style="font-size: 0.74rem; color: #1E40AF;">
              ${bannerSub}
            </span>
          </div>
          <div style="background: #FFFFFF; border-radius: 8px; padding: 8px 14px; text-align: center; border: 1px solid #BFDBFE;">
            <span style="font-size: 0.70rem; color: #64748B; font-weight: 700;">APORTE MÉDIO / ALUNO</span>
            <div style="font-size: 1.15rem; font-weight: 800; color: #1E40AF;">R$ 5.250 / ano</div>
          </div>
        </div>

        <div class="budget-history-table-wrap">
          <table class="budget-history-table">
            <thead>
              <tr>
                <th>${cabecalhoCol1}</th>
                <th>Fomento Rede Municipal (R$)</th>
                <th>Matrículas ETI Pactuadas</th>
                <th>Aporte Médio / Matrícula</th>
                <th>Status do Programa</th>
              </tr>
            </thead>
            <tbody>
              ${linhasTabela}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  if (tipo === 'trabalho') {
    const nacLista = APP_DATA?.series_historicas?.nacional || [];
    const linhasTrab = nacLista.map(item => {
      let badgeClass = 'gov-lula';
      let govNome = 'Lula 3';
      if (item.ano <= 2016) { badgeClass = 'gov-dilma'; govNome = 'Dilma / Temer'; }
      else if (item.ano <= 2018) { badgeClass = 'gov-temer'; govNome = 'Temer'; }
      else if (item.ano <= 2022) { badgeClass = 'gov-bolsonaro'; govNome = 'Bolsonaro'; }
      else { badgeClass = 'gov-lula'; govNome = 'Lula 3'; }

      const isLula3 = item.ano >= 2023 ? 'row-lula-3' : '';
      const totalFormal = ((item.clt_milhoes || 0) + (item.meis_milhoes || 0)).toFixed(2);

      return `
        <tr class="${isLula3}">
          <td style="font-weight: 700;">${item.ano}</td>
          <td><span class="gov-badge ${badgeClass}">${govNome}</span></td>
          <td style="font-weight: 700; color: #1A56DB;">${(item.clt_milhoes || 0).toFixed(2)} M</td>
          <td style="font-weight: 700; color: #D97706;">${(item.meis_milhoes || 0).toFixed(2)} M</td>
          <td style="font-weight: 800; color: #047857;">${totalFormal} M</td>
          <td>R$ ${formatarNumero(item.salario_minimo)}</td>
          <td style="font-size: 0.72rem; color: #64748B;">${item.ano >= 2025 ? 'Projeção / Estimativa' : 'Consolidado Oficial'}</td>
        </tr>
      `;
    }).join('');

    return `
      <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #E2E8F0;">
        <h4 style="font-family: var(--font-display); font-size: 1.05rem; font-weight: 800; color: var(--gov-blue-dark); margin-bottom: 4px;">
          🏛️ Evolução Histórica Nacional: Empregos Formais CLT e MEIs Cadastrados (2016 a 2026)
        </h4>
        <p style="font-size: 0.78rem; color: #64748B; margin-bottom: 12px; line-height: 1.4;">
          Trajetória oficial da força de trabalho formalizada no Brasil: evolução do contingente com carteira assinada (CLT) e avanço dos Microempreendedores Individuais (MEI) sob a política de valorização do Salário Mínimo.
        </p>
        <div class="budget-history-table-wrap">
          <table class="budget-history-table">
            <thead>
              <tr>
                <th>Ano</th>
                <th>Governo</th>
                <th>Empregos CLT (Milhões)</th>
                <th>MEIs Cadastrados (Milhões)</th>
                <th>Total Formalizado (Milhões)</th>
                <th>Salário Mínimo</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${linhasTrab}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  if (!APP_DATA || !APP_DATA.series_historicas || !APP_DATA.series_historicas.orcamento_governos) {
    return '';
  }
  const lista = APP_DATA.series_historicas.orcamento_governos;

  let colunas = '';
  let tituloSecao = '';
  let descricaoSecao = '';

  if (tipo === 'previdencia') {
    tituloSecao = '🏛️ Histórico Oficial Federal: Benefícios Previdenciários (RGPS) e Aposentadoria Rural (2010 a 2026)';
    descricaoSecao = 'Série histórica oficial dos recursos federais pagos pelo Regime Geral de Previdência Social (INSS/MPS) em aposentadorias e benefícios do RGPS, discriminando a clientela urbana e rural (agricultura familiar e campo). Fonte: Tesouro Nacional (RTN) e Ministério da Previdência Social (MPS).';
    colunas = `
      <th>Ano</th>
      <th>Governo</th>
      <th>Total Benefícios RGPS</th>
      <th>Aposentadorias Totais</th>
      <th>Aposentadoria / Rural</th>
      <th>Peso Rural (%)</th>
      <th>Investimento Obras União</th>
      <th>Status</th>
    `;
  } else if (tipo === 'agro') {
    tituloSecao = '🏛️ Histórico Oficial Federal: Agricultura Familiar, PNAE Merenda & CONAB (2010 a 2026)';
    descricaoSecao = 'Trajetória dos repasses e compras diretas de pequenos produtores rurais. Destaque para o PNAE (Lei nº 11.947/2009 que exige no mínimo 30% da merenda comprada da agricultura familiar) e recuperação da CONAB.';
    colunas = `
      <th>Ano</th>
      <th>Governo</th>
      <th>PNAE Total (Nominal)</th>
      <th>Agricultura Familiar (Mín. 30%)</th>
      <th>Agro Familiar (Real 2026)</th>
      <th>CONAB Orçamento Executado</th>
      <th>Status</th>
    `;
  }

  const linhas = lista.map(item => {
    let badgeClass = 'gov-lula';
    if (item.governo.includes('Dilma')) badgeClass = 'gov-dilma';
    else if (item.governo.includes('Temer')) badgeClass = 'gov-temer';
    else if (item.governo.includes('Bolsonaro')) badgeClass = 'gov-bolsonaro';
    else if (item.governo.includes('Lula 3')) badgeClass = 'gov-lula';

    const isLula3 = item.ano >= 2023 ? 'row-lula-3' : '';

    let colDados = '';
    if (tipo === 'previdencia') {
      const prevTot = item.previdencia_total_bi || 0;
      const aposTot = item.aposentadorias_total_bi || (prevTot * 0.675);
      const rural = item.previdencia_rural_bi || 0;
      const pesoRural = prevTot > 0 ? ((rural / prevTot) * 100).toFixed(1) + '%' : '—';
      colDados = `
        <td style="font-weight: 700; color: #1E40AF;">R$ ${prevTot.toFixed(1)} Bi</td>
        <td style="font-weight: 700; color: #7E3AF2;">R$ ${aposTot.toFixed(1)} Bi</td>
        <td style="font-weight: 700; color: #059669;">R$ ${rural.toFixed(1)} Bi</td>
        <td style="font-weight: 600; color: #059669;">${pesoRural}</td>
        <td>R$ ${(item.investimento_total_bi || 0).toFixed(1)} Bi</td>
      `;
    } else if (tipo === 'agro') {
      const agroNom = item.pnae_compras_agricultura_familiar_bi || 0.45;
      const agroReal = (agroNom * (item.ano <= 2014 ? 1.75 : item.ano <= 2018 ? 1.45 : item.ano <= 2022 ? 1.22 : 1.05)).toFixed(2);
      const pnaeTotal = (agroNom / 0.3).toFixed(2);
      colDados = `
        <td>R$ ${pnaeTotal} Bi</td>
        <td style="font-weight: 700; color: #0E9F6E;">R$ ${agroNom.toFixed(2)} Bi</td>
        <td style="font-weight: 700; color: #1E40AF;">R$ ${agroReal} Bi</td>
        <td>R$ ${(item.conab_orcamento_executado_bi || 0.8).toFixed(2)} Bi</td>
      `;
    }

    return `
      <tr class="${isLula3}">
        <td style="font-weight: 700;">${item.ano}</td>
        <td><span class="gov-badge ${badgeClass}">${item.governo}</span></td>
        ${colDados}
        <td style="font-size: 0.72rem; color: #64748B;">${item.status}</td>
      </tr>
    `;
  }).join('');

  return `
    <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #E2E8F0;">
      <h4 style="font-family: var(--font-display); font-size: 1.05rem; font-weight: 800; color: var(--gov-blue-dark); margin-bottom: 4px;">
        ${tituloSecao}
      </h4>
      <p style="font-size: 0.78rem; color: #64748B; margin-bottom: 12px; line-height: 1.4;">
        ${descricaoSecao}
      </p>
      <div class="budget-history-table-wrap">
        <table class="budget-history-table">
          <thead>
            <tr>${colunas}</tr>
          </thead>
          <tbody>
            ${linhas}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function gerarBlocoGraficoModalOrcamento(tipo) {
  const configs = {
    saude: {
      tag: 'Visualização Gráfica Integrada',
      titulo: 'Distribuição de Pacientes Atendidos por Patologia e Tratamento SUS',
      badge: '🩺 Farmácia Popular & Alta Complexidade SUS',
      anoRef: 'Ano-base: 2024 (Consolidado DATASUS)'
    },
    educacao: {
      tag: 'Visualização Gráfica Integrada',
      titulo: 'Fomento Federal e Matrículas em Tempo Integral (Programa ETI)',
      badge: '🎓 MEC / FNDE • Programa ETI 2024–2026',
      anoRef: 'Ano-base: 2024/2025 (MEC / ETI & Pé-de-Meia)'
    },
    previdencia: {
      tag: 'Visualização Gráfica Integrada',
      titulo: 'Valores Pagos pelo Governo em Aposentadorias e Benefícios RGPS (Total e Rural)',
      badge: '🏛️ Previdência Social & Tesouro Nacional (RGPS)',
      anoRef: 'Série Oficial: 2010 a 2025 (RTN/MPS) + 2026 (Projeção LOA)'
    },
    trabalho: {
      tag: 'Visualização Gráfica Integrada',
      titulo: 'Evolução do Emprego Formal CLT & Suporte ao MEI (2016 a 2026)',
      badge: '💼 Séries Oficiais MTE / CAGED / RFB',
      anoRef: 'Série Oficial: 2016 a 2025 (CAGED / MTE / RFB)'
    },
    agro: {
      tag: 'Visualização Gráfica Integrada',
      titulo: 'Compras da Agricultura Familiar para Alimentação Escolar (PNAE) e CONAB',
      badge: '🌱 FNDE / PNAE / CONAB (2010 a 2026)',
      anoRef: 'Série Oficial: 2010 a 2025 (PNAE / FNDE / CONAB)'
    }
  };
  const cfg = configs[tipo] || configs.saude;

  return `
    <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 16px; margin: 20px 0;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
        <div>
          <span style="font-size: 0.72rem; font-weight: 800; color: #64748B; text-transform: uppercase;">${cfg.tag}</span>
          <h5 style="font-size: 0.95rem; font-weight: 800; color: var(--gov-blue-dark); margin: 0;">${cfg.titulo}</h5>
        </div>
        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
          <span class="graph-corner-year">📅 ${cfg.anoRef}</span>
          <span style="font-size: 0.72rem; background: #EEF2FF; color: #1E40AF; padding: 4px 10px; border-radius: 6px; font-weight: 700;">${cfg.badge}</span>
        </div>
      </div>
      <div style="height: 290px; position: relative;">
        <canvas id="chart-modal-orcamento"></canvas>
      </div>
    </div>
  `;
}

/**
 * Renderiza gráfico no modal de prioridades
 */
function renderizarGraficoModalOrcamento(tipo) {
  const canvas = document.getElementById('chart-modal-orcamento');
  if (!canvas) return;

  if (chartModalOrcamento) {
    chartModalOrcamento.destroy();
    chartModalOrcamento = null;
  }

  const ctx = canvas.getContext('2d');

  // Caso 1: Saúde Pública (Farmácia Popular & Alta Complexidade SUS)
  if (tipo === 'saude') {
    const sde = (activeRaioXCity && activeRaioXCity.sde) ? activeRaioXCity.sde : (APP_DATA.saude_nacional || {});
    const hipTot = Math.round((sde.fp_so_hipertensao || sde.hip || 4962509) / 10000) / 100;
    const ambTot = Math.round((sde.fp_hipertensao_e_diabetes || sde.amb || 3239501) / 10000) / 100;
    const acTot = Math.round((sde.alto_custo || sde.ac || 3284659) / 10000) / 100;
    const diabTot = Math.round((sde.fp_so_diabetes || sde.diab || 1808126) / 10000) / 100;
    const asmaTot = Math.round((sde.fp_asma || sde.asma || 875033) / 10000) / 100;
    const quimTot = Math.round((sde.quimioterapia || sde.quim || 361331) / 10000) / 100;
    const radTot = Math.round((sde.radioterapia || sde.rad || 8987) / 10000) / 100;

    const labels = [
      'Hipertensão isolada',
      'Hipertensão + Diabetes',
      'Diabetes isolada',
      'Asma Crônica',
      'Alto Custo Especializado',
      'Quimioterapia Oncológica',
      'Radioterapia Oncológica'
    ];

    const dataFP = [hipTot, ambTot, diabTot, asmaTot, null, null, null];
    const dataSUS = [null, null, null, null, acTot, quimTot, radTot];

    chartModalOrcamento = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Farmácia Popular (Milhões de Pacientes)',
            data: dataFP,
            backgroundColor: 'rgba(14, 159, 110, 0.85)',
            borderColor: '#0E9F6E',
            borderWidth: 1.5,
            borderRadius: 4
          },
          {
            label: 'Alta Complexidade SUS (Milhões de Atendimentos)',
            data: dataSUS,
            backgroundColor: 'rgba(30, 58, 138, 0.85)',
            borderColor: '#1E3A8A',
            borderWidth: 1.5,
            borderRadius: 4,
            hidden: true
          }
        ]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: { boxWidth: 12, font: { size: 11, weight: '700' } },
            onClick: function(e, legendItem, legend) {
              const index = legendItem.datasetIndex;
              const ci = legend.chart;
              if (ci.isDatasetVisible(index)) {
                ci.hide(index);
                legendItem.hidden = true;
              } else {
                ci.show(index);
                legendItem.hidden = false;
              }
              ci.update();
            }
          },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.dataset.label}: ${ctx.raw !== null ? ctx.raw.toFixed(2) + ' Milhões' : '—'}`
            }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: { callback: v => `${v} M` },
            title: { display: true, text: 'Milhões de Pacientes / Procedimentos', font: { weight: 'bold' } }
          },
          y: {
            grid: { display: false }
          }
        }
      }
    });
    return;
  }

  // Caso 2: Educação Básica & Programa Escola em Tempo Integral (ETI)
  if (tipo === 'educacao') {
    const etiTop10 = (APP_DATA.eti_por_uf || []).slice(0, 10);
    const labels = etiTop10.map(d => `${d.nome} (${d.uf})`);
    const fomData = etiTop10.map(d => Math.round(d.fomento / 1000000));
    const matData = etiTop10.map(d => Math.round(d.matriculas / 1000));

    chartModalOrcamento = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Fomento Federal Rede Municipal (R$ Milhões)',
            data: fomData,
            backgroundColor: 'rgba(26, 86, 219, 0.85)',
            borderColor: '#1A56DB',
            borderWidth: 1.5,
            borderRadius: 4
          },
          {
            label: 'Matrículas Tempo Integral (Milhares de Alunos)',
            data: matData,
            backgroundColor: 'rgba(245, 158, 11, 0.85)',
            borderColor: '#D97706',
            borderWidth: 1.5,
            borderRadius: 4,
            hidden: true
          }
        ]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: { boxWidth: 12, font: { size: 11, weight: '700' } },
            onClick: function(e, legendItem, legend) {
              const index = legendItem.datasetIndex;
              const ci = legend.chart;
              if (ci.isDatasetVisible(index)) {
                ci.hide(index);
                legendItem.hidden = true;
              } else {
                ci.show(index);
                legendItem.hidden = false;
              }
              ci.update();
            }
          },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.dataset.label}: ${ctx.datasetIndex === 0 ? 'R$ ' + ctx.raw + ' Mi' : ctx.raw + ' mil vagas'}`
            }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: { callback: v => `${v}` },
            title: { display: true, text: 'R$ Milhões / Milhares de Vagas ETI', font: { weight: 'bold' } }
          },
          y: {
            grid: { display: false }
          }
        }
      }
    });
    return;
  }

  // Caso 3: Mercado de Trabalho Formal CLT & Suporte ao MEI
  if (tipo === 'trabalho') {
    const nacList = APP_DATA?.series_historicas?.nacional || [];
    const labels = nacList.map(d => String(d.ano));
    const cltData = nacList.map(d => d.clt_milhoes);
    const meiData = nacList.map(d => d.meis_milhoes);

    chartModalOrcamento = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            type: 'bar',
            label: 'Empregos Formais CLT (Milhões de Carteiras)',
            data: cltData,
            backgroundColor: 'rgba(26, 86, 219, 0.85)',
            borderColor: '#1A56DB',
            borderWidth: 1.5,
            borderRadius: 4,
            order: 1
          },
          {
            type: 'bar',
            label: 'Microempreendedores MEI (Milhões de Formalizados)',
            data: meiData,
            backgroundColor: 'rgba(245, 158, 11, 0.85)',
            borderColor: '#D97706',
            borderWidth: 1.5,
            borderRadius: 4,
            order: 2,
            hidden: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            position: 'top',
            labels: { boxWidth: 12, font: { size: 11, weight: '700' } },
            onClick: function(e, legendItem, legend) {
              const index = legendItem.datasetIndex;
              const ci = legend.chart;
              if (ci.isDatasetVisible(index)) {
                ci.hide(index);
                legendItem.hidden = true;
              } else {
                ci.show(index);
                legendItem.hidden = false;
              }

              const cltVis = ci.isDatasetVisible(0);
              const meiVis = ci.isDatasetVisible(1);
              const yAxis = ci.options.scales.y;

              if (cltVis && !meiVis) {
                yAxis.min = 80;
                yAxis.suggestedMin = 80;
                yAxis.suggestedMax = 108;
                yAxis.title.text = 'Milhões de Trabalhadores CLT (Corte a partir de 80M)';
              } else if (!cltVis && meiVis) {
                yAxis.min = 0;
                yAxis.suggestedMin = 0;
                yAxis.suggestedMax = 22;
                yAxis.title.text = 'Milhões de Microempreendedores MEI (Escala 0 a 22M)';
              } else if (cltVis && meiVis) {
                yAxis.min = 0;
                yAxis.suggestedMin = 0;
                yAxis.suggestedMax = 115;
                yAxis.title.text = 'Milhões de Trabalhadores (CLT & MEI - Escala Geral)';
              } else {
                yAxis.min = 0;
                yAxis.suggestedMin = 0;
                yAxis.suggestedMax = 100;
              }

              ci.update();
            }
          },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.dataset.label}: ${ctx.raw.toFixed(2)} Milhões`
            }
          }
        },
        scales: {
          x: { grid: { display: false } },
          y: {
            min: 80,
            suggestedMin: 80,
            suggestedMax: 108,
            ticks: { callback: v => `${v} M` },
            title: { display: true, text: 'Milhões de Trabalhadores CLT (Corte a partir de 80M)', font: { weight: 'bold' } }
          }
        }
      },
      plugins: [{
        id: 'cltMeiLabels',
        afterDatasetsDraw(chart) {
          const { ctx } = chart;
          ctx.save();
          ctx.font = 'bold 9px Inter, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          chart.data.datasets.forEach((dataset, datasetIndex) => {
            const meta = chart.getDatasetMeta(datasetIndex);
            if (meta.hidden) return;
            meta.data.forEach((bar, index) => {
              const val = dataset.data[index];
              if (val === undefined || val === null || val <= 0) return;
              ctx.fillStyle = '#1E293B';
              ctx.fillText(`${val.toFixed(1)}M`, bar.x, bar.y - 3);
            });
          });
          ctx.restore();
        }
      }]
    });
    return;
  }

  // Casos 4 e 5: Previdência e Agro
  const lista = APP_DATA?.series_historicas?.orcamento_governos || [];
  if (lista.length === 0) return;

  const labels = lista.map(d => String(d.ano));

  const barColors = lista.map(d => {
    if (d.governo.includes('Lula 2')) return 'rgba(239, 68, 68, 0.75)';
    if (d.governo.includes('Dilma')) return 'rgba(220, 38, 38, 0.75)';
    if (d.governo.includes('Temer')) return 'rgba(100, 116, 139, 0.75)';
    if (d.governo.includes('Bolsonaro')) return 'rgba(37, 99, 235, 0.75)';
    if (d.governo.includes('Lula 3')) return 'rgba(185, 28, 28, 0.85)';
    return 'rgba(75, 85, 99, 0.75)';
  });

  const borderColors = lista.map(d => {
    if (d.governo.includes('Lula 2')) return '#EF4444';
    if (d.governo.includes('Dilma')) return '#DC2626';
    if (d.governo.includes('Temer')) return '#64748B';
    if (d.governo.includes('Bolsonaro')) return '#2563EB';
    if (d.governo.includes('Lula 3')) return '#B91C1C';
    return '#4B5563';
  });

  let datasetsOrc = [];

  if (tipo === 'previdencia') {
    const aposData = lista.map(d => d.aposentadorias_total_bi || (d.previdencia_total_bi ? Math.round(d.previdencia_total_bi * 0.675 * 10) / 10 : 0));
    const ruralData = lista.map(d => d.previdencia_rural_bi || 0);
    const totalRgpsData = lista.map(d => d.previdencia_total_bi || 0);

    datasetsOrc = [
      {
        type: 'bar',
        label: 'Aposentadorias Pagas pelo Governo (R$ Bi)',
        data: aposData,
        backgroundColor: 'rgba(126, 58, 242, 0.85)',
        borderColor: '#7E3AF2',
        borderWidth: 1.5,
        borderRadius: 4,
        order: 2,
        yAxisID: 'y'
      },
      {
        type: 'bar',
        label: 'Aposentadoria & Benefício Rural (R$ Bi)',
        data: ruralData,
        backgroundColor: 'rgba(16, 185, 129, 0.85)',
        borderColor: '#059669',
        borderWidth: 1.5,
        borderRadius: 4,
        order: 3,
        yAxisID: 'y'
      },
      {
        type: 'line',
        label: 'Total Geral RGPS (Apos. + Pensões) (R$ Bi)',
        data: totalRgpsData,
        borderColor: '#1E40AF',
        backgroundColor: 'rgba(30, 64, 175, 0.05)',
        borderWidth: 2.5,
        pointBackgroundColor: '#1E40AF',
        pointBorderColor: '#FFFFFF',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.2,
        order: 1,
        yAxisID: 'y',
        hidden: true
      }
    ];
  } else if (tipo === 'agro') {
    const agroNom = lista.map(d => d.pnae_compras_agricultura_familiar_bi || 0.45);
    const agroReal = lista.map(d => {
      const nom = d.pnae_compras_agricultura_familiar_bi || 0.45;
      const fator = d.ano <= 2014 ? 1.75 : d.ano <= 2018 ? 1.45 : d.ano <= 2022 ? 1.22 : 1.05;
      return Math.round(nom * fator * 100) / 100;
    });

    datasetsOrc = [
      {
        type: 'bar',
        label: 'Compras da Agricultura Familiar PNAE (Nominal)',
        data: agroNom,
        backgroundColor: barColors,
        borderColor: borderColors,
        borderWidth: 1.5,
        borderRadius: 4,
        order: 2,
        yAxisID: 'y'
      },
      {
        type: 'line',
        label: 'Compras Agricultura Familiar (Corrigido IPCA 2026)',
        data: agroReal,
        borderColor: '#1E3A8A',
        backgroundColor: 'rgba(30, 58, 138, 0.05)',
        borderWidth: 3,
        pointBackgroundColor: '#1E3A8A',
        pointBorderColor: '#FFFFFF',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
        tension: 0.25,
        order: 1,
        yAxisID: 'y',
        hidden: true
      }
    ];
  }

  chartModalOrcamento = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: datasetsOrc
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          position: 'top',
          labels: {
            boxWidth: 12,
            font: { size: 11, weight: '700' },
            color: '#334155'
          },
          onClick: function(e, legendItem, legend) {
            const index = legendItem.datasetIndex;
            const ci = legend.chart;
            if (ci.isDatasetVisible(index)) {
              ci.hide(index);
              legendItem.hidden = true;
            } else {
              ci.show(index);
              legendItem.hidden = false;
            }
            ci.update();
          }
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          padding: 12,
          titleFont: { size: 12, weight: 'bold' },
          bodyFont: { size: 11 },
          callbacks: {
            label: function(context) {
              const val = context.parsed.y !== null ? context.parsed.y.toFixed(2) : '0.00';
              return ` ${context.dataset.label}: R$ ${val} Bi`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            font: { size: 10, weight: '600' },
            color: '#64748B'
          }
        },
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(226, 232, 240, 0.6)' },
          ticks: {
            font: { size: 10 },
            color: '#64748B',
            callback: v => `R$ ${v} Bi`
          },
          title: {
            display: true,
            text: 'Valores em R$ Bilhões',
            font: { size: 10, weight: 'bold' },
            color: '#64748B'
          }
        }
      }
    },
    plugins: [{
      id: 'barLabelsModalOrcamento',
      afterDatasetsDraw(chart) {
        const { ctx } = chart;
        ctx.save();
        ctx.font = 'bold 9px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        chart.data.datasets.forEach((dataset, datasetIndex) => {
          const meta = chart.getDatasetMeta(datasetIndex);
          if (meta.hidden || (chart.isDatasetVisible && !chart.isDatasetVisible(datasetIndex))) return;
          meta.data.forEach((element, index) => {
            const val = dataset.data[index];
            if (val === undefined || val === null || val <= 0) return;
            if (tipo === 'previdencia') {
              ctx.fillStyle = datasetIndex === 0 ? '#7E3AF2' : (datasetIndex === 1 ? '#047857' : '#1E3A8A');
            } else {
              ctx.fillStyle = datasetIndex === 0 ? '#0F172A' : '#1E3A8A';
            }
            ctx.fillText(`${val.toFixed(0)}B`, element.x, element.y - 4);
          });
        });
        ctx.restore();
      }
    }]
  });
}

/**
 * Abre o Modal de Análise Aprofundada da Prioridade Nacional
 * Integra dinamicamente os valores de acordo com o filtro territorial ativo (município, estado, região, cluster ou Brasil)
 */
function abrirModalPrioridade(tipo) {
  const modal = document.getElementById('modal-prioridade-detalhe');
  const catEl = document.getElementById('prio-modal-category');
  const titleEl = document.getElementById('prio-modal-title');
  const bodyEl = document.getElementById('prio-modal-body');
  const scopeBadge = document.getElementById('prio-modal-scope-badge');

  if (!modal || !catEl || !titleEl || !bodyEl) return;

  const escopo = obterEscopoTerritorialModal();

  if (scopeBadge) {
    if (escopo.isBrasil) {
      scopeBadge.textContent = '📍 Brasil (Consolidado) • 5.571 Cidades';
      scopeBadge.style.background = '#EEF2FF';
      scopeBadge.style.color = '#1E40AF';
      scopeBadge.style.borderColor = '#CBD5E1';
    } else {
      scopeBadge.textContent = `📍 Filtro Ativo: ${escopo.nomeTerritorio} (${formatarNumero(escopo.totalCidades)} ${escopo.totalCidades === 1 ? 'cidade' : 'cidades'})`;
      scopeBadge.style.background = '#FEF3C7';
      scopeBadge.style.color = '#92400E';
      scopeBadge.style.borderColor = '#FCD34D';
    }
  }

  let cfg = null;

  if (escopo.isBrasil) {
    const configsNacionais = {
      saude: {
        categoria: 'SAÚDE PÚBLICA & ASSISTÊNCIA FARMACÊUTICA',
        titulo: 'Farmácia Popular do Brasil: Cobertura, Economia e Saúde Integral',
        descricao: 'O Programa Farmácia Popular garante medicamentos 100% gratuitos para diabetes, hipertensão, asma e osteoporose, além de anticoncepcionais e fraldas geriátricas com copagamento reduzido.',
        destaques: [
          { label: 'Pessoas Atendidas no Brasil', valor: '12,96 Milhões', ano: 'Ref: 2024' },
          { label: 'Economia Anual para Famílias', valor: 'R$ 7,73 Bilhões', ano: 'Ref: 2024' },
          { label: 'Municípios com Cobertura Ativa', valor: '5.571 Cidades (100%)', ano: 'Ref: 2024/2025' },
          { label: 'Medicamentos Gratuitos Disponíveis', valor: '40+ Itens Essenciais', ano: 'Ref: Vigente' }
        ],
        impactoPolitico: 'Impacto direto no orçamento familiar das classes C, D e E, liberando até 25% da renda de idosos e aposentados que antes era gasta com remédios contínuos.'
      },
      educacao: {
        categoria: 'EDUCAÇÃO BÁSICA & JUVENTUDE',
        titulo: 'Poupança Pé-de-Meia & Expansão do Novo FUNDEB',
        descricao: 'O Programa Pé-de-Meia é uma poupança financeira direta aos estudantes do ensino médio da rede pública cadastrados no CadÚnico, visando combater a evasão escolar e incentivar a conclusão dos estudos e a realização do ENEM.',
        destaques: [
          { label: 'Estudantes Beneficiados', valor: '4,08 Milhões de Jovens', ano: 'Ref: 2024' },
          { label: 'Investimento Federal Total', valor: 'R$ 10,53 Bilhões', ano: 'Ref: 2024/2025' },
          { label: 'Complementação VAAT da União', valor: 'R$ 46,07 Bilhões', ano: 'Ref: 2024/2025' },
          { label: 'Incentivo Total por Estudante', valor: 'Até R$ 9.200 no Ciclo', ano: 'Ref: Lei 14.818' }
        ],
        impactoPolitico: 'Retenção imediata de jovens das periferias e do interior na escola, reduzindo a evasão no 1º ano do ensino médio em até 35% e dinamizando pequenos comércios locais com os saques mensais de R$ 200.'
      },
      previdencia: {
        categoria: 'PREVIDÊNCIA SOCIAL & SEGURIDADE',
        titulo: 'Previdência Social RGPS: O Maior Motor de Renda dos Municípios',
        descricao: 'Em mais de 78% dos municípios brasileiros (mais de 4.300 cidades), o total pago em benefícios do Regime Geral de Previdência Social (aposentadorias urbanas e rurais) supera a receita total arrecadada via Fundo de Participação dos Municípios (FPM).',
        destaques: [
          { label: 'Aposentadorias Pagas (RGPS)', valor: 'R$ 606,2 Bilhões', ano: 'Ref: 2024/2025' },
          { label: 'Aposentadoria / Benefício Rural', valor: 'R$ 121,4 a 218,8 Bi', ano: 'Ref: 2024/2025' },
          { label: 'Total de Benefícios Mantidos', valor: '35,17 Milhões', ano: 'Ref: 2024/2025' },
          { label: 'Cidades onde RGPS > FPM', valor: '4.345 Municípios (78%)', ano: 'Ref: 2023/2024' }
        ],
        impactoPolitico: 'Sustentáculo absoluto da atividade econômica local em cidades do interior, especialmente no Nordeste, Sul e Centro-Oeste rural, com forte impacto no consumo básico de supermercados e farmácias.'
      },
      trabalho: {
        categoria: 'TRABALHO, EMPREGO & RENDA',
        titulo: 'Mercado de Trabalho Formal CLT & Suporte ao MEI',
        descricao: 'O Brasil alcançou recorde histórico com quase 50 milhões de carteiras assinadas no setor privado aliadas a mais de 16,9 milhões de Microempreendedores Individuais (MEIs) formalizados, impulsionados pela valorização do Salário Mínimo e retomada de obras estruturantes.',
        destaques: [
          { label: 'Empregos Formais CLT Ativos', valor: '49,66 Milhões', ano: 'Ref: 2024' },
          { label: 'MEIs Cadastrados', valor: '16,94 Milhões', ano: 'Ref: 2024' },
          { label: 'Repasse Mensal Bolsa Família', valor: 'R$ 11,96 Bi / mês', ano: 'Ref: 2024' },
          { label: 'Taxa de Desemprego Nacional', valor: 'Mínima Histórica (< 7%)', ano: 'Ref: 2024/2025' }
        ],
        impactoPolitico: 'Sensação palpável de melhora na renda familiar, segurança de direitos trabalhistas e acesso a crédito produtivo, gerando otimismo econômico nas classes trabalhadoras urbanas.'
      },
      agro: {
        categoria: 'AGRICULTURA FAMILIAR & MERENDA ESCOLAR',
        titulo: 'PNAE Merenda Escolar, Compras da Agricultura Familiar & CONAB',
        descricao: 'A Lei Federal nº 11.947/2009 determina que no mínimo 30% dos recursos federais repassados pelo FNDE para a merenda escolar (PNAE) devem ser aplicados na compra direta de alimentos produzidos pela agricultura familiar local, promovendo comida saudável nas escolas e renda fixa para os pequenos produtores.',
        destaques: [
          { label: 'Compras Agricultura Familiar (PNAE)', valor: 'R$ 1,51 Bilhão', ano: 'Ref: 2024/2025' },
          { label: 'Alunos Atendidos com Merenda', valor: '40,5 Milhões', ano: 'Ref: 2024/2025' },
          { label: 'Exigência Legal Mínima', valor: 'No mínimo 30% Local', ano: 'Ref: Lei 11.947' },
          { label: 'Orçamento Executado CONAB', valor: 'R$ 1,84 Bilhão', ano: 'Ref: 2024' }
        ],
        impactoPolitico: 'Fortalecimento da economia solidária no campo, fixação do agricultor familiar na terra, garantia de preço justo via estoques públicos da CONAB e qualidade nutricional para crianças das redes públicas municipais e estaduais.'
      }
    };
    cfg = configsNacionais[tipo] || configsNacionais.saude;
  } else {
    // Cálculo Dinâmico Calibrado com base no Território Ativo
    const totalCidades = escopo.totalCidades;
    const isMunUnico = totalCidades === 1;
    const munUnico = isMunUnico ? escopo.cidades[0] : null;
    const popTot = escopo.cidades.reduce((s, c) => s + (c.pop || 0), 0);

    const fpAtendidos = escopo.cidades.reduce((s, c) => s + ((c.pop || 0) * (c.ind?.fp || 0) / 100), 0);
    const fpEconomia = fpAtendidos * 600;

    const pdmJovens = escopo.cidades.reduce((s, c) => s + ((c.pop || 0) * 0.03 * (c.ind?.pdm || 60) / 100), 0);
    const pdmInvest = pdmJovens * 2580;
    const fundebVaat = escopo.cidades.reduce((s, c) => s + ((c.pop || 0) * (c.ind?.fundeb || 15.9) / 100), 0) * 1420;
    const etiMatriculas = escopo.cidades.reduce((s, c) => s + (c.eti?.mat || 0), 0);

    const prevBenef = escopo.cidades.reduce((s, c) => s + ((c.pop || 0) * (c.ind?.apos || 0) / 100), 0);
    const prevValor = prevBenef * 17235;
    const prevRuralValor = prevValor * (121.4 / 606.2);
    const mediaPesoPib = totalCidades > 0 ? (escopo.cidades.reduce((s, c) => s + (c.ind?.prev_pib || 0), 0) / totalCidades).toFixed(1) : '0.0';

    const cltVagas = escopo.cidades.reduce((s, c) => s + ((c.pop || 0) * (c.ind?.clt || 0) / 100), 0);
    const meiCad = escopo.cidades.reduce((s, c) => s + ((c.pop || 0) * (c.ind?.mei || 0) / 100), 0);
    const bfFamilias = escopo.cidades.reduce((s, c) => s + ((c.pop || 0) * (c.ind?.bf || 0) / 100), 0);
    const bfRepasse = bfFamilias * 575;
    const servidores = escopo.cidades.reduce((s, c) => s + ((c.pop || 0) * (c.ind?.serv || 0) / 100), 0);

    const agroAlunos = escopo.cidades.reduce((s, c) => s + ((c.pop || 0) * 0.1995), 0);
    const agroValor = agroAlunos * 37.28;
    const agroComprasFamiliar = agroValor * 0.35;

    const configsLocais = {
      saude: {
        categoria: 'SAÚDE PÚBLICA & ASSISTÊNCIA FARMACÊUTICA',
        titulo: `Farmácia Popular: Cobertura e Alívio Financeiro • ${escopo.nomeTerritorio}`,
        descricao: `Em ${escopo.nomeTerritorio} (população de ${formatarNumero(popTot)} habitantes), o Programa Farmácia Popular garante medicamentos 100% gratuitos para diabetes, hipertensão e asma, gerando alívio financeiro direto para as famílias e reduzindo a pressão sobre os postos de saúde municipais.`,
        destaques: [
          { label: `Pessoas Atendidas (${isMunUnico ? 'No Município' : 'No Território'})`, valor: `${formatarGrandeza(fpAtendidos)}`, ano: 'Ref: 2024' },
          { label: 'Economia Anual das Famílias', valor: `${formatarGrandeza(fpEconomia, true)}`, ano: 'Ref: 2024' },
          { label: isMunUnico ? 'Cobertura na População' : 'Cidades Abrangidas', valor: isMunUnico ? `${(munUnico.ind?.fp || 0).toFixed(1)}% dos Habitantes` : `${formatarNumero(totalCidades)} Municípios`, ano: 'Ref: 2024/2025' },
          { label: isMunUnico && munUnico.sde ? 'Hipertensão e Diabetes Atendidos' : 'Medicamentos Gratuitos', valor: isMunUnico && munUnico.sde ? `${formatarNumero((munUnico.sde.hip || 0) + (munUnico.sde.diab || 0))} Pacientes` : '40+ Itens Essenciais', ano: isMunUnico ? 'Ref: SUS 2024' : 'Ref: Vigente' }
        ],
        impactoPolitico: `Impacto socioeconômico direto no orçamento familiar de ${escopo.nomeTerritorio}, liberando renda de idosos e famílias vulneráveis que antes seria consumida em farmácias comerciais, além de prevenir agravamentos e internações cardiovasculares.`
      },
      educacao: {
        categoria: 'EDUCAÇÃO BÁSICA & JUVENTUDE',
        titulo: `Poupança Pé-de-Meia & Expansão do Ensino Básico • ${escopo.nomeTerritorio}`,
        descricao: `Em ${escopo.nomeTerritorio}, a poupança estudantil Pé-de-Meia protege os estudantes do ensino médio público com incentivo mensal de R$ 200 mais bônus de matrícula e ENEM, combatendo a evasão escolar e apoiando o desenvolvimento da juventude.`,
        destaques: [
          { label: 'Estudantes Beneficiados Pé-de-Meia', valor: `${formatarGrandeza(pdmJovens)} Jovens`, ano: 'Ref: 2024/2025' },
          { label: 'Injeção Federal Pé-de-Meia', valor: `${formatarGrandeza(pdmInvest, true)} / ano`, ano: 'Ref: MEC 2024' },
          { label: 'Complementação VAAT FUNDEB', valor: `${formatarGrandeza(fundebVaat, true)}`, ano: 'Ref: FUNDEB 2024' },
          { label: etiMatriculas > 0 ? 'Matrículas Tempo Integral (ETI)' : 'Incentivo Máximo / Estudante', valor: etiMatriculas > 0 ? `${formatarGrandeza(etiMatriculas)} Vagas ETI` : 'Até R$ 9.200 no Ciclo', ano: etiMatriculas > 0 ? 'Ref: ETI 2024' : 'Ref: Lei 14.818' }
        ],
        impactoPolitico: `Redução drástica do abandono escolar de jovens em idade produtiva em ${escopo.nomeTerritorio}, mantendo os alunos na sala de aula e dinamizando a economia de bairros e comércios locais com os saques mensais.`
      },
      previdencia: {
        categoria: 'PREVIDÊNCIA SOCIAL & SEGURIDADE',
        titulo: `Previdência Social RGPS: Motor de Renda Local • ${escopo.nomeTerritorio}`,
        descricao: `Em ${escopo.nomeTerritorio}, os benefícios pagos pelo Regime Geral de Previdência Social (aposentadorias urbanas e rurais) constituem a principal base de sustentação da economia local, injetando recursos regulares no comércio e serviços.`,
        destaques: [
          { label: 'Total Pago em Benefícios RGPS', valor: `${formatarGrandeza(prevValor, true)} / ano`, ano: 'Ref: 2024/2025' },
          { label: 'Aposentadorias e Benefício Rural', valor: `${formatarGrandeza(prevRuralValor, true)} / ano`, ano: 'Ref: 2024/2025' },
          { label: 'Beneficiários Mantidos (INSS)', valor: `${formatarGrandeza(prevBenef)} Pessoas`, ano: 'Ref: 2024/2025' },
          { label: isMunUnico ? 'Peso da Previdência no PIB' : 'Peso Médio no PIB Municipal', valor: isMunUnico ? `${munUnico.ind?.prev_pib || 0}% do PIB Local` : `${mediaPesoPib}% do PIB`, ano: 'Ref: MPS / IBGE' }
        ],
        impactoPolitico: `Segurança social contínua em ${escopo.nomeTerritorio}: o dinheiro das aposentadorias circula integralmente na economia municipal, sustentando supermercados, farmácias e feiras livres mesmo em momentos de crise ou entressafra.`
      },
      trabalho: {
        categoria: 'TRABALHO, EMPREGO & RENDA',
        titulo: `Mercado de Trabalho, MEIs e Proteção de Renda • ${escopo.nomeTerritorio}`,
        descricao: `Em ${escopo.nomeTerritorio}, o mercado de trabalho combina carteiras assinadas protegidas pela CLT e microempreendedores formalizados (MEI), articulados com a rede de proteção social do Bolsa Família.`,
        destaques: [
          { label: 'Empregos Formais CLT Ativos', valor: `${formatarGrandeza(cltVagas)}`, ano: 'Ref: 2024' },
          { label: 'Microempreendedores MEI', valor: `${formatarGrandeza(meiCad)} MEIs`, ano: 'Ref: 2024' },
          { label: 'Repasse Mensal Bolsa Família', valor: `${formatarGrandeza(bfRepasse, true)} / mês`, ano: 'Ref: 2024' },
          { label: isMunUnico ? 'Servidores Públicos Ativos' : 'Famílias Cadastradas no BF', valor: isMunUnico ? `${formatarGrandeza(servidores)} Servidores` : `${formatarGrandeza(bfFamilias)} Famílias`, ano: 'Ref: 2024' }
        ],
        impactoPolitico: `Aquecimento da economia popular e segurança de renda para trabalhadores de ${escopo.nomeTerritorio}, estimulando contratações, microcrédito e circulação contínua de recursos.`
      },
      agro: {
        categoria: 'AGRICULTURA FAMILIAR & MERENDA ESCOLAR',
        titulo: `Alimentação Escolar PNAE e Agricultura Familiar • ${escopo.nomeTerritorio}`,
        descricao: `Em ${escopo.nomeTerritorio}, o Programa Nacional de Alimentação Escolar (PNAE) assegura refeições de qualidade para os estudantes e impulsiona os produtores rurais com compras locais garantidas pela Lei 11.947/2009.`,
        destaques: [
          { label: 'Compras Agricultura Familiar (Mín. 30%)', valor: `${formatarGrandeza(agroComprasFamiliar, true)} / ano`, ano: 'Ref: Lei 11.947' },
          { label: 'Repasse Federal Merenda (PNAE)', valor: `${formatarGrandeza(agroValor, true)} / ano`, ano: 'Ref: FNDE 2024' },
          { label: 'Alunos Atendidos com Alimentação', valor: `${formatarGrandeza(agroAlunos)} Estudantes`, ano: 'Ref: Censo Escolar' },
          { label: isMunUnico ? 'Exigência Legal Obrigatória' : 'Municípios Produtores', valor: isMunUnico ? 'Mínimo 30% Local' : `${formatarNumero(totalCidades)} Cidades`, ano: 'Ref: Lei 11.947' }
        ],
        impactoPolitico: `Fortalecimento de cooperativas e agricultores familiares locais em ${escopo.nomeTerritorio}, gerando renda no campo e garantindo alimentação fresca e saudável para as crianças nas escolas.`
      }
    };
    cfg = configsLocais[tipo] || configsLocais.saude;
  }

  catEl.textContent = cfg.categoria;
  titleEl.textContent = cfg.titulo;

  const destaquesHtml = cfg.destaques.map(d => `
    <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 10px; padding: 14px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.04); position: relative;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
        <span style="font-size: 0.68rem; color: #64748B; font-weight: 700; text-transform: uppercase;">${d.label}</span>
        ${d.ano ? `<span style="font-size: 0.60rem; font-weight: 700; color: #475569; background: #F1F5F9; border: 1px solid #CBD5E1; padding: 1px 5px; border-radius: 3px;">${d.ano}</span>` : ''}
      </div>
      <div style="font-size: 1.35rem; font-weight: 800; color: var(--gov-blue-dark); margin-top: 4px;">${d.valor}</div>
    </div>
  `).join('');

  const grafBloco = gerarBlocoGraficoModalOrcamento(tipo);
  const tabelaBloco = gerarTabelaHistoricoOrcamento(tipo);

  bodyEl.innerHTML = `
    <div style="margin-bottom: 20px;">
      <p style="font-size: 0.95rem; color: #334155; line-height: 1.6; margin-bottom: 16px;">
        ${cfg.descricao}
      </p>
      
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-bottom: 18px;">
        ${destaquesHtml}
      </div>

      <div style="background: #F0FDF4; border-left: 4px solid #16A34A; padding: 12px 16px; border-radius: 6px; margin-bottom: 20px;">
        <strong style="color: #166534; font-size: 0.85rem;">🎯 Impacto Estratégico no Território:</strong>
        <p style="color: #15803D; font-size: 0.82rem; margin: 4px 0 0 0; line-height: 1.4;">${cfg.impactoPolitico}</p>
      </div>

      ${grafBloco}
      ${tabelaBloco}
    </div>
  `;

  modal.classList.remove('hidden');

  // Renderiza gráfico misto de orçamento após o canvas ser inserido no DOM
  setTimeout(() => {
    renderizarGraficoModalOrcamento(tipo);
  }, 60);
}
window.abrirModalPrioridade = abrirModalPrioridade;

function fecharModalPrioridade() {
  document.getElementById('modal-prioridade-detalhe').classList.add('hidden');
}

/**
 * MODAL DA TABELA COMPLETA DE MUNICÍPIOS EM FOCO
 */
function abrirModalTabelaMunicipios() {
  const modal = document.getElementById('modal-municipios-foco');
  if (modal) {
    modal.classList.remove('hidden');
    atualizarTabelaMunicipios();
  }
}

function fecharModalTabelaMunicipios() {
  const modal = document.getElementById('modal-municipios-foco');
  if (modal) {
    modal.classList.add('hidden');
  }
}

/**
 * 13. MODAL DE RAIO-X COMPLETO DO MUNICÍPIO (COM NARRATIVA ESTRATÉGICA & RANGE BULLETS)
 */
async function carregarNarrativas() {
  if (narrativasData) return narrativasData;
  try {
    const resp = await fetch('data/narrativas.json');
    if (resp.ok) {
      narrativasData = await resp.json();
    }
  } catch (e) {
    console.warn('Erro ao carregar narrativas:', e);
    narrativasData = {};
  }
  return narrativasData || {};
}

async function copiarNarrativaMunicipio(idIbge) {
  const narrativas = await carregarNarrativas();
  const texto = narrativas[idIbge] || narrativas[String(idIbge)] || '';
  if (!texto) return;
  try {
    await navigator.clipboard.writeText(texto);
    const btn = document.getElementById(`btn-copy-narrative-${idIbge}`);
    if (btn) {
      const original = btn.textContent;
      btn.textContent = '✓ Narrativa Copiada!';
      btn.style.backgroundColor = '#0E9F6E';
      btn.style.color = '#FFFFFF';
      setTimeout(() => {
        btn.textContent = original;
        btn.style.backgroundColor = '';
        btn.style.color = '';
      }, 2500);
    }
  } catch (err) {
    console.error('Erro ao copiar:', err);
  }
}

async function abrirModalMunicipio(idIbge) {
  const m = APP_DATA.municipios.find(c => c.id === idIbge);
  if (!m) return;

  activeRaioXCity = m;
  atualizarRaioXIntegrado();

  const perfil = PERFIS_IMPACTO[m.pf] || { cor: '#4B5563' };
  const corPerfil = perfil.cor;
  const eleic = currentElection === '2026_1t' ? m.e26 : (currentElection === '2022_1t' ? m.e22_1t : m.e22_2t);
  const lulaPct = eleic.lula || 0;
  const opositorPct = currentElection.includes('2026') ? (eleic.flavio || 0) : (eleic.bolsonaro || 0);

  // Carrega a narrativa estratégica da planilha
  const narrativas = await carregarNarrativas();
  const narrativaTexto = narrativas[m.id] || narrativas[String(m.id)] || 'Diagnóstico detalhado em consolidação para esta municipalidade.';

  const medianas = APP_DATA.totais_nacionais?.medianas_municipais || {};
  const itensIndicadores = [
    { key: 'mei', label: 'MEI / 100 hab', sub: 'microempreendedores', sufixo: '' },
    { key: 'serv', label: 'Servidores / 100 hab', sub: 'funcionalismo público', sufixo: '' },
    { key: 'bpc', label: 'BPC / 100 hab', sub: 'beneficiários LOAS', sufixo: '' },
    { key: 'fp', label: 'Farmácia Popular', sub: 'beneficiários / 100 hab', sufixo: '' },
    { key: 'pdm', label: 'Pé-de-Meia (Cobertura)', sub: 'jovens EM c/ poupança', sufixo: '%' },
    { key: 'apos', label: 'Aposentadorias RGPS', sub: 'aposentados / 100 hab', sufixo: '' }
  ];

  const cardsIndicadoresHtml = itensIndicadores.map(cfg => {
    const stat = medianas[cfg.key] || { min: 0, mediana: 5, max: 20 };
    const val = m.ind?.[cfg.key] || 0;
    const isAbove = val > stat.mediana;

    const min = stat.min;
    const max = stat.max;
    const med = stat.mediana;

    const pct = Math.max(0, Math.min(100, ((val - min) / (max - min || 1)) * 100));
    const medianPct = Math.max(0, Math.min(100, ((med - min) / (max - min || 1)) * 100));

    const cardClass = isAbove ? 'indicator-box card-above-median' : 'indicator-box';
    const badgeHtml = isAbove
      ? `<span class="median-pill above" title="Valor acima da mediana de todos os 5.571 municípios do Brasil">▲ Acima da Mediana (${med})</span>`
      : `<span class="median-pill below">▼ Na ou Abaixo (${med})</span>`;

    return `
      <div class="${cardClass}">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 4px; margin-bottom: 4px;">
          <span class="indicator-box-label" style="margin-bottom: 0;">${cfg.label}</span>
          ${badgeHtml}
        </div>
        <div class="indicator-box-val" style="color: ${isAbove ? '#0E9F6E' : 'var(--gov-blue-dark)'};">
          ${val.toFixed(1)}${cfg.sufixo}
        </div>
        <span class="indicator-box-sub">${cfg.sub}</span>

        <div class="range-bullet-wrap" style="margin-top: 8px;" title="Mínimo no Brasil: ${min} | Mediana: ${med} | Máximo: ${max}">
          <div class="range-bullet-track">
            <div class="range-median-mark" style="left: ${medianPct}%;"></div>
            <div class="range-bullet-dot ${isAbove ? 'dot-high' : ''}" style="left: ${pct}%;"></div>
          </div>
          <div class="range-bullet-sub">
            <span>Min ${min}</span>
            <span style="color: #475569;">Mediana ${med}</span>
            <span>Max ${max}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');

  const modalBody = document.getElementById('city-modal-body');
  modalBody.innerHTML = `
    <div class="city-detail-header">
      <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
        <h2 class="city-detail-title">${m.nm}</h2>
        <span class="city-detail-badge" style="background-color: ${corPerfil}20; color: ${corPerfil}; border: 1px solid ${corPerfil}50;">
          ● ${m.pf}
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
        ${perfil.resumo || ''}
      </p>
    </div>

    <!-- Card de Narrativa Estratégica Consolidada (Tradução Municipal) -->
    <div class="municipal-narrative-card">
      <div class="narrative-header">
        <span class="narrative-badge">📖 Raio-X Narrativo Estratégico (Tradução Municipal)</span>
        <button class="btn-copy-narrative" onclick="copiarNarrativaMunicipio('${m.id}')" id="btn-copy-narrative-${m.id}">
          📋 Copiar Narrativa
        </button>
      </div>
      <div class="narrative-text-box" id="narrative-content-${m.id}">
        ${narrativaTexto.replace(/\n/g, '<br>')}
      </div>
    </div>

    <!-- Comparativo Eleitoral Histórico: 2018 (Haddad), 2022 (Lula) e 2026 (Lula) -->
    <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 12px; margin-bottom: 16px;">
      <div style="font-size: 0.72rem; font-weight: 800; color: #64748B; text-transform: uppercase; margin-bottom: 8px;">
        Votação Presidencial Histórica no Município (Oficial TSE)
      </div>
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; text-align: center;">
        <div style="background: #FFFFFF; padding: 8px; border-radius: 6px; border: 1px solid #CBD5E1;">
          <span style="font-size: 0.68rem; color: #64748B;">2018 (Haddad)</span>
          <div style="font-size: 1.1rem; font-weight: 800; color: #991B1B;">${(m.e18?.haddad || 0).toFixed(1)}%</div>
        </div>
        <div style="background: #FFFFFF; padding: 8px; border-radius: 6px; border: 1px solid #CBD5E1;">
          <span style="font-size: 0.68rem; color: #64748B;">2022 (1ºT Lula)</span>
          <div style="font-size: 1.1rem; font-weight: 800; color: var(--eleitoral-lula);">${(m.e22_1t?.lula || 0).toFixed(1)}%</div>
        </div>
        <div style="background: #FFFFFF; padding: 8px; border-radius: 6px; border: 1px solid #CBD5E1;">
          <span style="font-size: 0.68rem; color: #64748B;">2022 (2ºT Lula)</span>
          <div style="font-size: 1.1rem; font-weight: 800; color: var(--eleitoral-lula);">${(m.e22_2t?.lula || 0).toFixed(1)}%</div>
        </div>
        <div style="background: #FEF3C7; padding: 8px; border-radius: 6px; border: 1px solid #F59E0B;">
          <span style="font-size: 0.68rem; color: #92400E; font-weight: 700;">2026 (1ºT Lula)</span>
          <div style="font-size: 1.1rem; font-weight: 800; color: #DC2626;">${(m.e26?.lula || 0).toFixed(1)}%</div>
        </div>
      </div>
    </div>

    <!-- Indicadores com Comparativo vs Mediana Nacional dos 5.571 municípios -->
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; flex-wrap: wrap; gap: 8px;">
      <h4 style="font-size: 0.92rem; font-weight: 700; color: var(--gov-blue-dark); margin: 0;">
        Indicadores Socioeconômicos vs Mediana Nacional (5.571 Cidades)
      </h4>
      <span style="font-size: 0.72rem; color: #64748B;">
        Verde = <strong style="color: #0E9F6E;">Acima da Mediana Nacional</strong>
      </span>
    </div>
    <div class="city-indicators-grid">
      ${cardsIndicadoresHtml}
    </div>

    <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 18px; flex-wrap: wrap;">
      <button class="social-share-btn btn-whatsapp" style="padding: 9px 16px; font-size: 0.85rem;" onclick="compartilharMunicipioDiretoWhatsApp('${m.id}')">
        <svg viewBox="0 0 24 24" fill="currentColor" class="social-icon">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.05 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
        </svg>
        WhatsApp
      </button>

      <!-- Estúdio de cards desativado temporariamente conforme solicitado -->
    </div>
  `;

  document.getElementById('city-modal').classList.remove('hidden');
}

function fecharModalMunicipio() {
  document.getElementById('city-modal').classList.add('hidden');
}

function fecharTodosModais() {
  fecharModalCorrelacao();
  fecharModalMetodologia();
  fecharModalPrioridade();
  fecharModalMunicipio();
  fecharModalTabelaMunicipios();
  fecharEstudioCards();
}

/**
 * 14. ESTÚDIO GERADOR DE CARDS PARA REDES SOCIAIS & EXPORTAÇÃO
 */
function configurarEstudioCards() {
  const perfilSelect = document.getElementById('studio-profile-select');
  perfilSelect.innerHTML = Object.keys(APP_DATA.perfis).map(p => `<option value="${p}">${p}</option>`).join('');

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

  document.getElementById('btn-download-card')?.addEventListener('click', exportarCardPNG);
  document.getElementById('btn-share-whatsapp')?.addEventListener('click', compartilharWhatsApp);
  document.getElementById('btn-copy-card-img')?.addEventListener('click', copiarImagemCard);
  document.getElementById('btn-native-share')?.addEventListener('click', compartilharNativo);
  document.getElementById('btn-share-x')?.addEventListener('click', compartilharX);
  document.getElementById('btn-share-telegram')?.addEventListener('click', compartilharTelegram);
  document.getElementById('btn-share-linkedin')?.addEventListener('click', compartilharLinkedIn);
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

function atualizarPreviewCard() {
  const stage = document.getElementById('card-render-stage');
  const eleicNome = currentElection === '2026_1t' ? 'Eleição 2026' : (currentElection === '2022_1t' ? '2022 (1ºT)' : (currentElection === '2018_2t' ? '2018 (2ºT)' : '2022 (2ºT)'));
  const nomeCand1 = currentElection === '2018_2t' ? 'Haddad' : 'Lula';

  if (studioConfig.theme === 'municipio') {
    const m = studioConfig.selectedCity || activeRaioXCity || APP_DATA.municipios[0];
    const perfil = PERFIS_IMPACTO[m.pf] || { cor: '#4B5563' };
    const eleic = currentElection === '2026_1t' ? m.e26 : (currentElection === '2022_1t' ? m.e22_1t : (currentElection === '2018_2t' ? m.e18 : m.e22_2t));
    const lulaPct = currentElection === '2018_2t' ? (eleic?.haddad || 0) : (eleic?.lula || 0);
    const opositorPct = currentElection.includes('2026') ? (eleic?.flavio || 0) : (eleic?.bolsonaro || 0);

    stage.innerHTML = `
      <div class="card-export-header">
        <div class="card-export-brand"><span class="brand-pill">BRASIL</span> <span>Inteligência Municipal</span></div>
        <span class="card-export-tag">RAIO-X MUNICIPAL</span>
      </div>

      <div class="card-export-title">${m.nm} • ${m.uf}</div>
      <div class="card-export-subtitle">Perfil: <strong>${m.pf}</strong> • ${formatarNumero(m.pop)} hab</div>

      <div class="card-export-stats-grid">
        <div class="card-export-stat-box">
          <span class="card-export-stat-val">${(m.ind?.mei || 0).toFixed(1)}</span>
          <span class="card-export-stat-lbl">MEI / 100 hab</span>
        </div>
        <div class="card-export-stat-box">
          <span class="card-export-stat-val">${(m.ind?.bpc || 0).toFixed(1)}</span>
          <span class="card-export-stat-lbl">BPC / 100 hab</span>
        </div>
        <div class="card-export-stat-box">
          <span class="card-export-stat-val">${(m.ind?.fp || 0).toFixed(1)}</span>
          <span class="card-export-stat-lbl">Farmácia Pop. / 100 hab</span>
        </div>
        <div class="card-export-stat-box">
          <span class="card-export-stat-val">${(m.ind?.pdm || 0).toFixed(1)}%</span>
          <span class="card-export-stat-lbl">Pé-de-Meia (Poupança)</span>
        </div>
      </div>

      <div class="card-export-election-box">
        <div class="card-export-election-header">
          <span>Resultado ${eleicNome}</span>
          <span>${formatarNumero(eleic.vtot || 0)} votos</span>
        </div>
        <div class="card-export-election-bars">
          <div class="card-export-cand-pill">
            <span style="color: #F87171; font-weight: 700;">${nomeCand1}</span>
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
          <span class="card-export-stat-val">R$ 1.518</span>
          <span class="card-export-stat-lbl">Salário Mínimo (R$ 1.212 em 2022 • Ganho Real)</span>
        </div>
        <div class="card-export-stat-box" style="border-left: 4px solid #7E3AF2;">
          <span class="card-export-stat-val">102,7 M</span>
          <span class="card-export-stat-lbl">Empregos Formais CLT (+6,7M vagas desde 2022)</span>
        </div>
      </div>

      <div class="card-export-footer">
        <span class="card-export-seal">✔ DADOS ECONÔMICOS CONSOLIDADOS</span>
        <span>DIEESE • ANP • CAGED/MTE • BANCO CENTRAL</span>
      </div>
    `;
  }
}

async function exportarCardPNG() {
  const stage = document.getElementById('card-render-stage');
  const btn = document.getElementById('btn-download-card');
  const originalText = btn.innerHTML;

  try {
    btn.innerHTML = '<span>Gerando imagem em alta resolução...</span>';
    btn.disabled = true;

    const canvas = await html2canvas(stage, {
      scale: 2,
      useCORS: true,
      backgroundColor: null,
      logging: false
    });

    const link = document.createElement('a');
    link.download = `card-brasil-${studioConfig.theme}-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  } catch (err) {
    console.error('Erro ao gerar card PNG:', err);
    alert('Não foi possível gerar a imagem.');
  } finally {
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
}

function gerarTextoCompartilhamento() {
  const eleicNome = currentElection === '2026_1t' ? '2026 (1ºT)' : (currentElection === '2022_1t' ? '2022 (1ºT)' : (currentElection === '2018_2t' ? '2018 (2ºT Haddad)' : '2022 (2ºT)'));
  const urlPainel = window.location.href;
  const m = activeRaioXCity || APP_DATA.municipios[0];
  const eleic = currentElection === '2026_1t' ? m.e26 : (currentElection === '2022_1t' ? m.e22_1t : (currentElection === '2018_2t' ? m.e18 : m.e22_2t));
  const cand1Nome = currentElection === '2018_2t' ? 'Haddad' : 'Lula';
  const cand1Pct = currentElection === '2018_2t' ? (eleic?.haddad || 0) : (eleic?.lula || 0);

  return `🇧🇷 *Raio-X Municipal: ${m.nm} (${m.uf})*\n` +
    `📌 Perfil: *${m.pf}*\n` +
    `👥 População: ${formatarNumero(m.pop)} habitantes\n` +
    `💼 MEIs / 100 hab: ${(m.ind?.mei || 0).toFixed(1)}\n` +
    `🏛️ Servidores / 100 hab: ${(m.ind?.serv || 0).toFixed(1)}\n` +
    `🤝 BPC / 100 hab: ${(m.ind?.bpc || 0).toFixed(1)}\n` +
    `💊 Farmácia Popular: ${(m.ind?.fp || 0).toFixed(1)} / 100 hab\n` +
    `🎓 Pé-de-Meia: ${(m.ind?.pdm || 0).toFixed(1)}%\n` +
    `🗳️ Votação ${cand1Nome}: ${cand1Pct.toFixed(1)}%\n\n` +
    `Acesse o painel completo: ${urlPainel}`;
}

function compartilharWhatsApp() {
  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(gerarTextoCompartilhamento())}`, '_blank');
}

function compartilharMunicipioDiretoWhatsApp(idIbge) {
  const m = APP_DATA.municipios.find(c => c.id === idIbge);
  if (!m) return;
  const eleicNome = currentElection === '2026_1t' ? '2026 (1ºT)' : (currentElection === '2022_1t' ? '2022 (1ºT)' : (currentElection === '2018_2t' ? '2018 (2ºT Haddad)' : '2022 (2ºT)'));
  const eleic = currentElection === '2026_1t' ? m.e26 : (currentElection === '2022_1t' ? m.e22_1t : (currentElection === '2018_2t' ? m.e18 : m.e22_2t));
  const cand1Nome = currentElection === '2018_2t' ? 'Haddad' : 'Lula';
  const cand1Pct = currentElection === '2018_2t' ? (eleic?.haddad || 0) : (eleic?.lula || 0);

  const texto = `🇧🇷 *Raio-X Municipal: ${m.nm} (${m.uf})*\n` +
    `📌 Perfil: *${m.pf}*\n` +
    `👥 População: ${formatarNumero(m.pop)} habitantes\n` +
    `💼 MEIs / 100 hab: ${(m.ind?.mei || 0).toFixed(1)}\n` +
    `🏛️ Servidores / 100 hab: ${(m.ind?.serv || 0).toFixed(1)}\n` +
    `🤝 BPC / 100 hab: ${(m.ind?.bpc || 0).toFixed(1)}\n` +
    `🗳️ Votação ${eleicNome}: ${cand1Nome} ${cand1Pct.toFixed(1)}%\n\n` +
    `Acesse o painel: ${window.location.href}`;

  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(texto)}`, '_blank');
}

function compartilharX() {
  window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(gerarTextoCompartilhamento())}`, '_blank');
}

function compartilharTelegram() {
  window.open(`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(gerarTextoCompartilhamento())}`, '_blank');
}

function compartilharLinkedIn() {
  window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`, '_blank');
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
          mostrarToast('✔ Imagem copiada! Cole com Ctrl+V.');
        } else {
          mostrarToast('Dica: Use o botão de download para baixar.');
        }
      } catch (err) {
        mostrarToast('Dica: Use o botão de download para baixar.');
      } finally {
        btn.innerHTML = originalHtml;
        btn.disabled = false;
      }
    }, 'image/png');
  } catch (err) {
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
          await navigator.share({ title: 'Painel Municipal Brasil', text: texto, files: [file] });
        } catch (e) {}
      } else if (navigator.share) {
        try {
          await navigator.share({ title: 'Painel Municipal Brasil', text: texto, url: window.location.href });
        } catch (e) {}
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(texto);
        mostrarToast('✔ Resumo copiado!');
      }
    }, 'image/png');
  } catch (err) {}
}

function mostrarToast(mensagem) {
  const toast = document.getElementById('share-toast');
  if (!toast) return;
  toast.textContent = mensagem;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 3500);
}

function formatarNumero(num) {
  if (num === null || num === undefined) return '0';
  return Number(num).toLocaleString('pt-BR');
}

function truncarTexto(str, max) {
  if (!str) return '';
  return str.length > max ? str.substring(0, max) + '...' : str;
}
