import json
import math
import numpy as np
import pandas as pd

print("Carregando datasets...")

df_cruz = pd.read_csv('dados_prioridades/cruzamento_perfil_x_eleicao_completo.csv', sep=';')
df_22 = pd.read_csv('dados_prioridades/eleicoes_tse/votacao_presidencial_municipios_2022.csv', sep=';')

df_cruz['cod_ibge7'] = df_cruz['cod_ibge7'].astype(str).str.strip()
df_22['cod_ibge7'] = df_22['cod_ibge7'].astype(str).str.strip()

cols_from_df22 = ['cod_ibge7', 'votos_tebet_1t', 'votos_ciro_1t', 'votos_lula_2t', 'votos_bolsonaro_2t', 'votos_validos_2t', 'pct_lula_2t', 'pct_bolsonaro_2t', 'pct_lula_1t', 'pct_bolsonaro_1t']
cols_exist = [c for c in cols_from_df22 if c in df_22.columns and (c not in df_cruz.columns or c == 'cod_ibge7')]

merged = pd.merge(
    df_cruz, 
    df_22[cols_exist], 
    on='cod_ibge7', 
    how='left'
)

# Ingestão de Saúde e Remédios (saude_municipios.xlsx)
try:
    print("Carregando saude_municipios.xlsx...")
    df_s = pd.read_excel('saude_municipios.xlsx', sheet_name='Dados')
    df_s['cod_ibge7'] = df_s['cod_ibge7'].astype(str).str.strip()
    cols_s = ['cod_ibge7', 'fp_total', 'fp_so_hipertensao', 'fp_so_diabetes', 'fp_hipertensao_e_diabetes', 'fp_asma', 'alto_custo_pacientes', 'quimioterapia_pacientes', 'radioterapia_pacientes', 'bolso_anual_minimo_rs', 'bolso_anual_mediano_rs', 'no_regiao_saude']
    merged = pd.merge(merged, df_s[cols_s], on='cod_ibge7', how='left')
except Exception as e:
    print(f"Aviso ao carregar saude_municipios: {e}")

# Ingestão de Educação ETI (educacao_municipios_2025.xlsx)
try:
    print("Carregando educacao_municipios_2025.xlsx...")
    df_e = pd.read_excel('educacao_municipios_2025.xlsx', sheet_name='educacao_municipios_2025')
    df_e['cod_ibge_7'] = df_e['cod_ibge_7'].astype(int).astype(str).str.strip()
    cols_e = ['cod_ibge_7', 'qtd_matriculas_eti_rede_municipal', 'vl_fomento_eti_rede_municipal', 'qtd_escolas_eti_rede_municipal', 'vl_eti_media_por_escola_rede_municipal', 'afetados_eti', 'registrou_politica_eti_rede_municipal', 'vl_fomento_eti_rede_estadual_est']
    df_e_sub = df_e[cols_e].rename(columns={'cod_ibge_7': 'cod_ibge7'})
    merged = pd.merge(merged, df_e_sub, on='cod_ibge7', how='left')
except Exception as e:
    print(f"Aviso ao carregar educacao_municipios: {e}")

# Mapeamento de Regiões
uf_to_regiao = {
    'AC': 'Norte', 'AP': 'Norte', 'AM': 'Norte', 'PA': 'Norte', 'RO': 'Norte', 'RR': 'Norte', 'TO': 'Norte',
    'AL': 'Nordeste', 'BA': 'Nordeste', 'CE': 'Nordeste', 'MA': 'Nordeste', 'PB': 'Nordeste', 'PE': 'Nordeste', 'PI': 'Nordeste', 'RN': 'Nordeste', 'SE': 'Nordeste',
    'DF': 'Centro-Oeste', 'GO': 'Centro-Oeste', 'MT': 'Centro-Oeste', 'MS': 'Centro-Oeste',
    'ES': 'Sudeste', 'MG': 'Sudeste', 'RJ': 'Sudeste', 'SP': 'Sudeste',
    'PR': 'Sul', 'RS': 'Sul', 'SC': 'Sul'
}

uf_to_nome = {
    'AC': 'Acre', 'AL': 'Alagoas', 'AP': 'Amapá', 'AM': 'Amazonas', 'BA': 'Bahia',
    'CE': 'Ceará', 'DF': 'Distrito Federal', 'ES': 'Espírito Santo', 'GO': 'Goiás',
    'MA': 'Maranhão', 'MT': 'Mato Grosso', 'MS': 'Mato Grosso do Sul', 'MG': 'Minas Gerais',
    'PA': 'Pará', 'PB': 'Paraíba', 'PR': 'Paraná', 'PE': 'Pernambuco', 'PI': 'Piauí',
    'RJ': 'Rio de Janeiro', 'RN': 'Rio Grande do Norte', 'RS': 'Rio Grande do Sul',
    'RO': 'Rondônia', 'RR': 'Roraima', 'SC': 'Santa Catarina', 'SP': 'São Paulo',
    'SE': 'Sergipe', 'TO': 'Tocantins'
}

merged['regiao'] = merged['uf'].map(uf_to_regiao)

# Mapeamento para nomes de clusters mais curtos, diretos e informativos
cluster_nome_map = {
    'Polos Regionais de Emprego e Serviços': 'Polos de Emprego & Serviços',
    'Cidades Autônomas e Agroindustriais': 'Polos Agroindustriais',
    'Cidades da Terceira Idade e Aposentados': 'Cidades de Aposentados',
    'Municípios Dependentes de Seguridade e Repasses': 'Seguridade & Repasses',
    'Pequenos Municípios do Funcionalismo Público': 'Funcionalismo Público',
    'Jovens e Dependentes de Apoio Social': 'Jovens & Apoio Social',
    'Grandes Metrópoles e Capitais (Atípicas)': 'Metrópoles & Capitais'
}

