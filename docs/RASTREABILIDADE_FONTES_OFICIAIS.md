# 🏛️ Rastreabilidade, Proveniência e Auditoria das Fontes Oficiais

Este documento detalha a metodologia de extração, as fontes primárias federais e a rastreabilidade direta de todos os indicadores socioeconômicos consolidados no projeto **Tradução por Municípios** e no **Dashboard de Inteligência Municipal**.

---

## 🎯 Arquitetura de Dados: Como os dados são extraídos

O projeto adota uma arquitetura em **três camadas complementares**, eliminando dados "hardcoded" soltos no código:

1. **APIs Governamentais em Tempo Real (REST / JSON / OData):**
   * Séries macroeconômicas consumidas diretamente de servidores oficiais da autoridade monetária (Banco Central do Brasil) e do Tesouro Nacional.
2. **Downloads Automatizados de Bases Abertas:**
   * Planilhas e relatórios oficiais baixados programaticamente dos servidores das entidades emissoras (Tesouro Transparente CKAN, FIPE).
3. **Bases Estruturadas com Metadados e Auditabilidade:**
   * Para bases com dados massivos ou relatórios consolidados em PDF/Painéis (Receita Federal, Mapa de Empresas/MDIC, AgroStat/MAPA, ANP e FENAUTO), os dados foram estruturados em arquivos auditáveis na pasta [`dados_prioridades/fontes_oficiais/`](../dados_prioridades/fontes_oficiais/) contendo ano, valores, órgão emissor, URL de origem, periodicidade e nota metodológica.

---

## 📊 Matriz de Rastreabilidade por Indicador

