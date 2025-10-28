#!/usr/bin/env python3
import json
import os
import sys
import mysql.connector
from urllib.parse import urlparse, parse_qs

# Obter DATABASE_URL do ambiente
database_url = os.getenv('DATABASE_URL')
if not database_url:
    print("❌ DATABASE_URL não configurada!")
    sys.exit(1)

print("🚀 Iniciando importação de medicamentos...\n")

# Parsear DATABASE_URL
# Formato: mysql://user:pass@host:port/database?ssl=...
parsed = urlparse(database_url)
db_config = {
    'user': parsed.username,
    'password': parsed.password,
    'host': parsed.hostname,
    'port': parsed.port or 3306,
    'database': parsed.path.lstrip('/'),
    'ssl_disabled': False,
}

# Conectar ao banco
print("🔌 Conectando ao banco de dados MySQL...")
conn = mysql.connector.connect(**db_config)
cur = conn.cursor()

# Ler JSON
print("📖 Lendo arquivo JSON...")
with open('/home/ubuntu/medko/data/medicamentos.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

total = len(data)
print(f"📊 Total de medicamentos encontrados: {total}\n")

# Preparar dados
BATCH_SIZE = 500
imported = 0

for i in range(0, total, BATCH_SIZE):
    batch = data[i:i+BATCH_SIZE]
    
    values = []
    for med in batch:
        medication_data = (
            med.get('codigo'),
            med.get('numeroRegistro'),
            med.get('nomeProduto', 'Sem nome'),
            med.get('numeroProcesso', ''),
            med.get('empresaNome'),
            med.get('empresaCnpj'),
            med.get('principioAtivo'),
            med.get('tarja'),
            json.dumps(med.get('apresentacoes')) if med.get('apresentacoes') else None,
            med.get('bula_txt', '')[:65000] if med.get('bula_txt') else None,
            med.get('bula_pdf_url'),
            med.get('bula_txt_profissional', '')[:65000] if med.get('bula_txt_profissional') else None,
            med.get('bula_pdf_profissional_url'),
            med.get('categoriaRegulatoria'),
            med.get('situacaoRegistro'),
            med.get('medicamentoReferencia'),
            med.get('classesTerapeuticas'),
            med.get('indicacao'),
            med.get('dataProduto'),
            med.get('dataVencimentoRegistro'),
            med.get('dataPublicacao'),
        )
        values.append(medication_data)
    
    # Inserir lote
    sql = """
        INSERT INTO medications (
            codigo, numeroRegistro, nomeProduto, numeroProcesso,
            empresaNome, empresaCnpj, principioAtivo, tarja,
            apresentacoes, bula_txt, bula_pdf_url,
            bula_txt_profissional, bula_pdf_profissional_url,
            categoriaRegulatoria, situacaoRegistro, medicamentoReferencia,
            classesTerapeuticas, indicacao, dataProduto,
            dataVencimentoRegistro, dataPublicacao
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """
    
    cur.executemany(sql, values)
    conn.commit()
    
    imported += len(values)
    progress = (imported / total) * 100
    print(f"✅ Progresso: {imported}/{total} ({progress:.1f}%)")

cur.close()
conn.close()

print(f"\n🎉 Importação concluída com sucesso!")
print(f"📊 Total importado: {imported} medicamentos")
