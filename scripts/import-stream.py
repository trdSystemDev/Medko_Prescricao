#!/usr/bin/env python3
import ijson
import os
import sys
import mysql.connector
from urllib.parse import urlparse
import json as json_lib
from datetime import datetime

def clean_date(date_str):
    """Limpa e valida datas, retorna None se inválida"""
    if not date_str:
        return None
    try:
        # Tentar parsear a data
        dt = datetime.strptime(date_str, '%Y-%m-%d %H:%M:%S')
        # MySQL timestamp válido: 1970-01-01 00:00:01 a 2038-01-19 03:14:07
        if dt.year < 1970 or dt.year > 2037:
            return None
        return date_str
    except:
        return None

# Obter DATABASE_URL do ambiente
database_url = os.getenv('DATABASE_URL')
if not database_url:
    print("❌ DATABASE_URL não configurada!")
    sys.exit(1)

print("🚀 Iniciando importação de medicamentos...\n")

# Parsear DATABASE_URL
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

# Abrir arquivo JSON em modo streaming
print("📖 Processando arquivo JSON em streaming...")
with open('/home/ubuntu/medko/data/medicamentos.json', 'rb') as f:
    # ijson.items retorna um iterador de objetos
    medications = ijson.items(f, 'item')
    
    batch = []
    BATCH_SIZE = 500
    imported = 0
    
    for med in medications:
        medication_data = (
            med.get('codigo'),
            med.get('numeroRegistro'),
            med.get('nomeProduto', 'Sem nome'),
            med.get('numeroProcesso', ''),
            med.get('empresaNome'),
            med.get('empresaCnpj'),
            med.get('principioAtivo'),
            med.get('tarja'),
            json_lib.dumps(med.get('apresentacoes')) if med.get('apresentacoes') else None,
            None,  # bulaTxt - muito grande, usar apenas PDF
            med.get('bula_pdf_url'),
            None,  # bulaTxtProfissional - muito grande, usar apenas PDF
            med.get('bula_pdf_profissional_url'),
            med.get('categoriaRegulatoria'),
            med.get('situacaoRegistro'),
            med.get('medicamentoReferencia'),
            med.get('classesTerapeuticas'),
            med.get('indicacao'),
            clean_date(med.get('dataProduto')),
            clean_date(med.get('dataVencimentoRegistro')),
            clean_date(med.get('dataPublicacao')),
        )
        
        batch.append(medication_data)
        
        if len(batch) >= BATCH_SIZE:
            sql = """
                INSERT INTO medications (
                    codigo, numeroRegistro, nomeProduto, numeroProcesso,
                    empresaNome, empresaCnpj, principioAtivo, tarja,
                    apresentacoes, bulaTxt, bulaPdfUrl,
                    bulaTxtProfissional, bulaPdfProfissionalUrl,
                    categoriaRegulatoria, situacaoRegistro, medicamentoReferencia,
                    classesTerapeuticas, indicacao, dataProduto,
                    dataVencimentoRegistro, dataPublicacao
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            
            try:
                cur.executemany(sql, batch)
                conn.commit()
            except mysql.connector.errors.IntegrityError as e:
                # Ignorar duplicatas e tentar inserir um por um
                conn.rollback()
                for row in batch:
                    try:
                        cur.execute(sql, row)
                        conn.commit()
                    except mysql.connector.errors.IntegrityError:
                        # Ignorar duplicata silenciosamente
                        conn.rollback()
                        pass
            
            imported += len(batch)
            progress = (imported / 17808) * 100
            print(f"✅ Progresso: {imported}/17808 ({progress:.1f}%)")
            batch = []
    
    # Inserir últimos registros
    if batch:
        sql = """
            INSERT INTO medications (
                codigo, numeroRegistro, nomeProduto, numeroProcesso,
                empresaNome, empresaCnpj, principioAtivo, tarja,
                apresentacoes, bulaTxt, bulaPdfUrl,
                bulaTxtProfissional, bulaPdfProfissionalUrl,
                categoriaRegulatoria, situacaoRegistro, medicamentoReferencia,
                classesTerapeuticas, indicacao, dataProduto,
                dataVencimentoRegistro, dataPublicacao
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        
        try:
            cur.executemany(sql, batch)
            conn.commit()
        except mysql.connector.errors.IntegrityError:
            # Ignorar duplicatas e tentar inserir um por um
            conn.rollback()
            for row in batch:
                try:
                    cur.execute(sql, row)
                    conn.commit()
                except mysql.connector.errors.IntegrityError:
                    # Ignorar duplicata silenciosamente
                    conn.rollback()
                    pass
        
        imported += len(batch)
        print(f"✅ Progresso: {imported}/17808 (100.0%)")

cur.close()
conn.close()

print(f"\n🎉 Importação concluída com sucesso!")
print(f"📊 Total importado: {imported} medicamentos")
