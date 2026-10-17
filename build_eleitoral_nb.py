import nbformat as nbf
from nbformat.v4 import new_notebook, new_markdown_cell, new_code_cell

def build():
    nb = new_notebook()
    nb.metadata = {
        "kernelspec": {
            "display_name": "Python (trad_x_municipio)",
            "language": "python",
            "name": "trad_x_municipio"
        },
        "language_info": {
            "name": "python",
            "version": "3.12.3"
        }
    }

    # Célula 0: Markdown
    nb.cells.append(new_markdown_cell(r"""# 🗳️ Cruzamento Eleitoral: Perfis Socioeconômicos x Eleições Presidenciais
## Votação no 1º Turno de 2026 (Lula x Flávio Bolsonaro), Série Histórica de Abstenção (2010–2026), Abstenção por Idade e Mapa do Brasil

### 🎯 Objetivos deste Caderno:
1. **Resultado do 1º Turno de 2026:** Analisar a média de votos de **Lula** e **Flávio Bolsonaro** (e demais candidatos) em cada um dos perfis socioeconômicos dos 5.571 municípios.
2. **Peso Eleitoral de Cada Perfil:** Calcular a fatia dos votos válidos do país que cada grupo representa e de onde vêm os votos de cada candidato.
3. **Dinâmica de Mudança e Migração de Votos (2022 ➔ 2026):** Quantificar quantos % do eleitorado mudou de voto entre o 1º turno de 2022 e o de 2026 (considerando Flávio Bolsonaro = Bolsonaro), o swing eleitoral e os principais municípios em cada perfil.
4. **Série Histórica da Abstenção (2010 a 2026):** Acompanhar a evolução do comparecimento eleitoral em 5 eleições presidenciais consecutivas.
5. **Abstenção por Faixa Etária:** Identificar os padrões de abstenção entre jovens (16-24), adultos (25-59) e idosos (60+).
6. **Mapeamento Geoespacial do Brasil:** Plotar o mapa geográfico com todos os municípios brasileiros geolocalizados e coloridos de acordo com seu perfil socioeconômico.
7. **Exportação Consolidada:** Salvar as bases com indicadores socioeconômicos e eleitorais integrados.
"""))

    # Célula 1: Code (Imports)
    nb.cells.append(new_code_cell("""import os
import json
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from matplotlib.patches import Polygon
from matplotlib.collections import PatchCollection

# Estilo editorial de visualização
plt.style.use('seaborn-v0_8-whitegrid')
plt.rcParams['font.sans-serif'] = 'DejaVu Sans'
plt.rcParams['axes.edgecolor'] = '#CCCCCC'
plt.rcParams['axes.linewidth'] = 0.8
plt.rcParams['figure.dpi'] = 120

print("✅ Ambiente configurado com pandas, matplotlib, seaborn e módulos geoespaciais!")
"""))

    # Célula 2: Markdown
    nb.cells.append(new_markdown_cell(r"""## 📂 1. Carregamento e Cruzamento das Bases de Dados
Integramos em uma única base nacional:
* Classificação dos **Perfis Socioeconômicos Reclassificados** (`classificacao_perfis_municipios_completa.xlsx`);
* Votação Presidencial do **1º Turno de 2026** (`votacao_presidencial_municipios_2026.csv`);
* Votação Presidencial de **2022** (`votacao_presidencial_municipios_2022.csv`);
* Série Histórica de **Abstenção 2010–2026** (`serie_historica_presidencial_2010_2022.csv` + 2026);
* Abstenção por **Faixa Etária** (`abstencao_idade_municipios_2022.csv`);
* Coordenadas Geográficas dos Municípios (`municipios_coordenadas.csv`).
"""))

    # Célula 3: Code
    nb.cells.append(new_code_cell("""# 1. Carregando Perfis Socioeconômicos Reclassificados
df_perfis = pd.read_excel('dados_prioridades/classificacao_perfis_municipios_completa.xlsx', sheet_name='Todos_Municipios_5571')
col_perfil = 'perfil_final_reclassificado' if 'perfil_final_reclassificado' in df_perfis.columns else 'nome_perfil_socioeconomico'

# 2. Carregando Votação 2026 (1º Turno)
df_2026 = pd.read_csv('dados_prioridades/eleicoes_tse/votacao_presidencial_municipios_2026.csv', sep=';')

# 3. Carregando Votação 2022 (para referência histórica)
df_2022 = pd.read_csv('dados_prioridades/eleicoes_tse/votacao_presidencial_municipios_2022.csv', sep=';')

# 4. Carregando Série Histórica TSE
df_hist = pd.read_csv('dados_prioridades/eleicoes_tse/serie_historica_presidencial_2010_2022.csv', sep=';')
df_hist['taxa_abst_2010'] = (df_hist['abstencao_2010_2t'] / df_hist['aptos_2010'].replace(0, np.nan) * 100).round(1)
df_hist['taxa_abst_2014'] = (df_hist['abstencao_2014_2t'] / df_hist['aptos_2014'].replace(0, np.nan) * 100).round(1)
df_hist['taxa_abst_2018'] = (df_hist['abstencao_2018_2t'] / df_hist['aptos_2018'].replace(0, np.nan) * 100).round(1)
df_hist['taxa_abst_2022'] = (df_hist['abstencao_2022_2t'] / df_hist['aptos_2022'].replace(0, np.nan) * 100).round(1)

# 5. Carregando Abstenção por Idade
df_idade = pd.read_csv('dados_prioridades/eleicoes_tse/abstencao_idade_municipios_2022.csv', sep=';')

# 6. Carregando Coordenadas Geográficas
df_geo = pd.read_csv('dados_prioridades/municipios_coordenadas.csv')
df_geo = df_geo.rename(columns={'codigo_ibge': 'cod_ibge7'})

# Cruzamento Geral (Merge)
df_eleitoral = df_perfis.copy()
df_eleitoral['perfil_analise'] = df_eleitoral[col_perfil]

# Merge com Eleições 2026
df_eleitoral = df_eleitoral.merge(
    df_2026[['cod_ibge7', 'votos_lula_2026_1t', 'votos_flavio_2026_1t', 'votos_caiado_2026_1t', 'votos_zema_2026_1t',
             'votos_validos_2026_1t', 'pct_lula_2026_1t', 'pct_flavio_2026_1t', 'pct_caiado_2026_1t', 'pct_zema_2026_1t',
             'vencedor_2026_1t', 'eleitores_aptos_2026', 'comparecimento_2026_1t', 'abstencao_2026_1t', 'taxa_abst_2026_1t']],
    on='cod_ibge7', how='left'
)

# Merge com Eleições 2022
df_eleitoral = df_eleitoral.merge(
    df_2022[['cod_ibge7', 'votos_lula_1t', 'votos_bolsonaro_1t', 'votos_validos_1t', 'pct_lula_1t', 'pct_bolsonaro_1t', 'pct_lula_2t', 'pct_bolsonaro_2t']],
    on='cod_ibge7', how='left'
)

# Merge com Série Histórica
df_eleitoral = df_eleitoral.merge(
    df_hist[['cod_ibge7', 'taxa_abst_2010', 'taxa_abst_2014', 'taxa_abst_2018', 'taxa_abst_2022']],
    on='cod_ibge7', how='left'
)

# Merge com Abstenção por Idade
df_eleitoral = df_eleitoral.merge(
    df_idade[['cod_ibge7', 'taxa_abstencao_jovem_16_24_pct', 'taxa_abstencao_adulto_25_59_pct', 'taxa_abstencao_idoso_60_mais_pct']],
    on='cod_ibge7', how='left'
)

# Merge com Coordenadas
df_eleitoral = df_eleitoral.merge(
    df_geo[['cod_ibge7', 'latitude', 'longitude']],
    on='cod_ibge7', how='left'
)

print(f"✅ Base cruzada com sucesso: {len(df_eleitoral)} municípios com dados socioeconômicos e eleitorais de 2026 integrados!")
"""))

    # Célula 4: Markdown
    nb.cells.append(new_markdown_cell(r"""## ⚖️ 2. Peso Eleitoral: Quanto Cada Perfil Representa nos Votos do Brasil (2026)
Calculamos a participação real de cada perfil socioeconômico no eleitorado e nos votos válidos do **1º Turno de 2026**:
1. **% do Eleitorado Nacional 2026:** Proporção dos eleitores aptos no país.
2. **% dos Votos Válidos Nacionais 2026:** Fatia dos votos válidos apurados no 1º turno.
3. **Composição da Base de Votos:** De onde vieram os votos de **Lula** e de **Flávio Bolsonaro** (% do total nacional de cada candidato que veio de cada perfil).
"""))

    # Célula 5: Code (Tabela de Peso Eleitoral)
    nb.cells.append(new_code_cell("""total_aptos_26 = df_eleitoral['eleitores_aptos_2026'].sum()
total_validos_26 = df_eleitoral['votos_validos_2026_1t'].sum()
total_lula_26 = df_eleitoral['votos_lula_2026_1t'].sum()
total_flavio_26 = df_eleitoral['votos_flavio_2026_1t'].sum()

resumo_peso_26 = df_eleitoral.groupby('perfil_analise').agg({
    'cod_ibge7': 'count',
    'eleitores_aptos_2026': 'sum',
    'votos_validos_2026_1t': 'sum',
    'votos_lula_2026_1t': 'sum',
    'votos_flavio_2026_1t': 'sum'
})

resumo_peso_26['pct_eleitorado_nacional_2026'] = (resumo_peso_26['eleitores_aptos_2026'] / total_aptos_26 * 100).round(2)
resumo_peso_26['pct_votos_validos_nacional_2026'] = (resumo_peso_26['votos_validos_2026_1t'] / total_validos_26 * 100).round(2)
resumo_peso_26['pct_do_total_lula_2026'] = (resumo_peso_26['votos_lula_2026_1t'] / total_lula_26 * 100).round(2)
resumo_peso_26['pct_do_total_flavio_2026'] = (resumo_peso_26['votos_flavio_2026_1t'] / total_flavio_26 * 100).round(2)

resumo_peso_26 = resumo_peso_26.sort_values(by='pct_votos_validos_nacional_2026', ascending=False)

print("📊 PESO ELEITORAL DE CADA PERFIL NO 1º TURNO DE 2026:")
tabela_exib = resumo_peso_26[['cod_ibge7', 'eleitores_aptos_2026', 'pct_eleitorado_nacional_2026', 'votos_validos_2026_1t', 'pct_votos_validos_nacional_2026', 'pct_do_total_lula_2026', 'pct_do_total_flavio_2026']].copy()
tabela_exib.columns = ['Qtd_Cidades', 'Eleitores_Aptos_2026', '%_Eleitorado_BR', 'Votos_Validos_1T_2026', '%_Votos_Validos_BR', '%_Total_Votos_Lula', '%_Total_Votos_Flavio']
tabela_exib['Eleitores_Aptos_2026'] = tabela_exib['Eleitores_Aptos_2026'].map('{:,.0f}'.format)
tabela_exib['Votos_Validos_1T_2026'] = tabela_exib['Votos_Validos_1T_2026'].map('{:,.0f}'.format)
display(tabela_exib)
"""))

    # Célula 6: Code (Gráfico 1 Separado: Peso nos Votos Válidos)
    nb.cells.append(new_code_cell("""# Gráfico 1: Peso de Cada Perfil no Total de Votos Válidos do Brasil em 2026
plt.figure(figsize=(12, 6))

cores_perfis = ['#1F4E79', '#C00000', '#00B050', '#E26B00', '#0070C0', '#7030A0', '#FFD700']
ax1 = resumo_peso_26['pct_votos_validos_nacional_2026'].plot(kind='barh', color=cores_perfis, edgecolor='black', alpha=0.85)
plt.gca().invert_yaxis()
plt.title('Participação no Total de Votos Válidos do Brasil — 1º Turno 2026 (% do País)', fontsize=14, fontweight='bold', pad=15)
plt.xlabel('% dos Votos Válidos Nacionais (2026)', fontsize=12, fontweight='bold')
plt.ylabel('Perfil Socioeconômico', fontsize=12, fontweight='bold')

for p in ax1.patches:
    ax1.annotate(f"{p.get_width():.2f}%", (p.get_width() + 0.6, p.get_y() + p.get_height() / 2.),
                 va='center', fontsize=11, fontweight='bold', color='#222222')
plt.xlim(0, 38)
plt.tight_layout()
plt.show()
"""))

    # Célula 7: Code (Gráfico 2 Separado: Composição da Base Eleitoral)
    nb.cells.append(new_code_cell("""# Gráfico 2: De Onde Vieram os Votos de Lula e de Flávio Bolsonaro em 2026?
df_comp_26 = resumo_peso_26[['pct_do_total_lula_2026', 'pct_do_total_flavio_2026']].copy()
df_comp_26.columns = ['Base de Lula (100%)', 'Base de Flávio Bolsonaro (100%)']

ax2 = df_comp_26.plot(kind='bar', color=['#C00000', '#1F4E79'], edgecolor='black', alpha=0.85, figsize=(13, 6))
plt.title('Composição das Bases Eleitorais: De Onde Vieram os Votos no 1º Turno 2026?', fontsize=14, fontweight='bold', pad=15)
plt.ylabel('% do Total de Votos Obtidos no País', fontsize=12, fontweight='bold')
plt.xlabel('Perfil Socioeconômico', fontsize=12, fontweight='bold')
plt.xticks(rotation=30, ha='right', fontsize=10, fontweight='bold')
plt.legend(fontsize=12)
plt.ylim(0, 42)

for p in ax2.patches:
    if p.get_height() > 0:
        ax2.annotate(f"{p.get_height():.1f}%", (p.get_x() + p.get_width() / 2., p.get_height() + 0.7),
                     ha='center', va='bottom', fontsize=9, fontweight='bold')

plt.tight_layout()
plt.show()
"""))

    # Célula 8: Markdown
    nb.cells.append(new_markdown_cell(r"""## 🗳️ 3. Análise da Votação no 1º Turno de 2026 por Perfil de Cidade
Examinamos a média percentual de votos válidos obtida pelos candidatos presidenciais no **1º Turno de 2026** por perfil de município.
"""))

    # Célula 9: Code
    nb.cells.append(new_code_cell("""resumo_voto_26 = df_eleitoral.groupby('perfil_analise').agg({
    'cod_ibge7': 'count',
    'pct_lula_2026_1t': 'mean',
    'pct_flavio_2026_1t': 'mean',
    'pct_caiado_2026_1t': 'mean',
    'pct_zema_2026_1t': 'mean'
}).round(2)

resumo_voto_26.columns = ['Qtd_Cidades', 'Lula_2026_1T_pct', 'Flavio_2026_1T_pct', 'Caiado_2026_1T_pct', 'Zema_2026_1T_pct']
resumo_voto_26['Vantagem_Lula'] = (resumo_voto_26['Lula_2026_1T_pct'] - resumo_voto_26['Flavio_2026_1T_pct']).round(2)
resumo_voto_26 = resumo_voto_26.sort_values(by='Lula_2026_1T_pct', ascending=False)

print("📋 VOTAÇÃO MÉDIA NO 1º TURNO DE 2026 POR PERFIL SOCIOECONÔMICO:")
display(resumo_voto_26)

# Gráfico Comparativo: Votação 1º Turno 2026 (Lula x Flávio Bolsonaro)
fig, ax = plt.subplots(figsize=(14, 7))
y_pos = np.arange(len(resumo_voto_26))
bar_width = 0.38

rects1 = ax.barh(y_pos - bar_width/2, resumo_voto_26['Lula_2026_1T_pct'], bar_width, label='Lula (1ºT 2026)', color='#C00000', alpha=0.85, edgecolor='black')
rects2 = ax.barh(y_pos + bar_width/2, resumo_voto_26['Flavio_2026_1T_pct'], bar_width, label='Flávio Bolsonaro (1ºT 2026)', color='#1F4E79', alpha=0.85, edgecolor='black')

ax.set_yticks(y_pos)
ax.set_yticklabels(resumo_voto_26.index, fontsize=11, fontweight='bold')
ax.invert_yaxis()
ax.set_xlabel('% Média de Votos Válidos no 1º Turno (2026)', fontsize=12, fontweight='bold')
ax.set_title('Resultado Médio do 1º Turno das Eleições 2026 por Perfil de Cidade', fontsize=14, fontweight='bold', pad=15)
ax.legend(loc='lower right', fontsize=12)

for p in rects1:
    ax.annotate(f"{p.get_width():.1f}%", (p.get_width() + 1, p.get_y() + p.get_height() / 2.), va='center', fontsize=10, fontweight='bold', color='#800000')
for p in rects2:
    ax.annotate(f"{p.get_width():.1f}%", (p.get_width() + 1, p.get_y() + p.get_height() / 2.), va='center', fontsize=10, fontweight='bold', color='#0F2840')

plt.xlim(0, 85)
plt.tight_layout()
plt.show()
"""))

    # Célula 10: Markdown (Nova Seção 4: Mudança de Voto 2022 x 2026)
    nb.cells.append(new_markdown_cell(r"""## 🔄 4. Dinâmica de Mudança e Migração de Votos (1º Turno 2022 vs 1º Turno 2026)
### Premissa Política: Continuidade Eleitoral (Flávio Bolsonaro 2026 = Jair Bolsonaro 2022)

Analisamos como o eleitor brasileiro mudou de voto entre o 1º Turno de 2022 e o 1º Turno de 2026:
1. **Δ Lula (p.p.):** Variação percentual de Lula nos votos válidos (`pct_lula_2026_1t - pct_lula_1t`).
2. **Δ Flávio / Bolsonaro (p.p.):** Variação percentual do campo bolsonarista (`pct_flavio_2026_1t - pct_bolsonaro_1t`).
3. **Swing Líquido Pró-Flávio (p.p.):** Quanto a balança se inclinou em direção a Flávio Bolsonaro em relação a Lula (`Δ_Flavio - Δ_Lula`).
4. **% do Eleitorado que Mudou o Voto:** Calculado via **Índice de Volatilidade de Pedersen** ponderado pelo total de votos válidos de cada perfil:
   $$\text{Taxa de Mudança} = \frac{1}{2} \left( |\Delta \text{Lula}| + |\Delta \text{Flávio/Bolsonaro}| + |\Delta \text{Outros}| \right)$$
5. **Principais Municípios:** Análise dos maiores colégios eleitorais do país, das cidades que viraram de vencedor ("flips" de Lula 2022 para Flávio 2026) e das maiores oscilações por perfil socioeconômico.
"""))

    # Célula 11: Code (Tabela Analítica de Mudança de Voto por Perfil)
    nb.cells.append(new_code_cell("""# 1. Nível Municipal: Cálculos de Migração e Mudança de Voto
df_eleitoral['delta_lula'] = (df_eleitoral['pct_lula_2026_1t'] - df_eleitoral['pct_lula_1t']).round(2)
df_eleitoral['delta_bolso_flavio'] = (df_eleitoral['pct_flavio_2026_1t'] - df_eleitoral['pct_bolsonaro_1t']).round(2)
df_eleitoral['pct_outros_2022'] = (100 - (df_eleitoral['pct_lula_1t'] + df_eleitoral['pct_bolsonaro_1t'])).round(2)
df_eleitoral['pct_outros_2026'] = (100 - (df_eleitoral['pct_lula_2026_1t'] + df_eleitoral['pct_flavio_2026_1t'])).round(2)
df_eleitoral['delta_outros'] = (df_eleitoral['pct_outros_2026'] - df_eleitoral['pct_outros_2022']).round(2)

# Taxa de Mudança de Voto a nível municipal
df_eleitoral['pct_mudanca_voto_mun'] = (0.5 * (
    df_eleitoral['delta_lula'].abs() + 
    df_eleitoral['delta_bolso_flavio'].abs() + 
    df_eleitoral['delta_outros'].abs()
)).round(2)
df_eleitoral['swing_flavio_vs_lula'] = (df_eleitoral['delta_bolso_flavio'] - df_eleitoral['delta_lula']).round(2)

# Vencedores do 1º Turno (2022 vs 2026)
venc_22_1t = np.where(df_eleitoral['pct_lula_1t'] > df_eleitoral['pct_bolsonaro_1t'], 'LULA', 
                      np.where(df_eleitoral['pct_bolsonaro_1t'] > df_eleitoral['pct_lula_1t'], 'BOLSONARO', 'EMPATE'))
venc_26_1t = df_eleitoral['vencedor_2026_1t'].replace({'FLAVIO BOLSONARO': 'BOLSONARO'})
df_eleitoral['vencedor_2022_1t'] = venc_22_1t
df_eleitoral['virada_lula_para_flavio'] = (venc_22_1t == 'LULA') & (venc_26_1t == 'BOLSONARO')

# 2. Agregação Ponderada por Perfil Socioeconômico (Total de Votos Reais)
resumo_migracao_perfil = df_eleitoral.groupby('perfil_analise').agg({
    'cod_ibge7': 'count',
    'votos_validos_1t': 'sum',
    'votos_lula_1t': 'sum',
    'votos_bolsonaro_1t': 'sum',
    'votos_validos_2026_1t': 'sum',
    'votos_lula_2026_1t': 'sum',
    'votos_flavio_2026_1t': 'sum',
    'virada_lula_para_flavio': 'sum'
}).copy()

resumo_migracao_perfil['pct_lula_2022_pond'] = (resumo_migracao_perfil['votos_lula_1t'] / resumo_migracao_perfil['votos_validos_1t'] * 100).round(2)
resumo_migracao_perfil['pct_bolso_2022_pond'] = (resumo_migracao_perfil['votos_bolsonaro_1t'] / resumo_migracao_perfil['votos_validos_1t'] * 100).round(2)
resumo_migracao_perfil['pct_lula_2026_pond'] = (resumo_migracao_perfil['votos_lula_2026_1t'] / resumo_migracao_perfil['votos_validos_2026_1t'] * 100).round(2)
resumo_migracao_perfil['pct_flavio_2026_pond'] = (resumo_migracao_perfil['votos_flavio_2026_1t'] / resumo_migracao_perfil['votos_validos_2026_1t'] * 100).round(2)

resumo_migracao_perfil['delta_lula_pp'] = (resumo_migracao_perfil['pct_lula_2026_pond'] - resumo_migracao_perfil['pct_lula_2022_pond']).round(2)
resumo_migracao_perfil['delta_flavio_bolso_pp'] = (resumo_migracao_perfil['pct_flavio_2026_pond'] - resumo_migracao_perfil['pct_bolso_2022_pond']).round(2)

resumo_migracao_perfil['pct_outros_2022_pond'] = (100 - resumo_migracao_perfil['pct_lula_2022_pond'] - resumo_migracao_perfil['pct_bolso_2022_pond']).round(2)
resumo_migracao_perfil['pct_outros_2026_pond'] = (100 - resumo_migracao_perfil['pct_lula_2026_pond'] - resumo_migracao_perfil['pct_flavio_2026_pond']).round(2)
resumo_migracao_perfil['delta_outros_pp'] = (resumo_migracao_perfil['pct_outros_2026_pond'] - resumo_migracao_perfil['pct_outros_2022_pond']).round(2)

# % Real do Eleitorado que Mudou de Voto
resumo_migracao_perfil['pct_eleitor_mudou_voto'] = (0.5 * (
    resumo_migracao_perfil['delta_lula_pp'].abs() + 
    resumo_migracao_perfil['delta_flavio_bolso_pp'].abs() + 
    resumo_migracao_perfil['delta_outros_pp'].abs()
)).round(2)

resumo_migracao_perfil['swing_flavio_vs_lula'] = (
    resumo_migracao_perfil['delta_flavio_bolso_pp'] - resumo_migracao_perfil['delta_lula_pp']
).round(2)

resumo_migracao_perfil = resumo_migracao_perfil.sort_values(by='pct_eleitor_mudou_voto', ascending=False)

print("📊 TAXA DE MUDANÇA DE VOTO E SWING ELEITORAL POR PERFIL SOCIOECONÔMICO (1ºT 2022 vs 1ºT 2026):")
tabela_migracao_show = resumo_migracao_perfil[[
    'cod_ibge7', 'pct_lula_2022_pond', 'pct_lula_2026_pond', 'delta_lula_pp',
    'pct_bolso_2022_pond', 'pct_flavio_2026_pond', 'delta_flavio_bolso_pp',
    'swing_flavio_vs_lula', 'pct_eleitor_mudou_voto', 'virada_lula_para_flavio'
]].copy()
tabela_migracao_show.columns = [
    'Qtd_Cidades', 'Lula_2022_%', 'Lula_2026_%', 'Δ_Lula_(p.p.)',
    'Bolso_2022_%', 'Flavio_2026_%', 'Δ_Flavio_(p.p.)',
    'Swing_Flavio_vs_Lula_(p.p.)', '%_Eleitor_Mudou_Voto', 'Cidades_Viraram_p/_Flavio'
]
display(tabela_migracao_show)
"""))

    # Célula 12: Code (Visualização Gráfica Dupla: Deslocamento dos Polos e % de Mudança)
    nb.cells.append(new_code_cell("""# Visualização Gráfica Editorial: Deslocamento dos Polos e Taxa de Mudança de Voto
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(16, 7), sharey=True)

y_pos = np.arange(len(resumo_migracao_perfil))

# Subplot 1: Variação dos Polos em p.p. (Δ Lula vs Δ Flávio Bolsonaro)
ax1.barh(y_pos - 0.2, resumo_migracao_perfil['delta_lula_pp'], height=0.38, color='#C00000', alpha=0.85, edgecolor='black', label='Δ Lula (2026 - 2022)')
ax1.barh(y_pos + 0.2, resumo_migracao_perfil['delta_flavio_bolso_pp'], height=0.38, color='#1F4E79', alpha=0.85, edgecolor='black', label='Δ Flávio / Bolsonaro (2026 - 2022)')
ax1.axvline(0, color='black', lw=1, ls='--')
ax1.set_yticks(y_pos)
ax1.set_yticklabels(resumo_migracao_perfil.index, fontsize=10, fontweight='bold')
ax1.invert_yaxis()
ax1.set_xlabel('Variação em Pontos Percentuais (p.p.)', fontsize=11, fontweight='bold')
ax1.set_title('Deslocamento dos Polos: Lula vs Flávio Bolsonaro', fontsize=13, fontweight='bold', pad=12)
ax1.legend(loc='lower left', fontsize=10)

for p in ax1.patches:
    w = p.get_width()
    offset = 0.3 if w >= 0 else -0.3
    ha = 'left' if w >= 0 else 'right'
    cor = '#0F2840' if w >= 0 else '#800000'
    ax1.annotate(f"{w:+.2f} p.p.", (w + offset, p.get_y() + p.get_height()/2.), va='center', ha=ha, fontsize=9, fontweight='bold', color=cor)
ax1.set_xlim(-10, 9)

# Subplot 2: % Real do Eleitorado que Mudou o Voto
cores_mudanca = ['#B22222' if v >= 7.0 else '#E26B00' if v >= 4.5 else '#1F4E79' for v in resumo_migracao_perfil['pct_eleitor_mudou_voto']]
bars2 = ax2.barh(y_pos, resumo_migracao_perfil['pct_eleitor_mudou_voto'], height=0.55, color=cores_mudanca, alpha=0.85, edgecolor='black')
ax2.set_xlabel('% do Eleitorado que Mudou o Voto', fontsize=11, fontweight='bold')
ax2.set_title('Intensidade da Mudança de Voto (% do Eleitorado)', fontsize=13, fontweight='bold', pad=12)
ax2.set_xlim(0, 10)

for p in bars2:
    w = p.get_width()
    ax2.annotate(f"{w:.2f}%", (w + 0.25, p.get_y() + p.get_height()/2.), va='center', fontsize=10, fontweight='bold', color='#222222')

plt.suptitle('🔄 Diagnóstico da Mudança de Voto: 1ºT 2022 vs 1ºT 2026 por Perfil Socioeconômico (Flávio = Bolsonaro)', fontsize=15, fontweight='bold', y=1.02)
plt.tight_layout()
plt.show()
"""))

    # Célula 13: Code (Diagnóstico dos Principais Municípios e Perfis)
    nb.cells.append(new_code_cell("""# 1. Os 15 Maiores Colégios Eleitorais do Brasil
top15_maiores = df_eleitoral.sort_values(by='eleitores_aptos_2026', ascending=False).head(15).copy()
top15_maiores_exib = top15_maiores[[
    'municipio', 'uf', 'perfil_analise', 'eleitores_aptos_2026',
    'pct_lula_1t', 'pct_lula_2026_1t', 'delta_lula',
    'pct_bolsonaro_1t', 'pct_flavio_2026_1t', 'delta_bolso_flavio',
    'pct_mudanca_voto_mun', 'swing_flavio_vs_lula'
]].copy()
top15_maiores_exib.columns = [
    'Município', 'UF', 'Perfil_Socioeconômico', 'Eleitores_Aptos_2026',
    'Lula_2022_%', 'Lula_2026_%', 'Δ_Lula_(p.p.)',
    'Bolso_2022_%', 'Flavio_2026_%', 'Δ_Flavio_(p.p.)',
    '%_Mudou_Voto', 'Swing_Flavio_vs_Lula_(p.p.)'
]
top15_maiores_exib['Eleitores_Aptos_2026'] = top15_maiores_exib['Eleitores_Aptos_2026'].map('{:,.0f}'.format)

print("🏙️ 1. OS 15 MAIORES MUNICÍPIOS DO BRASIL — MUDANÇA DE VOTO E PERFIL:")
display(top15_maiores_exib)

# 2. Cidades que Viraram de Lula (2022) para Flávio Bolsonaro (2026)
top_viradas = df_eleitoral[df_eleitoral['virada_lula_para_flavio']].sort_values(by='eleitores_aptos_2026', ascending=False).head(15).copy()
top_viradas_exib = top_viradas[[
    'municipio', 'uf', 'perfil_analise', 'eleitores_aptos_2026',
    'pct_lula_1t', 'pct_lula_2026_1t', 'pct_bolsonaro_1t', 'pct_flavio_2026_1t',
    'swing_flavio_vs_lula'
]].copy()
top_viradas_exib.columns = [
    'Município', 'UF', 'Perfil_Socioeconômico', 'Eleitores_Aptos_2026',
    'Lula_2022_%', 'Lula_2026_%', 'Bolso_2022_%', 'Flavio_2026_%',
    'Swing_Flavio_vs_Lula_(p.p.)'
]
top_viradas_exib['Eleitores_Aptos_2026'] = top_viradas_exib['Eleitores_Aptos_2026'].map('{:,.0f}'.format)

print(f"\\n🔄 2. PRINCIPAIS MUNICÍPIOS QUE VIRARAM DE LADO (Lula 2022 ➔ Flávio Bolsonaro 2026 — Total no País: {df_eleitoral['virada_lula_para_flavio'].sum()} cidades):")
display(top_viradas_exib)

# 3. Top Cidades com Maior Virada / Swing Pró-Flávio (Mínimo 50 mil Eleitores)
top_swing = df_eleitoral[df_eleitoral['eleitores_aptos_2026'] >= 50000].sort_values(by='swing_flavio_vs_lula', ascending=False).head(10).copy()
top_swing_exib = top_swing[[
    'municipio', 'uf', 'perfil_analise', 'eleitores_aptos_2026',
    'delta_lula', 'delta_bolso_flavio', 'pct_mudanca_voto_mun', 'swing_flavio_vs_lula'
]].copy()
top_swing_exib.columns = [
    'Município', 'UF', 'Perfil_Socioeconômico', 'Eleitores_Aptos_2026',
    'Δ_Lula_(p.p.)', 'Δ_Flavio_(p.p.)', '%_Mudou_Voto', 'Swing_Flavio_vs_Lula_(p.p.)'
]
top_swing_exib['Eleitores_Aptos_2026'] = top_swing_exib['Eleitores_Aptos_2026'].map('{:,.0f}'.format)

print("\\n⚡ 3. TOP 10 CIDADES COM MAIOR SWING PRÓ-FLÁVIO (Mínimo 50.000 Eleitores):")
display(top_swing_exib)
"""))

    # Célula 14: Markdown
    nb.cells.append(new_markdown_cell(r"""## 📉 5. Trajetória Histórica da Abstenção (2010 a 2026 — 5 Eleições Presidenciais)
Acompanhamos a taxa de abstenção (% de eleitores aptos que deixaram de votar) ao longo de cinco eleições presidenciais consecutivas: **2010, 2014, 2018, 2022 e 2026**.
"""))

    # Célula 11: Code
    nb.cells.append(new_code_cell("""resumo_hist_abst = df_eleitoral.groupby('perfil_analise').agg({
    'taxa_abst_2010': 'mean',
    'taxa_abst_2014': 'mean',
    'taxa_abst_2018': 'mean',
    'taxa_abst_2022': 'mean',
    'taxa_abst_2026_1t': 'mean'
}).round(1)

resumo_hist_abst.columns = ['Abst_2010', 'Abst_2014', 'Abst_2018', 'Abst_2022', 'Abst_2026']
resumo_hist_abst['Variacao_2010_2026'] = (resumo_hist_abst['Abst_2026'] - resumo_hist_abst['Abst_2010']).round(1)

print("📋 HISTÓRICO DE ABSTENÇÃO (% DO ELEITORADO) DE 2010 A 2026:")
display(resumo_hist_abst)

# Gráfico de Linhas: Trajetória Histórica de 5 Eleições
plt.figure(figsize=(14, 7))
anos = [2010, 2014, 2018, 2022, 2026]
paleta = {
    'Jovens e Dependentes de Apoio Social': '#C00000',
    'Municípios Dependentes de Seguridade e Repasses': '#E26B00',
    'Pequenos Municípios do Funcionalismo Público': '#7030A0',
    'Polos Regionais de Emprego e Serviços': '#1F4E79',
    'Cidades Autônomas e Agroindustriais': '#00B050',
    'Cidades da Terceira Idade e Aposentados': '#0070C0',
    'Grandes Metrópoles e Capitais (Atípicas)': '#333333'
}

for perfil, row in resumo_hist_abst.iterrows():
    valores = [row['Abst_2010'], row['Abst_2014'], row['Abst_2018'], row['Abst_2022'], row['Abst_2026']]
    plt.plot(anos, valores, marker='o', lw=2.5, label=perfil, color=paleta.get(perfil, '#666666'))

plt.title('Evolução da Taxa Média de Abstenção Eleitoral (2010 a 2026) por Perfil de Município', fontsize=14, fontweight='bold', pad=15)
plt.xlabel('Ano da Eleição Presidencial', fontsize=12, fontweight='bold')
plt.ylabel('Taxa Média de Abstenção (%)', fontsize=12, fontweight='bold')
plt.xticks(anos)
plt.ylim(16, 28)
plt.legend(bbox_to_anchor=(1.02, 1), loc='upper left', fontsize=10)
plt.tight_layout()
plt.show()
"""))

    # Célula 16: Markdown
    nb.cells.append(new_markdown_cell(r"""## 👥 6. Diagnóstico de Abstenção por Faixa Etária
Avaliamos a taxa de abstenção em cada estrato etário do eleitorado (Jovens 16-24, Adultos 25-59 e Idosos 60+).
"""))

    # Célula 17: Code
    nb.cells.append(new_code_cell("""resumo_idade = df_eleitoral.groupby('perfil_analise').agg({
    'taxa_abstencao_jovem_16_24_pct': 'mean',
    'taxa_abstencao_adulto_25_59_pct': 'mean',
    'taxa_abstencao_idoso_60_mais_pct': 'mean'
}).round(1)

resumo_idade.columns = ['Abst_Jovem_16_24', 'Abst_Adulto_25_59', 'Abst_Idoso_60+']
print("📋 ABSTENÇÃO POR FAIXA ETÁRIA POR PERFIL SOCIOECONÔMICO:")
display(resumo_idade)

# Gráfico de barras agrupadas: Faixa Etária por Perfil
ax = resumo_idade[['Abst_Jovem_16_24', 'Abst_Adulto_25_59', 'Abst_Idoso_60+']].plot(
    kind='bar', figsize=(15, 7), color=['#2E75B6', '#00B050', '#ED7D31'], edgecolor='black', alpha=0.85
)
plt.title('Taxa Média de Abstenção por Faixa Etária e Perfil Socioeconômico', fontsize=14, fontweight='bold', pad=15)
plt.xlabel('Perfil Socioeconômico', fontsize=12, fontweight='bold')
plt.ylabel('Taxa de Abstenção (%)', fontsize=12, fontweight='bold')
plt.xticks(rotation=30, ha='right', fontsize=10, fontweight='bold')
plt.legend(['Jovens (16 a 24 anos)', 'Adultos (25 a 59 anos)', 'Idosos (60+ anos)'], fontsize=11)
plt.ylim(0, 42)

for p in ax.patches:
    if p.get_height() > 0:
        ax.annotate(f"{p.get_height():.1f}%", (p.get_x() + p.get_width() / 2., p.get_height() + 0.8),
                    ha='center', va='bottom', fontsize=9, fontweight='bold')

plt.tight_layout()
plt.show()
"""))

    # Célula 18: Markdown
    nb.cells.append(new_markdown_cell(r"""## 🗺️ 7. Mapa Geográfico do Brasil com as Cidades Pintadas por Perfil
Plotamos os **5.571 municípios brasileiros** georreferenciados sobre a malha territorial oficial das 27 Unidades da Federação do IBGE.
"""))

    # Célula 15: Code (Mapa do Brasil)
    nb.cells.append(new_code_cell("""# Carregamento da Malha Territorial das UFs (IBGE)
with open('dados_prioridades/brasil_estados.json', 'r', encoding='utf-8') as f:
    geojson_br = json.load(f)

cores_mapa = {
    'Jovens e Dependentes de Apoio Social': '#C00000',
    'Municípios Dependentes de Seguridade e Repasses': '#E26B00',
    'Polos Regionais de Emprego e Serviços': '#1F4E79',
    'Cidades Autônomas e Agroindustriais': '#00B050',
    'Cidades da Terceira Idade e Aposentados': '#0070C0',
    'Pequenos Municípios do Funcionalismo Público': '#7030A0',
    'Grandes Metrópoles e Capitais (Atípicas)': '#333333'
}

fig, ax = plt.subplots(figsize=(15, 15))

# 1. Desenhar os polígonos dos 27 Estados
patches_uf = []
for feat in geojson_br['features']:
    geom = feat['geometry']
    coords = geom['coordinates']
    if geom['type'] == 'Polygon':
        for poly in coords:
            patches_uf.append(Polygon(poly, closed=True))
    elif geom['type'] == 'MultiPolygon':
        for multi in coords:
            for poly in multi:
                patches_uf.append(Polygon(poly, closed=True))

p_col = PatchCollection(patches_uf, facecolor='#F5F5F5', edgecolor='#B0B0B0', linewidth=0.7, zorder=1)
ax.add_collection(p_col)

# 2. Plotar os municípios por perfil
df_plot = df_eleitoral[df_eleitoral['latitude'].notna() & df_eleitoral['longitude'].notna()].copy()

for perfil, cor in cores_mapa.items():
    sub = df_plot[df_plot['perfil_analise'] == perfil]
    tam = 16 if 'Atípicas' not in perfil else 45
    borda = 'none' if 'Atípicas' not in perfil else 'black'
    z = 2 if 'Atípicas' not in perfil else 5
    
    ax.scatter(
        sub['longitude'], sub['latitude'],
        c=cor, label=f"{perfil} ({len(sub):,} cidades)",
        s=tam, alpha=0.75, edgecolors=borda, linewidth=0.8, zorder=z
    )

ax.set_xlim(-74, -34)
ax.set_ylim(-34, 6)
ax.set_aspect('equal')
ax.axis('off')

plt.title('🗺️ Mapeamento Geoespacial dos 5.571 Municípios Brasileiros por Perfil Socioeconômico', fontsize=16, fontweight='bold', pad=20)
plt.legend(loc='lower left', frameon=True, facecolor='white', framealpha=0.9, fontsize=11, markerscale=1.6, title='Perfis Socioeconômicos', title_fontsize=12)

plt.tight_layout()
plt.savefig('dados_prioridades/mapa_brasil_perfis_municipios.png', dpi=300, bbox_inches='tight')
plt.show()
print("✅ Mapa salvo em alta resolução em 'dados_prioridades/mapa_brasil_perfis_municipios.png'!")
"""))

    # Célula 20: Markdown
    nb.cells.append(new_markdown_cell(r"""## 💾 8. Exportação da Base Completa Integrada (Socioeconômica + Eleitoral 2026)
Exportamos a base unificada com todas as 5.571 cidades, seus perfis socioeconômicos reclassificados, matriz de mudança de votos e séries temporais.
"""))

    # Célula 21: Code
    nb.cells.append(new_code_cell("""out_xlsx_integrado = 'dados_prioridades/cruzamento_perfil_x_eleicao_completo.xlsx'
out_csv_integrado = 'dados_prioridades/cruzamento_perfil_x_eleicao_completo.csv'

with pd.ExcelWriter(out_xlsx_integrado, engine='openpyxl') as writer:
    df_eleitoral.to_excel(writer, sheet_name='Base_Consolidada_5571', index=False)
    resumo_peso_26.to_excel(writer, sheet_name='Peso_Eleitoral_2026')
    resumo_voto_26.to_excel(writer, sheet_name='Votacao_1T_2026')
    resumo_migracao_perfil.to_excel(writer, sheet_name='Migracao_Voto_2022_2026')
    top15_maiores.to_excel(writer, sheet_name='Maiores_Cidades_Mudanca')
    df_eleitoral[df_eleitoral['virada_lula_para_flavio']].to_excel(writer, sheet_name='Cidades_Virada_Flavio')
    resumo_hist_abst.to_excel(writer, sheet_name='Historico_Abstencao_2010_2026')
    resumo_idade.to_excel(writer, sheet_name='Abstencao_Idade')

df_eleitoral.to_csv(out_csv_integrado, sep=';', index=False, encoding='utf-8')
print(f"🎉 Base completa com Eleições 2026 e Migração de Votos exportada com sucesso:")
print(f" - {out_xlsx_integrado}")
print(f" - {out_csv_integrado}")
print("Amostra das primeiras 5 cidades com dados consolidados:")
display(df_eleitoral[['cod_ibge7', 'municipio', 'uf', 'perfil_analise', 'pct_lula_2026_1t', 'pct_flavio_2026_1t', 'delta_lula', 'delta_bolso_flavio', 'pct_mudanca_voto_mun']].head(5))
"""))

    with open("analise_eleitoral_perfis_municipios.ipynb", "w", encoding="utf-8") as f_out:
        nbf.write(nb, f_out)
    print("🎉 Notebook analise_eleitoral_perfis_municipios.ipynb compilado com sucesso via build_eleitoral_nb.py!")

if __name__ == "__main__":
    build()