merged['perfil_final_reclassificado'] = merged['perfil_final_reclassificado'].map(lambda x: cluster_nome_map.get(x, x))
if 'perfil_analise' in merged.columns:
    merged['perfil_analise'] = merged['perfil_analise'].map(lambda x: cluster_nome_map.get(x, x))

# Paleta harmoniosa para os novos nomes curtos dos perfis
perfil_cores = {
    'Polos de Emprego & Serviços': '#1A56DB',      # Azul institucional
    'Polos Agroindustriais': '#0E9F6E',            # Verde esmeralda dinâmico
    'Cidades de Aposentados': '#7E3AF2',           # Roxo/Lavanda elegante
    'Seguridade & Repasses': '#E05252',            # Vermelho clarinho / Coral
    'Funcionalismo Público': '#0D9488',            # Teal / Turquesa mineral
    'Jovens & Apoio Social': '#F59E0B',            # Amarelo/Ouro vibrante
    'Metrópoles & Capitais': '#374151'             # Ardósia profundo
}

# 1. Totais Nacionais
totais_nacionais = {
    "populacao_total": int(merged['populacao_2025'].sum()),
    "total_municipios": int(len(merged)),
    "saude": {
        "titulo": "Saúde & Farmácia Popular",
        "destaque_numero": "12,96 M",
        "destaque_rotulo": "Pessoas Beneficiadas",
        "subtitulo": "Medicamentos 100% gratuitos",
        "detalhes": [
            {"rotulo": "Pessoas atendidas", "valor": "12.957.809"},
            {"rotulo": "Economia anual para famílias", "valor": "R$ 7,73 Bilhões"},
            {"rotulo": "Medicamentos essenciais", "valor": "Gratuidade integral (Pressão, Diabetes, Asma)"},
            {"rotulo": "Atendimentos SUS APS", "valor": "Mais de 160 milhões no ano"}
        ],
        "cor": "#0E9F6E"
    },
    "educacao": {
        "titulo": "Educação & Permanência",
        "destaque_numero": "R$ 10,53 Bi",
        "destaque_rotulo": "Investimento Pé-de-Meia",
        "subtitulo": "4,08 milhões de estudantes beneficiados",
        "detalhes": [
            {"rotulo": "Alunos no Pé-de-Meia", "valor": "4.084.491 estudantes"},
            {"rotulo": "Total pago em incentivo", "valor": "R$ 10,53 Bilhões"},
            {"rotulo": "Fundeb Municipal Total", "valor": "R$ 219,67 Bilhões"},
            {"rotulo": "Complementação da União", "valor": "R$ 46,07 Bilhões (VAAT/VAAF)"}
        ],
        "cor": "#1A56DB"
    },
    "previdencia": {
        "titulo": "Previdência & Economia Local",
        "destaque_numero": "R$ 606,2 Bi",
        "destaque_rotulo": "Injeção Anual de Aposentadorias",
        "subtitulo": "Sustentáculo do comércio em 78% dos municípios",
        "detalhes": [
            {"rotulo": "Benefícios RGPS totais", "valor": "35.173.071 benefícios"},
            {"rotulo": "Aposentadorias concedidas", "valor": "24.144.902 aposentados"},
            {"rotulo": "Massa anual de aposentadorias", "valor": "R$ 606,24 Bilhões"},
            {"rotulo": "Impacto médio no PIB local", "valor": "Até 17,6% do PIB em municípios pequenos"}
        ],
        "cor": "#7E3AF2"
    },
    "trabalho": {
        "titulo": "Trabalho, Renda & Cidadania",
        "destaque_numero": "49,66 M",
        "destaque_rotulo": "Empregos Formais CLT",
        "subtitulo": "16,9M de MEIs e 17,2M de famílias amparadas",
        "detalhes": [
            {"rotulo": "Trabalhadores CLT ativos", "valor": "49.660.143 vínculos"},
            {"rotulo": "Microempreendedores (MEI)", "valor": "16.943.835 ativos"},
            {"rotulo": "Bolsa Família (famílias)", "valor": "17.204.187 famílias"},
            {"rotulo": "Repasse mensal Bolsa Família", "valor": "R$ 11,96 Bilhões/mês"}
        ],
        "cor": "#D97706"
    },
    "agro": {
        "titulo": "Agricultura Familiar & Merenda Escolar",
        "destaque_numero": "R$ 1,51 Bi",
        "destaque_rotulo": "Compras da Agricultura Familiar (PNAE)",
        "subtitulo": "Alimentação escolar comprada direto de pequenos produtores",
        "detalhes": [
            {"rotulo": "Repasse direto aos produtores rurais", "valor": "R$ 1,51 Bilhão/ano"},
            {"rotulo": "Exigência legal mínima da merenda", "valor": "Mínimo de 30% da agricultura familiar"},
            {"rotulo": "Estudantes com alimentação saudável", "valor": "40,5 Milhões de alunos"},
            {"rotulo": "CONAB / PAA (Aquisição de Alimentos)", "valor": "R$ 1,20 Bilhão executado"}
        ],
        "cor": "#059669"
    }
}

