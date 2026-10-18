# 🇧🇷 Inteligência Municipal, Tipologia Socioeconômica & Geografia Eleitoral (2010–2026)

[![Python 3.10+](https://img.shields.io/badge/python-3.10+-3776AB.svg?style=flat&logo=python&logoColor=white)](https://www.python.org/)
[![Jupyter Notebooks](https://img.shields.io/badge/Jupyter-Notebooks-F37626.svg?style=flat&logo=jupyter&logoColor=white)](https://jupyter.org/)
[![Pandas](https://img.shields.io/badge/Pandas-2.0+-150458.svg?style=flat&logo=pandas&logoColor=white)](https://pandas.pydata.org/)
[![Scikit-Learn](https://img.shields.io/badge/Scikit--Learn-K--Means%20%7C%20StandardScaler-F7931E.svg?style=flat)](https://scikit-learn.org/)
[![Abrangência: 5.571 Municípios](https://img.shields.io/badge/Abrangência-5.571%20Municípios-009739.svg?style=flat)](https://www.ibge.gov.br/)

> Plataforma integrada de ciência de dados e machine learning conectando políticas públicas (Saúde, Educação, Previdência, Trabalho e Renda) à vida real dos **5.571 municípios brasileiros**, tipologia socioeconômica por agrupamento não-supervisionado e comportamento eleitoral em eleições presidenciais (**2010 a 2026**).

---

## 🧭 Sumário do Repositório

- [🖥️ Dashboard Web Interativo (Aplicação Completa)](#️-dashboard-web-interativo-aplicação-completa)
- [🎯 Arquitetura dos Cadernos Analíticos](#-arquitetura-dos-cadernos-analíticos)
- [🏛️ Metodologia dos Perfis Socioeconômicos](#️-metodologia-dos-perfis-socioeconômicos)
- [🗳️ Resultados Eleitorais de 2026 por Perfil](#️-resultados-eleitorais-de-2026-por-perfil)
- [🗺️ Mapeamento Geoespacial do Brasil](#️-mapeamento-geoespacial-do-brasil)
- [📉 Série Histórica da Abstenção (2010 a 2026)](#-série-histórica-da-abstenção-2010-a-2026)
- [📁 Estrutura de Arquivos e Bases de Dados](#-estrutura-de-arquivos-e-bases-de-dados)
- [📚 Documentação Técnica Completa](#-documentação-técnica-completa)
- [🚀 Como Executar Localmente](#-como-executar-localmente)

---

## 🖥️ Dashboard Web Interativo (Aplicação Completa)

A pasta [`dashboard/`](dashboard/) abriga a aplicação web executiva completa de visualização e exploração dos dados:

* 🗺️ **Mapa Territorial Interativo (Leaflet + Esri Canvas):** Navegação fluida e transições de câmera suaves em 3 níveis: **Brasil ➔ 5 Regiões ➔ 27 Estados ➔ 5.571 Municípios** com polígonos GeoJSON coloridos por perfil, marcadores municipais e tooltips instantâneos (livre de chaves de API e marcas d'água).
* 📍 **Sinalizador de Filtro Territorial no Cabeçalho:** O cabeçalho superior (`top-nav`) mantém permanentemente visível a localidade selecionada via chip interativo com botão `✕` para desfazer o filtro e restaurar a visão nacional.
* 🏷️ **Sinalização de Escopo em Todos os Gráficos:** Cada visualização é rotulada com selos explícitos de abrangência (`[Visão Nacional]`, `[Visão Estadual / Regional]` ou `[Visão Municipal]`), eliminando ambiguidades estatísticas.
* 📊 **Rótulos Diretos de Dados:** Gráficos de barras e séries temporais contam com data labels visíveis diretamente nos elementos gráficos, sem depender do hover do mouse.
* 🏛️ **Resumo das 5 Grandes Prioridades Nacionais:** Cards dinâmicos e modais aprofundados para:
  - 💊 **Farmácia Popular & Saúde:** Atendimento e gratuidade de medicamentos para diabetes, hipertensão e asma;
  - 🎓 **Educação Básica & Pé-de-Meia:** Investimento do Pé-de-Meia e complementação federal do Fundeb (VAAT);
  - 💼 **Mercado de Trabalho CLT & Suporte ao MEI:** Vagas com carteira assinada, suporte a microempreendedores e evolução histórica (2016–2026);
  - 👴 **Previdência & Seguridade Social:** Injeção direta de benefícios RGPS na economia municipal;
  - 🌾 **Agricultura Familiar & Merenda Escolar:** Repasse do PNAE (mínimo legal de 30% local) para produtores da agricultura familiar.
* ⚡ **Raio-X Municipal Estratégico com Benchmark da Mediana:** 8 eixos temáticos estruturados segundo a Teoria da Gestalt, com chips de posicionamento relativo (`▲ Acima` ou `▼ Abaixo` da mediana do Brasil) e barras de dispersão contínua (Range Bullet Track).
* 🗳️ **Seletor de Pleito Eleitoral:** Alternância em 1 clique entre **2026 (1º Turno)**, **2022 (1º Turno)** e **2022 (2º Turno)**, com recálculo instantâneo de todos os gráficos e cards.
* 🔎 **Busca Preditiva de Municípios:** Autocomplete em milissegundos para localizar qualquer cidade e exibir seu raio-x completo (Saúde, Educação, RGPS, Emprego e Votação).
* 📈 **Séries Históricas & Poder de Compra (2016–2026):** Gráficos analíticos de Cesta Básica (DIEESE), Botijão de Gás e Gasolina (ANP) em relação ao Salário Mínimo, Emprego CLT, MEIs, Veículos e Habitação.
* 🎨 **Estúdio de Cards Sociais (Card Studio):** Gerador client-side de cards em alta resolução (**Retina 2x**) nos formatos **Feed (1:1)** e **Stories (9:16)**, com botão de **Copiar Imagem (Ctrl+V)** e compartilhamento direto para **WhatsApp, X/Twitter, Telegram, LinkedIn e Web Share API**.

👉 **Documentação Completa da Interface:** Consulte o manual em [docs/DASHBOARD_E_VISUALIZACOES.md](docs/DASHBOARD_E_VISUALIZACOES.md).

---

## 🎯 Arquitetura dos Cadernos Analíticos

O ecossistema é organizado em cadernos modulares, cada um acompanhado por um script de compilação reproduzível (`build_*.py`):

| Caderno | Script de Build | Escopo e Objetivo Central | Base de Dados Principal |
| :--- | :--- | :--- | :--- |
| [`analise_clusters_perfis_municipios.ipynb`](analise_clusters_perfis_municipios.ipynb) | [`build_clusters_nb.py`](build_clusters_nb.py) | **Tipologia Socioeconômica (Machine Learning):** Diagnóstico de $K$ ideal (Cotovelo e Silhueta), simulação de 30 rodadas K-Means, isolamento e projeção euclidiana das 53 metrópoles. | `classificacao_perfis_municipios_completa.xlsx` |
| [`analise_eleitoral_perfis_municipios.ipynb`](analise_eleitoral_perfis_municipios.ipynb) | [`build_eleitoral_nb.py`](build_eleitoral_nb.py) | **Inteligência Eleitoral (2010–2026):** Votação no 1º Turno de 2026 (Lula x Flávio Bolsonaro), peso nos votos válidos do país, série histórica de abstenção (5 eleições) e mapa do Brasil. | `cruzamento_perfil_x_eleicao_completo.xlsx` |
| [`analise_cruzamentos_municipios.ipynb`](analise_cruzamentos_municipios.ipynb) | `gerar_analise_municipios.py` | **Impacto das Políticas Públicas no PIB Municipal:** RGPS, Bolsa Família, BPC, Fundeb, Pé-de-Meia e Farmácia Popular nos 5.571 municípios. | `traducao_municipios_consolidado.xlsx` |
| [`series_historicas_brasil_2010_2025.ipynb`](series_historicas_brasil_2010_2025.ipynb) | [`build_series_nb.py`](build_series_nb.py) | **Macroeconomia e Poder de Compra das Famílias:** Séries mensais de 2010 a 2025 (Cesta Básica, Gás, Combustíveis, Aluguel, Automotivo e Habitação). | `series_historicas_brasil_2010_2025.xlsx` |

---

## 🏛️ Metodologia dos Perfis Socioeconômicos

Para agrupar os municípios de forma imparcial e sem viés de escala populacional:
1. **10 Indicadores de Intensidade Relativa:** Carteira assinada (CLT), MEI, servidores públicos totais (municipais e federais), aposentadorias do INSS, peso da previdência no PIB, Bolsa Família, BPC, cobertura do Pé-de-Meia, dependência do Fundeb da União e dispensação de remédios na Farmácia Popular — todos medidos **por 100 habitantes ou em percentual**.
2. **Isolamento Metropolitano:** As 53 grandes metrópoles e capitais foram separadas inicialmente para não distorcer a formação dos centróides das cidades pequenas e médias do interior.
3. **K-Means com 30 Rodadas:** Estabilização dos centróides via alinhamento euclidiano (`cdist`).
4. **Projeção e Reclassificação das Metrópoles:** As 53 metrópoles foram projetadas no espaço padronizado dos clusters. 48 delas tinham distância euclidiana $\le 3,02$ (dentro do percentil 95 das cidades brasileiras) e foram reclassificadas nos clusters correspondentes, enquanto apenas 5 cidades atípicas permaneceram isoladas.

### Os 7 Perfis Nacionais Consolidados (5.571 Municípios):
* **1. Jovens e Dependentes de Apoio Social (1.414 cidades | 25,4% do Brasil):** Alta cobertura de Bolsa Família e Pé-de-Meia, forte dependência do Fundeb da União, população jovem e menor densidade de carteira assinada. Inclui capitais como Salvador, Fortaleza, Recife, Belém e Manaus.
* **2. Polos Regionais de Emprego e Serviços (1.134 cidades | 20,4% do Brasil):** Cidades médias e centros metropolitanos com mercado formal robusto (CLT e MEI elevados), baixa dependência de auxílios e forte economia terciária. Inclui Belo Horizonte, Curitiba, Porto Alegre, Rio de Janeiro e Campinas.
* **3. Cidades Autônomas e Agroindustriais (957 cidades | 17,2% do Brasil):** O menor índice de Bolsa Família do país (4,2/100 hab), alto dinamismo formal e forte presença do agronegócio e indústria. Inclui São Paulo, Brasília, Florianópolis, Campo Grande e Uberlândia.
* **4. Municípios Dependentes de Seguridade e Repasses (766 cidades | 13,8% do Brasil):** Extrema dependência da seguridade pública: 17,6% de todo o PIB vem de aposentadorias (principalmente rurais), somado a alto Bolsa Família e máxima complementação do Fundeb.
* **5. Cidades da Terceira Idade e Aposentados (722 cidades | 13,0% do Brasil):** A maior proporção de idosos/aposentados do país (22,1/100 hab) e o maior consumo de medicamentos na Farmácia Popular (15,1/100 hab), combinados com baixo Bolsa Família e bom mercado formal.
* **6. Pequenos Municípios do Funcionalismo Público (573 cidades | 10,3% do Brasil):** Cidades de pequeno porte (média 5.300 hab) onde a presença da administração pública é máxima: **10,7 servidores por 100 habitantes** (1 em cada 10 moradores trabalha no setor público).
* **7. Grandes Metrópoles e Capitais Atípicas (5 cidades | 0,1% do Brasil):** Cidades com distorções estruturais severas que ultrapassaram a dispersão dos clusters (Duque de Caxias, Boa Vista, Natal, Nova Iguaçu e Aracaju).

---

## 💼 Metodologia de Cálculo: Emprego Formal CLT e Suporte ao MEI

Para assegurar consistência estatística e transparência nos dados do **Mercado de Trabalho**:
1. **Fontes Primárias Auditadas:**
   - **Emprego com Carteira Assinada (CLT):** Estoque formal acumulado do **Novo CAGED** e **RAIS** (Ministério do Trabalho e Emprego), vinculado aos códigos municipais do Censo IBGE.
   - **Microempreendedores Individuais (MEI):** Base da **Receita Federal / DGI** e **Portal do Empreendedor** (estoque de CNPJs ativos do SIMEI com localização na cidade).
2. **Indicadores de Intensidade Local (`ind.clt` e `ind.mei` por 100 hab):**
   - Calculados estritamente como percentual da população municipal:
     $$\text{CLT / 100 hab} = \left(\frac{\text{Vagas CLT Ativas no Município}}{\text{População IBGE}}\right) \times 100$$
     $$\text{MEI / 100 hab} = \left(\frac{\text{CNPJs MEI Ativos}}{\text{População IBGE}}\right) \times 100$$
3. **Reconciliação Exata (Card de Prioridades vs. Raio-X Municipal):**
   - **Visão Brasil (Sem Filtro):** Registra o volume nacional consolidado de **50,4 Milhões de empregos formais CLT** e **16,9 Milhões de MEIs**.
   - **Visão Filtrada (Município, Estado ou Região):** O volume é agregado pela soma real dos microdados locais ($\sum \text{Pop} \times \text{taxa\_clt} / 100$), assegurando que o número do Card Superior coincida perfeitamente (100% de precisão) com o indicador apresentado no Raio-X da cidade (ex: **Sobral (CE)** com taxa de 17,5% totaliza **37,9 Mil vagas formais CLT** em todas as telas).

---

## 🗳️ Resultados Eleitorais de 2026 por Perfil

Cruzamento oficial com os dados do **1º Turno das Eleições Presidenciais de 2026** (TSE):

| Perfil Socioeconômico Reclassificado | Qtd Cidades | % Votos Válidos BR | Lula (1ºT 2026) | Flávio Bolsonaro (1ºT 2026) | Caiado (1ºT 2026) | Zema (1ºT 2026) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Municípios Dependentes de Seguridade e Repasses** | 766 | 10,22% | **71,19%** | 24,66% | 0,88% | 0,05% |
| **Jovens e Dependentes de Apoio Social** | 1.414 | 25,46% | **63,80%** | 31,76% | 1,01% | 0,05% |
| **Pequenos Municípios do Funcionalismo** | 573 | 1,79% | 44,00% | **48,77%** | 3,23% | 0,24% |
| **Grandes Metrópoles e Capitais (Atípicas)** | 5 | 1,60% | 38,65% | **54,02%** | 1,72% | 0,15% |
| **Cidades Autônomas e Agroindustriais** | 957 | 24,66% | 35,99% | **56,36%** | 2,85% | 0,26% |
| **Polos Regionais de Emprego e Serviços** | 1.134 | **31,82%** | 35,59% | **56,79%** | 2,60% | 0,29% |
| **Cidades da Terceira Idade e Aposentados** | 722 | 4,45% | 34,53% | **58,31%** | 2,37% | 0,27% |
| **TOTAL BRASIL (118,9M Votos Válidos)** | **5.571** | **100,00%** | **45,16%** | **47,03%** | **2,19%** | **0,27%** |

---

## 🗺️ Mapeamento Geoespacial do Brasil

O mapeamento de todos os municípios brasileiros geolocalizados por perfil foi gerado em alta resolução editorial (300 DPI):

![Mapa do Brasil por Perfil](dados_prioridades/mapa_brasil_perfis_municipios.png)

---

## 📉 Série Histórica da Abstenção (2010 a 2026)

Evolução da taxa de abstenção (% de eleitores aptos que deixaram de comparecer às urnas) em cinco eleições presidenciais:

| Perfil Socioeconômico | 2010 | 2014 | 2018 | 2022 | 2026 (1ºT) | Trajetória (2010→2026) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Grandes Metrópoles e Capitais (Atípicas)** | 19,4% | 17,6% | 18,5% | 18,8% | **18,97%** | Estável |
| **Municípios Dependentes de Seguridade e Repasses** | **26,3%** | 25,9% | 23,3% | 21,9% | **19,43%** | **-6,9%** *(maior ganho de participação)* |
| **Jovens e Dependentes de Apoio Social** | **26,1%** | 24,9% | 23,4% | 22,5% | **19,45%** | **-6,6%** *(forte queda da abstenção)* |
| **Cidades da Terceira Idade e Aposentados** | 18,0% | 18,2% | 19,0% | 18,2% | **19,81%** | +1,8% *(baixo absenteísmo)* |
| **Polos Regionais de Emprego e Serviços** | 20,9% | 21,4% | 22,5% | 20,9% | **21,75%** | +0,8% |
| **Cidades Autônomas e Agroindustriais** | 21,2% | 21,8% | 22,3% | 20,9% | **21,77%** | +0,5% |
| **Pequenos Municípios do Funcionalismo** | 23,4% | 24,3% | 25,6% | 22,5% | **22,92%** | -0,5% |

---

## 📁 Estrutura de Arquivos e Bases de Dados

As bases processadas e consolidadas estão salvas no diretório [`dados_prioridades/`](dados_prioridades/):

* 📊 [`classificacao_perfis_municipios_completa.xlsx`](dados_prioridades/classificacao_perfis_municipios_completa.xlsx): Planilha mestra com todos os 5.571 municípios, indicadores per capita e a coluna `perfil_final_reclassificado`.
* 📊 [`cruzamento_perfil_x_eleicao_completo.xlsx`](dados_prioridades/cruzamento_perfil_x_eleicao_completo.xlsx): Planilha integrada contendo abas com o Peso Eleitoral 2026, Votação 1ºT 2026, Histórico de Abstenção 2010–2026 e Abstenção por Idade.
* 📄 [`metropoles_brasileiras.xlsx`](dados_prioridades/metropoles_brasileiras.xlsx): Planilha dedicada das 53 metrópoles com 5 abas detalhadas.
* 📄 [`votacao_presidencial_municipios_2026.csv`](dados_prioridades/eleicoes_tse/votacao_presidencial_municipios_2026.csv): Votação municipal completa do 1º Turno de 2026.

---

## 📚 Documentação Técnica Completa

Para aprofundar na fundamentação matemática, nos dados e na plataforma:
* 👉 **[Dashboard Web, Mapa e Visualizações Interativas](docs/DASHBOARD_E_VISUALIZACOES.md):** Manual completo de operação da aplicação web, navegação geoespacial Leaflet, séries históricas e motor de exportação de cards sociais.
* 👉 **[Arquitetura de Dados e Metodologia Científica](docs/ARQUITETURA_E_METODOLOGIA.md):** Pipelines, diagramas Mermaid, formulações de normalização Z-score e projeção euclidiana.
* 👉 **[Dicionário de Dados Oficial](docs/DICIONARIO_DE_DADOS.md):** Descrição campo a campo de todas as variáveis, fontes primárias e schema do JSON.
* 👉 **[Principais Achados Socioeconômicos](docs/PRINCIPAIS_ACHADOS.md):** Relatório detalhado dos impactos de renda e previdência na economia local.

---

## 🚀 Como Executar Localmente

```bash
# 1. Ativar o ambiente virtual
source .venv/bin/activate

# 2. Compilar e rodar os clusters
python build_clusters_nb.py
jupyter nbconvert --to notebook --execute --inplace analise_clusters_perfis_municipios.ipynb

# 3. Compilar e rodar a análise eleitoral
python build_eleitoral_nb.py
jupyter nbconvert --to notebook --execute --inplace analise_eleitoral_perfis_municipios.ipynb

# 4. Atualizar o payload de dados do Dashboard
python export_dashboard_data.py

# 5. Iniciar o Dashboard Web Interativo
python -m http.server 8080 --directory dashboard
# Abra no navegador: http://localhost:8080/index.html
```
