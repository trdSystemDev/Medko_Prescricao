#!/usr/bin/env python3
import json
import os
import sys
import psycopg2
from psycopg2.extras import execute_batch

# Obter DATABASE_URL do ambiente
database_url = os.getenv('DATABASE_URL')
if not database_url:
    print("❌ DATABASE_URL não configurada!")
    sys.exit(1)

print("🚀 Iniciando importação de medicamentos...\n")

# Conectar ao banco
print("🔌 Conectando ao banco de dados...")
conn = psycopg2.connect(database_url)
cur = conn.cursor()

# Ler JSON
print("📖 Lendo arquivo JSON...")
with open('/home/ubuntu/medko/data/medicamentos.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

total = len(data)
print(f"📊 Total de medicamentos encontrados: {total}\n")

# Preparar dados
batch = []
BATCH_SIZE = 500

for i, med in enumerate(data):
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
    
    batch.append(medication_data)
    
    if len(batch) >= BATCH_SIZE:
        execute_batch(cur, """
            INSERT INTO medications (
                codigo, numeroRegistro, nomeProduto, numeroProcesso,
                empresaNome, empresaCnpj, principioAtivo, tarja,
                apresentacoes, bula_txt, bula_pdf_url,
                bula_txt_profissional, bula_pdf_profissional_url,
                categoriaRegulatoria, situacaoRegistro, medicamentoReferencia,
                classesTerapeuticas, indicacao, dataProduto,
                dataVencimentoRegistro, dataPublicacao
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, batch)
        conn.commit()
        
        imported = i + 1
        progress = (imported / total) * 100
        print(f"✅ Progresso: {imported}/{total} ({progress:.1f}%)")
        batch = []

# Inserir últimos registros
if batch:
    execute_batch(cur, """
        INSERT INTO medications (
            codigo, numeroRegistro, nomeProduto, numeroProcesso,
            empresaNome, empresaCnpj, principioAtivo, tarja,
            apresentacoes, bula_txt, bula_pdf_url,
            bula_txt_profissional, bula_pdf_profissional_url,
            categoriaRegulatoria, situacaoRegistro, medicamentoReferencia,
            classesTerapeuticas, indicacao, dataProduto,
            dataVencimentoRegistro, dataPublicacao
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, batch)
    conn.commit()
    print(f"✅ Progresso: {total}/{total} (100.0%)")

cur.close()
conn.close()

print(f"\n🎉 Importação concluída com sucesso!")
print(f"📊 Total importado: {total} medicamentos")
