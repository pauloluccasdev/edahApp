# Backend Architecture — edahApp

> Guia oficial de arquitetura e padrões de código do backend.  
> Leia antes de criar qualquer módulo novo.

---

## 1. Princípios da Arquitetura

### Monólito modular

O backend é um único processo NestJS, mas organizado internamente por **features independentes**. Cada feature é um módulo com suas próprias camadas. Isso permite escalar o time sem criar microserviços prematuramente.

### Separação por feature, não por tipo global

Errado:
```
src/
  controllers/
  services/
  repositories/
```

Certo:
```
src/modules/
  churches/
  users/
  events/
```

Cada feature carrega suas próprias camadas. Nada é compartilhado globalmente sem necessidade real.

### Clean Architecture adaptada (sem overengineering)

Usamos os princípios da Clean Architecture de forma prática:

- **Domínio no centro**: entidades e regras de negócio não dependem de frameworks, banco ou HTTP.
- **Infraestrutura nas bordas**: Prisma, Supabase, bibliotecas externas ficam na implementação, não no domínio.
- **Adaptada**: não seguimos a Clean Architecture ao pé da letra. Se uma abstração não resolve um problema real, ela não existe aqui.

### Backend como dono da regra de negócio

Toda lógica de negócio vive no NestJS. O Next.js é camada de apresentação. O frontend nunca acessa o banco diretamente para operações de domínio.

### Supabase como infraestrutura

Supabase provê Postgres, Auth e Storage. Ele não é o dono da lógica — é o provedor de infraestrutura. O NestJS controla autenticação, autorização e regras de acesso.

---

## 2. Estrutura de Pastas

```
apps/api/src/modules/<feature>/
├── controllers/
│   └── <feature>.controller.ts
├── dto/
│   ├── create-<feature>.dto.ts
│   └── update-<feature>.dto.ts
├── use-cases/
│   ├── create-<feature>.use-case.ts
│   └── find-<feature>.use-case.ts
├── repositories/
│   ├── <feature>.repository.ts          # Interface/abstract
│   └── prisma-<feature>.repository.ts   # Implementação
├── entities/
│   └── <feature>.entity.ts
├── enums/
│   └── <feature>-status.enum.ts
├── mappers/
│   └── <feature>.mapper.ts
├── errors/
│   └── <feature>-not-found.error.ts
└── <feature>.module.ts
```

### Papel de cada pasta

| Pasta | Responsabilidade |
|---|---|
| `controllers/` | Entrada HTTP. Recebe request, chama use case, retorna response. |
| `dto/` | Contratos de entrada e saída da API. Sem lógica. |
| `use-cases/` | Orquestra o fluxo e aplica as regras de negócio. |
| `repositories/` | Interface que define o contrato + implementação que acessa o banco. |
| `entities/` | Representa o domínio. Protege invariantes. |
| `enums/` | Constantes tipadas do domínio. |
| `mappers/` | Converte entre DTO, entidade e modelo de persistência. |
| `errors/` | Erros de domínio específicos da feature. |
| `<feature>.module.ts` | Registro do módulo NestJS. |

---

## 3. Responsabilidades por Camada

### Controller

- Recebe a requisição HTTP.
- Valida o DTO (via `class-validator`).
- Chama o use case correspondente.
- Retorna a resposta.
- **Não contém regra de negócio.**

```typescript
// churches/controllers/church.controller.ts
@Controller('churches')
export class ChurchController {
  constructor(private readonly createChurch: CreateChurchUseCase) {}

  @Post()
  async create(@Body() dto: CreateChurchDto) {
    return this.createChurch.execute(dto);
  }
}
```

---

### Use Case

- Orquestra o fluxo da operação.
- Aplica as regras de negócio.
- Chama os repositories necessários.
- Lança erros de domínio quando necessário.
- **Uma classe = uma responsabilidade.**

```typescript
// churches/use-cases/create-church.use-case.ts
@Injectable()
export class CreateChurchUseCase {
  constructor(private readonly churchRepository: ChurchRepository) {}

  async execute(dto: CreateChurchDto): Promise<ChurchEntity> {
    const existing = await this.churchRepository.findByName(dto.name);

    if (existing) {
      throw new ChurchAlreadyExistsError(dto.name);
    }

    const church = ChurchEntity.create(dto);
    return this.churchRepository.save(church);
  }
}
```

