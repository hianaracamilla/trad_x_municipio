# 🏛️ Arquitetura de Dados e Metodologia Científica do Projeto
## Plataforma de Inteligência Municipal, Tipologia Socioeconômica e Comportamento Eleitoral (2010–2026)

---

## 📌 1. Visão Geral do Sistema

O projeto **trad_x_municipio** é uma infraestrutura de inteligência de dados públicos que integra dados municipais transversais dos **5.571 municípios brasileiros**. O objetivo é transformar estatísticas de políticas públicas em inteligência analítica, conectando a estrutura socioeconômica local (mercado formal, funcionalismo, previdência social e transferências de renda) à geografia do voto e do comparecimento eleitoral em eleições presidenciais (2010 a 2026).

```mermaid
flowchart TD
    subgraph S1 [1. Ingestão de Dados Primários]
        A1[MTE / Novo CAGED & MEI] --> D[traducao_municipios_consolidado.xlsx]
        A2[INSS / Previdência Social RGPS] --> D
        A3[MDS / Bolsa Família & BPC] --> D
        A4[MEC / FNDE Fundeb & Pé-de-Meia] --> D
        A5[DataSUS / Farmácia Popular] --> D
        A6[IBGE MUNIC 2023 & SIAPE] --> D
    end

    subgraph S2 [2. Engenharia de Features e Normalização]
        D --> F1[10 Indicadores de Intensidade Per Capita / por 100 hab]
        F1 --> F2[Isolamento das 53 Grandes Metrópoles e Capitais]
        F2 --> F3[Padronização Z-Score StandardScaler N = 5.518]
    end

    subgraph S3 [3. Pipeline de Machine Learning e Agrupamento]
        F3 --> M1[Diagnóstico K Ideal: Cotovelo WCSS & Silhueta K=2..10]
        M1 --> M2[Simulação de Estabilidade 30 Rodadas K=6]
        M2 --> M3[Centróides Estabilizados e 6 Perfis do Interior]
        M3 --> M4[Projeção Euclidiana das 53 Metrópoles Limiar P95 = 3.02]
        M4 --> M5[Base Nacional Consolidada: 5.571 Cidades Classificadas]
    end

    subgraph S4 [4. Inteligência Eleitoral e Séries Temporais]
        M5 --> E1[TSE: Votação Presidencial 1º Turno 2026 Lula x Flávio Bolsonaro]
        M5 --> E2[TSE: Séries Históricas de Abstenção 2010 a 2026]
        M5 --> E3[TSE: Abstenção por Idade Jovens, Adultos, Idosos]
        E1 & E2 & E3 --> E4[Mapeamento Geoespacial IBGE e Relatórios Executivos]
    end
```

---

## 📂 2. Estrutura de Diretórios e Arquivos

