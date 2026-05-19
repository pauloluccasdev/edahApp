import { CanActivate, ExecutionContext, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ChurchRole } from '@prisma/client';
import request = require('supertest');

import { AuditLogService } from '../audit/audit-log.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SuporteGuard } from '../auth/guards/suporte.guard';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { SupabaseAuthService } from '../auth/services/supabase-auth.service';
import { PrismaService } from '../../database/prisma.service';
import { ChurchesController } from './controllers/churches.controller';
import { CreateChurchUseCase } from './use-cases/create-church.use-case';
import { GetChurchUseCase } from './use-cases/get-church.use-case';
import { ListChurchesUseCase } from './use-cases/list-churches.use-case';
import { SelectChurchesUseCase } from './use-cases/select-churches.use-case';
import { UpdateChurchUseCase } from './use-cases/update-church.use-case';

const OPERATOR_ID = 'aaaaaaaa-0000-0000-0000-000000000001';
const CHURCH_ID   = 'aaaaaaaa-0000-0000-0000-000000000002';
const PASTOR_ID   = 'aaaaaaaa-0000-0000-0000-000000000003';
const AUXILIAR_ID = 'aaaaaaaa-0000-0000-0000-000000000004';

const suporteUser: AuthenticatedUser = {
  id: OPERATOR_ID,
  email: 'suporte@edah.app',
  name: 'Suporte Edah',
  avatarUrl: null,
  churchId: '',
  churchName: '',
  role: 'pastor_central',
  supabaseUserId: 'supabase-000',
  isSuporte: true,
};

const regularUser: AuthenticatedUser = {
  ...suporteUser,
  id: 'bbbbbbbb-0000-0000-0000-000000000001',
  isSuporte: false,
};

class TestJwtGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<{ user: AuthenticatedUser; headers: Record<string, string> }>();
    const header = req.headers['x-test-user'];
    if (!header) return false;
    req.user = JSON.parse(header) as AuthenticatedUser;
    return true;
  }
}

const mockPrisma = {
  church: { findUnique: jest.fn(), create: jest.fn() },
  user: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
  churchRoleAssignment: { create: jest.fn() },
  auditLog: { create: jest.fn() },
  $transaction: jest.fn(),
};

const mockSupabase = { inviteUser: jest.fn() };

