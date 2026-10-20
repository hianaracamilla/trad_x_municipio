# 📖 Dicionário de Dados Oficial

Este documento reúne a especificação detalhada de todas as variáveis, métricas, fontes e fórmulas utilizadas nas análises municipais e nas séries históricas dos governos.

---

## 📌 1. Base Consolidada de Municípios (`traducao_municipios_consolidado.xlsx`)
Abrangência: **5.571 municípios brasileiros**  
Chave Primária de Cruzamento: `cod_ibge7` (Código IBGE com 7 dígitos)

### 🏛️ Identificação e Demografia
| Coluna | Tipo | Unidade | Descrição | Fonte Primária | Período |
| :--- | :--- | :--- | :--- | :--- | :---: |
| `cod_ibge7` | Identificação | Código (7 dígitos) | Chave oficial do município pelo IBGE | IBGE | — |
| `cod_ibge6` | Identificação | Código (6 dígitos) | Código sem dígito verificador (padrão DataSUS e Ministérios) | IBGE / DataSUS | — |
| `municipio` | Texto | Nome | Nome oficial do município | IBGE | — |
| `uf` | Texto | Sigla | Unidade Federativa (Estado) | IBGE | — |
| `regiao` | Texto | Categoria | Grande Região Geográfica (Norte, Nordeste, Centro-Oeste, Sudeste, Sul) | IBGE | — |
| `populacao_2025` | Numérico | Habitantes | Projeção oficial da população residente em 2025 | IBGE · Estimativas Populacionais | 2025 |
| `pib_municipal_precos_correntes_brl` | Numérico | R$ | Produto Interno Bruto a preços correntes do município | IBGE Contas Regionais | 2023-2025 |

---

### 🛡️ Previdência Social e Risco de Desvinculação (`Previdencia_Economia`)
| Coluna | Tipo | Unidade | Descrição | Fonte Primária | Fórmula / Metodologia |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `aposentadorias_rgps_dezembro` | Numérico | Quantidade | Número de aposentadorias do Regime Geral da Previdência Social pagas em dezembro | MPS / INSS | Censo Previdenciário |
| `pensoes_por_morte_rgps_dezembro`| Numérico | Quantidade | Número de pensões por morte pagas no município | MPS / INSS | Folha mensal |
| `total_rgps_dezembro` | Numérico | Quantidade | Soma de aposentadorias e pensões pagas pelo RGPS | MPS / INSS | Soma simples |
| `valor_liquido_aposentadorias_ano_brl` | Numérico | R$ / ano | Total líquido anual injetado exclusivamente em aposentadorias | MPS / INSS | Folha anualizada |
| `valor_liquido_rgps_ano_brl` | Numérico | R$ / ano | Injeção líquida total anual de benefícios previdenciários (aposentadorias + pensões) | MPS / INSS | Folha anualizada |
| `aposentadorias_sobre_pib_pct` | Numérico | % | Proporção que o valor líquido de aposentadorias representa sobre o PIB municipal | Cálculo Analítico | `(valor_liquido_aposentadorias / pib) * 100` |
| `beneficios_rgps_rurais_dezembro`| Numérico | Quantidade | Benefícios previdenciários emitidos para trabalhadores rurais | MPS / INSS | Base Dezembro |
| `participacao_rural_no_rgps_pct`| Numérico | % | Peso relativo dos benefícios rurais no total do RGPS | Cálculo Analítico | `(rurais / total_rgps) * 100` |
| `perda_hipotetica_anual_brl` | Simulação | R$ / ano | Impacto financeiro anual de um corte/desindexação simulado de 10% nas aposentadorias | MPS / Cenário Analítico | `folha_rgps * 0.10` |
| `perda_hipotetica_por_habitante_brl`| Simulação | R$ / morador / ano | Perda anual de 10% dividida pela população total do município (impacto macroeconômico local) | Cenário Analítico | `perda_hipotetica_anual / populacao_2025` |
| `perda_por_aposentado` *(Derivada)* | Simulação | R$ / aposentado / ano | Impacto financeiro individual anual no bolso de cada aposentado | Análise Própria | `perda_hipotetica_anual / aposentadorias_rgps_dezembro` |