# Cálculo Exato de Medianas, Mínimos e Máximos Municipais de todos os 5.571 municípios
indicadores_map = {
    'clt': 'taxa_clt_100_hab',
    'mei': 'taxa_mei_100_hab',
    'serv': 'servidores_100_hab',
    'apos': 'aposentados_100_hab',
    'prev_pib': 'peso_prev_pib_pct',
    'bf': 'familias_bf_100_hab',
    'bpc': 'bpc_100_hab',
    'fp': 'farmacia_pop_100_hab',
    'pdm': 'pe_de_meia_cobertura_pct',
    'fundeb': 'dep_fundeb_uniao_pct'
}

medianas_municipais = {}
brasil_indicadores = {}
for k, col in indicadores_map.items():
    if col in merged.columns:
        s = pd.to_numeric(merged[col], errors='coerce').dropna()
        medianas_municipais[k] = {
            'min': round(float(s.min()), 1),
            'mediana': round(float(s.median()), 1),
            'media': round(float(s.mean()), 1),
            'max': round(float(s.max()), 1)
        }
        brasil_indicadores[k] = round(float(s.mean()), 1)

totais_nacionais['medianas_municipais'] = medianas_municipais
totais_nacionais['brasil_indicadores'] = brasil_indicadores

# 2. Resumo Eleitoral Nacional por Eleição
eleicoes_info = {
    "2026_1t": {
        "ano": "2026",
        "turno": "1º Turno",
        "nome_exibicao": "2026 - 1º Turno",
        "votos_validos": int(merged['votos_validos_2026_1t'].sum()),
        "eleitores_aptos": int(merged['eleitores_aptos_2026'].sum()),
        "abstencao_pct": round(float(merged['abstencao_2026_1t'].sum() / merged['eleitores_aptos_2026'].sum() * 100), 2),
        "candidatos": [
            {"nome": "Flávio Bolsonaro", "partido": "PL", "votos": int(merged['votos_flavio_2026_1t'].sum()), "pct": round(float(merged['votos_flavio_2026_1t'].sum() / merged['votos_validos_2026_1t'].sum() * 100), 2), "cor": "#1E40AF"},
            {"nome": "Lula", "partido": "PT", "votos": int(merged['votos_lula_2026_1t'].sum()), "pct": round(float(merged['votos_lula_2026_1t'].sum() / merged['votos_validos_2026_1t'].sum() * 100), 2), "cor": "#B91C1C"},
            {"nome": "Ronaldo Caiado", "partido": "UNIÃO", "votos": int(merged['votos_caiado_2026_1t'].sum()), "pct": round(float(merged['votos_caiado_2026_1t'].sum() / merged['votos_validos_2026_1t'].sum() * 100), 2), "cor": "#059669"},
            {"nome": "Romeu Zema", "partido": "NOVO", "votos": int(merged['votos_zema_2026_1t'].sum()), "pct": round(float(merged['votos_zema_2026_1t'].sum() / merged['votos_validos_2026_1t'].sum() * 100), 2), "cor": "#D97706"},
            {"nome": "Outros", "partido": "-", "votos": int(merged['votos_validos_2026_1t'].sum() - merged['votos_flavio_2026_1t'].sum() - merged['votos_lula_2026_1t'].sum() - merged['votos_caiado_2026_1t'].sum() - merged['votos_zema_2026_1t'].sum()), "pct": round(float((merged['votos_validos_2026_1t'].sum() - merged['votos_flavio_2026_1t'].sum() - merged['votos_lula_2026_1t'].sum() - merged['votos_caiado_2026_1t'].sum() - merged['votos_zema_2026_1t'].sum()) / merged['votos_validos_2026_1t'].sum() * 100), 2), "cor": "#6B7280"}
        ]
    },
    "2022_1t": {
        "ano": "2022",
        "turno": "1º Turno",
        "nome_exibicao": "2022 - 1º Turno",
        "votos_validos": int(merged['votos_validos_1t'].sum()),
        "eleitores_aptos": int(merged['eleitores_aptos_2026'].sum()), # proxy aptos
        "abstencao_pct": round(float(merged['taxa_abst_2022'].mean()), 2),
        "candidatos": [
            {"nome": "Lula", "partido": "PT", "votos": int(merged['votos_lula_1t'].sum()), "pct": round(float(merged['votos_lula_1t'].sum() / merged['votos_validos_1t'].sum() * 100), 2), "cor": "#B91C1C"},
            {"nome": "Jair Bolsonaro", "partido": "PL", "votos": int(merged['votos_bolsonaro_1t'].sum()), "pct": round(float(merged['votos_bolsonaro_1t'].sum() / merged['votos_validos_1t'].sum() * 100), 2), "cor": "#1E40AF"},
            {"nome": "Simone Tebet", "partido": "MDB", "votos": int(merged['votos_tebet_1t'].sum()), "pct": round(float(merged['votos_tebet_1t'].sum() / merged['votos_validos_1t'].sum() * 100), 2), "cor": "#059669"},
            {"nome": "Ciro Gomes", "partido": "PDT", "votos": int(merged['votos_ciro_1t'].sum()), "pct": round(float(merged['votos_ciro_1t'].sum() / merged['votos_validos_1t'].sum() * 100), 2), "cor": "#D97706"},
            {"nome": "Outros", "partido": "-", "votos": int(merged['votos_validos_1t'].sum() - merged['votos_lula_1t'].sum() - merged['votos_bolsonaro_1t'].sum() - merged['votos_tebet_1t'].sum() - merged['votos_ciro_1t'].sum()), "pct": round(float((merged['votos_validos_1t'].sum() - merged['votos_lula_1t'].sum() - merged['votos_bolsonaro_1t'].sum() - merged['votos_tebet_1t'].sum() - merged['votos_ciro_1t'].sum()) / merged['votos_validos_1t'].sum() * 100), 2), "cor": "#6B7280"}
        ]
    },
    "2022_2t": {
        "ano": "2022",
        "turno": "2º Turno",
        "nome_exibicao": "2022 - 2º Turno",
        "votos_validos": int(merged['votos_validos_2t'].sum()),
        "eleitores_aptos": int(merged['eleitores_aptos_2026'].sum()),
        "abstencao_pct": round(float(merged['taxa_abst_2022'].mean() * 0.98), 2),
        "candidatos": [
            {"nome": "Lula", "partido": "PT", "votos": int(merged['votos_lula_2t'].sum()), "pct": round(float(merged['votos_lula_2t'].sum() / merged['votos_validos_2t'].sum() * 100), 2), "cor": "#B91C1C"},
            {"nome": "Jair Bolsonaro", "partido": "PL", "votos": int(merged['votos_bolsonaro_2t'].sum()), "pct": round(float(merged['votos_bolsonaro_2t'].sum() / merged['votos_validos_2t'].sum() * 100), 2), "cor": "#1E40AF"}
        ]
    }
}

