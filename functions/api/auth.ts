export async function onRequestGet({ env }: any) {
  const CLIENT_ID = env.GITHUB_CLIENT_ID;
  const REDIRECT = env.OAUTH_REDIRECT_URL || "https://digital-insight.pages.dev/api/callback";

  if (!CLIENT_ID) {
    return new Response("Missing GITHUB_CLIENT_ID", { status: 500 });
  }

  // Generate a CSRF state and set it in a cookie
  const state = crypto.getRandomValues(new Uint8Array(16)).reduce((s, b) => s + b.toString(16).padStart(2, "0"), "");
  const scopes = "repo,user:email"; // public repos: use "public_repo,user:email" if you prefer

  const url = new URL("https://github.com/login/oauth/authorize");
  url.searchParams.set("client_id", CLIENT_ID);
  url.searchParams.set("redirect_uri", REDIRECT);
  url.searchParams.set("scope", scopes);
  url.searchParams.set("state", state);

  const headers = new Headers({
    "Set-Cookie": \`decap_state=\${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600\`,
  });

  return Response.redirect(url.toString(), 302, { headers });
}
