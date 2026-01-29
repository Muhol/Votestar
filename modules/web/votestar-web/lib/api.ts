const API_BASE = '/api/proxy'; 

export const fetcher = async (url: string) => {
    // Note: /api/proxy is a Next.js route on the same port, so it handles cookies automatically
    const res = await fetch(`${API_BASE}${url}`, {
        headers: {
            'Content-Type': 'application/json',
        }
    });
    
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: 'An error occurred while fetching the data.' }));
        const error = new Error(errorData.detail || 'Fetch failed');
        throw error;
    }
    return res.json();
}
