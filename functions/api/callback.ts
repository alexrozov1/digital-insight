export async function onRequestGet({ request, env }: any) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    if (!code || !state) return new Response("Missing code or state", { status: 400 });

    const cookies = request.headers.get("Cookie") || "";
    if (!cookies.includes("decap_state=" + state)) return new Response("Invalid state", { status: 400 });

    const body = new URLSearchParams();
    body.set("client_id", env.GITHUB_CLIENT_ID || "");
    body.set("client_secret", env.GITHUB_CLIENT_SECRET || "");
    body.set("code", code);
    body.set("redirect_uri", env.OAUTH_REDIRECT_URL || "https://digital-insight.pages.dev/api/callback");

    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { "Accept": "application/json" },
      body
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) return new Response("Failed to get access token", { status: 500 });

    const html =
      '<!doctype html><meta charset="utf-8"><script>' +
      '(function(){var msg="authorization:github:"+JSON.stringify({token:"' + tokenData.access_token + '"});' +
      'if(window.opener){window.opener.postMessage(msg,"*");} window.close();})();' +
      '</script>';

    const headers = new Headers();
    headers.set("Content-Type", "text/html; charset=utf-8");
    headers.set("Set-Cookie", "decap_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0");

    return new Response(html, { headers });
  } catch (err: any) {
    return new Response("Callback error: " + (err?.message || String(err)), { status: 500 });
  }
}
