export const onRequestGet = async ({ env }) => {
  const CLIENT_ID = env.GITHUB_CLIENT_ID;
  const REDIRECT = env.OAUTH_REDIRECT_URL || "https://digital-insight.pages.dev/api/callback";
  if (!CLIENT_ID) return new Response("Missing GITHUB_CLIENT_ID", { status: 500 });

  // CSRF state cookie
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  const state = Array.from(arr).map(b => b.toString(16).padStart(2, "0")).join("");

  // Scopes: use "repo" if the repo is private; "public_repo" for public
  const scopes = "public_repo,user:email";

  const url = new URL("https://github.com/login/oauth/authorize");
  url.searchParams.set("client_id", CLIENT_ID);
  url.searchParams.set("redirect_uri", REDIRECT);
  url.searchParams.set("scope", scopes);
  url.searchParams.set("state", state);

  const headers = new Headers();
  headers.set("Set-Cookie", "decap_state=" + state + "; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600");
  headers.set("Location", url.toString());

  return new Response(null, { status: 302, headers });
};
