"""
Módulo de Cálculo e Argumentação Econômica: Impacto da Desvinculação do Salário Mínimo e Previdência Municipal

Parâmetros Oficiais de Referência:
- Salário Mínimo Nominal Oficial: R$ 1.518,00
- Política de Reajuste da Previdência: Mediana da Inflação IPCA 10 anos (4,57%) + Mediana do PIB positivo 10 anos (2,65%) = 7,22% a.a.
- Faixa de Isenção do Imposto de Renda: Proposta de isenção até R$ 5.000,00

Critério Estratégico de Grupos (Corte na Média Nacional de 1 SM - R$ 1.518,00):
- Grupo 1 (Média até 1 SM - ≤ R$ 1.518,00):
  Foco: Congelamento do Salário Mínimo (fim do reajuste integral de inflação + ganho real do PIB) somado ao fim do remédio gratuito na Farmácia Popular.
- Grupo 2 (Média acima de 1 SM - > R$ 1.518,00):
  Foco: Desindexação dos benefícios previdenciários + revogação da isenção do Imposto de Renda até R$ 5 mil somada ao fim do remédio gratuito na Farmácia Popular.
"""

SALARIO_MINIMO_REF = 1518.00

# Metodologia Oficial de Reajuste (2016-2025):
# 1. Mediana da Inflação Anual (IPCA dos 10 anos): 4,57%
# 2. Mediana do Crescimento do PIB (ignorando anos negativos): 2,65%
# 3. Soma das 2 medianas (Reajuste Anual Total): 4,57% + 2,65% = 7,22%
MEDIANA_IPCA_10_ANOS = 0.0457
MEDIANA_PIB_POSITIVO_10_ANOS = 0.0265
TAXA_REAJUSTE_TOTAL = 0.0722  # 7,22% ao ano

TAXA_GANHO_REAL_SM = TAXA_REAJUSTE_TOTAL   # 7,22% ao ano
TAXA_DESINDEXACAO_G2 = TAXA_REAJUSTE_TOTAL # 7,22% ao ano
ISENCAO_IR_TETO = 5000.00

def classificar_grupo(valor_medio):
    """
    Classifica o município no Grupo 1 ou Grupo 2 com base no valor médio da aposentadoria.
    """
    if valor_medio is None or valor_medio <= 0:
        return "Grupo 1 (Até 1 SM)"
    if valor_medio <= SALARIO_MINIMO_REF:
        return "Grupo 1 (Até 1 SM)"
    return "Grupo 2 (Acima de 1 SM)"

def calcular_impacto_anual(valor_liquido_apos_ano, valor_medio, comercios=1, aposentados=0, populacao=1, **kwargs):
    """
    Calcula o montante anual em R$ que deixa de circular na economia do município
    caso haja desvinculação ou fim da política de valorização do salário mínimo.
    
    Retorna:
    - impacto_anual_brl (float): Volume total em R$ retirado da economia municipal por ano
    - impacto_por_comercio_anual_brl (float): Perda anual média por microempresa ativa de comércio
    """
    if not valor_liquido_apos_ano or valor_liquido_apos_ano <= 0:
        return 0.0, 0.0
    
    grupo = classificar_grupo(valor_medio)
    
    if "Grupo 1" in grupo:
        # Perda do ganho real do salário mínimo sobre a folha anual de aposentadorias
        impacto_anual = valor_liquido_apos_ano * TAXA_GANHO_REAL_SM
    else:
        # Perda decorrente da desindexação geral e pressão inflacionária sobre benefícios acima do piso
        impacto_anual = valor_liquido_apos_ano * TAXA_DESINDEXACAO_G2
        
    qtd_com = comercios if comercios and comercios > 0 else 1
    impacto_comercio = impacto_anual / qtd_com
    
    return round(impacto_anual, 2), round(impacto_comercio, 2)

def obter_argumento_economico(valor_medio):
    """
    Retorna a linha argumentativa exata para a realidade do município.
    """
    grupo = classificar_grupo(valor_medio)
    if "Grupo 1" in grupo:
        return (
            "Fim do ganho real do Salário Mínimo (congelamento no piso de R$ 1.518,00) "
            "somado ao risco de corte no remédio gratuito da Farmácia Popular."
        )
    return (
        "Desindexação dos benefícios previdenciários + revogação da isenção do Imposto de Renda "
        "até R$ 5 mil somada ao fim do remédio gratuito na Farmácia Popular."
    )
