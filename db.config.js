import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg
import dotenv from 'dotenv';

dotenv.config(); // Load .env variables
const isLocal = process.env.DATABASE_URL.includes("localhost");
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // Use your local PostgreSQL connection
  ssl: process.env.DATABASE_URL.includes('sslmode=require') 
  ? { rejectUnauthorized: false } 
  : false,
});

export const db = drizzle(pool);