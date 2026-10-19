import os
import urllib.request
import pandas as pd

CACHE_DIR = os.path.join(os.path.dirname(__file__), 'cache')
os.makedirs(CACHE_DIR, exist_ok=True)
CACHE_XLSX = os.path.join(CACHE_DIR, 'fipezap_serieshistoricas.xlsx')
CACHE_CSV = os.path.join(CACHE_DIR, 'fipezap_aluguel_anual.csv')
FIPEZAP_URL = 'https://downloads.fipe.org.br/indices/fipezap/fipezap-serieshistoricas.xlsx'

def obter_aluguel_fipezap(forcar_download=False, metragem_padrao=60.0):
    """
    Extrai a série histórica oficial do Índice FipeZAP de Locação Residencial.
    Calcula o valor médio de locação (R$) anual para um imóvel padrão.
    Utiliza cache local inteligente em formato CSV/Excel.
    """
    if not forcar_download and os.path.exists(CACHE_CSV):
        try:
            df_cache = pd.read_csv(CACHE_CSV)
            if not df_cache.empty and 'ano' in df_cache.columns and 'aluguel_rs' in df_cache.columns:
                print("✔️ [FipeZAP] Dados de locação residencial carregados do cache local.")
                return df_cache
        except Exception:
            pass

    # Tenta download da série oficial no portal da FIPE
    try:
        print("🌐 [FipeZAP] Baixando planilha oficial de séries históricas da FIPE...")
        req = urllib.request.Request(FIPEZAP_URL, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
        with urllib.request.urlopen(req, timeout=25) as resp:
            with open(CACHE_XLSX, 'wb') as f:
                f.write(resp.read())
        print("✔️ [FipeZAP] Download concluído com sucesso!")
    except Exception as e:
        print(f"⚠️ [FipeZAP] Falha ao baixar diretamente da FIPE ({e}). Verificando cache local...")
        if os.path.exists(CACHE_CSV):
            return pd.read_csv(CACHE_CSV)

    if not os.path.exists(CACHE_XLSX):
        raise FileNotFoundError("Planilha FipeZAP não encontrada e indisponível para download.")

    print("⚙️ [FipeZAP] Processando série histórica do Índice FipeZAP de Locação Residencial...")
    df = pd.read_excel(CACHE_XLSX, sheet_name='Índice FipeZAP')
    datas = df.iloc[3:, 1]
    preco_m2 = pd.to_numeric(df.iloc[3:, 37], errors='coerce')
    
    df_loc = pd.DataFrame({'data': pd.to_datetime(datas), 'preco_m2': preco_m2}).dropna()
    df_loc['ano'] = df_loc['data'].dt.year.astype(int)
    df_loc = df_loc[(df_loc['ano'] >= 2016) & (df_loc['ano'] <= 2026)]

    df_anual = df_loc.groupby('ano')['preco_m2'].mean().reset_index()
    df_anual['aluguel_rs'] = (df_anual['preco_m2'] * metragem_padrao).round(2)
    df_anual.to_csv(CACHE_CSV, index=False)
    print("✅ [FipeZAP] Série de aluguel residencial anual consolidada e salva em cache.")
    return df_anual

if __name__ == '__main__':
    df = obter_aluguel_fipezap(forcar_download=True)
    print(df)
