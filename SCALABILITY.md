# Análise de Escalabilidade - Sistema Medko

## 1. Cenários de Uso

### 1.1. Cenário Pequeno
- **10 médicos** ativos
- **100 pacientes** por médico = 1.000 pacientes
- **20 atendimentos/dia** por médico = 200 atendimentos/dia
- **Pico:** 5 médicos atendendo simultaneamente

### 1.2. Cenário Médio
- **100 médicos** ativos
- **500 pacientes** por médico = 50.000 pacientes
- **30 atendimentos/dia** por médico = 3.000 atendimentos/dia
- **Pico:** 50 médicos atendendo simultaneamente

### 1.3. Cenário Grande
- **1.000 médicos** ativos
- **1.000 pacientes** por médico = 1.000.000 pacientes
- **40 atendimentos/dia** por médico = 40.000 atendimentos/dia
- **Pico:** 500 médicos atendendo simultaneamente

## 2. Análise de Requisições

### 2.1. Fluxo de Atendimento Típico

**Ações durante um atendimento (10 minutos):**

| Ação | Requisições | Frequência |
|------|-------------|------------|
| Buscar paciente | 3 | 1x (autocomplete) |
| Carregar dados do paciente | 1 | 1x |
| Buscar medicamento | 10 | 2x (autocomplete) |
| Visualizar bula | 2 | 1x |
| Criar prescrição | 1 | 1x |
| Assinar digitalmente | 1 | 1x |
| Enviar via WhatsApp | 1 | 1x |
| **TOTAL** | **19 req** | **por atendimento** |

### 2.2. Cálculo de Requisições por Minuto

**Cenário Médio (50 médicos simultâneos):**
- 50 médicos × 19 req/atendimento ÷ 10 min = **95 req/min**
- Com margem de segurança (2x) = **190 req/min**

**Cenário Grande (500 médicos simultâneos):**
- 500 médicos × 19 req/atendimento ÷ 10 min = **950 req/min**
- Com margem de segurança (2x) = **1.900 req/min** (~32 req/s)

### 2.3. Conclusão sobre Rate Limiting

**Limite proposto: 300 req/min por médico**

✅ **Adequado** para todos os cenários:
- Médico fazendo 19 req a cada 10 min = 114 req/hora
- Limite de 300 req/min = 18.000 req/hora
- **Margem de segurança: 157x**

## 3. Capacidade do Banco de Dados

### 3.1. Estimativa de Armazenamento

**Cenário Grande (1.000 médicos, 1.000.000 pacientes):**

| Tabela | Registros | Tamanho/Registro | Total |
|--------|-----------|------------------|-------|
| **users** (médicos) | 1.000 | 1 KB | 1 MB |
| **patients** | 1.000.000 | 2 KB (criptografado) | 2 GB |
| **medications** | 60.000 | 5 KB (JSON apresentações) | 300 MB |
| **prescriptions** | 10.000.000/ano | 3 KB | 30 GB/ano |
| **certificates** (atestados) | 2.000.000/ano | 2 KB | 4 GB/ano |
| **exam_requests** | 5.000.000/ano | 2 KB | 10 GB/ano |
| **audit_logs** | 100.000.000/ano | 500 bytes | 50 GB/ano |
| **TOTAL** | - | - | **~96 GB/ano** |

**Com 5 anos de retenção:** ~480 GB

✅ **Adequado** para MySQL/TiDB (suporta TB de dados)

### 3.2. Índices Necessários

**Para garantir performance:**

```sql
-- Tabela patients
CREATE INDEX idx_patients_doctor ON patients(doctorId);
CREATE INDEX idx_patients_cpf ON patients(cpf_encrypted);

-- Tabela prescriptions
CREATE INDEX idx_prescriptions_doctor ON prescriptions(doctorId);
CREATE INDEX idx_prescriptions_patient ON prescriptions(patientId);
CREATE INDEX idx_prescriptions_date ON prescriptions(createdAt);

-- Tabela medications
CREATE INDEX idx_medications_nome ON medications(nomeProduto);
CREATE INDEX idx_medications_principio ON medications(principioAtivo);
CREATE INDEX idx_medications_processo ON medications(numeroProcesso);

-- Tabela audit_logs
CREATE INDEX idx_audit_user ON audit_logs(userId);
CREATE INDEX idx_audit_date ON audit_logs(timestamp);
```

## 4. Capacidade do S3 (Armazenamento de Arquivos)

### 4.1. PDFs de Bulas

**Medicamentos: 60.000**
- 60.000 medicamentos × 2 PDFs (paciente + profissional) = 120.000 PDFs
- Tamanho médio: 500 KB por PDF
- **Total: 60 GB**

### 4.2. Documentos Médicos Gerados

**Cenário Grande (40.000 atendimentos/dia):**
- 40.000 atendimentos/dia × 365 dias = 14.600.000 documentos/ano
- Tamanho médio: 200 KB por PDF
- **Total: 2.92 TB/ano**

**Com 5 anos de retenção:** ~15 TB

✅ **Adequado** para S3 (armazenamento ilimitado)

**Custo estimado (S3 Standard):**
- 15 TB × $0.023/GB = ~$345/mês

**Otimização com Lifecycle:**
- Após 90 dias → S3 Glacier (~$4/TB/mês)
- Economia: ~$285/mês

## 5. Largura de Banda

### 5.1. Upload de PDFs (Bulas)

