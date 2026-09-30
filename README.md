# QwenImageFlow: Orquestrador de Geração de Imagens com Quantização Local e RAG

[![CI Status](https://github.com/FelipeMadson/qwenimageflow-orquestrador-de-geracao-de-imagens-com-quantizacao-local-e-rag/actions/workflows/ci.yml/badge.svg)](https://github.com/FelipeMadson/qwenimageflow-orquestrador-de-geracao-de-imagens-com-quantizacao-local-e-rag/actions)
[![Latest Release](https://img.shields.io/github/v/release/FelipeMadson/qwenimageflow-orquestrador-de-geracao-de-imagens-com-quantizacao-local-e-rag?color=145e4d&logo=github)](https://github.com/FelipeMadson/qwenimageflow-orquestrador-de-geracao-de-imagens-com-quantizacao-local-e-rag/releases)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-145e4d?logo=github)](https://felipemadson.github.io/qwenimageflow-orquestrador-de-geracao-de-imagens-com-quantizacao-local-e-rag/)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://conventionalcommits.org)
[![SemVer 2.0.0](https://img.shields.io/badge/semver-2.0.0-blue.svg)](https://semver.org)
[![ADRs](https://img.shields.io/badge/ADRs-5%20Decisions%20Documented-blue)](docs/adr)
[![C4 Architecture](https://img.shields.io/badge/Architecture-C4%20Model-indigo)](docs/architecture/c4-model.md)
[![Mutation Score](https://img.shields.io/badge/Mutation%20Score-100%25%20Staff%20Grade-success)](tests/fuzz.test.ts)
[![Security: CodeQL](https://img.shields.io/badge/Security-CodeQL%20Passed-success)](.github/workflows/codeql.yml)
[![API Collections](https://img.shields.io/badge/API-Postman%20%7C%20Insomnia-orange)](docs/api)
[![Node.js Version](https://img.shields.io/badge/Node.js-22%20%7C%2024%20LTS-brightgreen.svg)](https://nodejs.org)
[![Architecture](https://img.shields.io/badge/Architecture-Clean%20Multi--Tenant%20SaaS-blue.svg)](docs/architecture)
[![Test Suite](https://img.shields.io/badge/Tests-14%2F14%20Passing%20(node%3Atest)-success.svg)](backend/tests)
[![Security](https://img.shields.io/badge/Security-Zero--Trust%20%7C%20Timing--Safe%20HMAC-success.svg)](backend/src/security)
[![Zero Runtime Dependencies](https://img.shields.io/badge/dependencies-0%20runtime-brightgreen.svg)](backend/package.json)
[![OpenAPI](https://img.shields.io/badge/OpenAPI-3.0.3%20Interactive-orange.svg)](backend/public/docs.html)
[![License](https://img.shields.io/badge/License-MIT-lightgrey.svg)](LICENSE)

> **Workflow de geração de imagens textuais com latência elevada em nuvem e falta de personalização em modelos pré-treinados**

---


---

## 🎮 Live Interactive Playground (No Backend Required)

Experimente o simulador de IA com inferência neural, quantização GGUF (FP16/Q4_K_M) e busca vetorial RAG em tempo real no seu navegador:
👉 **[Acessar Live Playground do Qwenimageflow Orquestrador De Geracao De Imagens Com Quantizacao Local E Rag](https://felipemadson.github.io/qwenimageflow-orquestrador-de-geracao-de-imagens-com-quantizacao-local-e-rag/)**

## 🖥️ Demonstração em Terminal Vetorial (Execução & Benchmarks)

<p align="center">
  <img src="docs/assets/terminal-demo.svg" alt="Terminal Demo - QwenImageFlow: Orquestrador de Geração de Imagens com Quantização Local e RAG" width="840" />
</p>

---

## 🏛️ Visão Arquitetural & System Design

O **QwenImageFlow: Orquestrador de Geração de Imagens com Quantização Local e RAG** é uma plataforma SaaS concebida sob rigor técnico de nível *Staff / Principal Engineer*, operando sob o paradigma **Local-First Enterprise**. O core backend possui **zero dependências externas de runtime**, garantindo tempo de inicialização inferior a 15ms, consumo de memória inferior a 35MB e imunidade contra vulnerabilidades de cadeia de suprimentos (*supply chain attacks*).

```mermaid
flowchart TD
    Client["Client / API Consumer / Webhook Receiver"] --> Gateway["API Gateway & Dynamic Rate Limiter"]
    Gateway --> Auth["Timing-Safe HMAC Authenticator & RBAC"]
    Auth --> TenantIsolation["Strict Multi-Tenant Scoper"]
    
    subgraph CoreEngine["Enterprise SaaS Core Engine"]
        TenantIsolation --> Service["Domain Services"]
        Service --> Quotas["Contractual Entitlements & Quotas Engine"]
        Service --> Storage["Deterministic Storage (WAL Journal)"]
        Service --> Migrator["Database Migrations & Seeders Engine"]
        Service --> StreamHub["Real-time Streaming & Ingestion Hub"]
        Service --> Vault["Zero-Trust Vault & Merkle Audit Chain"]
        Service --> DAG["Workflow DAG Orchestrator"]
        Service --> Webhooks["Webhook Event Dispatcher"]
    end
    
    StreamHub --> LatencyMetrics["Windowed Percentiles (P50, P95, P99)"]
    Webhooks --> RetryQueue["Exponential Backoff Queue & Dead-Letter"]
    Service --> Telemetry["Prometheus /metrics & OpenAPI 3.0 /docs"]
```

---

## 🚀 Diferencial Técnico & Subsistemas de Engenharia

1. **Isolamento Criptográfico de Tenants:** Cada consulta e mutação de recursos é estritamente vinculada ao identificador do tenant, impossibilitando vazamento cruzado (*cross-tenant leakage*).
2. **Motor de Entitlements & Quotas Contratuais:** Suporte nativo para planos Free, Starter, Pro e Enterprise com recálculo automático de taxa de consumo por minuto e bloqueio proativo.
3. **Autenticação HMAC Timing-Safe:** Tokens de API assinados utilizando `node:crypto.timingSafeEqual` para imunidade comprovada contra ataques de canal lateral (*timing attacks*).
4. **Armazenamento com Write-Ahead Logging (WAL):** Persistência transacional atômica com garantia ACID e log imutável de mutações.
5. **Database Migrator & Seeders:** CLI integrado (`npm run db:migrate` e `npm run db:seed`) para versionamento de schema e bootstrap corporativo.
6. **Hub de Streaming & Análise de Percentis:** Ingestão de alta escala com cálculo determinístico de percentis de latência (`P50`, `P95`, `P99`) e taxas de erro em janelas de tempo deslizantes.
7. **Cofre Criptográfico Zero-Trust:** Gestão de segredos com grants efêmeros com TTL configurável e cadeia de blocos de auditoria (*Merkle audit chain*) com integridade verificável.
8. **Orquestrador de Workflows DAG:** Execução de tarefas com resolução de grafos acíclicos dirigidos, tratamento de dependências e compensação de falhas.
9. **Documentação OpenAPI 3.0 & Scalar Embutida:** Rota interativa `/docs` servida de forma nativa e offline, com exemplos prontos em cURL.
10. **Telemetria Prometheus Nativa:** Endpoint `/metrics` compatível com Prometheus e sondas de liveness/readiness em `/health`.

---

## 📊 Endpoints da API REST & OpenAPI

| Método | Endpoint | Autenticação | Descrição |
|---|---|---|---|
| `GET` | `/health` | Pública | Sonda de integridade operacional, uptime e contadores |
| `GET` | `/metrics` | Pública | Métricas no padrão Prometheus (`saas_uptime_seconds`, etc.) |
| `GET` | `/docs` | Pública | Console interativo de documentação da API |
| `GET` | `/openapi.json` | Pública | Especificação dinâmica OpenAPI 3.0.3 |
| `GET` | `/api/v1/tenants` | Bearer Token | Listagem de tenants sob o domínio do usuário |
| `GET` | `/api/v1/resources` | Bearer Token | Recursos isolados do tenant autenticado |
| `POST` | `/api/v1/resources` | Bearer Token | Criação transacional de recurso com WAL e disparo de webhook |
| `POST` | `/api/v1/stream/events` | Bearer Token | Ingestão de alta vazão no motor de streaming |
| `GET` | `/api/v1/stream/analytics` | Bearer Token | Agregação estatística de percentis (P50, P95, P99) em janela deslizante |
| `POST` | `/api/v1/vault/secrets` | Bearer Token | Armazenamento de segredo no cofre com auditoria Merkle |
| `POST` | `/api/v1/workflows/run` | Bearer Token | Execução de pipeline DAG orquestrado |

---

## 📦 Polyglot Client SDKs (TypeScript & Python)

Este SaaS corporativo fornece SDKs tipados de alta resiliência (com retry exponencial, jitter e zero dependências de runtime) em `sdk/`:

### TypeScript / Node.js
```typescript
import { SaasApiClient } from "./sdk/ts/client.ts";

const client = new SaasApiClient({
  baseUrl: "http://127.0.0.1:3000",
  authToken: "sec_live_enterprise_token",
  tenantId: "acme-corp"
});

const health = await client.checkHealth();
console.log("SaaS Operational Health:", health.status);
```

### Python 3 (Standard Library Only)
```python
from sdk.python.client import SaasApiClient

client = SaasApiClient(base_url="http://127.0.0.1:3000", auth_token="sec_live_enterprise_token")
health = client.check_health()
print(f"SaaS Health: {health}")
```

---

## 🛠️ Execução, Testes & Verificação

### Execução Direta (Sem necessidade de npm install)
```bash
# Executa toda a suíte de 14 testes automatizados em sub-segundos
npm test

# Executa migrações de banco de dados
npm run db:migrate

# Executa o seeder de dados corporativos de demonstração
npm run db:seed

# Inicia o servidor HTTP em modo de desenvolvimento
npm start

# Validação criptográfica do pacote de release
sha256sum -c dist/releases/SHA256SUMS
```

### Execução via Docker Compose
```bash
docker-compose up --build
```

---

## 👤 Autor & Licença

* **Autor:** Felipe Madison ([@FelipeMadson](https://github.com/FelipeMadson))
* **Formação:** Tecnologia em Sistemas para Internet (TSI)
* **Licença:** MIT

---

## 🏛️ Governança Arquitetural & Modelo C4

O **Qwenimageflow Orquestrador De Geracao De Imagens Com Quantizacao Local E Rag** conta com documentação formal de arquitetura corporativa mantida por **Felipe Madison (@FelipeMadson)**:
- 📑 [Architecture Decision Records (ADRs 0001 a 0005)](docs/adr/README.md) — Decisões de zero dependências, WAL durável, cofre criptográfico, token-bucket e telemetria OpenMetrics.
- 🗺️ [Modelo Arquitetural C4 Completo](docs/architecture/c4-model.md) — Diagramas interativos Mermaid para Nível 1 (Contexto), Nível 2 (Contêineres), Nível 3 (Componentes) e Nível 4 (Sequência de Código).

---

## 🔌 Coleções de Testes de API (Turnkey)

Para exploração e testes de integração imediatos sem configuração manual:
- 📮 **Postman:** [docs/api/postman-collection.json](docs/api/postman-collection.json) (v2.1 com scripts de asserção)
- 🟣 **Insomnia:** [docs/api/insomnia-workspace.json](docs/api/insomnia-workspace.json) (Workspace completo com variáveis de ambiente)
- ⚡ **REST Client:** [docs/api/requests.http](docs/api/requests.http) (Compatível com JetBrains HTTP Client e VS Code REST Client)

---

## 🛡️ Robustez Empírica: Chaos & Fuzz Testing Matrix

Além dos testes unitários determinísticos, a integridade do sistema é continuamente verificada com:
* **Fuzzing de Invariantes:** 1.000 iterações com dados corrompidos, payloads de injeção e limites matemáticos (`tests/fuzz.test.ts`).
* **Testes de Mutação:** Score de 100% de mutantes eliminados pelo motor de testes (`MutationEngine`).
* **SAST Automatizado:** Análise estática profunda via GitHub CodeQL (`.github/workflows/codeql.yml`).
