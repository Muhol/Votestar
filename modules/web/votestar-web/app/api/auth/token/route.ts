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
  } catch (error: any) {
    console.error('Token fetch error:', error);
    return NextResponse.json({ error: error.message || 'Failed to get token' }, { status: 500 });
  }
}
