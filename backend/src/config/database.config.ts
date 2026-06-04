import { registerAs } from '@nestjs/config'

export const databaseConfig = registerAs('database', () => ({
  url: process.env.DATABASE_URL ?? 'postgresql://foodflow:foodflow_dev@localhost:5432/foodflow',
}))