---

### Repository

- A **interface/abstract** define o contrato que o use case conhece.
- A **implementação** acessa o banco (Prisma).
- **Não contém regra de negócio.**

```typescript
// churches/repositories/church.repository.ts
export abstract class ChurchRepository {
  abstract findById(id: string): Promise<ChurchEntity | null>;
  abstract findByName(name: string): Promise<ChurchEntity | null>;
  abstract save(church: ChurchEntity): Promise<ChurchEntity>;
}
```

```typescript
// churches/repositories/prisma-church.repository.ts
@Injectable()
export class PrismaChurchRepository extends ChurchRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(id: string): Promise<ChurchEntity | null> {
    const record = await this.prisma.church.findUnique({ where: { id } });
    if (!record) return null;
    return ChurchMapper.toDomain(record);
  }

  async findByName(name: string): Promise<ChurchEntity | null> {
    const record = await this.prisma.church.findFirst({ where: { name } });
    if (!record) return null;
    return ChurchMapper.toDomain(record);
  }

  async save(church: ChurchEntity): Promise<ChurchEntity> {
    const data = ChurchMapper.toPersistence(church);
    const record = await this.prisma.church.upsert({
      where: { id: church.id },
      create: data,
      update: data,
    });
    return ChurchMapper.toDomain(record);
  }
}
```

---

### Entity

- Representa o conceito de domínio.
- Protege as invariantes (validações de negócio internas).
- Não depende de Prisma, NestJS ou qualquer framework.

```typescript
// churches/entities/church.entity.ts
export class ChurchEntity {
  readonly id: string;
  readonly name: string;
  readonly tenantId: string;
  readonly createdAt: Date;

  private constructor(props: ChurchProps) {
    this.id = props.id ?? randomUUID();
    this.name = props.name;
    this.tenantId = props.tenantId;
    this.createdAt = props.createdAt ?? new Date();
  }

  static create(props: Omit<ChurchProps, 'id' | 'createdAt'>): ChurchEntity {
    if (!props.name || props.name.trim().length < 3) {
      throw new Error('Nome da igreja deve ter ao menos 3 caracteres.');
    }
    return new ChurchEntity(props);
  }

  static restore(props: ChurchProps): ChurchEntity {
    return new ChurchEntity(props);
  }
}
```

---

### DTO

- Define o contrato de entrada e saída da API.
- Sem lógica.
- Usa `class-validator` para validação.

```typescript
// churches/dto/create-church.dto.ts
export class CreateChurchDto {
  @IsString()
  @MinLength(3)
  name: string;

  @IsUUID()
  tenantId: string;
}
```

---

### Mapper

- Converte entre DTO, entidade de domínio e modelo do Prisma.
- Criado apenas quando há diferença real entre as representações.

```typescript
// churches/mappers/church.mapper.ts
export class ChurchMapper {
  static toDomain(record: PrismaChurch): ChurchEntity {
    return ChurchEntity.restore({
      id: record.id,
      name: record.name,
      tenantId: record.tenant_id,
      createdAt: record.created_at,
    });
  }

  static toPersistence(entity: ChurchEntity): Prisma.ChurchCreateInput {
    return {
      id: entity.id,
      name: entity.name,
      tenant_id: entity.tenantId,
      created_at: entity.createdAt,
    };
  }
}
```

---

## 4. Uso de Interfaces

| Camada | Usar interface? | Por quê? |
|---|---|---|
| Repository | **Sim** — abstract class | Permite trocar a implementação (Prisma → outra) sem mudar o use case. |
| Use Case | **Não** | Um use case por arquivo. Interface não agrega nada. |
| Service auxiliar | Só se houver múltiplas implementações reais. | Caso contrário é abstração desnecessária. |

**Regra:** crie a interface quando a troca de implementação for um cenário real, não hipotético.

---

## 5. Padrões de Nomeação

