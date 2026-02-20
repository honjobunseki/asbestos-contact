// Cloudflare Pages Function - 疎通確認版
export async function onRequestPost({ request, env }) {
  const body = await request.json().catch(() => ({}));

  return new Response(JSON.stringify({
    ok: true,
    message: "api/search reached",
    received: body,
    hasKey: !!env.PERPLEXITY_API_KEY,
    hasDB: !!env.DB
  }), {
    headers: { "content-type": "application/json; charset=utf-8" }
  });
}
