# 🇧🇷 Inteligência Municipal, Tipologia Socioeconômica & Geografia Eleitoral (2010–2026)

[![Python 3.10+](https://img.shields.io/badge/python-3.10+-3776AB.svg?style=flat&logo=python&logoColor=white)](https://www.python.org/)
[![Jupyter Notebooks](https://img.shields.io/badge/Jupyter-Notebooks-F37626.svg?style=flat&logo=jupyter&logoColor=white)](https://jupyter.org/)
[![Pandas](https://img.shields.io/badge/Pandas-2.0+-150458.svg?style=flat&logo=pandas&logoColor=white)](https://pandas.pydata.org/)
[![Scikit-Learn](https://img.shields.io/badge/Scikit--Learn-K--Means%20%7C%20StandardScaler-F7931E.svg?style=flat)](https://scikit-learn.org/)
[![Abrangência: 5.571 Municípios](https://img.shields.io/badge/Abrangência-5.571%20Municípios-009739.svg?style=flat)](https://www.ibge.gov.br/)

> Plataforma integrada de ciência de dados e machine learning conectando políticas públicas (Saúde, Educação, Previdência, Trabalho e Renda) à vida real dos **5.571 municípios brasileiros**, tipologia socioeconômica por agrupamento não-supervisionado e comportamento eleitoral em eleições presidenciais (**2010 a 2026**).

---

## 🧭 Sumário do Repositório

- [🎯 Arquitetura dos Cadernos Analíticos](#-arquitetura-dos-cadernos-analíticos)
- [🏛️ Metodologia dos Perfis Socioeconômicos](#️-metodologia-dos-perfis-socioeconômicos)
- [🗳️ Resultados Eleitorais de 2026 por Perfil](#️-resultados-eleitorais-de-2026-por-perfil)
- [🗺️ Mapeamento Geoespacial do Brasil](#️-mapeamento-geoespacial-do-brasil)
- [📉 Série Histórica da Abstenção (2010 a 2026)](#-série-histórica-da-abstenção-2010-a-2026)
- [📁 Estrutura de Arquivos e Bases de Dados](#-estrutura-de-arquivos-e-bases-de-dados)
- [📚 Documentação Técnica Completa](#-documentação-técnica-completa)
- [🚀 Como Executar Localmente](#-como-executar-localmente)

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

Para aprofundar na fundamentação matemática e no significado de cada métrica:
* 👉 **[Arquitetura de Dados e Metodologia Científica](docs/ARQUITETURA_E_METODOLOGIA.md):** Pipelines, diagramas Mermaid, formulações de normalização Z-score e projeção euclidiana.
* 👉 **[Dicionário de Dados](docs/DICIONARIO_DE_DADOS.md):** Descrição campo a campo de todas as variáveis e fontes primárias.
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
```
