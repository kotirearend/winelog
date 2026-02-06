import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { signupSchema } from '@/lib/validations';
import { hashPassword, signToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = signupSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { email, password, name, defaultCurrency } = result.data;

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email));

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: 'Email already in use' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const newUser = await db
      .insert(users)
      .values({
        email,
        passwordHash,
        name,
        defaultCurrency,
      })
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        defaultCurrency: users.defaultCurrency,
        beverageType: users.beverageType,
        scoringMode: users.scoringMode,
        createdAt: users.createdAt,
      });

    // Sign JWT
    const token = await signToken({
      userId: newUser[0].id,
      email: newUser[0].email,
    });

    return NextResponse.json(
      {
        token,
        user: newUser[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
