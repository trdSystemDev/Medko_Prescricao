# Medko - Lista de Tarefas

## Segurança e Proteção de Dados (LGPD)
- [ ] Implementar criptografia de dados sensíveis:
  - Dados do paciente (nome, CPF, endereço, telefone) criptografados no banco
  - Dados médicos (prescrições, atestados, diagnósticos) criptografados
  - Chaves de criptografia armazenadas em variáveis de ambiente
- [ ] Implementar controle de acesso (RBAC):
  - Médico só acessa seus próprios pacientes e documentos
  - Admin tem acesso limitado (sem acesso a dados médicos)
  - Logs de auditoria de todos os acessos
- [ ] Implementar autenticação segura:
  - OAuth 2.0 com Manus
  - Tokens JWT com expiração curta (15 minutos)
  - Refresh tokens seguros
  - Bloqueio após múltiplas tentativas de login
- [ ] Implementar proteção de API:
  - Rate limiting inteligente (diferenciado por tipo de operação):
    * Operações normais: 300 req/min por médico (5 req/segundo)
    * Busca de medicamentos: 60 req/min (autocomplete)
    * Upload de arquivos: 10 req/min
    * Exportação de dados: 5 req/hora
    * Proteção DDoS por IP: 1000 req/min (global)
  - CORS configurado corretamente
  - Headers de segurança (HSTS, CSP, X-Frame-Options)
  - Sanitização de inputs para prevenir SQL Injection
  - Validação de todos os inputs
- [ ] Implementar proteção de PDFs:
  - URLs assinadas temporárias (presigned URLs) com expiração
  - Watermark com dados do médico e paciente
  - Proteção contra download (apenas visualização no navegador)
  - Content-Disposition: inline (não attachment)
- [ ] Implementar logs de auditoria:
  - Registrar todas as ações: criação, visualização, edição, exclusão
  - Registrar IP, user agent, timestamp
  - Logs imutáveis (append-only)
  - Retenção de logs por 5 anos (conforme CFM)
- [ ] Implementar backup e recuperação:
  - Backup automático diário do banco de dados
  - Backup de documentos no S3 com versionamento
  - Criptografia de backups
  - Testes periódicos de recuperação
- [ ] Implementar conformidade LGPD:
  - Termo de consentimento para coleta de dados
  - Política de privacidade
  - Direito de acesso aos dados
  - Direito de exclusão de dados (anonimização)
  - Portabilidade de dados
  - Notificação de incidentes de segurança
- [ ] Implementar proteção contra ataques:
  - Proteção CSRF
  - Proteção XSS
  - Proteção contra clickjacking
  - Validação de certificados SSL/TLS
  - Segurança de sessão (httpOnly, secure, sameSite cookies)
- [ ] Implementar monitoramento de segurança:
  - Alertas de tentativas de acesso não autorizado
  - Monitoramento de anomalias
  - Detecção de vazamento de dados

## Backend - Banco de Dados e Schema
- [x] Criar tabela de médicos (doctors) com CRM, especialidade, RQE
- [x] Criar tabela de pacientes (patients) com dados pessoais
- [x] Criar tabela de medicamentos (medications) com estrutura completa do JSON:
  - Campos principais: id, codigo, numeroRegistro, nomeProduto, numeroProcesso
  - Empresa: empresaNome, empresaCnpj
  - Composição: principioAtivo, tarja, apresentacoes (JSON)
  - Bulas: bula_txt, bula_pdf_url, bula_txt_profissional, bula_pdf_profissional_url
  - Regulatório: categoriaRegulatoria, situacaoRegistro, medicamentoReferencia
  - Classificação: classesTerapeuticas, indicacao
  - Datas: dataProduto, dataVencimentoRegistro, dataPublicacao
- [ ] Criar índices para busca: nomeProduto, principioAtivo, numeroProcesso, situacaoRegistro
- [x] Criar tabela de exames (exams) com códigos TUSS e SUS
- [x] Criar tabela de prescrições (prescriptions) com tipos de receituário
- [x] Criar tabela de atestados (certificates)
- [x] Criar tabela de pedidos de exames (exam_requests)
- [x] Criar tabela de modelos salvos (templates)
- [x] Criar tabela de histórico de envios (message_logs) via Zenvia
- [x] Criar tabela de logs de auditoria (audit_logs)

