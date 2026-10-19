"""
Módulo de Extração: Série Histórica de Preços de Combustíveis (Gasolina e GLP)
Fonte Primária: Agência Nacional do Petróleo, Gás Natural e Biocombustíveis (ANP)
Sistema: Levantamento de Preços de Combustíveis (LPC) / Dados Abertos ANP
Portal Oficial: https://www.gov.br/anp/pt-br/centrais-de-conteudo/dados-abertos
"""

import os
import pandas as pd

DIRETORIO_ATUAL = os.path.dirname(__file__)
CACHE_DIR = os.path.join(DIRETORIO_ATUAL, 'cache')
os.makedirs(CACHE_DIR, exist_ok=True)
CACHE_CSV = os.path.join(CACHE_DIR, 'anp_combustiveis_anual.csv')

FONTE_OFICIAL_CSV = os.path.join(DIRETORIO_ATUAL, '..', 'dados_prioridades', 'fontes_oficiais', 'serie_anp_combustiveis_oficial.csv')

def obter_combustiveis_anp(forcar_atualizacao=False):
    """
    Retorna a série histórica oficial consolidada dos preços médios anuais
    ao consumidor para Gasolina Comum (R$/Litro) e Botijão de GLP 13kg (R$).
    Carrega a base oficial auditável da ANP com proveniência e links governamentais.
    """
    if not forcar_atualizacao and os.path.exists(CACHE_CSV):
        try:
            df = pd.read_csv(CACHE_CSV)
            if not df.empty and 'gasolina_rs' in df.columns:
                print("✔️ [ANP] Série de preços de combustíveis (Gasolina e GLP) carregada do cache validado.")
                return df
        except Exception:
            pass

    if not os.path.exists(FONTE_OFICIAL_CSV):
        raise FileNotFoundError(
            f"Arquivo de dados oficiais da ANP não encontrado em: {FONTE_OFICIAL_CSV}. "
            "Consulte https://www.gov.br/anp/ para obter a base consolidada do LPC."
        )

    # Lê da base oficial auditável
    df = pd.read_csv(FONTE_OFICIAL_CSV)
    
    # Validação de integridade dos campos esperados
    colunas_obrigatorias = ['ano', 'gasolina_rs', 'gas_glp_rs']
    for col in colunas_obrigatorias:
        if col not in df.columns:
            raise ValueError(f"Base da ANP corrompida: coluna '{col}' ausente.")

    # Se tiver a coluna 'fonte', mantém ou padroniza
    if 'fonte' not in df.columns:
        df['fonte'] = df.apply(lambda r: f"{r.get('orgao_emissor', 'ANP')} - {r.get('sistema_origem', 'LPC')}", axis=1)

    df.to_csv(CACHE_CSV, index=False)
    print(f"✅ [ANP] Série oficial de combustíveis carregada com sucesso ({len(df)} anos apurados da ANP).")
    return df

if __name__ == '__main__':
    df = obter_combustiveis_anp(forcar_atualizacao=True)
    print(df[['ano', 'gasolina_rs', 'gas_glp_rs', 'fonte']])
