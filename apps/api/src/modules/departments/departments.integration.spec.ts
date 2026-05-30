import { CanActivate, ExecutionContext, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DepartmentTemplate } from '@prisma/client';
import request = require('supertest');

import { AuditLogService } from '../audit/audit-log.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { PrismaService } from '../../database/prisma.service';
import { DepartmentsController } from './controllers/departments.controller';
import { ScheduleFieldsController } from './controllers/schedule-fields.controller';
import { DepartmentFieldSeederService } from './services/department-field-seeder.service';
import { CreateDepartmentUseCase } from './use-cases/create-department.use-case';
import { DeactivateDepartmentUseCase } from './use-cases/deactivate-department.use-case';
import { DeleteDepartmentUseCase } from './use-cases/delete-department.use-case';
import { GetDepartmentUseCase } from './use-cases/get-department.use-case';
import { GetScheduleFieldsUseCase } from './use-cases/get-schedule-fields.use-case';
import { ListDepartmentsUseCase } from './use-cases/list-departments.use-case';
import { UpdateDepartmentUseCase } from './use-cases/update-department.use-case';
import { UpsertScheduleFieldsUseCase } from './use-cases/upsert-schedule-fields.use-case';

// ---------------------------------------------------------------------------
// IDs fixos
// ---------------------------------------------------------------------------
const CHURCH_ID   = 'aaaaaaaa-0000-4000-8000-000000000001';
const DEPT_ID     = 'bbbbbbbb-0000-4000-8000-000000000002';
const LEADER_ID   = 'cccccccc-0000-4000-8000-000000000003';
const MINISTER_ID = 'dddddddd-0000-4000-8000-000000000004';
const FIELD_ID    = 'eeeeeeee-0000-4000-8000-000000000005';
const SCHEDULE_ID = 'ffffffff-0000-4000-8000-000000000006';

// ---------------------------------------------------------------------------
// Usuários de teste
// ---------------------------------------------------------------------------
const pastorUser: AuthenticatedUser = {
  id: LEADER_ID,
  email: 'pastor@test.com',
  name: 'Pastor Central',
  avatarUrl: null,
  churchId: CHURCH_ID,
  churchName: 'Igreja Teste',
  role: 'pastor_central',
  supabaseUserId: 'supa-000',
  isSuporte: false,
};

const leaderUser: AuthenticatedUser = {
  ...pastorUser,
  id: LEADER_ID,
  role: 'lider',
};

const ministerUser: AuthenticatedUser = {
  ...pastorUser,
  id: MINISTER_ID,
  role: 'membro',
};

const membroUser: AuthenticatedUser = {
  ...pastorUser,
  id: 'a1b2c3d4-0000-4000-8000-000000000099',
  role: 'membro',
};

// ---------------------------------------------------------------------------
// Guard de teste
// ---------------------------------------------------------------------------
class TestJwtGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<{ user: AuthenticatedUser; headers: Record<string, string> }>();
    const header = req.headers['x-test-user'];
    if (!header) return false;
    req.user = JSON.parse(header) as AuthenticatedUser;
    return true;
  }
}

// ---------------------------------------------------------------------------
// Mock do Prisma
// ---------------------------------------------------------------------------
const mockPrisma = {
  department:          { create: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), update: jest.fn(), delete: jest.fn() },
  departmentField:     { createMany: jest.fn(), findMany: jest.fn(), deleteMany: jest.fn() },
  departmentMember:    { count: jest.fn() },
  schedule:            { count: jest.fn(), findFirst: jest.fn(), deleteMany: jest.fn() },
  scheduleFieldValue:  { upsert: jest.fn(), findMany: jest.fn() },
  churchRoleAssignment:{ findFirst: jest.fn() },
  user:                { findFirst: jest.fn() },
  auditLog:            { create: jest.fn() },
  $transaction: jest.fn().mockImplementation((arg: unknown) => {
    if (typeof arg === 'function') return (arg as (tx: typeof mockPrisma) => Promise<unknown>)(mockPrisma);
    if (Array.isArray(arg)) return Promise.all(arg as Promise<unknown>[]);
    return Promise.resolve();
  }),
};