## Backend - API e Lógica de Negócio
- [x] Implementar autenticação e autorização de médicos
- [ ] Validar CRM do médico (consulta ao Cadastro Nacional de Médicos do CFM)
- [x] Criar endpoints para CRUD de pacientes
- [x] Criar endpoints para busca de medicamentos:
  - Busca por nome do produto
  - Busca por princípio ativo
  - Busca por classe terapêutica
  - Filtro por tarja (controle de receituário)
  - Filtro por situação do registro (ATIVO)
- [x] Criar endpoint para obter detalhes completos do medicamento
- [x] Criar endpoint para listar apresentações de um medicamento
- [x] Criar endpoints para obter bulas de medicamento (paciente e profissional)
- [x] Criar endpoint para servir PDFs de bulas (com proteção contra download)
- [ ] Criar endpoints para busca de exames
- [x] Criar endpoints para criação de prescrições:
  - Validar tipo de receituário vs tarja do medicamento
  - Validar quantidade de medicamentos por receita
  - Validar validade conforme tipo
  - Calcular data de vencimento da receita
- [ ] Criar endpoints para criação de atestados
- [ ] Criar endpoints para criação de pedidos de exames
- [ ] Criar endpoints para gerenciamento de modelos:
  - Salvar modelo de prescrição
  - Salvar modelo de atestado
  - Salvar modelo de pedido de exame
  - Listar, editar e excluir modelos
- [ ] Implementar validação de tipos de receituário:
  - Receita Simples: sem restrições
  - Receita Controle Especial (C): máx 3 medicamentos, 30 dias
  - Receita Azul (B): 1 medicamento, 60 dias
  - Receita Amarela (A): 1 medicamento, 30 dias
  - Receita Retinóides (C2): regras específicas
  - Receita Talidomida (C3): 15 dias
- [x] Implementar geração de PDF dos documentos:
  - Layout profissional com logo e dados do médico
  - QR Code para validação
  - Marca d'água de segurança
  - Formatação conforme tipo de documento

## Integração com Assinatura Digital ICP-Brasil
- [x] Implementar suporte para certificado A1 (arquivo .pfx)
- [x] Implementar suporte para certificado A3 (token/cartão USB)
- [x] Implementar suporte para certificado em nuvem (CFM)
- [x] Gerar QR Code com dados da assinatura (padrão ICP-Brasil)
- [x] Criar validador de assinatura digital:
  - Verificar autenticidade do certificado
  - Validar cadeia de certificação
  - Verificar se certificado não está revogado
  - Exibir dados do signatário
- [ ] Implementar armazenamento seguro de documentos assinados no S3
- [ ] Criar página pública de validação de documentos (via QR Code)

## Integração com Zenvia
- [ ] Configurar credenciais da API Zenvia
- [ ] Implementar envio de SMS
- [ ] Implementar envio de WhatsApp
- [ ] Criar templates de mensagens
- [ ] Implementar webhooks para status de entrega
- [ ] Criar logs de mensagens enviadas

## Frontend - Interface do Usuário
- [ ] Criar layout principal com navegação (sidebar para médicos)
- [ ] Criar página de login com OAuth
- [ ] Criar dashboard do médico:
  - Estatísticas de prescrições
  - Atalhos rápidos para nova prescrição/atestado
  - Histórico recente de documentos
  - Pacientes recentes
- [ ] Criar página de cadastro/listagem de pacientes
- [ ] Criar interface de busca de medicamentos:
  - Campo de busca com autocomplete
  - Filtros: tarja, categoria regulatória, classe terapêutica
  - Exibição de resultados com informações principais
- [ ] Criar modal de detalhes do medicamento:
  - Informações do produto
  - Lista de apresentações disponíveis
  - Botão para visualizar bulas
- [ ] Criar visualizador de PDF integrado (sem download, apenas visualização)
- [ ] Implementar abas para bula do paciente e bula do profissional
- [ ] Criar interface de busca de exames
- [ ] Criar formulário de prescrição médica:
  - Seleção de tipo de receituário (simples, controlado, etc)
  - Busca e adição de medicamentos
  - Definição de posologia (dose, frequência, duração)
  - Orientações ao paciente
  - Visualização de interações medicamentosas
  - Validação de regras por tipo de receita
  - Botão para salvar como modelo
- [ ] Criar formulário de atestado:
  - Tipos: comparecimento, afastamento, óbito
  - CID (opcional/obrigatório conforme tipo)
  - Período de afastamento
  - Observações
  - Botão para salvar como modelo
- [ ] Criar formulário de pedido de exames:
  - Busca de exames por nome ou código TUSS/SUS
  - Seleção múltipla de exames
  - Indicações clínicas para cada exame
  - Botão para salvar como modelo
