"""
Módulo de Extração: Saldo Comercial Líquido das Exportações do Agronegócio (US$ Bi)
Fontes Primárias: Ministério da Agricultura e Pecuária (AgroStat / MAPA) e Secex (MDIC / ComexStat)
Portal Oficial: https://indicadores.agricultura.gov.br/agrostat/index.htm
"""

import os
import pandas as pd

DIRETORIO_ATUAL = os.path.dirname(__file__)
CACHE_DIR = os.path.join(DIRETORIO_ATUAL, 'cache')
os.makedirs(CACHE_DIR, exist_ok=True)
CACHE_CSV = os.path.join(CACHE_DIR, 'agro_saldo_exportacoes.csv')

FONTE_OFICIAL_CSV = os.path.join(DIRETORIO_ATUAL, '..', 'dados_prioridades', 'fontes_oficiais', 'serie_agrostat_exportacoes_oficial.csv')

def obter_saldo_agrostat(forcar_atualizacao=False):
    """
    Retorna a série histórica oficial consolidada do Saldo Comercial Líquido
    das Exportações do Agronegócio Brasileiro em US$ Bilhões (Exportações Agro - Importações Agro),
    apurada pelo Ministério da Agricultura e Pecuária (AgroStat / MAPA) e Secex (MDIC).
    """
    if not forcar_atualizacao and os.path.exists(CACHE_CSV):
        try:
            df = pd.read_csv(CACHE_CSV)
            if not df.empty and 'agro_saldo_export_usd_bi' in df.columns:
                print("✔️ [AgroStat/MAPA] Saldo das exportações do Agro carregado do cache validado.")
                return df
        except Exception:
            pass

    if not os.path.exists(FONTE_OFICIAL_CSV):
        raise FileNotFoundError(
            f"Arquivo de dados oficiais do AgroStat não encontrado em: {FONTE_OFICIAL_CSV}. "
            "Consulte https://indicadores.agricultura.gov.br/agrostat/index.htm para obter o relatório oficial."
        )

    # Lê da base oficial auditável
    df = pd.read_csv(FONTE_OFICIAL_CSV)
    
    # Validação de integridade
    colunas_obrigatorias = ['ano', 'agro_saldo_export_usd_bi']
    for col in colunas_obrigatorias:
        if col not in df.columns:
            raise ValueError(f"Base do AgroStat corrompida: coluna '{col}' ausente.")

    if 'fonte' not in df.columns:
        df['fonte'] = df.apply(lambda r: f"{r.get('orgao_emissor', 'MAPA')} / {r.get('sistema_origem', 'AgroStat')}", axis=1)

    df.to_csv(CACHE_CSV, index=False)
    print(f"✅ [AgroStat/MAPA] Série oficial de saldo do agronegócio carregada com sucesso ({len(df)} anos apurados).")
    return df

if __name__ == '__main__':
    df = obter_saldo_agrostat(forcar_atualizacao=True)
    print(df[['ano', 'agro_saldo_export_usd_bi', 'fonte']])
