import { auth0 } from '@/lib/auth0';
import { NextResponse } from 'next/server';

export async function POST(req: any) { return handleProxy(req, 'POST'); }
export async function PATCH(req: any) { return handleProxy(req, 'PATCH'); }
export async function DELETE(req: any) { return handleProxy(req, 'DELETE'); }
export async function GET(req: any) { return handleProxy(req, 'GET'); }

async function handleProxy(req: any, method: string) {
  try {
    const session = await auth0.getSession();
    
    const url = new URL(req.url);
    const path = url.pathname.replace('/api/proxy/', '');

    let body = undefined;
    if (method !== 'DELETE' && method !== 'GET') {
      try {
        const text = await req.text();
        if (text) {
            body = JSON.parse(text);
        }
      } catch (e) {
        console.warn(`Proxy warning: Failed to parse request body for ${method} ${path}`);
      }
    }

    // Build headers - include auth token if available
    const headers: any = {
      'Content-Type': 'application/json'
    };
    
    if (session) {
      const { token } = await auth0.getAccessToken();
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/${path}`, {
      method: method,
      headers: headers,
      body: body ? JSON.stringify(body) : undefined
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error(`API Error [${response.status}]: ${errorText}`);
        try {
            return NextResponse.json(JSON.parse(errorText), { status: response.status });
        } catch {
            return NextResponse.json({ detail: errorText }, { status: response.status });
        }
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error(`Proxy ${method} CRITICAL Error:`, error);
    return NextResponse.json({ detail: error.message || "Internal Proxy Error" }, { status: 500 });
  }
}