- [ ] Criar interface de assinatura digital
- [ ] Criar interface de envio via SMS/WhatsApp
- [ ] Criar página de visualização de documentos
- [ ] Criar página de modelos salvos:
  - Listagem de modelos por tipo (prescrição, atestado, exame)
  - Busca e filtros
  - Ações: usar modelo, editar, excluir
- [ ] Criar página de histórico de documentos:
  - Listagem com filtros (data, tipo, paciente)
  - Visualização de documentos anteriores
  - Status de envio (SMS/WhatsApp)
  - Reenvio de documentos
- [ ] Criar página de perfil do médico:
  - Dados pessoais e profissionais
  - CRM, especialidade, RQE
  - Endereço do consultório
  - Assinatura digital configurada

## Estrutura de Pastas para Dados
- [x] Criar pasta `/home/ubuntu/medko/data/` para dados de importação:
  - `/home/ubuntu/medko/data/medicamentos.json` ← Copiar JSON aqui
  - `/home/ubuntu/medko/data/bulas/` ← Copiar PDFs aqui
  - Estrutura de PDFs: `{numeroProcesso}_paciente.pdf` e `{numeroProcesso}_profissional.pdf`
- [x] Criar documentação de importação:
  - README.md com instruções de como copiar os arquivos
  - Script de validação para verificar integridade dos dados
  - Script de importação com barra de progresso

## Dados e Seed
- [x] Criar script de importação do JSON de medicamentos:
  - Validar estrutura do JSON
  - Processar campo apresentacoes (JSON string → JSON object)
  - Fazer upload de PDFs para S3
  - Inserir registros no banco em lote
- [x] Fazer upload de PDFs de bulas para S3:
  - Padrão: {numeroProcesso}_paciente.pdf
  - Padrão: {numeroProcesso}_profissional.pdf
  - Gerar URLs públicas
- [ ] Importar todos os medicamentos do JSON para o banco (60k+ registros)
- [ ] Validar relacionamento numeroProcesso → PDFs
- [ ] Popular banco com exames e códigos TUSS/SUS (3k+ registros)
- [ ] Criar dados de exemplo para testes:
  - Médicos de teste
  - Pacientes de teste
  - Prescrições de exemplo

## Testes e Validação
- [ ] Testar criação de todos os tipos de receituário
- [ ] Testar assinatura digital com diferentes certificados
- [ ] Testar envio via Zenvia (SMS e WhatsApp)
- [ ] Testar validação de documentos
- [ ] Testar conformidade com Resolução CFM 2.299/2021

## Documentação
- [ ] Documentar API endpoints
- [ ] Documentar processo de configuração de certificado digital
- [ ] Documentar integração com Zenvia
- [ ] Criar guia de uso para médicos

## Frontend - Implementação Completa
- [x] Copiar logo para client/public/
- [x] Configurar cores do tema (azul #2C3E50, laranja #FF8C42)
- [x] Criar layout principal com sidebar
- [x] Criar página de login (OAuth Manus)
- [x] Criar dashboard do médico
- [x] Criar tela de gestão de pacientes
- [x] Criar formulário de cadastro de pacientes
- [x] Criar formulário de prescrição médica
- [x] Criar busca de medicamentos com autocomplete
- [x] Criar visualizador de bulas (PDF com iframe)
- [x] Criar formulário de atestados
- [x] Criar histórico de documentos
- [x] Criar página de configurações do médico
- [x] Integrar todas as telas com APIs tRPC

## Bugs
- [x] Corrigir verificação de role nas APIs (aceitar admin e doctor)

## Funcionalidades Faltantes (Para Completar 100%)
- [x] Implementar formulário de pedidos de exames
- [x] Implementar API de busca de exames
- [x] Implementar sistema de templates/modelos:
  - Salvar prescrição como modelo
  - Salvar atestado como modelo
  - Listar e reutilizar modelos
- [ ] Criar página de acesso do paciente (link seguro)
- [ ] Criar página de validação pública de documentos (QR Code)
- [ ] Criar índices de banco de dados para otimização
- [ ] Implementar validação de CRM do médico
- [ ] Implementar rate limiting real (não apenas documentado)
- [ ] Implementar proteção CSRF
- [ ] Implementar watermark em PDFs


## Bugs Reportados
- [x] Corrigir erro de criptografia ao cadastrar paciente
- [x] Criar página de edição de paciente (/pacientes/:id)
