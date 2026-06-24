import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LevelsModule } from './infrastructure/modules/levels.module';
import { AuthModule } from './infrastructure/modules/auth.module';
import { ProgressModule } from './infrastructure/modules/progress.module';
import { LeaderboardModule } from './infrastructure/modules/leaderboard.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LevelsModule,
    AuthModule,
    ProgressModule,
    LeaderboardModule,
  ],
})
export class AppModule {}
