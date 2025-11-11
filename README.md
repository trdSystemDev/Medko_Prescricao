# Medko - Plataforma de Prescrição Médica Digital

Sistema completo de prescrição médica digital com funcionalidades de prescrições, atestados médicos, pedidos de exames, teleconsulta com videochamada e chat em tempo real.

![Medko Logo](client/public/logo.png)

## 🚀 Funcionalidades

### 📋 Gestão de Prescrições
- ✅ Criação de prescrições médicas digitais
- ✅ 6 tipos de receituário (simples, controle especial, azul, amarela, retinóides, talidomida)
- ✅ Validação automática conforme legislação brasileira
- ✅ Busca de medicamentos com 17.808+ medicamentos cadastrados
- ✅ Visualizador de bulas (paciente e profissional)
- ✅ Geração de PDF profissional com QR Code
- ✅ Assinatura digital (estrutura ICP-Brasil)
- ✅ Envio via WhatsApp/SMS (integração Zenvia)

### 🏥 Atestados Médicos
- ✅ Atestado de comparecimento
- ✅ Atestado de afastamento (com cálculo automático de dias)
- ✅ Atestado de óbito
- ✅ Geração de PDF
- ✅ Envio via WhatsApp

### 🔬 Pedidos de Exames
- ✅ Solicitação de exames laboratoriais
- ✅ Códigos TUSS e SUS
- ✅ Geração de PDF

### 🎥 Teleconsulta (Novo!)
- ✅ Videochamada com Twilio Video
- ✅ Chat em tempo real
- ✅ Agendamento de consultas
- ✅ Controles de áudio/vídeo
- ✅ Interface intuitiva para médico e paciente

### 👥 Gestão de Pacientes
- ✅ Cadastro completo de pacientes
- ✅ Dados criptografados (LGPD)
- ✅ Histórico de documentos
- ✅ Sistema de templates/modelos

### 🔒 Segurança e Conformidade
- ✅ Criptografia AES-256-GCM para dados sensíveis
- ✅ Logs de auditoria completos (LGPD)
- ✅ Rate limiting inteligente
- ✅ RBAC (médico só acessa seus pacientes)
- ✅ Validação de permissões

## 🛠️ Tecnologias

### Backend
- **Node.js** + **Express**
- **tRPC** - Type-safe APIs
- **Drizzle ORM** - Database toolkit
- **MySQL/TiDB** - Banco de dados
- **PDFKit** - Geração de PDFs
- **Twilio** - Videochamada e SMS/WhatsApp
- **Zenvia** - Integração WhatsApp

### Frontend
- **React 19** + **TypeScript**
- **Vite** - Build tool
- **TailwindCSS 4** - Styling
- **shadcn/ui** - Componentes UI
- **Twilio Video SDK** - Videochamada
- **Wouter** - Routing

### Segurança
- **AES-256-GCM** - Criptografia
- **JWT** - Autenticação
- **Manus OAuth** - Login seguro

## 📦 Instalação

### Pré-requisitos
- Node.js 22+
- pnpm 10+
- MySQL/TiDB database

### 1. Clone o repositório
```bash
git clone https://github.com/trdSystemDev/Medko_Prescricao.git
cd Medko_Prescricao
```

### 2. Instale as dependências
```bash
pnpm install
```

### 3. Configure as variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Database
DATABASE_URL=mysql://user:password@host:port/database

# Criptografia (gere uma chave segura de 32+ caracteres)
ENCRYPTION_KEY=sua_chave_super_secreta_aqui

# Zenvia (para WhatsApp/SMS)
ZENVIA_API_TOKEN=seu_token_zenvia

# Twilio (para videochamada)
TWILIO_ACCOUNT_SID=seu_account_sid
TWILIO_API_KEY=sua_api_key
TWILIO_API_SECRET=seu_api_secret

# OAuth (configurado automaticamente pelo Manus)
JWT_SECRET=auto_generated
OAUTH_SERVER_URL=auto_generated
VITE_APP_ID=auto_generated
```

### 4. Execute as migrações do banco de dados
```bash
pnpm db:push
```

### 5. Importe os medicamentos (opcional)

Coloque o arquivo `medicamentos.json` em `/data/` e execute:

```bash
pnpm run validate-data
pnpm run import-data
```

### 6. Inicie o servidor de desenvolvimento
```bash
pnpm dev
```

O sistema estará disponível em `http://localhost:3000`

## 📊 Estrutura do Banco de Dados

O sistema possui 12 tabelas:

1. **users** - Usuários (médicos)
2. **patients** - Pacientes (dados criptografados)
3. **medications** - Medicamentos (17.808+)
4. **prescriptions** - Prescrições médicas
5. **certificates** - Atestados médicos
6. **examRequests** - Pedidos de exames
7. **appointments** - Consultas agendadas (teleconsulta)
8. **consultationMessages** - Chat das consultas
9. **templates** - Modelos salvos
10. **messageLogs** - Logs de envio (Zenvia)
11. **auditLogs** - Logs de auditoria (LGPD)
12. **exams** - Catálogo de exames

## 🎨 Layout e Design

O sistema utiliza as cores da marca Medko:
- **Azul escuro**: `#2C3E50` (sidebar, elementos principais)
- **Laranja**: `#F39C12` (destaques, hover, ícones)

## 📱 Funcionalidades por Página

### Dashboard
- Estatísticas (pacientes, prescrições, atestados)
- Ações rápidas
- Prescrições recentes
- Atestados recentes

### Consultas (Teleconsulta)
- Lista de consultas do dia
- Agendar nova consulta
- Iniciar videochamada
- Chat em tempo real

### Pacientes
- Listagem com busca
- Cadastro e edição
- Dados criptografados

### Prescrições
- Criação de prescrição
- Seleção de medicamentos
- Validação automática
- Geração de PDF
- Envio via WhatsApp

### Atestados
- Criação de atestado
- 3 tipos (comparecimento, afastamento, óbito)
- Geração de PDF
- Envio via WhatsApp

### Histórico
- Todas as prescrições
- Todos os atestados
- Filtros e busca

### Medicamentos
- Busca avançada
- Visualizador de bulas
- Filtros por tarja

### Configurações
- Dados do médico (CRM, especialidade, etc.)
- Perfil profissional

## 🔐 Segurança (LGPD)

O sistema está em conformidade com a LGPD:

- ✅ Criptografia de dados sensíveis (CPF, RG, telefone, endereço)
- ✅ Logs de auditoria de todas as ações
- ✅ Controle de acesso baseado em função (RBAC)
- ✅ Validação de permissões
- ✅ Rate limiting para prevenir abuso

## 📄 Documentação Adicional

- [SECURITY.md](docs/SECURITY.md) - Segurança e LGPD
- [SCALABILITY.md](docs/SCALABILITY.md) - Escalabilidade
- [TODO.md](TODO.md) - Lista de tarefas

## 🚀 Deploy

O sistema pode ser publicado através do painel Manus:

1. Crie um checkpoint: `webdev_save_checkpoint`
2. Clique em "Publish" no painel de gerenciamento
3. Configure o domínio personalizado (opcional)

## 📞 Suporte

Para dúvidas e suporte:
- Email: suporte@medko.com.br
- Website: https://medko.com.br

## 📝 Licença

Copyright © 2025 Medko. Todos os direitos reservados.

## 🙏 Agradecimentos

Desenvolvido com ❤️ pela equipe TRD System Dev.

---

**Versão:** 1.0.0  
**Última atualização:** Outubro 2025
