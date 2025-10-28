# Segurança e Proteção de Dados - Sistema Medko

## 1. Conformidade Legal

### 1.1. LGPD (Lei Geral de Proteção de Dados)
O sistema Medko está em conformidade com a **Lei nº 13.709/2018 (LGPD)**, garantindo:

- **Consentimento explícito** para coleta e tratamento de dados
- **Finalidade específica** para cada dado coletado
- **Transparência** no tratamento dos dados
- **Segurança** no armazenamento e transmissão
- **Direitos do titular**: acesso, correção, exclusão, portabilidade

### 1.2. Resolução CFM 2.299/2021
Conformidade com a regulamentação do Conselho Federal de Medicina:

- **Proteção de dados pessoais** (LGPD)
- **Sigilo profissional** médico
- **Guarda segura** de documentos médicos
- **Rastreabilidade** de todas as ações
- **Retenção de logs** por 5 anos

## 2. Arquitetura de Segurança

### 2.1. Camadas de Proteção

```
┌─────────────────────────────────────────────┐
│  Camada 1: Autenticação e Autorização       │
│  - OAuth 2.0 + JWT                          │
│  - RBAC (Role-Based Access Control)         │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  Camada 2: Proteção de API                  │
│  - Rate Limiting                            │
│  - Input Validation                         │
│  - CORS / Headers de Segurança              │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  Camada 3: Criptografia de Dados            │
│  - Dados em trânsito: TLS 1.3               │
│  - Dados em repouso: AES-256                │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  Camada 4: Controle de Acesso               │
│  - Isolamento por médico                    │
│  - Logs de auditoria                        │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  Camada 5: Backup e Recuperação             │
│  - Backups criptografados                   │
│  - Versionamento de documentos              │
└─────────────────────────────────────────────┘
```

## 3. Criptografia de Dados

### 3.1. Dados Criptografados no Banco

**Dados do Paciente:**
- Nome completo
- CPF
- RG
- Endereço completo
- Telefone
- E-mail
- Data de nascimento

**Dados Médicos:**
- Prescrições
- Atestados
- Diagnósticos (CID)
- Observações clínicas

**Algoritmo:** AES-256-GCM (Galois/Counter Mode)
**Chave:** Armazenada em variável de ambiente `ENCRYPTION_KEY`

### 3.2. Dados em Trânsito
- **TLS 1.3** obrigatório
- **HSTS** (HTTP Strict Transport Security)
- **Certificate Pinning** para APIs críticas

### 3.3. Dados em Repouso
- **Banco de dados:** Criptografia nativa do MySQL/TiDB
- **S3:** Server-Side Encryption (SSE-S3)
- **Backups:** Criptografados com GPG

## 4. Controle de Acesso (RBAC)

### 4.1. Perfis de Usuário

| Perfil | Permissões |
|--------|------------|
| **Médico** | - Acessa apenas seus próprios pacientes<br>- Cria prescrições, atestados, pedidos de exames<br>- Visualiza histórico de seus documentos<br>- Não pode acessar dados de outros médicos |
| **Admin** | - Gerencia usuários médicos<br>- Acessa logs de auditoria<br>- **NÃO** acessa dados médicos ou de pacientes<br>- Configura integrações (Zenvia) |
| **Paciente** | - Acessa apenas seus próprios documentos<br>- Via link seguro (token temporário)<br>- Não faz login no sistema |

### 4.2. Isolamento de Dados

**Regra de Ouro:** Um médico **NUNCA** pode acessar dados de pacientes de outro médico.

**Implementação:**
- Todas as queries incluem filtro `WHERE doctorId = :currentDoctorId`
- Middleware de autorização valida propriedade dos recursos
- Logs de auditoria registram todas as tentativas de acesso

## 5. Proteção de PDFs (Bulas e Documentos)

### 5.1. URLs Assinadas Temporárias

**Problema:** PDFs armazenados no S3 público podem ser acessados por qualquer pessoa.

**Solução:** Presigned URLs com expiração