---

### 💼 Trabalho, Renda e Dinâmica Empresarial (`Trabalho_e_Renda`)
| Coluna | Tipo | Unidade | Descrição | Fonte Primária | Período |
| :--- | :--- | :--- | :--- | :--- | :---: |
| `trabalhadores_clt_ativos` | Numérico | Trabalhadores | Total de empregos formais com carteira de trabalho assinada (CLT) | MTE / Novo CAGED / RAIS | 2025 |
| `total_mei_ativos` | Numérico | Estabelecimentos | Total de Microempreendedores Individuais formalmente registrados e ativos | Receita Federal / Simples Nacional | 2025/2026 |
| `total_empresas_ativas` | Numérico | Estabelecimentos | Total de estabelecimentos e empresas ativas registradas no município | Receita Federal / Mapa de Empresas | 2026 |
| `total_microempresas_ativas` | Numérico | Estabelecimentos | Estoque de Microempresas (ME) formalmente ativas no município | Mapa de Empresas (MDIC / MEMP / REDESIM) | 2026 |
| `total_microempresas_comercio_ativas` | Numérico | Estabelecimentos | Estoque de Microempresas (ME) ativas no segmento de Comércio (79 subclasses CNAE oficiais detalhadas em `comercio.xlsx`) | Mapa de Empresas (MDIC / MEMP / REDESIM) | 2026 |
| `familias_bolsa_familia` | Numérico | Famílias | Famílias beneficiárias atendidas pelo Programa Bolsa Família | MDS / SAGICAD | 2025 |
| `valor_mensal_bolsa_familia_rs` | Numérico | R$ / mês | Valor total da folha mensal de pagamento do Bolsa Família no município | MDS | Folha mensal |
| `beneficiarios_bpc_loas` | Numérico | Pessoas | Idosos (>=65 anos) e pessoas com deficiência vulneráveis amparados pelo BPC | MDS / INSS | 2025 |
| `valor_mensal_bpc_rs` | Numérico | R$ / mês | Folha mensal de pagamento do Benefício de Prestação Continuada (1 Salário Mínimo) | MDS / INSS | Folha mensal |
| `servidores_municipais` | Numérico | Servidores | Total de servidores municipais da administração direta e indireta | IBGE · MUNIC | 2023/2024 |
| `servidores_municipais_estatutarios` | Numérico | Servidores | Servidores municipais concursados/efetivos | IBGE · MUNIC | 2023/2024 |
| `servidores_municipais_comissionados` | Numérico | Servidores | Servidores municipais ocupantes de cargo em comissão | IBGE · MUNIC | 2023/2024 |
| `servidores_federais_siape` | Numérico | Servidores | Servidores públicos federais civis ativos lotados no município | SIAPE / Painel Estatístico de Pessoal | 2025/2026 |
| `total_servidores_publicos` | Numérico | Servidores | Total consolidado de servidores públicos municipais e federais | IBGE MUNIC / SIAPE | Consolidado |
| `renda_social_prev_total` *(Derivada)* | Numérico | R$ / ano | Injeção total de Renda Social: `RGPS Anual + (Bolsa Família * 12) + (BPC * 12)` | Análise Própria | Anualizado |
| `pct_renda_social_pib` *(Derivada)* | Numérico | % | Percentual da Renda Social e Previdenciária sobre o PIB do município | Análise Própria | `(renda_social / pib) * 100` |

---

