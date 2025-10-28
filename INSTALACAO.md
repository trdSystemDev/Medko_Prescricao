# 🏥 Medko - Guia de Instalação Local

Este guia explica como instalar e executar o sistema Medko na sua máquina local.

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

1. **Node.js** (versão 18 ou superior)
   - Download: https://nodejs.org/
   - Verifique: `node --version`

2. **pnpm** (gerenciador de pacotes)
   - Instalar: `npm install -g pnpm`
   - Verifique: `pnpm --version`

3. **PostgreSQL** (versão 14 ou superior)
   - Download: https://www.postgresql.org/download/
   - Ou use um serviço cloud como:
     - Supabase (https://supabase.com) - Gratuito
     - Neon (https://neon.tech) - Gratuito
     - Railway (https://railway.app)

## 🚀 Instalação Passo a Passo

### 1. Extrair o Projeto

```bash
# Extrair o ZIP
unzip medko-completo.zip
cd medko
```

### 2. Instalar Dependências

```bash
# Instalar todas as dependências
pnpm install
```

### 3. Configurar Banco de Dados

#### Opção A: PostgreSQL Local

```bash
# Criar banco de dados
createdb medko

# Sua connection string será:
# postgresql://seu_usuario:sua_senha@localhost:5432/medko
```

#### Opção B: PostgreSQL Cloud (Supabase/Neon)

1. Crie uma conta gratuita em https://supabase.com ou https://neon.tech
2. Crie um novo projeto
3. Copie a connection string fornecida

### 4. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```bash
# Copiar template
cp .env.example .env

# Editar com seus dados
nano .env
```

Conteúdo do arquivo `.env`:

```env
# ===== BANCO DE DADOS =====
DATABASE_URL="postgresql://usuario:senha@localhost:5432/medko"

# ===== AUTENTICAÇÃO =====
JWT_SECRET="sua-chave-secreta-jwt-aqui-minimo-32-caracteres"

# ===== CRIPTOGRAFIA (LGPD) =====
# Gerar com: openssl rand -hex 32
ENCRYPTION_KEY="sua-chave-de-criptografia-32-caracteres-aqui"

# ===== ZENVIA (SMS/WhatsApp) - OPCIONAL =====
# Obter em: https://app.zenvia.com/
ZENVIA_API_TOKEN="seu-token-zenvia-aqui"

# ===== OAUTH (Manus) - JÁ CONFIGURADO =====
OAUTH_SERVER_URL="https://api.manus.im"
VITE_OAUTH_PORTAL_URL="https://auth.manus.im"
VITE_APP_ID="seu-app-id"

# ===== APLICAÇÃO =====
VITE_APP_TITLE="Medko"
VITE_APP_LOGO="/medko-branco.png"
OWNER_OPEN_ID="seu-open-id"
OWNER_NAME="Seu Nome"

# ===== S3 STORAGE (Manus) - JÁ CONFIGURADO =====
BUILT_IN_FORGE_API_URL="https://api.manus.im"
BUILT_IN_FORGE_API_KEY="sua-chave-api"
```

### 5. Aplicar Schema do Banco de Dados

```bash
# Criar tabelas no banco
pnpm db:push
```

### 6. Importar Dados de Medicamentos (IMPORTANTE!)

```bash
# 1. Copiar seu arquivo JSON de medicamentos
cp /caminho/para/seu/medicamentos.json data/medicamentos.json

# 2. Copiar PDFs de bulas
cp -r /caminho/para/seus/pdfs/* data/bulas/

# 3. Validar dados
pnpm run validate-data

# 4. Importar para o banco (pode demorar alguns minutos)
pnpm run import-data
```

### 7. Iniciar o Servidor

```bash
# Modo desenvolvimento
pnpm dev

# O sistema estará disponível em:
# http://localhost:3000
```

## 🔐 Gerar Chaves Seguras

### JWT_SECRET e ENCRYPTION_KEY

```bash
# Opção 1: OpenSSL (Linux/Mac)
openssl rand -hex 32

# Opção 2: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Opção 3: Online
# https://generate-secret.vercel.app/32
```

## 📦 Estrutura de Pastas

```
medko/
├── client/              # Frontend (React + TypeScript)
│   ├── public/          # Arquivos estáticos
│   └── src/
│       ├── pages/       # Páginas da aplicação
│       ├── components/  # Componentes reutilizáveis
│       └── lib/         # Bibliotecas e utilitários
├── server/              # Backend (Node.js + Express + tRPC)
│   ├── _core/           # Núcleo do servidor
│   ├── db.ts            # Funções de banco de dados
│   ├── routers.ts       # Rotas da API
│   ├── encryption.ts    # Criptografia
│   ├── pdf-generator.ts # Geração de PDFs
│   └── zenvia.ts        # Integração Zenvia
├── drizzle/             # Schema do banco de dados
├── data/                # Dados para importação
│   ├── medicamentos.json
│   └── bulas/           # PDFs das bulas
└── scripts/             # Scripts de importação
```

## 🧪 Testar a Instalação

1. Acesse: http://localhost:3000
2. Faça login com sua conta Manus
3. Vá em "Pacientes" → "Cadastrar Paciente"
4. Preencha os dados e salve
5. Vá em "Nova Prescrição"
6. Busque um medicamento
7. Crie uma prescrição

## 🐛 Solução de Problemas

### Erro: "ENCRYPTION_KEY não configurada"
- Configure a variável `ENCRYPTION_KEY` no arquivo `.env`

### Erro: "Cannot connect to database"
- Verifique se o PostgreSQL está rodando
- Verifique a `DATABASE_URL` no `.env`
- Teste a conexão: `psql $DATABASE_URL`

### Erro: "Nenhum medicamento encontrado"
- Execute o script de importação: `pnpm run import-data`
- Verifique se o arquivo `data/medicamentos.json` existe

### Porta 3000 já está em uso
```bash
# Mudar porta no arquivo vite.config.ts
# Ou matar o processo:
lsof -ti:3000 | xargs kill -9
```

## 📚 Comandos Úteis

```bash
# Desenvolvimento
pnpm dev                    # Iniciar servidor de desenvolvimento
pnpm build                  # Build para produção
pnpm start                  # Iniciar em produção

# Banco de Dados
pnpm db:push                # Aplicar schema
pnpm db:studio              # Abrir Drizzle Studio (GUI)

# Importação
pnpm run validate-data      # Validar dados
pnpm run import-data        # Importar medicamentos
pnpm run check-medications  # Verificar importação

# Qualidade
pnpm check                  # Verificar TypeScript
pnpm lint                   # Verificar código
```

## 🚀 Deploy em Produção

### Opção 1: Manus (Recomendado)
- Clique em "Publish" no painel do Manus
- Configure domínio customizado em Settings → Domains

### Opção 2: Vercel + Supabase
1. Faça push do código para GitHub
2. Importe no Vercel
3. Configure variáveis de ambiente
4. Deploy automático

### Opção 3: VPS (DigitalOcean, AWS, etc)
```bash
# Build
pnpm build

# Iniciar com PM2
pm2 start pnpm --name medko -- start
pm2 save
pm2 startup
```

## 🔒 Segurança em Produção

**IMPORTANTE:** Antes de publicar em produção:

1. ✅ Configure `ENCRYPTION_KEY` única e segura (32+ caracteres)
2. ✅ Configure `JWT_SECRET` única e segura (32+ caracteres)
3. ✅ Use HTTPS (SSL/TLS)
4. ✅ Configure backup automático do banco de dados
5. ✅ Configure `ZENVIA_API_TOKEN` válido
6. ✅ Revise logs de auditoria regularmente
7. ✅ Mantenha dependências atualizadas

## 📞 Suporte

- Documentação: `/home/ubuntu/medko/SECURITY.md`
- Escalabilidade: `/home/ubuntu/medko/SCALABILITY.md`
- Issues: Entre em contato com o desenvolvedor

## 📄 Licença

Sistema desenvolvido para uso médico profissional.
Todos os direitos reservados.

---

**Desenvolvido com ❤️ para médicos brasileiros**
