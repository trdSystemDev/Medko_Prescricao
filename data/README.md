# Importação de Dados - Medicamentos e Bulas

## 📁 Estrutura de Pastas

```
/home/ubuntu/medko/data/
├── medicamentos.json          ← COPIAR SEU JSON AQUI
├── bulas/                     ← COPIAR TODOS OS PDFs AQUI
│   ├── 25351771065201417_paciente.pdf
│   ├── 25351771065201417_profissional.pdf
│   ├── 25351843204202031_paciente.pdf
│   ├── 25351843204202031_profissional.pdf
│   └── ...
└── README.md (este arquivo)
```

## 📋 Passo a Passo

### 1. Copiar o JSON de Medicamentos

Copie seu arquivo JSON completo para:
```bash
/home/ubuntu/medko/data/medicamentos.json
```

**Estrutura esperada do JSON:**
```json
[
  {
    "id": 1,
    "codigo": "1012584",
    "numeroRegistro": "188300060",
    "nomeProduto": "ácido zoledrônico",
    "numeroProcesso": "25351771065201417",
    "empresaNome": "VIATRIS FARMACEUTICA DO BRASIL LTDA",
    "empresaCnpj": "11643096000122",
    "principioAtivo": "ÁCIDO ZOLEDRÔNICO MONOIDRATADO",
    "tarja": "Vermelha sob restrição",
    "apresentacoes": "[{...}]",
    "medicamentoReferencia": "ZOMETA",
    "classesTerapeuticas": "SUPRESSORES DA REABSORCAO OSSEA",
    "bula_txt": "...",
    "bula_pdf": "repo/storage/25351771065201417_paciente.pdf",
    "bula_txt_profissional": "...",
    "bula_pdf_profissional": "repo/storage/25351771065201417_profissional.pdf",
    "categoriaRegulatoria": "Genérico",
    "situacaoRegistro": "ATIVO",
    "dataProduto": "2018-10-1 03:00:00",
    "dataVencimentoRegistro": "2028-10-1 03:00:00",
    "dataPublicacao": "2024-8-7 11:18:54",
    "indicacao": ""
  }
]
```

### 2. Copiar os PDFs de Bulas

Copie **TODOS** os PDFs de bulas para:
```bash
/home/ubuntu/medko/data/bulas/
```

**Padrão de nomenclatura obrigatório:**
- `{numeroProcesso}_paciente.pdf`
- `{numeroProcesso}_profissional.pdf`

**Exemplo:**
- `25351771065201417_paciente.pdf`
- `25351771065201417_profissional.pdf`

### 3. Validar os Dados

Execute o script de validação para verificar se todos os arquivos estão corretos:

```bash
cd /home/ubuntu/medko
pnpm run validate-data
```

**O script irá verificar:**
- ✅ Se o JSON existe e está válido
- ✅ Se todos os medicamentos têm `numeroProcesso`
- ✅ Se os PDFs correspondentes existem
- ✅ Se a nomenclatura dos PDFs está correta
- ✅ Estatísticas: total de medicamentos, PDFs encontrados, PDFs faltantes

### 4. Importar os Dados

Após validar, execute o script de importação:

```bash
cd /home/ubuntu/medko
pnpm run import-data
```

**O script irá:**
1. Ler o JSON de medicamentos
2. Fazer upload dos PDFs para o S3
3. Inserir os medicamentos no banco de dados
4. Exibir barra de progresso
5. Gerar relatório de importação

**Tempo estimado:**
- 60.000 medicamentos + 120.000 PDFs
- Upload para S3: ~30-60 minutos (depende da conexão)
- Inserção no banco: ~5-10 minutos

## 🔍 Verificação Pós-Importação

Após a importação, você pode verificar os dados:

```bash
# Ver total de medicamentos importados
pnpm run check-medications

# Ver medicamentos sem bulas
pnpm run check-missing-bulas
```

## ⚠️ Importante

1. **Não renomeie** os PDFs - o sistema usa o `numeroProcesso` como chave
2. **Não modifique** a estrutura do JSON
3. **Mantenha backup** dos arquivos originais
4. **Aguarde** a conclusão completa da importação antes de usar o sistema

## 📊 Estrutura do Banco Após Importação

```
medications (tabela)
├── id: 1
├── numeroProcesso: "25351771065201417"
├── nomeProduto: "ácido zoledrônico"
├── bulaPdfUrl: "https://s3.amazonaws.com/.../25351771065201417_paciente.pdf"
├── bulaPdfProfissionalUrl: "https://s3.amazonaws.com/.../25351771065201417_profissional.pdf"
└── ... (outros campos)
```

## 🆘 Problemas Comuns

### Erro: "JSON não encontrado"
- Verifique se o arquivo está em `/home/ubuntu/medko/data/medicamentos.json`
- Verifique as permissões do arquivo

### Erro: "PDFs faltando"
- Execute `pnpm run validate-data` para ver quais PDFs estão faltando
- Verifique a nomenclatura dos arquivos

### Erro: "Falha no upload para S3"
- Verifique a conexão com a internet
- Verifique as credenciais do S3 (devem estar configuradas automaticamente)

### Erro: "Duplicata de numeroProcesso"
- Verifique se não há medicamentos duplicados no JSON
- Limpe o banco e reimporte: `pnpm run clear-medications && pnpm run import-data`

## 📞 Suporte

Em caso de dúvidas ou problemas, consulte a documentação completa em:
- `/home/ubuntu/medko/medication-schema-analysis.md`
- `/home/ubuntu/medko/SECURITY.md`