### 🎓 Educação Básica e Juventude (`Educacao_Escolas`)
| Coluna | Tipo | Unidade | Descrição | Fonte Primária | Período |
| :--- | :--- | :--- | :--- | :--- | :---: |
| `qtd_alunos_rede_publica` | Numérico | Alunos | Total de matrículas na rede pública de ensino do município (estadual e municipal) | MEC / INEP / Censo Escolar | 2024/2025 |
| `vl_fundeb_rede_municipal` | Numérico | R$ / ano | Receita total anual do FUNDEB da rede municipal de ensino | MEC / FNDE / STN | 2024/2025 |
| `vl_fundeb_uniao_rede_municipal` | Numérico | R$ / ano | Complementação financeira direta paga pela União (VAAF, VAAT, VAAR) à rede municipal | MEC / FNDE | 2024/2025 |
| `pct_uniao_rede_municipal` | Numérico | % | Percentual do orçamento municipal do FUNDEB bancado pelo Governo Federal | Cálculo FNDE | `(uniao / fundeb_total) * 100` |
| `qtd_beneficiarios_pe_de_meia` | Numérico | Estudantes | Alunos do Ensino Médio público beneficiados pela poupança escola Pé-de-Meia | MEC / FNDE | 2024/2025 |
| `vl_pago_pe_de_meia` | Numérico | R$ / ano | Montante total em R$ creditado na conta poupança dos estudantes do município | MEC / CAIXA | 2024/2025 |

---

### 🏥 Saúde Pública e Farmácia Popular (`Saude_Medicamentos`)
| Coluna | Tipo | Unidade | Descrição | Fonte Primária | Período |
| :--- | :--- | :--- | :--- | :--- | :---: |
| `fp_total` | Numérico | Pacientes | Total de moradores atendidos pelo Programa Farmácia Popular com medicamentos gratuitos | Ministério da Saúde / DataSUS | 2024/2025 |
| `fp_so_hipertensao` | Numérico | Pacientes | Moradores que retiram exclusivamente remédios contra hipertensão | Ministério da Saúde | 2024/2025 |
| `fp_so_diabetes` | Numérico | Pacientes | Moradores que retiram exclusivamente remédios contra diabetes | Ministério da Saúde | 2024/2025 |
| `fp_hipertensao_e_diabetes` | Numérico | Pacientes | Moradores atendidos com tratamento combinado de hipertensão e diabetes | Ministério da Saúde | 2024/2025 |
| `fp_asma` | Numérico | Pacientes | Moradores atendidos com medicamentos para asma | Ministério da Saúde | 2024/2025 |
| `bolso_anual_mediano_rs` | Numérico | R$ / ano | Economia mediana anual total no bolso familiar com a gratuidade dos medicamentos | Ministério da Saúde / Preços ANVISA | Anual |
| `economia_por_paciente` *(Derivada)* | Numérico | R$ / paciente / ano | Economia média por usuário do programa: `bolso_anual_mediano_rs / fp_total` | Análise Própria | Anual |
| `quimioterapia_pacientes` | Numérico | Pacientes | Pacientes oncológicos do município que realizam quimioterapia | DataSUS / SIA-SUS | 2024 |
| `radioterapia_pacientes` | Numérico | Pacientes | Pacientes oncológicos que realizam radioterapia | DataSUS / SIA-SUS | 2024 |
| `alto_custo_pacientes` | Numérico | Pacientes | Moradores atendidos com medicamentos de alto custo pelo Componente Especializado | DataSUS | 2024 |

---

## 📈 2. Base de Séries Históricas dos Governos (`series_historicas_brasil_2010_2025.xlsx`)
Abrangência: **Brasil Anual (2016 a 2026 parcial)** e Mensal  
Comparativo de Governos: Temer (2016-2018), Bolsonaro (2019-2022) e Lula 3 (2023-2026 parcial).