### 1. Macroeconomia, Consumo e Poder de Compra (API Banco Central / SGS)
| Indicador | Código SGS | Órgão / Sistema Primário | URL da API Oficial | Tipo de Ingestão |
| :--- | :---: | :--- | :--- | :---: |
| **Veículos Novos Zero KM** | `1374` | ANFAVEA / Banco Central | [API BCB SGS 1374](https://api.bcb.gov.br/dados/serie/bcdata.sgs.1374/dados?formato=json) | API Dinâmica |
| **Imóveis SBPE (Unidades)** | `20703` | ABECIP / Banco Central | [API BCB SGS 20703](https://api.bcb.gov.br/dados/serie/bcdata.sgs.20703/dados?formato=json) | API Dinâmica |
| **Imóveis SBPE (R$ Financiado)**| `20704` | ABECIP / Banco Central | [API BCB SGS 20704](https://api.bcb.gov.br/dados/serie/bcdata.sgs.20704/dados?formato=json) | API Dinâmica |
| **Varejo Ampliado (Faturamento)**| `28544` | IBGE (PMC) / Banco Central | [API BCB SGS 28544](https://api.bcb.gov.br/dados/serie/bcdata.sgs.28544/dados?formato=json) | API Dinâmica |
| **Gastos no Exterior (Turismo)** | `22742` | Banco Central (Balanço de Pagamentos) | [API BCB SGS 22742](https://api.bcb.gov.br/dados/serie/bcdata.sgs.22742/dados?formato=json) | API Dinâmica |
| **Produção Industrial (PIM-PF)** | `21859` | IBGE (PIM) / Banco Central | [API BCB SGS 21859](https://api.bcb.gov.br/dados/serie/bcdata.sgs.21859/dados?formato=json) | API Dinâmica |
| **Pessoas Ocupadas Total** | `24379` | IBGE (PNAD Contínua) / Banco Central | [API BCB SGS 24379](https://api.bcb.gov.br/dados/serie/bcdata.sgs.24379/dados?formato=json) | API Dinâmica |
| **Recuperações Judiciais** | `4392` | Serasa / Banco Central | [API BCB SGS 4392](https://api.bcb.gov.br/dados/serie/bcdata.sgs.4392/dados?formato=json) | API Dinâmica |
| **Salário Mínimo Nominal** | `1619` | Ministério do Trabalho / BCB | [API BCB SGS 1619](https://api.bcb.gov.br/dados/serie/bcdata.sgs.1619/dados?formato=json) | API Dinâmica |
| **Rendimento Médio do Trabalho**| `24381` | IBGE (PNAD) / Banco Central | [API BCB SGS 24381](https://api.bcb.gov.br/dados/serie/bcdata.sgs.24381/dados?formato=json) | API Dinâmica |
| **Cesta Básica Nacional (SP)** | `7493` | DIEESE / Banco Central | [API BCB SGS 7493](https://api.bcb.gov.br/dados/serie/bcdata.sgs.7493/dados?formato=json) | API Dinâmica |
| **Inflação Oficial (IPCA)** | `433` | IBGE / Banco Central | [API BCB SGS 433](https://api.bcb.gov.br/dados/serie/bcdata.sgs.433/dados?formato=json) | API Dinâmica |

---

### 2. Orçamento Público Federal por Mandato (2010 a 2026)
* **Extrator:** [`extratores/extrator_orcamento_governos.py`](../extratores/extrator_orcamento_governos.py)
* **Base Primária:** **RTN (Resultado do Tesouro Nacional)** publicado pela Secretaria do Tesouro Nacional.
* **URL Oficial de Download:** [Tesouro Transparente - Série Histórica do RTN](https://www.tesourotransparente.gov.br/ckan/dataset/ab56485b-9c40-4efb-8563-9ce3e1973c4b)
* **Critério de Deflacionamento:** Converte gastos nominais para preços constantes de 2026 acumulando a série oficial do IPCA (SGS 433).

---

### 3. Dinâmica Empresarial, Microempresas e Microempreendedores Individuais (MEIs)
* **Extrator:** [`extratores/extrator_empresas.py`](../extratores/extrator_empresas.py)
* **Bases Auditáveis:**
  1. [`dados_prioridades/fontes_oficiais/serie_mapa_empresas_meis_oficial.csv`](../dados_prioridades/fontes_oficiais/serie_mapa_empresas_meis_oficial.csv) (série histórica nacional)
  2. [`consolidado ME.xlsx`](../consolidado%20ME.xlsx) (matriz municipalizada de Microempresas ativas totais e comércio em 2026)
  3. [`comercio.xlsx`](../comercio.xlsx) e [`dados_prioridades/fontes_oficiais/atividades_comercio_cnae_oficial.xlsx`](../dados_prioridades/fontes_oficiais/atividades_comercio_cnae_oficial.xlsx) (79 subclasses CNAE selecionadas que delimitam o setor de comércio)
  4. [`MEI.xlsx`](../MEI.xlsx) e [`dados_prioridades/fontes_oficiais/serie_mei_municipios_oficial.xlsx`](../dados_prioridades/fontes_oficiais/serie_mei_municipios_oficial.xlsx) (matriz municipalizada de optantes pelo MEI no Simples Nacional)
* **Órgãos Primários e Portais Oficiais:**
  1. **MDIC / MEMP / REDESIM:** [Painel Interativo do Mapa de Empresas](https://www.gov.br/empresas-e-negocios/pt-br/mapa-de-empresas/painel-mapa-de-empresas)
  2. **Receita Federal do Brasil:** Estatísticas do Simples Nacional / Portal do Empreendedor (dados de CNPJs ativos enquadrados no SIMEI).
* **Camada Municipal (5.571 municípios):**
  - **Microempresas Ativas Totais (2026):** 22.299.554 estabelecimentos ativos apurados diretamente no Painel do Mapa de Empresas.
  - **Microempresas Ativas no Comércio (2026):** 4.749.778 estabelecimentos ativos no comércio varejista, atacadista e representações comerciais (delimitadas por 79 subclasses CNAE).
  - **MEIs Ativos:** Levantamento municipalizado do total de optantes pelo MEI apurado na Receita Federal / Simples Nacional e consolidado em [`dados_prioridades/cruzamento_perfil_x_eleicao_completo.csv`](../dados_prioridades/cruzamento_perfil_x_eleicao_completo.csv) (totalizando 17.216.626 MEIs no Brasil).

---

### 4. Saldo Comercial Líquido do Agronegócio (US$ Bi)
* **Extrator:** [`extratores/extrator_agro.py`](../extratores/extrator_agro.py)
* **Base Auditável:** [`dados_prioridades/fontes_oficiais/serie_agrostat_exportacoes_oficial.csv`](../dados_prioridades/fontes_oficiais/serie_agrostat_exportacoes_oficial.csv)
* **Órgão Primário:** Ministério da Agricultura e Pecuária (MAPA) e Secretaria de Comércio Exterior (SECEX / MDIC).
* **Portal Oficial:** [AgroStat Brasil](https://indicadores.agricultura.gov.br/agrostat/index.htm) e [Comex Stat](http://comexstat.mdic.gov.br/)
* **Metodologia:** $\text{Saldo Comercial} = \text{Exportações do Agronegócio} - \text{Importações do Agronegócio}$.

---

### 5. Preços Médios de Combustíveis (Gasolina Comum e GLP 13kg)
* **Extrator:** [`extratores/extrator_anp.py`](../extratores/extrator_anp.py)
* **Base Auditável:** [`dados_prioridades/fontes_oficiais/serie_anp_combustiveis_oficial.csv`](../dados_prioridades/fontes_oficiais/serie_anp_combustiveis_oficial.csv)
* **Órgão Primário:** Agência Nacional do Petróleo, Gás Natural e Biocombustíveis (ANP).
* **Sistema Oficial:** Levantamento de Preços de Combustíveis (LPC) / Portal de Dados Abertos da ANP.
* **Portal Oficial:** [Dados Abertos ANP](https://www.gov.br/anp/pt-br/centrais-de-conteudo/dados-abertos)
* **Metodologia:** Média anual ponderada nacional das coletas semanais realizadas nos postos de combustíveis de todo o país.

---

### 6. Veículos Usados e Seminovos (Transferências)
* **Extrator:** [`extratores/extrator_veiculos_usados.py`](../extratores/extrator_veiculos_usados.py)
* **Base Auditável:** [`dados_prioridades/fontes_oficiais/serie_veiculos_usados_renavam_oficial.csv`](../dados_prioridades/fontes_oficiais/serie_veiculos_usados_renavam_oficial.csv)
* **Órgãos Primários:** Federação Nacional das Associações dos Revendedores de Veículos Automotores (FENAUTO) e Secretaria Nacional de Trânsito (SENATRAN / Renavam).
* **Portal Oficial:** [FENAUTO Relatórios Nacionais](https://www.fenauto.org.br/)

---

### 7. Aluguel Residencial Médio (Índice FipeZAP)
* **Extrator:** [`extratores/extrator_fipezap.py`](../extratores/extrator_fipezap.py)
* **Órgão Primário:** Fundação Instituto de Pesquisas Econômicas (FIPE) e Portal ZAP.
* **Download Oficial:** Baixado diretamente do servidor oficial da FIPE (`https://downloads.fipe.org.br/indices/fipezap/fipezap-serieshistoricas.xlsx`).
* **Metodologia:** Valor médio de locação por $m^2$ aplicado a um imóvel residencial padrão de 60 $m^2$.

---

### 8. Previdência Social, Valor Médio por Município e Impacto da Desvinculação do Salário Mínimo
* **Módulo Parametrizado:** [`calculo_impacto_previdencia.py`](../calculo_impacto_previdencia.py)
* **Bases Auditáveis:**
  1. [`ben_municipios_especie_2025.xlsx`](../ben_municipios_especie_2025.xlsx) e [`dados_prioridades/fontes_oficiais/ben_municipios_especie_2025_oficial.xlsx`](../dados_prioridades/fontes_oficiais/ben_municipios_especie_2025_oficial.xlsx) (aba `Valor_Médio_R$_dez24`, coluna `Total de Aposentadorias`).
  2. [`dados_prioridades/previdencia_municipios_2025.xlsx`](../dados_prioridades/previdencia_municipios_2025.xlsx)
* **Órgão Primário:** Ministério da Previdência Social (MPS / INSS / CGEET/DRGPS/SRGPS).
* **Parâmetros Oficiais de Referência:**
  - Salário Mínimo de Referência: **R$ 1.518,00**
  - Política de Reajuste da Previdência: Taxa anual de **7,22%** (soma da mediana da inflação IPCA de 10 anos = 4,57% com a mediana do PIB positivo de 10 anos = 2,65%).
  - Teto de Isenção do IRPF: Proposta de **R$ 5.000,00**.
* **Segmentação Estratégica Nacional (5.571 municípios):**
  - **Grupo 1 (Média $\le$ R$ 1.518,00):** 2.774 municípios (49,8% do país).
    * *Argumento central:* Congelamento do Salário Mínimo (fim do ganho real acima da inflação) somado ao risco do fim do remédio gratuito na Farmácia Popular.
  - **Grupo 2 (Média > R$ 1.518,00):** 2.797 municípios (50,2% do país).
    * *Argumento central:* Desindexação dos benefícios previdenciários + revogação da isenção do Imposto de Renda até R$ 5 mil somada ao fim do remédio gratuito na Farmácia Popular.
* **Métrica Econômica por Comércio Local:**
  - O impacto financeiro anual é dividido pelo total de microempresas ativas de comércio no município (`total_microempresas_comercio_ativas`, extraído do Mapa de Empresas/MDIC), mensurando diretamente quanto cada comércio de bairro deixa de faturar anualmente devido à retração do poder de compra dos aposentados.

---

### 9. Emprego Formal CLT (Novo CAGED - MTE)
* **Bases Auditáveis:**
  1. [`3-tabelas_Agosto de 2026 (1).xlsx`](../3-tabelas_Agosto%20de%202026%20(1).xlsx) e [`dados_prioridades/fontes_oficiais/3-tabelas_Agosto_2026_oficial.xlsx`](../dados_prioridades/fontes_oficiais/3-tabelas_Agosto_2026_oficial.xlsx)
  2. **Tabela 8.1 (série com ajustes):** Estoque de empregos formais ativos nos **5.571 municípios em Agosto de 2026** (coluna 398).
  3. **Tabela 5.1 (série com ajustes):** Evolução nacional de estoques em **Dezembro de cada ano** (2020 a 2025) e **Agosto de 2026**.
* **Órgão Primário:** Ministério do Trabalho e Emprego (MTE / Subsecretaria de Estatísticas e Estudos do Trabalho / CGEET).
* **Consolidação dos Dados:**
  - **Dezembro/2020:** 37.907.718 vínculos (37,91 Milhões)
  - **Dezembro/2021:** 40.690.220 vínculos (40,69 Milhões)
  - **Dezembro/2022:** 42.705.233 vínculos (42,71 Milhões)
  - **Dezembro/2023:** 44.161.013 vínculos (44,16 Milhões)
  - **Dezembro/2024:** 45.840.107 vínculos (45,84 Milhões)
  - **Dezembro/2025:** 47.110.663 vínculos (47,11 Milhões)
  - **Agosto/2026:** 48.244.696 vínculos (48,24 Milhões — sendo 48.238.982 municipalizados nos 5.571 municípios)