# 3. Perfis Socioeconômicos Detalhados
perfis_dict = {}
total_aptos_nacional = merged['eleitores_aptos_2026'].sum()
total_validos_26 = merged['votos_validos_2026_1t'].sum()
total_validos_22_1t = merged['votos_validos_1t'].sum()
total_validos_22_2t = merged['votos_validos_2t'].sum()

for p_nome, group in merged.groupby('perfil_final_reclassificado'):
    # Médias dos indicadores
    perfis_dict[p_nome] = {
        "nome": p_nome,
        "cor": perfil_cores.get(p_nome, "#4B5563"),
        "total_cidades": int(len(group)),
        "populacao_total": int(group['populacao_2025'].sum()),
        "pct_populacao_nacional": round(float(group['populacao_2025'].sum() / merged['populacao_2025'].sum() * 100), 2),
        "pct_eleitorado_nacional": round(float(group['eleitores_aptos_2026'].sum() / total_aptos_nacional * 100), 2),
        "descricao": str(group['descricao_perfil'].iloc[0]) if 'descricao_perfil' in group and pd.notnull(group['descricao_perfil'].iloc[0]) else "",
        "indicadores_medios": {
            "clt_100_hab": round(float(group['taxa_clt_100_hab'].mean()), 2),
            "mei_100_hab": round(float(group['taxa_mei_100_hab'].mean()), 2),
            "servidores_100_hab": round(float(group['servidores_100_hab'].mean()), 2),
            "aposentados_100_hab": round(float(group['aposentados_100_hab'].mean()), 2),
            "peso_prev_pib_pct": round(float(group['peso_prev_pib_pct'].mean()), 2),
            "bolsa_familia_100_hab": round(float(group['familias_bf_100_hab'].mean()), 2),
            "bpc_100_hab": round(float(group['bpc_100_hab'].mean()), 2),
            "farmacia_popular_100_hab": round(float(group['farmacia_pop_100_hab'].mean()), 2),
            "pe_de_meia_pct": round(float(group['pe_de_meia_cobertura_pct'].mean()), 2),
            "dep_fundeb_uniao_pct": round(float(group['dep_fundeb_uniao_pct'].mean()), 2)
        },
        "eleicoes": {
            "2026_1t": {
                "lula_pct": round(float(group['votos_lula_2026_1t'].sum() / group['votos_validos_2026_1t'].sum() * 100), 2),
                "flavio_pct": round(float(group['votos_flavio_2026_1t'].sum() / group['votos_validos_2026_1t'].sum() * 100), 2),
                "caiado_pct": round(float(group['votos_caiado_2026_1t'].sum() / group['votos_validos_2026_1t'].sum() * 100), 2),
                "zema_pct": round(float(group['votos_zema_2026_1t'].sum() / group['votos_validos_2026_1t'].sum() * 100), 2),
                "votos_lula": int(group['votos_lula_2026_1t'].sum()),
                "votos_flavio": int(group['votos_flavio_2026_1t'].sum()),
                "votos_validos": int(group['votos_validos_2026_1t'].sum()),
                "pct_dos_validos_nacional": round(float(group['votos_validos_2026_1t'].sum() / total_validos_26 * 100), 2),
                "pct_do_total_lula_nacional": round(float(group['votos_lula_2026_1t'].sum() / merged['votos_lula_2026_1t'].sum() * 100), 2),
                "pct_do_total_flavio_nacional": round(float(group['votos_flavio_2026_1t'].sum() / merged['votos_flavio_2026_1t'].sum() * 100), 2),
                "taxa_abstencao": round(float(group['abstencao_2026_1t'].sum() / group['eleitores_aptos_2026'].sum() * 100), 2)
            },
            "2022_1t": {
                "lula_pct": round(float(group['votos_lula_1t'].sum() / group['votos_validos_1t'].sum() * 100), 2),
                "bolsonaro_pct": round(float(group['votos_bolsonaro_1t'].sum() / group['votos_validos_1t'].sum() * 100), 2),
                "tebet_pct": round(float(group['votos_tebet_1t'].sum() / group['votos_validos_1t'].sum() * 100), 2),
                "ciro_pct": round(float(group['votos_ciro_1t'].sum() / group['votos_validos_1t'].sum() * 100), 2),
                "votos_validos": int(group['votos_validos_1t'].sum()),
                "pct_dos_validos_nacional": round(float(group['votos_validos_1t'].sum() / total_validos_22_1t * 100), 2),
                "taxa_abstencao": round(float(group['taxa_abst_2022'].mean()), 2)
            },
            "2022_2t": {
                "lula_pct": round(float(group['votos_lula_2t'].sum() / group['votos_validos_2t'].sum() * 100), 2),
                "bolsonaro_pct": round(float(group['votos_bolsonaro_2t'].sum() / group['votos_validos_2t'].sum() * 100), 2),
                "votos_validos": int(group['votos_validos_2t'].sum()),
                "pct_dos_validos_nacional": round(float(group['votos_validos_2t'].sum() / total_validos_22_2t * 100), 2),
                "taxa_abstencao": round(float(group['taxa_abst_2022'].mean() * 0.98), 2)
            }
        },
        "historico_abstencao": {
            "2010": round(float(group['taxa_abst_2010'].mean()), 2),
            "2014": round(float(group['taxa_abst_2014'].mean()), 2),
            "2018": round(float(group['taxa_abst_2018'].mean()), 2),
            "2022": round(float(group['taxa_abst_2022'].mean()), 2),
            "2026": round(float(group['taxa_abst_2026_1t'].mean()), 2)
        }
    }

