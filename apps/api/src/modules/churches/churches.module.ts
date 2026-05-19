import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { ChurchesController } from './controllers/churches.controller';
import { AddPastorAuxiliarUseCase } from './use-cases/add-pastor-auxiliar.use-case';
import { CreateChurchUseCase } from './use-cases/create-church.use-case';
import { GetChurchUseCase } from './use-cases/get-church.use-case';
import { ListChurchesUseCase } from './use-cases/list-churches.use-case';
import { RemovePastorAuxiliarUseCase } from './use-cases/remove-pastor-auxiliar.use-case';
import { SelectChurchesUseCase } from './use-cases/select-churches.use-case';
import { TransferChurchUseCase } from './use-cases/transfer-church.use-case';
import { UpdateChurchUseCase } from './use-cases/update-church.use-case';

@Module({
  imports: [DatabaseModule, AuthModule, AuditModule],
  controllers: [ChurchesController],
  providers: [
    CreateChurchUseCase,
    ListChurchesUseCase,
    SelectChurchesUseCase,
    GetChurchUseCase,
    UpdateChurchUseCase,
    AddPastorAuxiliarUseCase,
    RemovePastorAuxiliarUseCase,
    TransferChurchUseCase,
  ],
})
export class ChurchesModule {}
