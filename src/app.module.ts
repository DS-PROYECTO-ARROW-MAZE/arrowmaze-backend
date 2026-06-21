import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LevelsModule } from './infrastructure/modules/levels.module';
import { AuthModule } from './infrastructure/modules/auth.module';
import { ProgressModule } from './infrastructure/modules/progress.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LevelsModule,
    AuthModule,
    ProgressModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