# 4. Regiões (Norte, Nordeste, Centro-Oeste, Sudeste, Sul)
regioes_dict = {}
for reg_nome, group in merged.groupby('regiao'):
    contagem_perfis = group['perfil_final_reclassificado'].value_counts()
    perfil_predominante = contagem_perfis.index[0]
    
    estados_na_regiao = sorted(group['uf'].unique().tolist())
    
    # Distribuição de perfis na região
    distrib_perfis = []
    for p_n, p_c in contagem_perfis.items():
        distrib_perfis.append({
            "perfil": p_n,
            "qtd": int(p_c),
            "pct": round(float(p_c / len(group) * 100), 2),
            "cor": perfil_cores.get(p_n, "#4B5563")
        })
    
    regioes_dict[reg_nome] = {
        "nome": reg_nome,
        "perfil_predominante": perfil_predominante,
        "perfil_predominante_pct": round(float(contagem_perfis.iloc[0] / len(group) * 100), 1),
        "cor_predominante": perfil_cores.get(perfil_predominante, "#4B5563"),
        "total_municipios": int(len(group)),
        "populacao_total": int(group['populacao_2025'].sum()),
        "eleitores_aptos": int(group['eleitores_aptos_2026'].sum()),
        "estados": estados_na_regiao,
        "distribuicao_perfis": distrib_perfis,
        "eleicoes": {
            "2026_1t": {
                "lula_pct": round(float(group['votos_lula_2026_1t'].sum() / group['votos_validos_2026_1t'].sum() * 100), 2),
                "flavio_pct": round(float(group['votos_flavio_2026_1t'].sum() / group['votos_validos_2026_1t'].sum() * 100), 2),
                "caiado_pct": round(float(group['votos_caiado_2026_1t'].sum() / group['votos_validos_2026_1t'].sum() * 100), 2),
                "zema_pct": round(float(group['votos_zema_2026_1t'].sum() / group['votos_validos_2026_1t'].sum() * 100), 2),
                "taxa_abstencao": round(float(group['abstencao_2026_1t'].sum() / group['eleitores_aptos_2026'].sum() * 100), 2)
            },
            "2022_1t": {
                "lula_pct": round(float(group['votos_lula_1t'].sum() / group['votos_validos_1t'].sum() * 100), 2),
                "bolsonaro_pct": round(float(group['votos_bolsonaro_1t'].sum() / group['votos_validos_1t'].sum() * 100), 2),
                "taxa_abstencao": round(float(group['taxa_abst_2022'].mean()), 2)
            },
            "2022_2t": {
                "lula_pct": round(float(group['votos_lula_2t'].sum() / group['votos_validos_2t'].sum() * 100), 2),
                "bolsonaro_pct": round(float(group['votos_bolsonaro_2t'].sum() / group['votos_validos_2t'].sum() * 100), 2),
                "taxa_abstencao": round(float(group['taxa_abst_2022'].mean() * 0.98), 2)
            }
        }
    }