**Uma vez (importação inicial):**
- 60 GB ÷ 1 hora = 133 Mbps
- ✅ Viável com conexão de 200 Mbps

### 5.2. Download de PDFs (Visualização de Bulas)

**Cenário Grande (500 médicos simultâneos):**
- 500 médicos × 2 bulas/atendimento × 500 KB = 500 MB
- Distribuído em 10 minutos = 50 MB/min = **6.7 Mbps**

✅ **Adequado** (tráfego baixo)

### 5.3. Envio de Documentos via WhatsApp

**Cenário Grande (40.000 documentos/dia):**
- 40.000 docs × 200 KB = 8 GB/dia
- Distribuído em 12 horas (horário comercial) = 1.5 Mbps

✅ **Adequado** (tráfego baixo)

## 6. Capacidade da API Zenvia

### 6.1. Limites da Zenvia

**Segundo documentação:**
- WhatsApp: 1.000 mensagens/segundo
- SMS: 500 mensagens/segundo

### 6.2. Uso do Medko

**Cenário Grande (40.000 documentos/dia):**
- 40.000 mensagens/dia ÷ 12 horas = 3.333 mensagens/hora
- 3.333 mensagens/hora ÷ 3.600 segundos = **0.93 mensagens/segundo**

✅ **Muito abaixo do limite** (margem de 1.000x)

## 7. Otimizações para Escalabilidade

### 7.1. Cache de Dados Frequentes

**Implementar cache com Redis:**

| Dado | TTL | Benefício |
|------|-----|-----------|
| Lista de medicamentos | 24h | Reduz 90% das queries ao banco |
| Dados do médico | 1h | Reduz queries repetidas |
| Bulas (metadados) | 24h | Acelera busca |

**Estimativa de redução de carga:**
- Busca de medicamentos: -90% (de 60 req/min para 6 req/min)
- **Total:** -70% de queries ao banco

### 7.2. CDN para PDFs

**Usar CloudFront (CDN da AWS):**
- PDFs de bulas são estáticos
- Cache em edge locations próximas ao usuário
- **Redução de latência:** 80-90%
- **Redução de custo S3:** 60%

### 7.3. Paginação e Lazy Loading

**Listas grandes:**
- Histórico de documentos: 20 itens por página
- Lista de pacientes: 50 itens por página
- Busca de medicamentos: 10 resultados iniciais

**Benefício:** Reduz payload das respostas em 95%

### 7.4. Compressão de Respostas

**Habilitar gzip/brotli:**
- JSON responses: -70% de tamanho
- **Economia de banda:** 50%

### 7.5. Database Connection Pooling

**Configuração:**
- Pool mínimo: 10 conexões
- Pool máximo: 100 conexões
- Timeout: 30 segundos

**Benefício:** Reduz overhead de criação de conexões

## 8. Monitoramento de Performance

### 8.1. Métricas Críticas

**Backend:**
- Tempo de resposta médio (target: <200ms)
- Taxa de erro (target: <0.1%)
- CPU usage (target: <70%)
- Memória (target: <80%)
- Queries lentas (target: <100ms)

**Banco de Dados:**
- Queries por segundo
- Conexões ativas
- Slow queries
- Deadlocks

**S3:**
- Requisições por segundo
- Latência de download
- Taxa de erro

**Zenvia:**
- Mensagens enviadas
- Taxa de entrega
- Falhas de envio

### 8.2. Alertas

**Configurar alertas para:**
- Tempo de resposta > 500ms (5 min consecutivos)
- Taxa de erro > 1%
- CPU > 80% (10 min consecutivos)
- Memória > 90%
- Disco > 85%
- Queries lentas > 1 segundo

## 9. Plano de Escalabilidade

### 9.1. Fase 1: Até 100 Médicos
- **Servidor:** 1 instância (4 vCPU, 8 GB RAM)
- **Banco:** MySQL/TiDB compartilhado
- **Cache:** Redis compartilhado
- **Custo estimado:** $200/mês

### 9.2. Fase 2: 100-500 Médicos
- **Servidor:** 2 instâncias (load balancer)
- **Banco:** MySQL/TiDB dedicado (8 GB RAM)
- **Cache:** Redis dedicado (2 GB)
- **CDN:** CloudFront habilitado
- **Custo estimado:** $500/mês

### 9.3. Fase 3: 500-1000 Médicos
- **Servidor:** 4 instâncias (auto-scaling)
- **Banco:** MySQL/TiDB cluster (16 GB RAM)
- **Cache:** Redis cluster (4 GB)
- **CDN:** CloudFront + S3 Transfer Acceleration
- **Custo estimado:** $1.200/mês

### 9.4. Fase 4: 1000+ Médicos
- **Servidor:** Auto-scaling (4-10 instâncias)
- **Banco:** TiDB cluster distribuído (32 GB RAM)
- **Cache:** Redis cluster (8 GB)
- **CDN:** CloudFront global
- **Microservices:** Separar serviços críticos
- **Custo estimado:** $3.000/mês

## 10. Conclusão

✅ **O sistema Medko é altamente escalável:**

- **Rate limiting inteligente** não prejudica atendimento
- **Arquitetura suporta** 1.000+ médicos simultâneos
- **Banco de dados** comporta milhões de registros
- **S3** armazena TB de documentos
- **Zenvia** suporta 1.000x mais mensagens que o necessário
- **Otimizações** (cache, CDN) reduzem carga em 70-90%

**Recomendação:** Começar com Fase 1 e escalar conforme demanda.