| O que | Padrão | Exemplo |
|---|---|---|
| Use case | `<Ação><Feature>UseCase` | `CreateChurchUseCase` |
| Repository (abstract) | `<Feature>Repository` | `ChurchRepository` |
| Repository (impl) | `<ORM><Feature>Repository` | `PrismaChurchRepository` |
| Entity | `<feature>.entity.ts` | `church.entity.ts` |
| DTO | `<acao>-<feature>.dto.ts` | `create-church.dto.ts` |
| Mapper | `<feature>.mapper.ts` | `church.mapper.ts` |
| Erro | `<feature>-<descricao>.error.ts` | `church-not-found.error.ts` |
| Enum | `<feature>-<descricao>.enum.ts` | `church-status.enum.ts` |
| Módulo | `<feature>.module.ts` | `church.module.ts` |

---

## 6. Boas Práticas

- **SOLID de forma pragmática.** Aplique quando simplifica, não quando complica.
- **Código simples > código "perfeito".** Legibilidade é uma feature.
- **Uma classe, uma responsabilidade.** Use case = uma operação.
- **Não repita lógica.** Se vai repetir em dois use cases, extraia um helper — mas só então.
- **Evite lógica no controller.** Controller é roteador, não regra de negócio.
- **Acesse o banco apenas pelo repository.** Nunca chame Prisma diretamente no use case ou controller.
- **Frontend não acessa Supabase para regras de domínio.** Toda operação crítica passa pelo NestJS.
- **Erros de domínio são explícitos.** Use classes de erro próprias para facilitar o tratamento.

---

## 7. Anti-patterns — Proibido

| Anti-pattern | Por quê é um problema |
|---|---|
| Controller com regra de negócio | Viola SRP, impossível de testar isoladamente. |
| Lógica espalhada em múltiplas camadas | Difícil de rastrear, manter e testar. |
| Interfaces sem implementação alternativa real | Burocracia sem benefício. |
| Estrutura global por tipo (`/controllers`, `/services`) | Módulos acoplados, difícil de escalar o time. |
| Chamar Prisma diretamente fora do repository | Quebra o isolamento da infraestrutura. |
| Frontend acessando Supabase para regra de negócio | Backend perde controle de autorização e lógica. |
| Mappers para objetos idênticos | Mapeamento sem diferença real é ruído. |
| Use case com mais de uma responsabilidade | Dificulta testes e entendimento. |

---

## 8. Exemplo Completo — Módulo `churches`

### Estrutura

```
src/modules/churches/
├── controllers/
│   └── church.controller.ts
├── dto/
│   └── create-church.dto.ts
├── use-cases/
│   └── create-church.use-case.ts
├── repositories/
│   ├── church.repository.ts
│   └── prisma-church.repository.ts
├── entities/
│   └── church.entity.ts
├── mappers/
│   └── church.mapper.ts
├── errors/
│   └── church-already-exists.error.ts
└── church.module.ts
```

### `church-already-exists.error.ts`

```typescript
export class ChurchAlreadyExistsError extends Error {
  constructor(name: string) {
    super(`Já existe uma igreja com o nome "${name}".`);
    this.name = 'ChurchAlreadyExistsError';
  }
}
```

### `church.module.ts`

```typescript
@Module({
  controllers: [ChurchController],
  providers: [
    CreateChurchUseCase,
    {
      provide: ChurchRepository,
      useClass: PrismaChurchRepository,
    },
  ],
})
export class ChurchModule {}
```

### Fluxo de uma requisição

```
POST /churches
  → ChurchController.create(dto)
    → CreateChurchUseCase.execute(dto)
      → ChurchRepository.findByName(dto.name)  ← verifica duplicata
      → ChurchEntity.create(dto)               ← valida invariantes
      → ChurchRepository.save(entity)          ← persiste via Prisma
    ← ChurchEntity
  ← 201 Created { id, name, tenantId, createdAt }
```

---

## 9. Regra de Ouro

> **Se a abstração não resolve um problema real hoje, não crie.**
>
> Abstrações prematuras geram burocracia, dificultam a leitura e atrasam o time.  
> Crie a estrutura mínima que resolve o problema. Refatore quando a necessidade for real.

---

*Dúvidas sobre onde colocar algo? Pergunte: "isso é regra de negócio?" → NestJS. "Isso é apresentação?" → Next.js. "Isso é dado?" → Supabase.*
