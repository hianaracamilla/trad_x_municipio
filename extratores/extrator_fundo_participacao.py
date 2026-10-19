"""
Módulo de Extração: Séries Históricas dos Fundos de Participação (FPM e FPE)
Fonte Oficial: Secretaria do Tesouro Nacional (STN) / Ministério da Fazenda & Tesouro Transparente.
"""

import os
import pandas as pd
import requests

def extrair_fpe_estados_historico(caminho_planilha_stn='dados_prioridades/transferencias_consolidadas_stn.xlsx',
                                   ano_inicio=2010):
    """
    Extrai a série histórica anual dos repasses do Fundo de Participação dos Estados (FPE)
    para as 27 Unidades da Federação.
    """
    if not os.path.exists(caminho_planilha_stn):
        raise FileNotFoundError(f"Arquivo não encontrado: {caminho_planilha_stn}")
        
    df_fpe = pd.read_excel(caminho_planilha_stn, sheet_name='FPE', skiprows=7)
    df_fpe.dropna(subset=['ESTADOS', 'UF'], inplace=True)
    df_fpe = df_fpe[df_fpe['UF'].str.len() == 2]

    cols_id = ['ESTADOS', 'UF']
    cols_val = [c for c in df_fpe.columns if c not in cols_id and not str(c).startswith('Unnamed')]

    df_long = df_fpe.melt(id_vars=cols_id, value_vars=cols_val, var_name='data_repasse', value_name='valor_repasse_brl')
    df_long['data_repasse'] = pd.to_datetime(df_long['data_repasse'], errors='coerce')
    df_long['ano'] = df_long['data_repasse'].dt.year
    df_long['valor_repasse_brl'] = pd.to_numeric(df_long['valor_repasse_brl'], errors='coerce').fillna(0)

    df_anual = df_long[df_long['ano'] >= ano_inicio].groupby(['ano', 'ESTADOS', 'UF'])['valor_repasse_brl'].sum().reset_index()
    return df_anual

def baixar_fpm_mensal_municipios(ano, mes, pasta_destino='dados_prioridades/fpm_mensal'):
    """
    Baixa o arquivo mensal detalhado do FPM de todos os 5.571 municípios do país
    direto do portal de dados abertos do Tesouro Transparente.
    """
    os.makedirs(pasta_destino, exist_ok=True)
    url_base = "https://www.tesourotransparente.gov.br/ckan/dataset/af4e7c47-2132-4d9a-bd7c-34e28a210b03/resource"
    # Consulta via API CKAN do Tesouro para pegar a URL do mês específico
    api_url = f"https://www.tesourotransparente.gov.br/ckan/api/3/action/package_show?id=transferencias-constitucionais-para-municipios"
    r = requests.get(api_url, timeout=20)
    if r.status_code == 200:
        res = r.json().get('result', {}).get('resources', [])
        termo = f"{ano}{str(mes).zfill(2)}"
        for item in res:
            if termo in item.get('name', ''):
                url_csv = item.get('url')
                dest = os.path.join(pasta_destino, f"transferencias_fpm_{termo}.csv")
                r_file = requests.get(url_csv, timeout=40)
                with open(dest, 'wb') as f:
                    f.write(r_file.content)
                print(f"✅ Arquivo baixado com sucesso: {dest}")
                return dest
    return None

if __name__ == '__main__':
    df_fpe = extrair_fpe_estados_historico()
    print("Amostra do FPE histórico:")
    print(df_fpe.tail())