```text
trad_x_municipio/
├── analise_clusters_perfis_municipios.ipynb   # Caderno de machine learning e clusterização socioeconômica
├── analise_eleitoral_perfis_municipios.ipynb  # Caderno de análise eleitoral e abstenções (2010–2026)
├── analise_cruzamentos_municipios.ipynb       # Caderno transversal socioeconômico (políticas públicas no PIB)
├── series_historicas_brasil_2010_2025.ipynb   # Caderno de séries históricas de poder de compra e economia
├── build_clusters_nb.py                       # Script de compilação reproduzível do caderno de clusters
├── build_eleitoral_nb.py                      # Script de compilação reproduzível do caderno eleitoral
├── build_series_nb.py                         # Script de compilação reproduzível do caderno de séries históricas
├── traducao_municipios_consolidado.xlsx       # Matriz mestre municipal auditada (5.571 municípios, 72 variáveis)
│
├── dados_prioridades/                         # Repositório de dados processados e saídas analíticas
│   ├── classificacao_perfis_municipios_completa.xlsx  # Classificação final dos 5.571 municípios
│   ├── classificacao_perfis_municipios_completa.csv
│   ├── cruzamento_perfil_x_eleicao_completo.xlsx      # Base com votação 2026, histórico e abstenção
│   ├── cruzamento_perfil_x_eleicao_completo.csv
│   ├── metropoles_brasileiras.xlsx            # Planilha dedicada das 53 metrópoles e capitais
│   ├── metropoles_brasileiras.csv
│   ├── clusters_com_e_sem_porte_municipios.csv# Matriz com indicadores per capita e clusters K=6
│   ├── mapa_brasil_perfis_municipios.png      # Mapa geográfico do Brasil (300 DPI)
│   ├── brasil_estados.json                    # Malha territorial oficial das 27 UFs (IBGE)
│   ├── municipios_coordenadas.csv             # Latitude e longitude das 5.571 sedes municipais
│   │
│   ├── eleicoes_tse/                          # Repositório de dados eleitorais do TSE
│   │   ├── votacao_presidencial_municipios_2026.csv   # Votação 1º Turno 2026 por município (Lula x Flávio)
│   │   ├── votacao_candidato_munzona_2026_BR.csv      # Base nominal de votos presidenciais 2026
│   │   ├── detalhe_votacao_munzona_2026_BR.csv        # Apuração, comparecimento e abstenção 2026
│   │   ├── votacao_presidencial_municipios_2022.csv   # Votação 1º e 2º Turnos 2022 por município
│   │   ├── serie_historica_presidencial_2010_2022.csv # Série histórica painel largo de 4 eleições
│   │   └── abstencao_idade_municipios_2022.csv        # Abstenção por faixas etárias
│   │
│   ├── trabalho_renda/                        # Fontes de servidores, CLT e MEI
│   │   ├── Base_MUNIC_2023.xlsx               # IBGE Pesquisa de Informações Básicas Municipais
│   │   └── empresas_emprego_servidores.csv    # Servidores municipais, federais (SIAPE) e CLT
│   │
│   └── previdencia/                           # Dados previdenciários e PIB
│       └── peso_aposentadorias_pib_municipal_2023.csv
│
├── docs/                                      # Documentação técnica e metodológica
│   ├── ARQUITETURA_E_METODOLOGIA.md           # Este documento
│   ├── DICIONARIO_DE_DADOS.md                 # Dicionário de todas as colunas e métricas
│   └── PRINCIPAIS_ACHADOS.md                  # Resumo executivo dos insights socioeconômicos
│
└── README.md                                  # Portal de entrada do repositório
```

---

## 🔬 3. Metodologia de Clusterização e Machine Learning

### 3.1. Variáveis de Intensidade Socioeconômica (Sem Efeito de Escala Populacional)
Para evitar que cidades grandes e pequenas fossem separadas apenas pelo número absoluto de habitantes, o modelo utiliza **10 indicadores de intensidade relativa por 100 habitantes e percentuais**:

| Variável | Descrição Metodológica | Fonte Primária |
| :--- | :--- | :--- |
| `taxa_clt_100_hab` | Trabalhadores com carteira assinada por 100 habitantes | MTE / Novo CAGED |
| `taxa_mei_100_hab` | Microempreendedores Individuais ativos por 100 habitantes | Receita Federal / DGI |
| `servidores_100_hab` | Servidores públicos totais (municipais diretos/indiretos + federais SIAPE) por 100 hab | IBGE MUNIC 2023 + SIAPE |
| `aposentados_100_hab` | Benefícios de aposentadoria emitidos no RGPS por 100 habitantes | Previdência Social / DATAPREV |
| `peso_prev_pib_pct` | Valor anual das aposentadorias como proporção do PIB Municipal (%) | DATAPREV + IBGE Contas Regionais |
| `familias_bf_100_hab` | Famílias beneficiárias do Programa Bolsa Família por 100 habitantes | MDS / SAGICAD |
| `bpc_100_hab` | Beneficiários do BPC/LOAS (Idoso + PCD) por 100 habitantes | MDS / SAGICAD |
| `pe_de_meia_cobertura_pct` | Alunos do ensino médio público atendidos pelo Pé-de-Meia (%) | MEC / FNDE |
| `dep_fundeb_uniao_pct` | Dependência da rede municipal em relação à complementação federal do Fundeb (%) | MEC / FNDE |
| `farmacia_pop_100_hab` | Retiradas de medicamentos gratuitos no Programa Farmácia Popular por 100 hab | Ministério da Saúde / DataSUS |

### 3.2. Padronização $Z$-Score
Todas as 10 variáveis contínuas são padronizadas com média zero e variância unitária via `StandardScaler`:
$$Z_{ij} = \frac{X_{ij} - \mu_j}{\sigma_j}$$
Isso impede que grandezas em escalas distintas (ex: percentual de 0 a 100 vs servidores por 100 hab de 0 a 15) dominem artificialmente o cálculo das distâncias euclidianas.

