import { Module } from '@nestjs/common';
import { DistributionsService } from './distributions.service';
import { DistributionsController } from './distributions.controller';
import { FundsModule } from '../funds/funds.module';
import { HoldingsModule } from '../holdings/holdings.module';

@Module({
  imports: [FundsModule, HoldingsModule],
  providers: [DistributionsService],
  controllers: [DistributionsController],
  exports: [DistributionsService],
})
export class DistributionsModule {}
