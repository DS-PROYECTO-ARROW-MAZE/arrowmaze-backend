import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LevelsModule } from './infrastructure/modules/levels.module';
import { AuthModule } from './infrastructure/modules/auth.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), LevelsModule, AuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
