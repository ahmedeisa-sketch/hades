import { Module } from '@nestjs/common';
import { RedemptionsService } from './redemptions.service';
import { RedemptionsController } from './redemptions.controller';
import { FundsModule } from '../funds/funds.module';
import { HoldingsModule } from '../holdings/holdings.module';

@Module({
  imports: [FundsModule, HoldingsModule],
  providers: [RedemptionsService],
  controllers: [RedemptionsController],
  exports: [RedemptionsService],
})
export class RedemptionsModule {}
