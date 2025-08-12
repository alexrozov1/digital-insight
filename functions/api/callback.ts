export async function onRequestGet({ request, env }: any) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (!code || !state) {
    return new Response("Missing code or state", { status: 400 });
  }

  // CSRF check
  const cookie = request.headers.get("Cookie") || "";
  if (!cookie.includes(`decap_state=${state}`)) {
    return new Response("Invalid state", { status: 400 });
  }

  // Exchange code for access token
  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept": "application/json" },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: env.OAUTH_REDIRECT_URL || "https://digital-insight.pages.dev/api/callback",
    }),
  });

  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) {
    return new Response("Failed to get access token", { status: 500 });
  }

  // Send script to post message back to CMS auth
  const html =
    "<!doctype html><html><body><script>" +
    "window.opener.postMessage(" +
    JSON.stringify({ token: tokenData.access_token, provider: "github" }) +
    ", '*');" +
    "window.close();" +
    "</script></body></html>";

  return new Response(html, {
    headers: { "Content-Type": "text/html" },
  });
}