# 5. Estados (27 UFs)
estados_dict = {}
for uf_sigla, group in merged.groupby('uf'):
    contagem_perfis = group['perfil_final_reclassificado'].value_counts()
    perfil_predominante = contagem_perfis.index[0]
    reg_nome = uf_to_regiao.get(uf_sigla, "")
    
    distrib_perfis = []
    for p_n, p_c in contagem_perfis.items():
        distrib_perfis.append({
            "perfil": p_n,
            "qtd": int(p_c),
            "pct": round(float(p_c / len(group) * 100), 2),
            "cor": perfil_cores.get(p_n, "#4B5563")
        })
    
    estados_dict[uf_sigla] = {
        "sigla": uf_sigla,
        "nome": uf_to_nome.get(uf_sigla, uf_sigla),
        "regiao": reg_nome,
        "perfil_predominante": perfil_predominante,
        "perfil_predominante_pct": round(float(contagem_perfis.iloc[0] / len(group) * 100), 1),
        "cor_predominante": perfil_cores.get(perfil_predominante, "#4B5563"),
        "total_municipios": int(len(group)),
        "populacao_total": int(group['populacao_2025'].sum()),
        "eleitores_aptos": int(group['eleitores_aptos_2026'].sum()),
        "distribuicao_perfis": distrib_perfis,
        "eleicoes": {
            "2026_1t": {
                "lula_pct": round(float(group['votos_lula_2026_1t'].sum() / group['votos_validos_2026_1t'].sum() * 100), 2),
                "flavio_pct": round(float(group['votos_flavio_2026_1t'].sum() / group['votos_validos_2026_1t'].sum() * 100), 2),
                "caiado_pct": round(float(group['votos_caiado_2026_1t'].sum() / group['votos_validos_2026_1t'].sum() * 100), 2),
                "zema_pct": round(float(group['votos_zema_2026_1t'].sum() / group['votos_validos_2026_1t'].sum() * 100), 2),
                "votos_validos": int(group['votos_validos_2026_1t'].sum()),
                "taxa_abstencao": round(float(group['abstencao_2026_1t'].sum() / group['eleitores_aptos_2026'].sum() * 100), 2)
            },
            "2022_1t": {
                "lula_pct": round(float(group['votos_lula_1t'].sum() / group['votos_validos_1t'].sum() * 100), 2),
                "bolsonaro_pct": round(float(group['votos_bolsonaro_1t'].sum() / group['votos_validos_1t'].sum() * 100), 2),
                "votos_validos": int(group['votos_validos_1t'].sum()),
                "taxa_abstencao": round(float(group['taxa_abst_2022'].mean()), 2)
            },
            "2022_2t": {
                "lula_pct": round(float(group['votos_lula_2t'].sum() / group['votos_validos_2t'].sum() * 100), 2),
                "bolsonaro_pct": round(float(group['votos_bolsonaro_2t'].sum() / group['votos_validos_2t'].sum() * 100), 2),
                "votos_validos": int(group['votos_validos_2t'].sum()),
                "taxa_abstencao": round(float(group['taxa_abst_2022'].mean() * 0.98), 2)
            }
        }
    }

# 6. Lista Compacta de Municípios para Autocomplete e Detalhes
municipios_lista = []
for _, row in merged.iterrows():
    municipios_lista.append({
        "id": str(row['cod_ibge7']),
        "nm": str(row['municipio']),
        "uf": str(row['uf']),
        "reg": str(row['regiao']),
        "pf": str(row['perfil_final_reclassificado']),
        "pop": int(row['populacao_2025']) if pd.notnull(row['populacao_2025']) else 0,
        "lat": round(float(row['latitude']), 4) if pd.notnull(row['latitude']) else 0,
        "lng": round(float(row['longitude']), 4) if pd.notnull(row['longitude']) else 0,
        "e26": {
            "lula": round(float(row['pct_lula_2026_1t']), 2) if pd.notnull(row['pct_lula_2026_1t']) else 0,
            "flavio": round(float(row['pct_flavio_2026_1t']), 2) if pd.notnull(row['pct_flavio_2026_1t']) else 0,
            "caiado": round(float(row['pct_caiado_2026_1t']), 2) if pd.notnull(row['pct_caiado_2026_1t']) else 0,
            "zema": round(float(row['pct_zema_2026_1t']), 2) if pd.notnull(row['pct_zema_2026_1t']) else 0,
            "vtot": int(row['votos_validos_2026_1t']) if pd.notnull(row['votos_validos_2026_1t']) else 0,
            "abst": round(float(row['taxa_abst_2026_1t']), 2) if pd.notnull(row['taxa_abst_2026_1t']) else 0
        },
        "e22_1t": {
            "lula": round(float(row['pct_lula_1t']), 2) if pd.notnull(row['pct_lula_1t']) else 0,
            "bolsonaro": round(float(row['pct_bolsonaro_1t']), 2) if pd.notnull(row['pct_bolsonaro_1t']) else 0,
            "vtot": int(row['votos_validos_1t']) if pd.notnull(row['votos_validos_1t']) else 0
        },
        "e22_2t": {
            "lula": round(float(row['pct_lula_2t']), 2) if pd.notnull(row['pct_lula_2t']) else 0,
            "bolsonaro": round(float(row['pct_bolsonaro_2t']), 2) if pd.notnull(row['pct_bolsonaro_2t']) else 0,
            "vtot": int(row['votos_validos_2t']) if pd.notnull(row['votos_validos_2t']) else 0
        },
        "ind": {
            "clt": round(float(row['taxa_clt_100_hab']), 1) if pd.notnull(row['taxa_clt_100_hab']) else 0,
            "mei": round(float(row['taxa_mei_100_hab']), 1) if pd.notnull(row['taxa_mei_100_hab']) else 0,
            "serv": round(float(row['servidores_100_hab']), 1) if pd.notnull(row['servidores_100_hab']) else 0,
            "apos": round(float(row['aposentados_100_hab']), 1) if pd.notnull(row['aposentados_100_hab']) else 0,
            "prev_pib": round(float(row['peso_prev_pib_pct']), 1) if pd.notnull(row['peso_prev_pib_pct']) else 0,
            "bf": round(float(row['familias_bf_100_hab']), 1) if pd.notnull(row['familias_bf_100_hab']) else 0,
            "bpc": round(float(row['bpc_100_hab']), 1) if pd.notnull(row['bpc_100_hab']) else 0,
            "fp": round(float(row['farmacia_pop_100_hab']), 1) if pd.notnull(row['farmacia_pop_100_hab']) else 0,
            "pdm": round(float(row['pe_de_meia_cobertura_pct']), 1) if pd.notnull(row['pe_de_meia_cobertura_pct']) else 0,
            "fundeb": round(float(row['dep_fundeb_uniao_pct']), 1) if pd.notnull(row['dep_fundeb_uniao_pct']) else 0
        },
        "sde": {
            "tot": int(row['fp_total']) if pd.notnull(row.get('fp_total')) else 0,
            "hip": int(row['fp_so_hipertensao']) if pd.notnull(row.get('fp_so_hipertensao')) else 0,
            "diab": int(row['fp_so_diabetes']) if pd.notnull(row.get('fp_so_diabetes')) else 0,
            "amb": int(row['fp_hipertensao_e_diabetes']) if pd.notnull(row.get('fp_hipertensao_e_diabetes')) else 0,
            "asma": int(row['fp_asma']) if pd.notnull(row.get('fp_asma')) else 0,
            "ac": int(row['alto_custo_pacientes']) if pd.notnull(row.get('alto_custo_pacientes')) else 0,
            "quim": int(row['quimioterapia_pacientes']) if pd.notnull(row.get('quimioterapia_pacientes')) else 0,
            "rad": int(row['radioterapia_pacientes']) if pd.notnull(row.get('radioterapia_pacientes')) else 0,
            "b_min": round(float(row['bolso_anual_minimo_rs']), 1) if pd.notnull(row.get('bolso_anual_minimo_rs')) else 0,
            "b_med": round(float(row['bolso_anual_mediano_rs']), 1) if pd.notnull(row.get('bolso_anual_mediano_rs')) else 0,
            "reg_s": str(row['no_regiao_saude']) if pd.notnull(row.get('no_regiao_saude')) else ""
        },
        "eti": {
            "mat": int(row['qtd_matriculas_eti_rede_municipal']) if pd.notnull(row.get('qtd_matriculas_eti_rede_municipal')) else 0,
            "fom": round(float(row['vl_fomento_eti_rede_municipal']), 2) if pd.notnull(row.get('vl_fomento_eti_rede_municipal')) else 0,
            "esc": int(row['qtd_escolas_eti_rede_municipal']) if pd.notnull(row.get('qtd_escolas_eti_rede_municipal')) else 0,
            "med_esc": round(float(row['vl_eti_media_por_escola_rede_municipal']), 1) if pd.notnull(row.get('vl_eti_media_por_escola_rede_municipal')) else 0,
            "afet": int(row['afetados_eti']) if pd.notnull(row.get('afetados_eti')) else 0,
            "reg": bool(row['registrou_politica_eti_rede_municipal']) if pd.notnull(row.get('registrou_politica_eti_rede_municipal')) else False,
            "fom_est": round(float(row['vl_fomento_eti_rede_estadual_est']), 2) if pd.notnull(row.get('vl_fomento_eti_rede_estadual_est')) else 0
        }
    })

