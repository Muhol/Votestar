import { auth0 } from '@/lib/auth0';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const session = await auth0.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { token } = await auth0.getAccessToken();

    return NextResponse.json({ token });
  } catch (error: unknown) {
    console.error('Token fetch error:', error);
    const message = error instanceof Error ? error.message : 'Failed to get token';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
