import {
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ChurchRole } from '@prisma/client';

import { PrismaService } from '../../../database/prisma.service';
import { RegisterUserDto } from '../dto/register-user.dto';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';
import { SupabaseAuthService } from '../services/supabase-auth.service';

// Papéis que podem ser atribuídos por pastores (dentro da sua própria church)
const PASTOR_ASSIGNABLE_ROLES: ChurchRole[] = [
  ChurchRole.lider,
  ChurchRole.membro,
];

@Injectable()
export class RegisterUserUseCase {
  constructor(
    private readonly supabaseAuth: SupabaseAuthService,
    private readonly prisma: PrismaService,
  ) {}

  async execute(dto: RegisterUserDto, currentUser: AuthenticatedUser) {
    this.validatePermission(dto, currentUser);

    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('Já existe um usuário com este e-mail.');
    }

    // Cria usuário no Supabase Auth (email já confirmado)
    const supabaseUserId = await this.supabaseAuth.createUser(dto.email, dto.password);

    try {
      const user = await this.prisma.user.create({
        data: {
          churchId: dto.churchId,
          name: dto.name,
          email: dto.email,
          phone: dto.phone,
          whatsapp: dto.whatsapp,
          supabaseId: supabaseUserId,
        },
        select: {
          id: true,
          name: true,
          email: true,
          churchId: true,
          phone: true,
          whatsapp: true,
          createdAt: true,
        },
      });

      await this.prisma.churchRoleAssignment.create({
        data: {
          churchId: dto.churchId,
          userId: user.id,
          role: dto.role,
        },
      });

      return { ...user, role: dto.role };
    } catch (err) {
      // Garante consistência: se o insert falhar, remove o usuário do Supabase
      await this.supabaseAuth.deleteUser(supabaseUserId);
      throw err;
    }
  }

  private validatePermission(dto: RegisterUserDto, currentUser: AuthenticatedUser) {
    // Suporte pode cadastrar qualquer usuário em qualquer church com qualquer papel
    if (currentUser.isSuporte) return;

    // Pastores só podem cadastrar usuários dentro da sua própria church
    const isPastor =
      currentUser.role === ChurchRole.pastor_central ||
      currentUser.role === ChurchRole.pastor_auxiliar;

    if (!isPastor) {
      throw new ForbiddenException('Sem permissão para cadastrar usuários.');
    }

    if (currentUser.churchId !== dto.churchId) {
      throw new ForbiddenException('Pastores só podem cadastrar usuários da sua própria igreja.');
    }

    if (!PASTOR_ASSIGNABLE_ROLES.includes(dto.role)) {
      throw new ForbiddenException(
        `Pastores podem atribuir apenas os papéis: ${PASTOR_ASSIGNABLE_ROLES.join(', ')}.`,
      );
    }
  }
}
