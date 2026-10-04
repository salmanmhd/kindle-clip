'use server';

import { signIn } from '@/auth';
import dbConnect from '@/lib/db';
import { User } from '@/lib/models/User';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import crypto from 'node:crypto';
import { AuthError } from 'next-auth';

const signupSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(8, 'Password must be at least 8 characters long')
});

export async function login(formData: FormData) {
  try {
    await signIn('credentials', {
      ...Object.fromEntries(formData),
      redirect: false,
    });
    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return { error: 'Invalid email or password.' };
        default:
          return { error: 'Something went wrong.' };
      }
    }
    throw error; // Let next-auth handle redirection if needed, but since redirect: false, this won't happen for success, wait, redirect: false means no redirect error thrown? Actually next-auth v5 does throw redirect errors.
  }
}

export async function signup(formData: FormData) {
  const result = signupSchema.safeParse(Object.fromEntries(formData));
  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  const { email, password } = result.data;

  try {
    await dbConnect();
    const existing = await User.findOne({ email });
    if (existing) {
      return { error: 'Email already exists.' };
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const unsubscribeToken = crypto.randomBytes(32).toString('hex');

    await User.create({
      email,
      passwordHash,
      unsubscribeToken
    });

    return { success: true };
  } catch (err: any) {
    console.error('Signup error:', err);
    return { error: `Failed to create account: ${err.message}` };
  }
}
