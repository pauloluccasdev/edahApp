# Arquitetura e Regras de Responsabilidade

## Visão Geral das Camadas

```
[Next.js] → (HTTP/REST) → [NestJS] → (queries) → [Supabase / Postgres]
   UI                    Regra de negócio          Infraestrutura
```

---

## Responsabilidades por Camada

### Next.js — Interface e Experiência
- Somente camada de apresentação (UI/UX).
- Consome a API do NestJS via HTTP/REST (ou futuramente GraphQL/gRPC).
- **Não acessa o banco de dados diretamente para regras de domínio.**
- Pode usar o Supabase SDK apenas para operações de interface sem regra de negócio (ex: upload direto de arquivos para Storage com token obtido via backend).

### NestJS — Dono da Regra de Negócio e da API
O backend é o ponto central da aplicação. Deve concentrar:

- **Autenticação** — valida tokens, emite sessões, integra com Supabase Auth.
- **Autorização** — controla permissões e papéis (RBAC/ABAC).
- **Multi-tenant** — isola dados e contexto por organização/tenant.
- **Regras de negócio** — toda lógica de domínio passa pelo NestJS.
- **Integrações externas** — terceiros, webhooks, serviços externos.
- **Filas e jobs** — processamento assíncrono, workers, agendamentos.

### Supabase — Infraestrutura
Usado exclusivamente como plataforma de infraestrutura, não como camada de negócio:

| Recurso    | Uso                                              |
|------------|--------------------------------------------------|
| **Postgres** | Banco de dados relacional principal.           |
| **Auth**     | Provedor de identidade (JWT/OAuth). O NestJS valida e controla o acesso. |
| **Storage**  | Armazenamento de arquivos (imagens, documentos). |

---

## Regras Fundamentais

1. **O frontend nunca acessa o banco diretamente para regras de domínio.**
2. **Toda regra de negócio vive no NestJS.**
3. **O Supabase é infraestrutura — não é o dono da lógica.**
4. **O NestJS é a única porta de entrada para dados sensíveis e operações críticas.**
5. **Autenticação flui pelo Supabase Auth, mas a autorização é gerenciada pelo NestJS.**