### 3.3. Isolamento Estratégico das Metrópoles
Municípios com população $\ge 500.000$ habitantes ou capitais estaduais (53 cidades) possuem variância extrema e economias de aglomeração singulares. Se incluídas no treinamento inicial, a atração gravitacional de São Paulo e Rio de Janeiro distorcia a formação dos centróides das cidades médias e pequenas.
* **Solução:** O K-Means foi calibrado sobre os **5.518 municípios do interior** e, posteriormente, as 53 metrópoles foram projetadas no espaço dos clusters.

### 3.4. Diagnóstico de $K$ Ideal e Simulação de 30 Execuções
1. **Método do Cotovelo (WCSS / Inércia):** Identificou desaceleração do ganho explicativo marginal a partir de $K=6$.
2. **Coeficiente de Silhueta:** Apontou $K=6$ como o ponto de equilíbrio ótimo entre granularidade analítica e coesão dos grupos (Silhouette Score $= 0,171$ no Cenário sem Porte).
3. **Simulação de 30 Rodadas (Estabilidade):** O K-Means foi executado 30 vezes com sementes aleatórias distintas ($seed \in [1, 30]$). Os centróides de cada rodada foram alinhados pelo vizinho mais próximo via `cdist`, obtendo centróides estáveis e robustos contra variações de inicialização.

### 3.5. Projeção e Reclassificação das Metrópoles
As 53 metrópoles foram transformadas na mesma escala dos centróides e sua distância euclidiana multivariada foi calculada:
$$D(M_i, C_k) = \sqrt{\sum_{j=1}^{10} (Z_{M_{ij}} - Z_{C_{kj}})^2}$$
* **Limiar de Aderência (Percentil 95 das cidades do interior = 3,02):**
  * Se $D_{min} \le 3,02$: A metrópole se comporta como o cluster e é **reclassificada**.
  * Se $D_{min} > 3,02$: A metrópole é um outlier estatístico e **permanece como Metrópole Atípica**.
* **Resultado:** 48 das 53 metrópoles foram integradas aos perfis de serviços, mercado autônomo ou apoio social, enquanto apenas 5 cidades atípicas (Duque de Caxias, Boa Vista, Natal, Nova Iguaçu e Aracaju) permaneceram isoladas.

---

## 🗳️ 4. Integração Eleitoral (TSE 2010 a 2026)

### 4.1. Fontes Primárias do TSE
Os dados eleitorais foram obtidos via API de Dados Abertos e CDN do Tribunal Superior Eleitoral:
1. **Eleições 2026 (1º Turno):** Extração de `votacao_candidato_munzona_2026_BR.csv` e `detalhe_votacao_munzona_2026_BR.csv`.
2. **Eleições 2022 (1º e 2º Turnos):** Votação de Lula, Bolsonaro, Tebet, Ciro e apuração municipal.
3. **Série Histórica (2010, 2014, 2018 e 2022):** Votação presidencial nominal e abstenções apuradas no 2º turno.
4. **Abstenção por Faixa Etária:** Cruzamento do perfil do eleitorado (jovens 16-24, adultos 25-59 e idosos 60+).

### 4.2. Mapeamento de Códigos Territoriais
O TSE utiliza um código próprio de município de 5 dígitos (`CD_MUNICIPIO` / `cod_tse`), enquanto o IBGE utiliza o código padrão de 7 dígitos (`cod_ibge7`). O projeto mantém uma tabela de compatibilização estrita (5.571 municípios) garantindo integridade de 100% no cruzamento socioeconômico-eleitoral.

---

## 🚀 5. Como Reproduzir os Resultados Localmente

### Pré-requisitos
* Python 3.10 ou superior
* Pacotes: `pandas`, `numpy`, `scikit-learn`, `scipy`, `matplotlib`, `seaborn`, `openpyxl`, `nbformat`, `nbconvert`

```bash
# 1. Clonar o repositório
git clone https://github.com/hianaracamilla/trad_x_municipio.git
cd trad_x_municipio

# 2. Ativar o ambiente virtual
source .venv/bin/activate

# 3. Compilar e executar o caderno de Clusters
python build_clusters_nb.py
jupyter nbconvert --to notebook --execute --inplace analise_clusters_perfis_municipios.ipynb

# 4. Compilar e executar o caderno Eleitoral
python build_eleitoral_nb.py
jupyter nbconvert --to notebook --execute --inplace analise_eleitoral_perfis_municipios.ipynb
```
