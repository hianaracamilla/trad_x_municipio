# 📊 Principais Achados Analíticos (Key Findings)

Este relatório sintetiza os principais achados empíricos extraídos das duas bases de dados do repositório:
1. **Análise dos 5.571 Municípios Brasileiros** (`traducao_municipios_consolidado.xlsx` & `analise_cruzamentos_municipios.ipynb`)
2. **Séries Históricas dos Governos no Brasil** (`series_historicas_brasil_2010_2025.xlsx` & `series_historicas_brasil_2010_2025.ipynb`)

---

## 🏛️ PARTE 1: Radiografia dos 5.571 Municípios Brasileiros

### 1.1 A Seguridade Social como Motor Econômico Municipal
Ao consolidar os três pilares de proteção de renda direta — **Previdência Social (RGPS)**, **Bolsa Família** e **Benefício de Prestação Continuada (BPC/LOAS)** —, constata-se que a rede de seguridade social é a espinha dorsal da economia da esmagadora maioria dos municípios brasileiros:

- **Peso no PIB Estadual:**
  - No **Piauí (PI)**, a renda da seguridade social representa **20,95% do PIB** somado de todos os seus municípios.
  - Na **Paraíba (PB)**, atinge **20,77% do PIB**.
  - No **Maranhão (MA)**, representa **20,68% do PIB**.
  - No **Ceará (CE)** e no **Rio Grande do Norte (RN)**, supera os **17,5%**.
- **Cidades de Pequeno Porte (até 10.000 habitantes):**
  - Nessas cidades (que somam quase metade dos municípios do país), a renda social e previdenciária atinge em média **25,6% do PIB local**.
  - O dinheiro do aposentado, da mãe beneficiária do Bolsa Família e do idoso do BPC é o que movimenta o comércio, a farmácia, a padaria e a feira livre. Sem essa injeção mensal garantida, a economia local entra em colapso imediato.
- **Previdência Rural:** 
  - Nos municípios do Semiárido e da Região Norte, os benefícios rurais chegam a representar mais de **60% de todas as aposentadorias pagas**.

---

### 1.2 Dependência do FUNDEB e a Complementação Federal da União
A análise da educação básica municipal revelou um fosso de arrecadação compensado pelo aporte da União:

- **Nordeste:**
  - A rede municipal de ensino recebeu mais de **R$ 33,7 bilhões** em complementação direta da União no FUNDEB.
  - Isso representa **40,5% de todo o orçamento da educação municipal** da região.
  - Em estados como Maranhão, Piauí, Ceará e Bahia, mais de **85% das redes municipais** dependem do aporte federal para pagar o piso dos professores e manter as escolas abertas.
- **Norte:**
  - A dependência média é de **36,7%**, somando **R$ 9,8 bilhões** transferidos pelo governo federal.
- **Sudeste e Sul:**
  - A dependência da União é de apenas **5,1% e 3,8%**, respectivamente, onde a arrecadação própria de ICMS e ISS sustenta a quase totalidade do fundo.

---

### 1.3 Programa Pé-de-Meia: Retenção Escolar e Poupança da Juventude
O cruzamento das matrículas do ensino médio público com as bolsas poupança revelou:
- **Nordeste:** **1.670.360 estudantes** amparados, o que representa a maior concentração absoluta do país (garantindo permanência na escola e quebra do ciclo de evasão para trabalho precário).
- **Sudeste:** **1.248.868 estudantes** atendidos, com forte concentração nas periferias metropolitanas de SP, RJ e MG.
- **Norte:** **475.920 alunos**, com papel vital na retenção escolar de populações ribeirinhas e interioranas.
- **Sul e Centro-Oeste:** **349.522** e **295.405 alunos**, respectivamente.

---

### 1.4 Farmácia Popular: R$ 7,7 Bilhões de Alívio Real no Bolso Familiar
A reestruturação e gratuidade total para medicamentos de hipertensão, diabetes e asma gerou um impacto econômico imediato:

- **Economia Total Nacional:** **R$ 7.747.284.186** (R$ 7,75 bilhões) que deixaram de sair da renda familiar para a compra de remédios contínuos nas farmácias credenciadas.
- **Economia Média Real por Paciente Atendido:**
  - Calculada dividindo o valor economizado pelo número de pacientes que efetivamente retiraram os medicamentos:
    - **Norte:** **R$ 618,34 por paciente/ano** (~R$ 51,50/mês).
    - **Nordeste:** **R$ 577,15 por paciente/ano** (~R$ 48,10/mês).
    - **Centro-Oeste:** **R$ 553,02 por paciente/ano** (~R$ 46,10/mês).
    - **Sudeste:** **R$ 530,12 por paciente/ano** (~R$ 44,20/mês).
    - **Sul:** **R$ 528,70 por paciente/ano** (~R$ 44,05/mês).
- **Interpretação Prática:** Para uma família de renda mínima, economizar ~R$ 50,00 por mês em cada paciente com remédio gratuito representa garantir a compra de alimentos essenciais como arroz, leite e carne.

---

### 1.5 Simulação da Desvinculação do Salário Mínimo das Aposentadorias
Um dos debates fiscais mais sensíveis no Brasil é a proposta de desvincular o reajuste das aposentadorias do salário mínimo (corrigindo-as apenas pela inflação passada em vez do ganho real do SM). A simulação de uma defasagem acumulada de 10% evidenciou dois impactos distintos:

#### A) Impacto Macroeconômico por Habitante da Cidade
*(Quanto de dinheiro some da circulação do comércio local por cada morador da cidade)*
- **Rio Grande do Sul (RS):** Perda de **R$ 458,16 por morador/ano** (o maior do Brasil, reflexo do envelhecimento populacional acelerado e alta cobertura previdenciária).
- **Santa Catarina (SC):** Perda de **R$ 368,44 por morador/ano**.
- **São Paulo (SP):** Perda de **R$ 334,12 por morador/ano**.
- **Piauí (PI) e Paraíba (PB):** Perda média de R$ 260 a R$ 280 por morador/ano.

#### B) Impacto Individual no Bolso do Aposentado
*(Quanto o aposentado deixa de receber diretamente na sua folha)*
- A perda média individual estimada é de **R$ 2.510,84 por aposentado ao ano**.
- Isso equivale a um corte de aproximadamente **R$ 209,24 por mês**, ou o confisco de cerca de **1,7 salário mínimo por ano** de quem dedicou uma vida inteira de trabalho.

---

## 📈 PARTE 2: Séries Históricas e Ciclos Econômicos no Brasil (2010–2025)

### 2.1 Mercado Automotivo: Razão Usados vs. Novos
- **A Crise dos Chips e Queda de Renda (2020-2021):** A razão de veículos seminovos/usados vendidos para cada carro zero km bateu um recorde histórico de **5,8 usados por 1 novo** em 2021. O carro zero tornou-se inacessível para a classe média.
- **Recuperação e Normalização (2023-2024):** Com a retomada das cadeias de suprimento e programas de incentivo, a razão arrefeceu para **4,7 usados por 1 novo** em 2024, indicando reaquecimento da venda de automóveis novos.

---

### 2.2 Mercado Imobiliário: Expansão do Crédito Habitacional
- O volume anual financiado pelo **SBPE (Sistema Brasileiro de Poupança e Empréstimo)** saltou de:
  - **R$ 82,3 bilhões em 2018**
  - Para **R$ 180,4 bilhões em 2024**
- Esse crescimento de mais de **119%** em valor financiado reflete a forte demanda das famílias, consolidação de programas habitacionais e ampliação da oferta imobiliária nas capitais e médias cidades.

---

### 2.3 Dinâmica do Trabalho: CLT Recorde e Formalização MEI
- **Carteiras Assinadas (CLT):**
  - O estoque de postos formais atingiu o recorde histórico de **47,8 milhões de trabalhadores com carteira assinada em 2024**.
  - Representa uma recuperação robusta frente aos 38,4 milhões registrados em 2017.
- **Microempreendedores Individuais (MEIs):**
  - O contingente de MEIs ativos saltou de **5,6 milhões em 2015** para **16,3 milhões em 2024**.
  - Revela uma mudança estrutural na matriz ocupacional brasileira, com forte aumento da prestação de serviços por conta própria formalizada.

---

### 2.4 Poder de Compra do Salário Mínimo (Alimentos, Energia e Habitação)
Ao correlacionar o valor nominal do Salário Mínimo com os preços médios aferidos por DIEESE, ANP e FipeZap:

| Indicador | 2016-2018 (Temer) | 2019-2022 (Bolsonaro) | 2023-2025 (Lula 3) | Tendência |
| :--- | :---: | :---: | :---: | :--- |
| **Cesta Básica (% do Salário Mínimo)** | 48% a 52% | Pico de **59,3%** (2021) | Queda para **~53,1%** (2024) | Recomposição do poder de compra de alimentos |
| **Botijão de Gás 13kg (% do Salário Mínimo)** | 6,5% a 7,2% | Pico de **9,3%** (2021/2022) | Queda para **6,9%** (2024) | Alívio no custo de energia doméstica |
| **Gasolina Comum (% do SM por Litro)** | 0,42% | Pico de **0,55%** (2021/2022) | Redução para **0,42%** (2024) | Queda após fim do PPI na Petrobras (maio/2023) |
| **Aluguel Residencial (m² FipeZap vs SM)** | Estável | Pressionado pelo IGP-M | Estabilização gradual | Retomada do poder relativo de locação |

#### Destaques Qualitativos dos Marcos Políticos:
1. **Política de Preços dos Combustíveis (PPI):** Entre 2016 e início de 2023, o Preço de Paridade de Importação (PPI) expôs o mercado interno à volatilidade cambial e choques internacionais (guerra na Ucrânia). Em maio de 2023, a nova estratégia comercial da Petrobras reduziu a dependência das cotações externas diárias, estabilizando o preço nas refinarias.
2. **Recomposição dos Estoques da CONAB:** A retomada das compras públicas de grãos e estoques reguladores da CONAB a partir de 2023 amorteceu pressões inflacionárias sobre itens da cesta básica.
3. **Reforma Tributária (EC 132/2023):** Promulgada no final de 2023, instituiu a Cesta Básica Nacional com alíquota zero de IBS/CBS e imposto seletivo, com fase de transição e implementação progressiva a partir de 2026.

---

## 📌 Síntese Conclusiva
Tanto o caderno municipal quanto o histórico convergem para uma mesma evidência empírica: **a transferência de renda, a valorização real do salário mínimo e o investimento em saúde e educação básica não são apenas programas assistenciais, mas a base estrutural que mantém o comércio ativo e as contas públicas municipais em funcionamento no Brasil.**
