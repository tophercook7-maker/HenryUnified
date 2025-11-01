export const API_BASE =
  import.meta.env.VITE_API_BASE ?? 'http://127.0.0.1:3000';

export async function sendChat(message: string) {
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json() as Promise<{ reply: string }>;
}
