export async function onRequestGet({ request, env }: any) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieState = (request.headers.get("Cookie") || "").split(";").map(s => s.trim()).find(s => s.startsWith("decap_state="))?.split("=")[1];

  if (!code || !state || !cookieState || state !== cookieState) {
    return new Response("Invalid OAuth state", { status: 400 });
  }

  const CLIENT_ID = env.GITHUB_CLIENT_ID;
  const CLIENT_SECRET = env.GITHUB_CLIENT_SECRET;
  const REDIRECT = env.OAUTH_REDIRECT_URL || "https://digital-insight.pages.dev/api/callback";

  if (!CLIENT_ID || !CLIENT_SECRET) {
    return new Response("Missing GitHub credentials", { status: 500 });
  }

  // Exchange code for token
  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { "Accept": "application/json" },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      code,
      redirect_uri: REDIRECT,
    }),
  });

  const data = await tokenRes.json();
  if (!data.access_token) {
    return new Response("Failed to obtain access token", { status: 500 });
  }

  // Tell Decap (in the opener window) that auth succeeded and close the popup
  const html = \`<!doctype html>
  <meta charset="utf-8">
  <script>
    (function () {
      var token = \${JSON.stringify({ token: data.access_token })};
      window.opener && window.opener.postMessage('authorization:github:' + JSON.stringify(token), '*');
      window.close();
    })();
  </script>\`;

  const headers = new Headers({
    "Content-Type": "text/html; charset=utf-8",
    "Set-Cookie": "decap_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0",
  });

  return new Response(html, { headers });
}