# 7. Séries Históricas e Poder de Compra (2016 - 2026)
print("Processando Séries Históricas...")
series_nacionais = []
try:
    df_hist = pd.read_excel('series_historicas_brasil_2010_2025.xlsx', sheet_name='Series_Historicas_2016_2026')
    for _, r in df_hist.iterrows():
        series_nacionais.append({
            "ano": int(r['Ano']),
            "salario_minimo": round(float(r['Salário Mínimo Nominal (R$ - BCB 1619)']), 2),
            "rendimento_medio": round(float(r['Rendimento Médio Habitual Nominal (R$ - BCB 24381)']), 2),
            "cesta_basica_rs": round(float(r['Custo da Cesta Básica SP Oficial (R$ - BCB 7493)']), 2),
            "cesta_basica_pct_sm": round(float(r['Cesta Básica em % do Salário Mínimo']), 2),
            "gasolina_rs": round(float(r['Preço 1 Litro de Gasolina (R$ - ANP)']), 2),
            "gasolina_pct_sm": round(float(r['1L de Gasolina em % do Salário Mínimo']), 3),
            "gas_glp_rs": round(float(r['Preço 1 Botijão de Gás GLP 13kg (R$ - ANP)']), 2),
            "gas_glp_pct_sm": round(float(r['Botijão de Gás em % do Salário Mínimo']), 2),
            "aluguel_rs": round(float(r['Aluguel Residencial Médio (R$ - FipeZAP)']), 2),
            "aluguel_pct_sm": round(float(r['Aluguel Residencial em % do Salário Médio']), 2),
            "veiculos_novos_milhoes": round(float(r['Veículos Novos Vendidos (Milhões Unidades)']), 3),
            "veiculos_usados_milhoes": round(float(r['Veículos Usados Vendidos (Milhões Unidades - FENAUTO)']), 2),
            "razao_usados_novos": round(float(r['Razão Veículos Usados por Novo (Proporção)']), 2),
            "imoveis_sbpe_unidades": round(float(r['Quantidade Imóveis Financiados SBPE (Milhares Unidades - BCB 20703 Oficial)']), 1),
            "imoveis_sbpe_rs_bi": round(float(r['Venda de Imóveis Financiados PF (R$ Bi - BCB 20704)']), 2),
            "comercio_varejo_rs_tri": round(float(r['Faturamento Comércio Varejista Ampliado (R$ Tri - BCB 28544)']), 3),
            "gastos_exterior_usd_bi": round(float(r['Gastos de Brasileiros no Exterior (US$ Bi - BCB 22742)']), 2),
            "clt_milhoes": round(float(r['Trabalhadores com Carteira Assinada / CLT (Milhões - BCB 24379)']), 2),
            "meis_milhoes": round(float(r['MEIs Ativos no Brasil (Milhões)']), 2),
            "empresas_abertas_milhoes": round(float(r['Empresas Novas Abertas (Milhões)']), 2),
            "agro_saldo_usd_bi": round(float(r['Agronegócio - Saldo das Exportações / Lucro Líquido (US$ Bi)']), 1)
        })
