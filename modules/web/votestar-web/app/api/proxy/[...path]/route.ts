import { auth0 } from '@/lib/auth0';
import { NextResponse } from 'next/server';

export async function POST(req: Request) { return handleProxy(req, 'POST'); }
export async function PATCH(req: Request) { return handleProxy(req, 'PATCH'); }
export async function DELETE(req: Request) { return handleProxy(req, 'DELETE'); }
export async function GET(req: Request) { return handleProxy(req, 'GET'); }

async function handleProxy(req: Request, method: string) {
  try {
    const session = await auth0.getSession();

    const url = new URL(req.url);
    const path = url.pathname.replace('/api/proxy/', '') + url.search;

    let body = undefined;
    if (method !== 'DELETE' && method !== 'GET') {
      try {
        const text = await req.text();
        if (text) {
          body = JSON.parse(text);
        }
      } catch {
        console.warn(`Proxy warning: Failed to parse request body for ${method} ${path}`);
      }
    }

    // Build headers - include auth token if available
    const headers: Record<string, string> = {
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
  } catch (error: unknown) {
    console.error(`Proxy ${method} CRITICAL Error:`, error);
    const message = error instanceof Error ? error.message : "Internal Proxy Error";
    return NextResponse.json({ detail: message }, { status: 500 });
  }
}
