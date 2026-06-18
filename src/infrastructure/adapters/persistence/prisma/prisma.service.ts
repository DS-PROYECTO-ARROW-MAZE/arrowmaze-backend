import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
      console.log('🚀 Conexión exitosa a la base de datos a través de Prisma.');
    } catch (error: any) {
      console.error('⚠️ Alerta: No se pudo conectar a la base de datos de Supabase.');
      console.error('El backend seguirá corriendo para desarrollo:', error.message);
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}