| Indicador | Coluna no Excel | Unidade | Fonte Oficial Primária | Descrição / Metodologia |
| :--- | :--- | :--- | :--- | :--- |
| **Veículos Novos** | `Veículos Novos Vendidos (Milhões Unidades)` | Milhões de Veículos | Banco Central (SGS 1374) e Anfavea | Licenciamentos anuais de automóveis e comerciais leves novos emplacados. |
| **Veículos Usados** | `Veículos Usados Vendidos (Milhões Unidades - FENAUTO)` | Milhões de Veículos | FENAUTO e Senatran/Renavam | Transferências anuais de veículos leves usados e seminovos no Brasil. |
| **Razão Usados/Novo** | `Razão Veículos Usados por Novo (Proporção)` | Proporção | Cálculo: FENAUTO / BCB SGS 1374 | Quantidade de carros usados vendidos para cada 1 zero km emplacado. |
| **Imóveis SBPE (R$)** | `Venda de Imóveis Financiados PF (R$ Bi - BCB 20704)` | R$ Bilhões | Banco Central (SGS 20704) e Abecip | Volume total de crédito imobiliário SBPE contratado por pessoas físicas. |
| **Imóveis SBPE (Qtd)** | `Quantidade Imóveis Financiados SBPE (Milhares Unidades)` | Milhares de Imóveis | Banco Central (SGS 20703) | Total de unidades habitacionais adquiridas com financiamento imobiliário. |
| **Comércio Varejista** | `Faturamento Comércio Varejista Ampliado (R$ Tri)` | R$ Trilhões | Banco Central (SGS 28544) e IBGE (PMC) | Receita nominal anual de revenda do comércio varejista ampliado no país. |
| **Gastos no Exterior** | `Gastos de Brasileiros no Exterior (US$ Bi)` | US$ Bilhões | Banco Central (SGS 22742) | Balanço de Pagamentos: Despesas de viagens internacionais de residentes no exterior. |
| **Agronegócio** | `Agronegócio - Saldo das Exportações / Lucro Líquido (US$ Bi)` | US$ Bilhões | MAPA (AgroStat) e MDIC/Secex | Saldo comercial líquido gerado pelas exportações agropecuárias brasileiras. |
| **Abertura de Empresas** | `Empresas Novas Abertas (Milhões)` | Milhões de Empresas | MDIC / DREI / Mapa de Empresas | Total de novas pessoas jurídicas registradas nas Juntas Comerciais do país. |
| **Recuperação Judicial**| `Empresas em Recuperação Judicial (Casos - BCB 4392)` | Casos Requeridos | Banco Central (SGS 4392) e Serasa | Pedidos anuais de recuperação judicial requeridos por empresas em crise. |
| **Produção Industrial** | `Produção Física Industrial (Índice 2022=100)` | Índice Base | IBGE (PIM-PF) e BCB (SGS 21859) | Volume da produção física industrial geral brasileira. |
| **Emprego Formal CLT** | `Trabalhadores com Carteira Assinada / CLT (Milhões)` | Milhões de Pessoas | IBGE (PNAD Contínua) e BCB (SGS 24379) | Pessoas ocupadas no setor privado com carteira de trabalho assinada. |
| **MEIs Ativos** | `MEIs Ativos no Brasil (Milhões)` | Milhões de MEIs | Receita Federal e Mapa de Empresas | Estoque de Microempreendedores Individuais com CNPJ ativo e regular. |
| **Salário Mínimo** | `Salário Mínimo Nominal (R$ - BCB 1619)` | R$ | Banco Central (SGS 1619) | Valor vigente do Salário Mínimo Nacional por decreto/lei. |
| **Rendimento Médio** | `Rendimento Médio Habitual Nominal (R$ - BCB 24381)` | R$ | IBGE (PNAD Contínua) e BCB (SGS 24381) | Rendimento médio mensal real habitual do trabalhador brasileiro. |
| **Cesta Básica** | `Custo da Cesta Básica SP Oficial (R$ - BCB 7493)` | R$ | DIEESE e Banco Central (SGS 7493) | Custo nominal da cesta de alimentos essenciais para uma família. |
| **Botijão de Gás** | `Preço 1 Botijão de Gás GLP 13kg (R$ - ANP)` | R$ | ANP (Agência Nacional do Petróleo) | Preço médio nacional ao consumidor final do botijão de GLP 13kg. |
| **Gasolina Comum** | `Preço 1 Litro de Gasolina (R$ - ANP)` | R$ | ANP (Agência Nacional do Petróleo) | Preço médio nacional de bomba ao consumidor do litro da gasolina. |
| **Aluguel Residencial** | `Aluguel Residencial Médio (R$ - FipeZAP)` | R$ | FipeZAP / FIPE | Valor locatício residencial mediano de imóveis de 1 a 2 dormitórios. |

