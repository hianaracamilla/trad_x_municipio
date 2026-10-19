"""
Módulo de extratores automatizados de séries socioeconômicas históricas do Brasil.
"""
from .extrator_fipezap import obter_aluguel_fipezap
from .extrator_anp import obter_combustiveis_anp
from .extrator_empresas import obter_empresas_e_meis
from .extrator_agro import obter_saldo_agrostat
from .extrator_veiculos_usados import obter_veiculos_usados
from .extrator_orcamento_governos import extrair_series_orcamento_completas, salvar_bases_consolidadas
