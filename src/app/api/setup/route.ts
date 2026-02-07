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

    // Migration: add grapes, country, region columns and make location_id nullable
    await sql.unsafe(`
      ALTER TABLE bottles ADD COLUMN IF NOT EXISTS grapes JSONB;
      ALTER TABLE bottles ADD COLUMN IF NOT EXISTS country VARCHAR(255);
      ALTER TABLE bottles ADD COLUMN IF NOT EXISTS region VARCHAR(255);
      ALTER TABLE bottles ALTER COLUMN location_id DROP NOT NULL;
    `);

    // Migration: add tasting_notes JSONB to tasting_entries
    await sql.unsafe(`
      ALTER TABLE tasting_entries ADD COLUMN IF NOT EXISTS tasting_notes JSONB;
    `);

    // Migration: add status to bottles
    await sql.unsafe(`
      ALTER TABLE bottles ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'in_cellar';
    `);

    // Migration: add summary to tasting_sessions
    await sql.unsafe(`
      ALTER TABLE tasting_sessions ADD COLUMN IF NOT EXISTS summary TEXT;
    `);

    // Create drink_logs table
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS drink_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        bottle_id UUID NOT NULL REFERENCES bottles(id) ON DELETE CASCADE,
        drank_at TIMESTAMP DEFAULT NOW(),
        context VARCHAR(255),
        venue VARCHAR(255),
        rating INTEGER,
        tasting_notes JSONB,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_drink_logs_bottle ON drink_logs(bottle_id, drank_at DESC);
      CREATE INDEX IF NOT EXISTS idx_drink_logs_user ON drink_logs(user_id);
    `);

    // Migration: add entry_photo_url to tasting_entries
    await sql.unsafe(`
      ALTER TABLE tasting_entries ADD COLUMN IF NOT EXISTS entry_photo_url TEXT;
    `);

    // Migration: add beverage_type to users
    await sql.unsafe(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS beverage_type VARCHAR(10) NOT NULL DEFAULT 'wine';
    `);

    // Migration: add beverage_type to bottles
    await sql.unsafe(`
      ALTER TABLE bottles ADD COLUMN IF NOT EXISTS beverage_type VARCHAR(10) NOT NULL DEFAULT 'wine';
    `);

    // Migration: add scoring_mode to users
    await sql.unsafe(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS scoring_mode VARCHAR(10) NOT NULL DEFAULT 'casual';
    `);

    // Migration: social tasting mode columns on tasting_sessions
    await sql.unsafe(`
      ALTER TABLE tasting_sessions ADD COLUMN IF NOT EXISTS is_social_mode BOOLEAN DEFAULT FALSE;
      ALTER TABLE tasting_sessions ADD COLUMN IF NOT EXISTS session_code VARCHAR(8);
      ALTER TABLE tasting_sessions ADD COLUMN IF NOT EXISTS invite_expires_at TIMESTAMP;
    `);

    // Try to add unique constraint on session_code (ignore if exists)
    try {
      await sql.unsafe(`
        CREATE UNIQUE INDEX IF NOT EXISTS idx_tasting_sessions_code ON tasting_sessions(session_code) WHERE session_code IS NOT NULL;
      `);
    } catch { /* index may already exist */ }

    // Create tasting_session_guests table
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS tasting_session_guests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tasting_session_id UUID NOT NULL REFERENCES tasting_sessions(id) ON DELETE CASCADE,
        guest_name VARCHAR(100) NOT NULL,
        guest_token_hash TEXT NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        joined_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_tsg_session ON tasting_session_guests(tasting_session_id);
    `);

    // Migration: add guest columns to tasting_entries
    await sql.unsafe(`
      ALTER TABLE tasting_entries ADD COLUMN IF NOT EXISTS guest_id UUID REFERENCES tasting_session_guests(id);
      ALTER TABLE tasting_entries ADD COLUMN IF NOT EXISTS guest_name VARCHAR(100);
      ALTER TABLE tasting_entries ADD COLUMN IF NOT EXISTS parent_entry_id UUID;
    `);

    // Migration: add preferred_language to users
    await sql.unsafe(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(5);
    `);

    await sql.end();

    return NextResponse.json({
      success: true,
      message: 'All tables created/migrated successfully',
      tables: ['users', 'locations', 'bottles', 'tasting_sessions', 'tasting_entries', 'drink_logs', 'tasting_session_guests'],
    });
  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json(
      { error: 'Setup failed', details: String(error) },
      { status: 500 }
    );
  }
}