---

## 🏛️ 3. Base de Tipologia Socioeconômica (`classificacao_perfis_municipios_completa.xlsx`)
Abrangência: **5.571 municípios brasileiros**  
Objetivo: Agrupamento multivariado não-supervisionado (K-Means) por intensidade de políticas públicas e estrutura produtiva.

| Campo | Tipo | Unidade | Descrição / Fórmula |
| :--- | :--- | :--- | :--- |
| `taxa_clt_100_hab` | Numérico | Vagas / 100 hab | `(trabalhadores_clt_ativos / populacao_2025) * 100` |
| `taxa_mei_100_hab` | Numérico | MEIs / 100 hab | `(total_mei_ativos / populacao_2025) * 100` |
| `servidores_100_hab` | Numérico | Servidores / 100 hab | `(total_servidores_publicos / populacao_2025) * 100` |
| `aposentados_100_hab` | Numérico | Benefícios / 100 hab | `(aposentadorias_rgps_dezembro / populacao_2025) * 100` |
| `peso_prev_pib_pct` | Numérico | % | `(valor_liquido_aposentadorias_ano_brl / pib_municipal) * 100` |
| `familias_bf_100_hab` | Numérico | Famílias / 100 hab | `(familias_bolsa_familia / populacao_2025) * 100` |
| `bpc_100_hab` | Numérico | Beneficiários / 100 hab | `(beneficiarios_bpc_loas / populacao_2025) * 100` |
| `pe_de_meia_cobertura_pct` | Numérico | % | `(beneficiarios_pe_de_meia / matriculas_em_publico) * 100` |
| `dep_fundeb_uniao_pct` | Numérico | % | `(fundeb_uniao / fundeb_total_municipal) * 100` |
| `farmacia_pop_100_hab` | Numérico | Retiradas / 100 hab | `(fp_total / populacao_2025) * 100` |
| `nome_perfil_socioeconomico` | Categoria | Texto | Perfil obtido pelo K-Means inicial (com as 53 metrópoles isoladas) |
| `perfil_final_reclassificado`| Categoria | Texto | Classificação final nacional após a projeção euclidiana das 48 metrópoles aderentes ($Dist \le 3,02$) |

---

## 🗳️ 4. Base Eleitoral Integrada (`cruzamento_perfil_x_eleicao_completo.xlsx`)
Abrangência: **5.571 municípios brasileiros**  
Fontes: Tribunal Superior Eleitoral (TSE) — Dados Abertos e Totalização Oficial (2010 a 2026).

| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `eleitores_aptos_2026` | Numérico | Total de eleitores cadastrados e aptos a votar no município em 2026 |
| `comparecimento_2026_1t` | Numérico | Total de eleitores que compareceram às urnas no 1º Turno de 2026 |
| `abstencao_2026_1t` | Numérico | Eleitores que deixaram de votar no 1º Turno de 2026 |
| `taxa_abst_2026_1t` | Numérico (%) | `(abstencao_2026_1t / eleitores_aptos_2026) * 100` |
| `votos_validos_2026_1t` | Numérico | Votos nominais válidos destinados aos candidatos no 1º Turno de 2026 |
| `votos_lula_2026_1t` | Numérico | Votos recebidos por Lula (PT - 13) no 1º Turno de 2026 |
| `votos_flavio_2026_1t` | Numérico | Votos recebidos por Flávio Bolsonaro (PL - 22) no 1º Turno de 2026 |
| `votos_caiado_2026_1t` | Numérico | Votos recebidos por Ronaldo Caiado (PSD - 55) no 1º Turno de 2026 |
| `votos_zema_2026_1t` | Numérico | Votos recebidos por Romeu Zema (NOVO - 30) no 1º Turno de 2026 |
| `pct_lula_2026_1t` | Numérico (%) | `(votos_lula_2026_1t / votos_validos_2026_1t) * 100` |
| `pct_flavio_2026_1t` | Numérico (%) | `(votos_flavio_2026_1t / votos_validos_2026_1t) * 100` |
| `vencedor_2026_1t` | Texto | Candidato mais votado no município no 1º Turno de 2026 (`LULA` ou `FLAVIO BOLSONARO`) |
| `taxa_abst_2010` a `2022` | Numérico (%) | Série histórica de abstenção apurada no 2º Turno das eleições presidenciais de 2010, 2014, 2018 e 2022 |
| `taxa_abstencao_jovem_16_24_pct` | Numérico (%) | Taxa de abstenção entre eleitores de 16 a 24 anos no município |
| `taxa_abstencao_adulto_25_59_pct`| Numérico (%) | Taxa de abstenção entre eleitores de 25 a 59 anos no município |
| `taxa_abstencao_idoso_60_mais_pct`| Numérico (%) | Taxa de abstenção entre eleitores de 60 anos ou mais no município |