describe('POST /admin/churches — testes de integração', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [ChurchesController],
      providers: [
        CreateChurchUseCase,
        GetChurchUseCase,
        ListChurchesUseCase,
        SelectChurchesUseCase,
        UpdateChurchUseCase,
        AuditLogService,
        SuporteGuard,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: SupabaseAuthService, useValue: mockSupabase },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(TestJwtGuard)
      .compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.resetAllMocks();

    mockPrisma.church.findUnique.mockResolvedValue(null);
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.church.create.mockImplementation(
      ({ data }: { data: { name: string; slug: string } }) =>
        Promise.resolve({ id: CHURCH_ID, name: data.name, slug: data.slug, createdAt: new Date() }),
    );
    mockPrisma.user.create
      .mockResolvedValueOnce({ id: PASTOR_ID, name: 'João Silva', email: 'joao@test.com' })
      .mockResolvedValueOnce({ id: AUXILIAR_ID, name: 'Maria Lima', email: 'maria@test.com' });
    mockPrisma.churchRoleAssignment.create.mockResolvedValue({});
    mockPrisma.auditLog.create.mockResolvedValue({});
    mockPrisma.user.update.mockResolvedValue({});
    mockPrisma.$transaction.mockImplementation(
      (cb: (tx: typeof mockPrisma) => Promise<unknown>) => cb(mockPrisma),
    );
    mockSupabase.inviteUser.mockResolvedValue('supabase-generated-id');
  });

  it('TC-01: cria igreja com pastor central — church, user e church_role registrados corretamente', async () => {
    const res = await request(app.getHttpServer())
      .post('/admin/churches')
      .set('x-test-user', JSON.stringify(suporteUser))
      .send({ name: 'Igreja Teste', slug: 'igreja-teste', pastor: { name: 'João Silva', email: 'joao@test.com' } })
      .expect(201);

    expect(res.body).toMatchObject({
      id: CHURCH_ID,
      name: 'Igreja Teste',
      slug: 'igreja-teste',
      pastor: { id: PASTOR_ID, role: ChurchRole.pastor_central },
      auxiliar: null,
    });
    expect(mockPrisma.church.create).toHaveBeenCalledTimes(1);
    expect(mockPrisma.user.create).toHaveBeenCalledTimes(1);
    expect(mockPrisma.churchRoleAssignment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          churchId: CHURCH_ID,
          userId: PASTOR_ID,
          role: ChurchRole.pastor_central,
        }),
      }),
    );
  });

  it('TC-02: cria igreja com pastor central + auxiliar — ambos os roles registrados', async () => {
    const res = await request(app.getHttpServer())
      .post('/admin/churches')
      .set('x-test-user', JSON.stringify(suporteUser))
      .send({
        name: 'Igreja Completa',
        slug: 'igreja-completa',
        pastor: { name: 'João Silva', email: 'joao@test.com' },
        auxiliar: { name: 'Maria Lima', email: 'maria@test.com' },
      })
      .expect(201);

    expect(res.body.auxiliar).toMatchObject({ id: AUXILIAR_ID, role: ChurchRole.pastor_auxiliar });
    expect(mockPrisma.user.create).toHaveBeenCalledTimes(2);
    expect(mockPrisma.churchRoleAssignment.create).toHaveBeenCalledTimes(2);
    expect(mockPrisma.churchRoleAssignment.create).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        data: expect.objectContaining({ userId: AUXILIAR_ID, role: ChurchRole.pastor_auxiliar }),
      }),
    );
  });

  it('TC-03: retorna 400 quando o campo pastor não é informado', async () => {
    await request(app.getHttpServer())
      .post('/admin/churches')
      .set('x-test-user', JSON.stringify(suporteUser))
      .send({ name: 'Igreja Sem Pastor' })
      .expect(400);
  });

  it('TC-04: retorna 409 quando o slug já está em uso', async () => {
    mockPrisma.church.findUnique.mockResolvedValueOnce({ id: 'outro-id', slug: 'slug-em-uso' });

    await request(app.getHttpServer())
      .post('/admin/churches')
      .set('x-test-user', JSON.stringify(suporteUser))
      .send({ name: 'Outra Igreja', slug: 'slug-em-uso', pastor: { name: 'Pedro Costa', email: 'pedro@test.com' } })
      .expect(409);

    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });

  it('TC-05: gera slug a partir do nome removendo acentos e substituindo espaços por hífens', async () => {
    await request(app.getHttpServer())
      .post('/admin/churches')
      .set('x-test-user', JSON.stringify(suporteUser))
      .send({ name: 'Igreja da Graça', pastor: { name: 'Ana Souza', email: 'ana@test.com' } })
      .expect(201);

    expect(mockPrisma.church.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ slug: 'igreja-da-graca' }) }),
    );
  });

  it('TC-06: retorna 403 quando usuário sem isSuporte tenta criar uma igreja', async () => {
    await request(app.getHttpServer())
      .post('/admin/churches')
      .set('x-test-user', JSON.stringify(regularUser))
      .send({ name: 'Igreja Bloqueada', pastor: { name: 'Zé Silva', email: 'ze@test.com' } })
      .expect(403);

    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });

  it('TC-07: registra audit log com operatorId e churchId corretos após criação', async () => {
    await request(app.getHttpServer())
      .post('/admin/churches')
      .set('x-test-user', JSON.stringify(suporteUser))
      .send({ name: 'Igreja Auditada', slug: 'igreja-auditada', pastor: { name: 'Rui Braga', email: 'rui@test.com' } })
      .expect(201);

    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          operatorId: OPERATOR_ID,
          churchId: CHURCH_ID,
          action: 'create_church',
        }),
      }),
    );
  });
});
