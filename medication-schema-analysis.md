# Análise da Estrutura do JSON de Medicamentos

## Campos Principais do Medicamento

| Campo | Tipo | Descrição | Uso no Sistema |
|-------|------|-----------|----------------|
| `id` | number | ID sequencial | Chave primária no banco |
| `codigo` | string | Código do produto | Busca e identificação |
| `numeroRegistro` | string | Número de registro ANVISA | Informação regulatória |
| `nomeProduto` | string | Nome comercial do medicamento | **Busca principal** |
| `numeroProcesso` | string | Número do processo ANVISA | **Chave para bulas PDF** |
| `empresaNome` | string | Nome do fabricante | Informação do produto |
| `empresaCnpj` | string | CNPJ do fabricante | Informação do produto |
| `principioAtivo` | string | Princípio ativo | **Busca por substância** |
| `tarja` | string | Tipo de tarja (Vermelha, Amarela, etc) | **Controle de receituário** |
| `apresentacoes` | string (JSON) | Array de apresentações | **Seleção de dosagem** |
| `medicamentoReferencia` | string | Nome do medicamento de referência | Informação |
| `classesTerapeuticas` | string | Classe terapêutica | Busca e categorização |
| `bula_txt` | string | Texto da bula do paciente | Visualização rápida |
| `bula_pdf` | string | Caminho do PDF da bula paciente | **Visualizador PDF** |
| `bula_txt_profissional` | string | Texto da bula profissional | Visualização rápida |
| `bula_pdf_profissional` | string | Caminho do PDF da bula profissional | **Visualizador PDF** |
| `categoriaRegulatoria` | string | Genérico, Similar, Referência | Informação |
| `situacaoRegistro` | string | ATIVO, INATIVO | **Filtro de busca** |
| `dataProduto` | string | Data do produto | Informação |
| `dataVencimentoRegistro` | string | Data de vencimento do registro | Validação |
| `dataPublicacao` | string | Data de publicação | Informação |
| `indicacao` | string | Indicações terapêuticas | Informação clínica |

## Estrutura de Apresentações

O campo `apresentacoes` é um JSON string contendo array de objetos:

```json
{
  "codigo": 1587717,
  "apresentacao": "0,8 MG/ML SOL INJ IV CT FA VD TRANS X 5 ML",
  "formasFarmaceuticas": ["SOLUÇAO INJETAVEL"],
  "numero": 1,
  "registro": "1883000600015",
  "principiosAtivos": ["ácido zoledrônico monoidratado"],
  "qtdUnidadeMedida": "5 MILILITRO",
  "viasAdministracao": ["ENDOVENOSA/INTRAVENOSA"],
  "conservacao": ["CONSERVAR EM TEMPERATURA AMBIENTE..."],
  "restricaoPrescricao": ["Venda sob prescrição médica com retenção de receita"],
  "restricaoUso": ["Adulto"],
  "destinacao": ["Hospitalar"],
  "tarja": "Vermelha sob restrição",
  "medicamentoReferencia": "N",
  "ativa": true
}
```

## Campos Importantes para Prescrição

1. **Busca de Medicamento:**
   - `nomeProduto` (nome comercial)
   - `principioAtivo` (substância)
   - `classesTerapeuticas`

2. **Seleção de Apresentação:**
   - `apresentacoes[].apresentacao` (dosagem e forma)
   - `apresentacoes[].formasFarmaceuticas`
   - `apresentacoes[].qtdUnidadeMedida`

3. **Informações de Prescrição:**
   - `apresentacoes[].viasAdministracao`
   - `apresentacoes[].restricaoPrescricao`
   - `apresentacoes[].restricaoUso`
   - `apresentacoes[].conservacao`

4. **Controle de Receituário:**
   - `tarja` (determina tipo de receita)
   - `apresentacoes[].restricaoPrescricao`

5. **Bulas (Visualização):**
   - `numeroProcesso` → chave para PDFs
   - `bula_pdf` → caminho do PDF paciente
   - `bula_pdf_profissional` → caminho do PDF profissional

## Relacionamento com PDFs de Bulas

```
numeroProcesso: "25351771065201417"
    ↓
bula_pdf: "repo/storage/25351771065201417_paciente.pdf"
bula_pdf_profissional: "repo/storage/25351771065201417_profissional.pdf"
```

## Schema do Banco de Dados Proposto

### Tabela: medications

```typescript
{
  id: int (PK),
  codigo: varchar(50),
  numeroRegistro: varchar(50),
  nomeProduto: text,
  numeroProcesso: varchar(50) UNIQUE,
  empresaNome: text,
  empresaCnpj: varchar(20),
  principioAtivo: text,
  tarja: varchar(50),
  apresentacoes: json, // Array de apresentações
  medicamentoReferencia: text,
  classesTerapeuticas: text,
  bula_txt: text,
  bula_pdf_url: text, // URL no S3
  bula_txt_profissional: text,
  bula_pdf_profissional_url: text, // URL no S3
  categoriaRegulatoria: varchar(50),
  situacaoRegistro: varchar(20),
  dataProduto: datetime,
  dataVencimentoRegistro: datetime,
  dataPublicacao: datetime,
  indicacao: text,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

## Fluxo de Importação

1. Ler JSON de medicamentos
2. Para cada medicamento:
   - Fazer upload dos PDFs para S3 (se existirem)
   - Armazenar URLs do S3 no banco
   - Inserir registro no banco com todos os campos
3. Criar índices para busca rápida:
   - `nomeProduto`
   - `principioAtivo`
   - `numeroProcesso`
   - `situacaoRegistro`
