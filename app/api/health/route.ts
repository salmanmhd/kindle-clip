import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await dbConnect();
    const state = mongoose.connection.readyState;
    const isConnected = state === 1;

    if (isConnected) {
      return NextResponse.json({ status: 'ok', database: 'connected' });
    } else {
      return NextResponse.json(
        { status: 'error', database: 'disconnected', state },
        { status: 503 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      { status: 'error', message: error.message },
      { status: 500 }
    );
  }
}
