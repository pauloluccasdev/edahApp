import { IsUUID } from 'class-validator';

export class TransferChurchDto {
  @IsUUID()
  targetUserId: string;
}
