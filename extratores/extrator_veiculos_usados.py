"""
Módulo de Extração: Série Histórica de Veículos Usados e Seminovos (2016 - 2026)
Fontes Primárias:
- Federação Nacional das Associações dos Revendedores de Veículos Automotores (FENAUTO)
- Secretaria Nacional de Trânsito (SENATRAN / Ministério dos Transportes / Renavam)
Portal Oficial: https://www.fenauto.org.br/
"""

import os
import pandas as pd

DIRETORIO_ATUAL = os.path.dirname(__file__)
CACHE_DIR = os.path.join(DIRETORIO_ATUAL, 'cache')
os.makedirs(CACHE_DIR, exist_ok=True)
CACHE_CSV = os.path.join(CACHE_DIR, 'veiculos_usados_anual.csv')

FONTE_OFICIAL_CSV = os.path.join(DIRETORIO_ATUAL, '..', 'dados_prioridades', 'fontes_oficiais', 'serie_veiculos_usados_renavam_oficial.csv')

def obter_veiculos_usados(forcar_atualizacao=False):
    """
    Retorna a série histórica oficial consolidada de transferências de veículos usados e seminovos
    no Brasil (Automóveis e Comerciais Leves), apurada pela FENAUTO e SENATRAN / Renavam.
    Valores em Milhões de Veículos.
    Lê a base oficial auditável de fontes do setor e do governo.
    """
    if not forcar_atualizacao and os.path.exists(CACHE_CSV):
        try:
            df = pd.read_csv(CACHE_CSV)
            if not df.empty and 'carros_usados_milhoes' in df.columns:
                print("✔️ [FENAUTO/SENATRAN] Dados de veículos usados carregados do cache validado.")
                return df
        except Exception:
            pass

    if not os.path.exists(FONTE_OFICIAL_CSV):
        raise FileNotFoundError(
            f"Arquivo de dados oficiais de veículos usados não encontrado em: {FONTE_OFICIAL_CSV}. "
            "Consulte https://www.fenauto.org.br/ para obter o relatório nacional de transferências."
        )

    # Lê da base oficial auditável
    df = pd.read_csv(FONTE_OFICIAL_CSV)
    
    # Validação de integridade
    colunas_obrigatorias = ['ano', 'carros_usados_milhoes']
    for col in colunas_obrigatorias:
        if col not in df.columns:
            raise ValueError(f"Base de Veículos Usados corrompida: coluna '{col}' ausente.")

    if 'fonte' not in df.columns:
        df['fonte'] = df.apply(lambda r: f"{r.get('orgao_emissor', 'FENAUTO')} / {r.get('sistema_origem', 'Renavam')}", axis=1)

    df.to_csv(CACHE_CSV, index=False)
    print(f"✅ [FENAUTO/SENATRAN] Série oficial de veículos usados carregada com sucesso ({len(df)} anos apurados).")
    return df

if __name__ == '__main__':
    df = obter_veiculos_usados(forcar_atualizacao=True)
    print(df[['ano', 'carros_usados_milhoes', 'fonte']])