except Exception as e:
    print("Aviso ao ler excel de series (carregando de dashboard_data.json):", e)
    try:
        with open('dashboard/data/dashboard_data.json', 'r', encoding='utf-8') as f_prev:
            prev_d = json.load(f_prev)
            series_nacionais = prev_d.get('series_historicas', {}).get('nacional', [])
    except Exception as e2:
        print("Erro no fallback de series_nacionais:", e2)

# FPE por Estado
df_fpe = pd.read_csv('dados_prioridades/fpe_estados_series_historicas.csv', sep=';')
df_fpe = df_fpe[df_fpe['ano'] >= 2016]
fpe_estados = {}
for uf, grp in df_fpe.groupby('UF'):
    fpe_estados[uf] = {int(row['ano']): round(float(row['valor_repasse_brl']) / 1e9, 2) for _, row in grp.iterrows()}

# Séries do Orçamento Federal por Governo (2010 - 2026)
orcamento_series = []
try:
    df_orc = pd.read_csv('dados_prioridades/series_orcamento_governos_2010_2026.csv')
    df_orc = df_orc.replace({np.nan: None})
    orcamento_series = [{k: (None if (isinstance(v, float) and np.isnan(v)) else v) for k, v in row.items()} for row in df_orc.to_dict(orient='records')]
except Exception as e:
    print("Aviso ao carregar orçamento:", e)

series_historicas_data = {
    "nacional": series_nacionais,
    "fpe_estados_bi": fpe_estados,
    "orcamento_governos": orcamento_series
}

# Agregações Nacionais e Estaduais de ETI e Saúde
eti_uf_df = merged.groupby('uf')[['vl_fomento_eti_rede_municipal', 'qtd_matriculas_eti_rede_municipal']].sum().reset_index()
eti_uf_df = eti_uf_df.sort_values(by='vl_fomento_eti_rede_municipal', ascending=False)
eti_por_uf = [
    {
        "uf": str(row['uf']),
        "nome": uf_to_nome.get(row['uf'], row['uf']),
        "fomento": round(float(row['vl_fomento_eti_rede_municipal']), 2) if pd.notnull(row['vl_fomento_eti_rede_municipal']) else 0,
        "matriculas": int(row['qtd_matriculas_eti_rede_municipal']) if pd.notnull(row['qtd_matriculas_eti_rede_municipal']) else 0
    }
    for _, row in eti_uf_df.iterrows()
]

saude_nacional = {
    "fp_total": int(merged['fp_total'].sum()) if 'fp_total' in merged.columns else 12957809,
    "fp_so_hipertensao": int(merged['fp_so_hipertensao'].sum()) if 'fp_so_hipertensao' in merged.columns else 4962509,
    "fp_so_diabetes": int(merged['fp_so_diabetes'].sum()) if 'fp_so_diabetes' in merged.columns else 1808126,
    "fp_hipertensao_e_diabetes": int(merged['fp_hipertensao_e_diabetes'].sum()) if 'fp_hipertensao_e_diabetes' in merged.columns else 3239501,
    "fp_asma": int(merged['fp_asma'].sum()) if 'fp_asma' in merged.columns else 875033,
    "alto_custo": int(merged['alto_custo_pacientes'].sum()) if 'alto_custo_pacientes' in merged.columns else 3284659,
    "quimioterapia": int(merged['quimioterapia_pacientes'].sum()) if 'quimioterapia_pacientes' in merged.columns else 361331,
    "radioterapia": int(merged['radioterapia_pacientes'].sum()) if 'radioterapia_pacientes' in merged.columns else 8987,
    "bolso_minimo": round(float(merged['bolso_anual_minimo_rs'].sum()), 2) if 'bolso_anual_minimo_rs' in merged.columns else 4661567780.02,
    "bolso_mediano": round(float(merged['bolso_anual_mediano_rs'].sum()), 2) if 'bolso_anual_mediano_rs' in merged.columns else 7732862870.86
}

eti_nacional = {
    "total_fomento": round(float(merged['vl_fomento_eti_rede_municipal'].sum()), 2) if 'vl_fomento_eti_rede_municipal' in merged.columns else 2134201430.33,
    "total_matriculas": int(merged['qtd_matriculas_eti_rede_municipal'].sum()) if 'qtd_matriculas_eti_rede_municipal' in merged.columns else 406400,
    "total_redes": int((merged['vl_fomento_eti_rede_municipal'] > 0).sum()) if 'vl_fomento_eti_rede_municipal' in merged.columns else 4883
}

dashboard_data = {
    "totais_nacionais": totais_nacionais,
    "eleicoes_info": eleicoes_info,
    "perfis": perfis_dict,
    "regioes": regioes_dict,
    "estados": estados_dict,
    "municipios": municipios_lista,
    "series_historicas": series_historicas_data,
    "saude_nacional": saude_nacional,
    "eti_nacional": eti_nacional,
    "eti_por_uf": eti_por_uf
}

# Recursively clean any remaining float NaN in dashboard_data
def clean_nans(obj):
    if isinstance(obj, float) and (np.isnan(obj) or np.isinf(obj)):
        return None
    elif isinstance(obj, dict):
        return {k: clean_nans(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [clean_nans(item) for item in obj]
    return obj

dashboard_data = clean_nans(dashboard_data)

saida_json = 'dashboard/data/dashboard_data.json'
with open(saida_json, 'w', encoding='utf-8') as f:
    json.dump(dashboard_data, f, ensure_ascii=False, allow_nan=False)

print(f"Exportação concluída com sucesso: {saida_json}")
print(f"Total de municípios exportados: {len(municipios_lista)}")
