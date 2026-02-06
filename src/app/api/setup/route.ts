import { NextResponse } from 'next/server';
import postgres from 'postgres';

export async function GET() {
  const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

  try {
    await sql.unsafe(`
      CREATE EXTENSION IF NOT EXISTS "pgcrypto";

      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name VARCHAR(255) NOT NULL,
        default_currency CHAR(3) DEFAULT 'GBP',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS locations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS bottles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        photo_url TEXT,
        name VARCHAR(255) NOT NULL,
        producer VARCHAR(255),
        vintage INTEGER,
        purchase_date DATE,
        purchase_source_type VARCHAR(20),
        purchase_source_name VARCHAR(255),
        price_amount NUMERIC(10, 2),
        price_currency CHAR(3),
        quantity INTEGER NOT NULL DEFAULT 1,
        location_id UUID NOT NULL REFERENCES locations(id),
        sub_location_text VARCHAR(255),
        notes_short VARCHAR(500),
        notes_long TEXT,
        tags JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS tasting_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        tasted_at TIMESTAMP DEFAULT NOW(),
        venue VARCHAR(255),
        participants TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS tasting_entries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tasting_session_id UUID NOT NULL REFERENCES tasting_sessions(id) ON DELETE CASCADE,
        bottle_id UUID REFERENCES bottles(id),
        ad_hoc_name VARCHAR(255),
        ad_hoc_photo_url TEXT,
        save_to_cellar BOOLEAN DEFAULT FALSE,
        appearance_score INTEGER,
        nose_score INTEGER,
        palate_score INTEGER,
        finish_score INTEGER,
        balance_score INTEGER,
        total_score INTEGER,
        notes_short VARCHAR(500),
        notes_long TEXT,
        tags JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_bottles_user_id ON bottles(user_id);
      CREATE INDEX IF NOT EXISTS idx_bottles_location_id ON bottles(location_id);
      CREATE INDEX IF NOT EXISTS idx_tasting_sessions_user_date ON tasting_sessions(user_id, tasted_at DESC);
      CREATE INDEX IF NOT EXISTS idx_tasting_entries_session ON tasting_entries(tasting_session_id);
      CREATE INDEX IF NOT EXISTS idx_tasting_entries_score ON tasting_entries(total_score DESC);
      CREATE INDEX IF NOT EXISTS idx_locations_user_id ON locations(user_id);
    `);

    await sql.end();

    return NextResponse.json({
      success: true,
      message: 'All tables created successfully',
      tables: ['users', 'locations', 'bottles', 'tasting_sessions', 'tasting_entries'],
    });
  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json(
      { error: 'Setup failed', details: String(error) },
      { status: 500 }
    );
  }
}
