"""
Módulo de Extração: Dinâmica Empresarial e MEIs Ativos no Brasil (2016 - 2026)
Fontes Primárias:
- Ministério do Desenvolvimento, Indústria, Comércio e Serviços (MDIC / DREI - Mapa de Empresas)
- Receita Federal do Brasil (RFB / Simples Nacional / Portal do Empreendedor)
Portal Oficial: https://www.gov.br/empresas-e-negocios/pt-br/mapa-de-empresas
"""

import os
import pandas as pd

DIRETORIO_ATUAL = os.path.dirname(__file__)
CACHE_DIR = os.path.join(DIRETORIO_ATUAL, 'cache')
os.makedirs(CACHE_DIR, exist_ok=True)
CACHE_CSV = os.path.join(CACHE_DIR, 'empresas_meis_anual.csv')

FONTE_OFICIAL_CSV = os.path.join(DIRETORIO_ATUAL, '..', 'dados_prioridades', 'fontes_oficiais', 'serie_mapa_empresas_meis_oficial.csv')

def obter_empresas_e_meis(forcar_atualizacao=False):
    """
    Retorna a série histórica oficial consolidada de:
    1. Novas Empresas Abertas no Brasil (Milhões) - Mapa de Empresas (DREI / MDIC)
    2. Estoque de Microempreendedores Individuais (MEIs Ativos em Milhões) - Receita Federal / Simples Nacional
    Lê a base oficial auditável de fontes governamentais.
    """
    if not forcar_atualizacao and os.path.exists(CACHE_CSV):
        try:
            df = pd.read_csv(CACHE_CSV)
            if not df.empty and 'empresas_abertas_milhoes' in df.columns and 'meis_ativos_milhoes' in df.columns:
                print("✔️ [MDIC/RFB] Dados de Empresas Abertas e MEIs carregados do cache validado.")
                return df
        except Exception:
            pass

    if not os.path.exists(FONTE_OFICIAL_CSV):
        raise FileNotFoundError(
            f"Arquivo de dados oficiais de empresas e MEIs não encontrado em: {FONTE_OFICIAL_CSV}. "
            "Consulte https://www.gov.br/empresas-e-negocios/pt-br/mapa-de-empresas para obter os dados oficiais."
        )

    # Lê da base oficial auditável
    df = pd.read_csv(FONTE_OFICIAL_CSV)
    
    # Validação de integridade
    colunas_obrigatorias = ['ano', 'empresas_abertas_milhoes', 'meis_ativos_milhoes']
    for col in colunas_obrigatorias:
        if col not in df.columns:
            raise ValueError(f"Base de Empresas e MEIs corrompida: coluna '{col}' ausente.")

    if 'fonte' not in df.columns:
        df['fonte'] = df.apply(lambda r: f"{r.get('orgao_emissor', 'MDIC / RFB')} - {r.get('sistema_origem', 'Mapa de Empresas')}", axis=1)

    df.to_csv(CACHE_CSV, index=False)
    print(f"✅ [MDIC/RFB] Série oficial de Empresas e MEIs carregada com sucesso ({len(df)} anos apurados).")
    return df

if __name__ == '__main__':
    df = obter_empresas_e_meis(forcar_atualizacao=True)
    print(df[['ano', 'empresas_abertas_milhoes', 'meis_ativos_milhoes', 'fonte']])