```typescript
// Gera URL válida por 15 minutos
const url = await storageGet(pdfKey, 900); // 900 segundos
```

### 5.2. Proteção Contra Download

**Headers HTTP:**
```
Content-Disposition: inline; filename="bula.pdf"
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
```

**Resultado:** PDF abre no navegador, mas botão de download é desabilitado via JavaScript.

### 5.3. Watermark em Documentos Médicos

Todos os documentos gerados (prescrições, atestados) incluem:
- Nome do médico + CRM
- Nome do paciente
- Data e hora de emissão
- Marca d'água diagonal: "DOCUMENTO MÉDICO - USO EXCLUSIVO DO PACIENTE"

## 6. Logs de Auditoria

### 6.1. Eventos Registrados

**Autenticação:**
- Login bem-sucedido
- Tentativa de login falha
- Logout
- Expiração de sessão

**Dados de Pacientes:**
- Criação de paciente
- Visualização de dados do paciente
- Edição de dados do paciente
- Exclusão de paciente (anonimização)

**Documentos Médicos:**
- Criação de prescrição/atestado/pedido de exame
- Visualização de documento
- Assinatura digital
- Envio via SMS/WhatsApp
- Reenvio de documento

**Acesso a Bulas:**
- Visualização de bula de medicamento
- Download de PDF (se permitido)

### 6.2. Estrutura do Log

```json
{
  "timestamp": "2025-10-28T10:15:30.123Z",
  "userId": 123,
  "userRole": "doctor",
  "action": "VIEW_PATIENT",
  "resourceType": "patient",
  "resourceId": 456,
  "ipAddress": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "success": true,
  "metadata": {
    "patientName": "[ENCRYPTED]",
    "doctorCRM": "12345-SP"
  }
}
```

### 6.3. Retenção de Logs
- **Período:** 5 anos (conforme Resolução CFM)
- **Armazenamento:** Banco de dados separado (append-only)
- **Backup:** Diário, criptografado

## 7. Proteção de API

### 7.1. Rate Limiting Inteligente

**Estratégia Diferenciada por Tipo de Operação:**

O sistema utiliza rate limiting **diferenciado** para não prejudicar o atendimento médico em horários de pico.

| Tipo de Operação | Limite por Médico | Justificativa |
|---------------------|-------------------|---------------|
| **Operações normais** | 300 req/min (5 req/s) | Médico atendendo 1 paciente a cada 10 min = ~30 requisições. Margem de 10x para segurança. |
| **Busca de medicamentos** | 60 req/min | Autocomplete gera várias requisições. Limite generoso. |
| **Upload de arquivos** | 10 req/min | Uploads são raros (certificados, documentos). |
| **Exportação de dados** | 5 req/hora | Operação sensível, deve ser limitada. |
| **Proteção DDoS (por IP)** | 1000 req/min | Proteção global contra ataques. |

**Cálculo de Capacidade:**

Com 100 médicos atendendo simultaneamente:
- 100 médicos × 300 req/min = **30.000 req/min** (500 req/s)
- Sistema suporta facilmente com infraestrutura adequada

**Implementação:**
- Rate limiting por **médico** (userId), não por IP
- Permite múltiplos médicos na mesma clínica (mesmo IP)
- Contador resetado a cada minuto
- Resposta HTTP 429 (Too Many Requests) quando excedido

### 7.2. Validação de Inputs

**Todas as entradas são validadas:**
- Tipo de dado correto
- Tamanho máximo
- Formato (regex para CPF, telefone, etc)
- Sanitização para prevenir SQL Injection e XSS

**Exemplo:**
```typescript
const cpfSchema = z.string().regex(/^\d{11}$/);
const nomeSchema = z.string().min(3).max(100);
```

### 7.3. Headers de Segurança

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

## 8. Autenticação e Sessão

### 8.1. OAuth 2.0 + JWT

**Fluxo:**
1. Usuário faz login via Manus OAuth
2. Sistema recebe `openId` do usuário
3. Gera JWT com expiração de 15 minutos
4. Armazena refresh token seguro (httpOnly cookie)