---

## 📉 5. Séries Históricas de Poder de Compra & Macroeconomia (2016–2026)
Fontes Primárias: DIEESE, ANP, Banco Central do Brasil (SGS), MTE (Novo CAGED), FENABRAVE, FENAUTO, FipeZAP e MCID.  
Frequência: Anual consolidada (valores de referência de dezembro de cada ano).

| Variável | Unidade | Descrição / Metodologia | Fonte Primária |
| :--- | :---: | :--- | :--- |
| `Salário Mínimo Nominal (R$)` | R$ / mês | Valor legal vigente em dezembro de cada exercício financeiro | Presidência da República / BCB SGS 1619 |
| `Rendimento Médio Habitual (R$)` | R$ / mês | Rendimento médio real habitual de todos os trabalhos | IBGE / PNAD Contínua / BCB SGS 24381 |
| `Custo da Cesta Básica SP (R$)` | R$ | Custo da ração essencial mínima para um trabalhador adulto | DIEESE / BCB SGS 7493 |
| `Cesta Básica em % do Salário Mínimo` | % | Proporção do salário mínimo consumida para adquirir 1 cesta básica | `(cesta_basica_rs / salario_minimo_rs) * 100` |
| `Preço 1 Botijão de Gás GLP 13kg (R$)` | R$ | Média nacional apurada no consumidor final residencial | Agência Nacional do Petróleo (ANP) |
| `Botijão de Gás em % do Salário Mínimo` | % | Peso relativo do botijão no orçamento do salário mínimo | `(gas_glp_rs / salario_minimo_rs) * 100` |
| `Preço 1 Litro de Gasolina Comum (R$)` | R$ | Preço médio ponderado nacional na bomba | Agência Nacional do Petróleo (ANP) |
| `1L Gasolina em % do Salário Mínimo` | % | Custo de um litro de gasolina sobre o salário mínimo | `(gasolina_rs / salario_minimo_rs) * 100` |
| `Trabalhadores com Carteira CLT (Milhões)` | Milhões | Total de vínculos celetistas ativos no mercado formal | MTE / Novo CAGED / BCB SGS 24379 |
| `MEIs Ativos no Brasil (Milhões)` | Milhões | Total de Microempreendedores Individuais formalmente registrados | Receita Federal / Mapa de Empresas MDIC |
| `Veículos Novos Vendidos (Milhões)` | Milhões unid. | Total de emplacamentos de automóveis, comerciais leves, caminhões e ônibus | FENABRAVE / Renavam |
| `Veículos Usados Vendidos (Milhões)` | Milhões unid. | Total de transações de veículos seminovos e usados transferidos | FENAUTO |
| `Razão Usados / Novos` | Proporção | Quantos veículos usados foram negociados para cada veículo zero-km vendido | `veiculos_usados / veiculos_novos` |
| `Financiamentos SBPE (Milhares Unidades)` | Milhares unid. | Imóveis residenciais adquiridos via crédito do Sistema Brasileiro de Poupança | Banco Central do Brasil (BCB SGS 20703) |
| `Volume de Crédito Imobiliário SBPE (R$ Bi)`| R$ Bilhões | Volume total de crédito liberado pelo SBPE para pessoas físicas | Banco Central do Brasil (BCB SGS 20704) |
| `MCMV Habitação Contratada (Milhares Unid.)`| Milhares unid. | Unidades habitacionais subsidiadas contratadas pelo programa | Ministério das Cidades (MCID) |
| `Saldo do Agronegócio (US$ Bi)` | US$ Bilhões | Saldo da balança comercial do agronegócio brasileiro (exportações - importações)| MAPA / Comex Stat |
| `Repasses FPE por UF (R$ Bi)` | R$ Bilhões | Repasses constitucionais do Fundo de Participação dos Estados (2016 a 2026)| Secretaria do Tesouro Nacional (STN) |

