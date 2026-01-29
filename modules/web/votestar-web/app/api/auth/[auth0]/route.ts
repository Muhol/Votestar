import { NextRequest, NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ auth0: string }> }
) {
  await params; // Ensure params are awaited for Next.js 15+

  const { auth0: route } = await params;

  try {
    // Specialized handler for /me to merge backend metadata
    if (route === 'me') {
      const session = await auth0.getSession();
      if (!session) return new Response(null, { status: 204 });

      try {
        const { token } = await auth0.getAccessToken();
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const metadata = await response.json();
          // Merge metadata into user profile
          return NextResponse.json({
            ...session.user,
            user_type: metadata.user_type,
            is_verified_org: metadata.is_verified_org,
            follower_count: metadata.follower_count,
            subscription_tier: metadata.subscription_tier
          });
        }
      } catch (err) {
        console.error("Profile metadata enrichment failed:", err);
      }
      
      // Fallback to basic profile if backend fails
      return NextResponse.json(session.user);
    }

    return await auth0.middleware(request);
  } catch (error: any) {
    console.error('Auth route error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