// ---------------------------------------------------------------------------
// Fábrica de dept padrão
// ---------------------------------------------------------------------------
const makeDept = (overrides = {}) => ({
  id: DEPT_ID,
  name: 'Louvor',
  description: null,
  template: DepartmentTemplate.louvor,
  isActive: true,
  leaderId: LEADER_ID,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------
describe('DepartmentsModule — testes de integração', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [DepartmentsController, ScheduleFieldsController],
      providers: [
        CreateDepartmentUseCase,
        ListDepartmentsUseCase,
        GetDepartmentUseCase,
        UpdateDepartmentUseCase,
        DeactivateDepartmentUseCase,
        DeleteDepartmentUseCase,
        UpsertScheduleFieldsUseCase,
        GetScheduleFieldsUseCase,
        DepartmentFieldSeederService,
        AuditLogService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(TestJwtGuard)
      .compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  afterAll(() => app.close());

  beforeEach(() => {
    jest.resetAllMocks();
    // Restaura o $transaction após reset
    mockPrisma.$transaction.mockImplementation((arg: unknown) => {
      if (typeof arg === 'function') return (arg as (tx: typeof mockPrisma) => Promise<unknown>)(mockPrisma);
      if (Array.isArray(arg)) return Promise.all(arg as Promise<unknown>[]);
      return Promise.resolve();
    });
    mockPrisma.auditLog.create.mockResolvedValue({});
    mockPrisma.departmentField.createMany.mockResolvedValue({ count: 1 });
  });

  // -------------------------------------------------------------------------
  // TC-01 — template dança → campo Figurino criado automaticamente
  // -------------------------------------------------------------------------
  it('TC-01: cria ministério com template dança → campo Figurino criado automaticamente', async () => {
    mockPrisma.user.findFirst.mockResolvedValue({ id: LEADER_ID });
    mockPrisma.churchRoleAssignment.findFirst.mockResolvedValue({ role: 'lider' });
    mockPrisma.department.create.mockResolvedValue(makeDept({ template: DepartmentTemplate.danca }));

    await request(app.getHttpServer())
      .post(`/churches/${CHURCH_ID}/departments`)
      .set('x-test-user', JSON.stringify(pastorUser))
      .send({ name: 'Dança', template: 'danca', leaderId: LEADER_ID, fields: [] })
      .expect(201);

    expect(mockPrisma.departmentField.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.arrayContaining([
          expect.objectContaining({ label: 'Figurino', order: 0 }),
        ]),
      }),
    );
  });

  // -------------------------------------------------------------------------
  // TC-02 — template personalizado → apenas campos customizáveis do request
  // -------------------------------------------------------------------------
  it('TC-02: cria ministério personalizado → apenas campos customizáveis informados', async () => {
    mockPrisma.user.findFirst.mockResolvedValue({ id: LEADER_ID });
    mockPrisma.churchRoleAssignment.findFirst.mockResolvedValue({ role: 'lider' });
    mockPrisma.department.create.mockResolvedValue(makeDept({ template: DepartmentTemplate.personalizado }));

    await request(app.getHttpServer())
      .post(`/churches/${CHURCH_ID}/departments`)
      .set('x-test-user', JSON.stringify(pastorUser))
      .send({ name: 'Personalizado', template: 'personalizado', leaderId: LEADER_ID, fields: [{ label: 'Posição', order: 0 }] })
      .expect(201);

    // createMany chamado 1x apenas para o campo customizável do request (seeder não cria nada para personalizado)
    expect(mockPrisma.departmentField.createMany).toHaveBeenCalledTimes(1);
    expect(mockPrisma.departmentField.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.arrayContaining([expect.objectContaining({ label: 'Posição' })]),
      }),
    );
    // Garante que Figurino não foi criado
    const calls = mockPrisma.departmentField.createMany.mock.calls as { data: { label: string }[] }[][];
    const allLabels = calls.flatMap(([arg]) => arg.data.map((f) => f.label));
    expect(allLabels).not.toContain('Figurino');
  });

  // -------------------------------------------------------------------------
  // TC-03 — cronograma_culto sem leaderId → aceita (201)
  // -------------------------------------------------------------------------
  it('TC-03: cronograma do culto criado sem leader_id → aceita', async () => {
    mockPrisma.department.create.mockResolvedValue(
      makeDept({ template: DepartmentTemplate.cronograma_culto, leaderId: null }),
    );

    await request(app.getHttpServer())
      .post(`/churches/${CHURCH_ID}/departments`)
      .set('x-test-user', JSON.stringify(pastorUser))
      .send({ name: 'Cronograma do Culto', template: 'cronograma_culto' })
      .expect(201);

    expect(mockPrisma.department.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ leaderId: null }) }),
    );
  });

  // -------------------------------------------------------------------------
  // TC-04 — outro template sem leaderId → 400
  // -------------------------------------------------------------------------
  it('TC-04: outros templates sem leader_id → retorna 400', async () => {
    await request(app.getHttpServer())
      .post(`/churches/${CHURCH_ID}/departments`)
      .set('x-test-user', JSON.stringify(pastorUser))
      .send({ name: 'Louvor sem líder', template: 'louvor' })
      .expect(400);

    expect(mockPrisma.department.create).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // TC-05 — inativar com membros ativos → 409
  // -------------------------------------------------------------------------
  it('TC-05: inativar ministério com membros ativos → retorna 409', async () => {
    mockPrisma.department.findFirst.mockResolvedValue(makeDept());
    mockPrisma.departmentMember.count.mockResolvedValue(3);
    mockPrisma.schedule.count.mockResolvedValue(0);

    const res = await request(app.getHttpServer())
      .patch(`/churches/${CHURCH_ID}/departments/${DEPT_ID}/deactivate`)
      .set('x-test-user', JSON.stringify(pastorUser))
      .expect(409);

    expect(res.body.message).toMatch(/3 membro\(s\) ativo\(s\)/);
    expect(mockPrisma.department.update).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // TC-06 — inativar com escalas futuras → 409
  // -------------------------------------------------------------------------
  it('TC-06: inativar ministério com escalas futuras → retorna 409', async () => {
    mockPrisma.department.findFirst.mockResolvedValue(makeDept());
    mockPrisma.departmentMember.count.mockResolvedValue(0);
    mockPrisma.schedule.count.mockResolvedValue(2);

    const res = await request(app.getHttpServer())
      .patch(`/churches/${CHURCH_ID}/departments/${DEPT_ID}/deactivate`)
      .set('x-test-user', JSON.stringify(pastorUser))
      .expect(409);

    expect(res.body.message).toMatch(/2 escala\(s\) futura\(s\)/);
    expect(mockPrisma.department.update).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // TC-07 — deletar ministério ativo → 409
  // -------------------------------------------------------------------------
  it('TC-07: deletar ministério ativo → retorna 409', async () => {
    mockPrisma.department.findFirst.mockResolvedValue(makeDept({ isActive: true }));

    const res = await request(app.getHttpServer())
      .delete(`/churches/${CHURCH_ID}/departments/${DEPT_ID}`)
      .set('x-test-user', JSON.stringify(pastorUser))
      .expect(409);

    expect(res.body.message).toMatch(/Inative-o primeiro/);
    expect(mockPrisma.schedule.deleteMany).not.toHaveBeenCalled();
    expect(mockPrisma.department.delete).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // TC-08 — deletar ministério inativo → cascata correta
  // -------------------------------------------------------------------------
  it('TC-08: deletar ministério inativo → remove schedules e department em cascata', async () => {
    mockPrisma.department.findFirst.mockResolvedValue(makeDept({ isActive: false }));
    mockPrisma.schedule.deleteMany.mockResolvedValue({ count: 2 });
    mockPrisma.department.delete.mockResolvedValue({});

    await request(app.getHttpServer())
      .delete(`/churches/${CHURCH_ID}/departments/${DEPT_ID}`)
      .set('x-test-user', JSON.stringify(pastorUser))
      .expect(200);

    expect(mockPrisma.schedule.deleteMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { departmentId: DEPT_ID } }),
    );
    expect(mockPrisma.department.delete).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: DEPT_ID } }),
    );
    // Garante a ordem: schedules antes do department
    const schedOrder = mockPrisma.schedule.deleteMany.mock.invocationCallOrder[0] as number;
    const deptOrder  = mockPrisma.department.delete.mock.invocationCallOrder[0] as number;
    expect(schedOrder).toBeLessThan(deptOrder);
  });

  // -------------------------------------------------------------------------
  // TC-09 — Ministro Responsável preenche campos → filled_by correto
  // -------------------------------------------------------------------------
  it('TC-09: Ministro Responsável preenche campos → filled_by salvo corretamente', async () => {
    mockPrisma.schedule.findFirst.mockResolvedValue({
      id: SCHEDULE_ID,
      ministerId: MINISTER_ID,
      departmentId: DEPT_ID,
    });
    mockPrisma.departmentField.findMany.mockResolvedValue([{ id: FIELD_ID }]);
    mockPrisma.scheduleFieldValue.upsert.mockResolvedValue({});

    await request(app.getHttpServer())
      .put(`/churches/${CHURCH_ID}/schedules/${SCHEDULE_ID}/fields`)
      .set('x-test-user', JSON.stringify(ministerUser))
      .send({ fields: [{ departmentFieldId: FIELD_ID, value: 'Vestido Branco' }] })
      .expect(200);

    expect(mockPrisma.scheduleFieldValue.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ filledBy: MINISTER_ID, value: 'Vestido Branco' }),
        update: expect.objectContaining({ filledBy: MINISTER_ID, value: 'Vestido Branco' }),
      }),
    );
  });

  // -------------------------------------------------------------------------
  // TC-10 — usuário que não é o Ministro tenta preencher campos → 403
  // -------------------------------------------------------------------------
  it('TC-10: líder tenta preencher campos da escala (não é o Ministro) → retorna 403', async () => {
    mockPrisma.schedule.findFirst.mockResolvedValue({
      id: SCHEDULE_ID,
      ministerId: 'outro-usuario-id',
      departmentId: DEPT_ID,
    });

    await request(app.getHttpServer())
      .put(`/churches/${CHURCH_ID}/schedules/${SCHEDULE_ID}/fields`)
      .set('x-test-user', JSON.stringify(leaderUser))
      .send({ fields: [{ departmentFieldId: FIELD_ID, value: 'Valor qualquer' }] })
      .expect(403);

    expect(mockPrisma.scheduleFieldValue.upsert).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // TC-11 — membro não vê ministérios inativos na listagem
  // -------------------------------------------------------------------------
  it('TC-11: membro visualiza listagem → ministérios inativos não aparecem', async () => {
    mockPrisma.department.findMany.mockResolvedValue([
      { id: DEPT_ID, name: 'Louvor', template: DepartmentTemplate.louvor, isActive: true, leader: null, _count: { members: 5 } },
    ]);

    const res = await request(app.getHttpServer())
      .get(`/churches/${CHURCH_ID}/departments`)
      .set('x-test-user', JSON.stringify(membroUser))
      .expect(200);

    expect(mockPrisma.department.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ isActive: true }),
      }),
    );
    expect(res.body).toHaveLength(1);
    expect(res.body[0].isActive).toBe(true);
  });
});