---

## 🗄️ 6. Schema do Payload do Dashboard (`dashboard_data.json`)
O arquivo gerado por [`export_dashboard_data.py`](../export_dashboard_data.py) possui ~3.0 MB e agrupa todo o ecossistema em nós JSON estritos:

```json
{
  "totais_nacionais": {
    "populacao_total": 213245678,
    "total_municipios": 5571,
    "farmacia_popular_beneficiarios": 12961803,
    "pe_de_meia_investimento_anual_brl": 10534200000,
    "rgps_aposentadorias_anual_brl": 606240000000,
    "clt_trabalhadores_total": 49660124
  },
  "eleicoes_info": {
    "2026_1t": { "nome_exibicao": "Eleição Presidencial 2026 (1º Turno)", "votos_validos": 118900000, "candidatos": [...] },
    "2022_1t": { "nome_exibicao": "Eleição Presidencial 2022 (1º Turno)", "votos_validos": 118580000, "candidatos": [...] },
    "2022_2t": { "nome_exibicao": "Eleição Presidencial 2022 (2º Turno)", "votos_validos": 118552349, "candidatos": [...] }
  },
  "perfis": {
    "Jovens e Dependentes de Apoio Social": {
      "nome": "Jovens e Dependentes de Apoio Social",
      "total_cidades": 1414,
      "pct_cidades_brasil": 25.4,
      "pct_eleitorado_nacional": 25.46,
      "indicadores_medios": { "clt_100_hab": 8.4, "farmacia_popular_100_hab": 4.1, "pe_de_meia_pct": 82.5, ... },
      "eleicoes": { "2026_1t": { "lula_pct": 63.8, "flavio_pct": 31.76, "taxa_abstencao": 19.45 } }
    }
  },
  "regioes": { "Nordeste": { ... }, "Sudeste": { ... }, "Sul": { ... }, "Norte": { ... }, "Centro-Oeste": { ... } },
  "estados": { "SP": { "nome": "São Paulo", "regiao": "Sudeste", "perfil_predominante": "...", "total_cidades": 645 }, ... },
  "municipios": [
    {
      "id": "3550308",
      "nm": "São Paulo",
      "uf": "SP",
      "reg": "Sudeste",
      "pf": "Cidades Autônomas e Agroindustriais",
      "pop": 11895578,
      "lat": -23.5505,
      "lng": -46.6333,
      "e26": { "lula": 48.2, "flavio": 44.1, "vtot": 6840000, "abst": 19.2 },
      "e22_1t": { "lula": 47.5, "bolsonaro": 44.8, "vtot": 6780000 },
      "e22_2t": { "lula": 53.5, "bolsonaro": 46.5, "vtot": 6810000 },
      "ind": { "clt": 32.5, "mei": 9.8, "apos": 14.1, "fp": 9.2, "pdm": 54.1 }
    }
  ],
  "series_historicas": {
    "nacional": [ { "ano": 2016, "salario_minimo": 880, ... }, ... { "ano": 2026, "salario_minimo": 1621, ... } ],
    "fpe_estados_bi": { "BA": { "2016": 6.8, "2026": 14.2 }, ... }
  }
}
```