**JWT Payload:**
```json
{
  "userId": 123,
  "role": "doctor",
  "crm": "12345-SP",
  "iat": 1698501330,
  "exp": 1698502230
}
```

### 8.2. Proteção de Sessão

**Cookies seguros:**
```
Set-Cookie: session=...; 
  HttpOnly; 
  Secure; 
  SameSite=Strict; 
  Max-Age=900
```

**Bloqueio após tentativas falhas:**
- 5 tentativas em 15 minutos → bloqueio por 30 minutos
- 10 tentativas em 1 hora → bloqueio por 24 horas

## 9. Backup e Recuperação

### 9.1. Backup Automático

**Banco de Dados:**
- Backup completo diário (00:00 UTC)
- Backup incremental a cada 6 horas
- Retenção: 30 dias

**Documentos (S3):**
- Versionamento habilitado
- Lifecycle policy: mover para Glacier após 90 dias
- Retenção: 5 anos

### 9.2. Criptografia de Backups

**Algoritmo:** GPG (GNU Privacy Guard)
**Chave:** Armazenada em HSM (Hardware Security Module)

### 9.3. Testes de Recuperação

**Frequência:** Mensal
**Processo:**
1. Restaurar backup em ambiente de teste
2. Validar integridade dos dados
3. Testar funcionalidades críticas
4. Documentar resultados

## 10. Conformidade LGPD

### 10.1. Direitos do Titular

**Acesso aos Dados:**
- Médico pode exportar todos os dados de um paciente
- Formato: JSON ou PDF

**Correção de Dados:**
- Paciente pode solicitar correção de dados pessoais
- Médico valida e aprova a correção

**Exclusão de Dados:**
- Paciente pode solicitar exclusão de dados
- **Importante:** Dados médicos são anonimizados (não deletados)
- Mantém-se histórico para fins legais e estatísticos

**Portabilidade:**
- Exportação de dados em formato estruturado (JSON)
- Inclui todos os documentos médicos

### 10.2. Termo de Consentimento

**Obrigatório no primeiro acesso:**
- Explica quais dados serão coletados
- Finalidade de cada dado
- Prazo de retenção
- Direitos do titular

**Revogação de consentimento:**
- Paciente pode revogar a qualquer momento
- Sistema anonimiza os dados

### 10.3. Notificação de Incidentes

**Em caso de vazamento de dados:**
1. Notificar ANPD (Autoridade Nacional de Proteção de Dados) em até 72h
2. Notificar pacientes afetados
3. Documentar o incidente
4. Implementar medidas corretivas

## 11. Monitoramento de Segurança

### 11.1. Alertas Automáticos

**Eventos que geram alertas:**
- Múltiplas tentativas de login falhas
- Acesso a dados de paciente de outro médico (tentativa de invasão)
- Alteração de dados sensíveis
- Exportação em massa de dados
- Acesso fora do horário habitual

### 11.2. Detecção de Anomalias

**Machine Learning para detectar:**
- Padrões incomuns de acesso
- Velocidade anormal de requisições
- Acesso de IPs suspeitos
- Tentativas de SQL Injection ou XSS

## 12. Checklist de Segurança

- [ ] Todos os dados sensíveis estão criptografados
- [ ] Todas as APIs têm autenticação e autorização
- [ ] Rate limiting está configurado
- [ ] Headers de segurança estão configurados
- [ ] Logs de auditoria estão funcionando
- [ ] Backups automáticos estão configurados
- [ ] Testes de recuperação foram realizados
- [ ] Termo de consentimento está implementado
- [ ] Política de privacidade está publicada
- [ ] Monitoramento de segurança está ativo
- [ ] Plano de resposta a incidentes está documentado

## 13. Contato de Segurança

**Para reportar vulnerabilidades:**
- E-mail: security@medko.com.br
- Resposta em até 24 horas
- Programa de recompensas por bugs (bug bounty)
