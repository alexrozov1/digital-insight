export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // /api/auth → redirect to GitHub OAuth
    if (url.pathname === "/api/auth") {
      const CLIENT_ID = env.GITHUB_CLIENT_ID;
      const REDIRECT = env.OAUTH_REDIRECT_URL || "https://digital-insight.pages.dev/api/callback";
      if (!CLIENT_ID) return new Response("Missing GITHUB_CLIENT_ID", { status: 500 });

      // CSRF state
      const arr = new Uint8Array(16); crypto.getRandomValues(arr);
      const state = Array.from(arr).map(b => b.toString(16).padStart(2,"0")).join("");

      // Public repo is enough for public repos. Use "repo,user:email" if private.
      const scopes = "public_repo,user:email";

      const gh = new URL("https://github.com/login/oauth/authorize");
      gh.searchParams.set("client_id", CLIENT_ID);
      gh.searchParams.set("redirect_uri", REDIRECT);
      gh.searchParams.set("scope", scopes);
      gh.searchParams.set("state", state);

      const headers = new Headers();
      headers.set("Set-Cookie", "decap_state=" + state + "; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600");
      headers.set("Location", gh.toString());
      return new Response(null, { status: 302, headers });
    }

    // /api/callback → exchange code and notify Decap
    if (url.pathname === "/api/callback") {
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
        headers: { Accept: "application/json" },
        body
      });
      const tokenData = await tokenRes.json();
      if (!tokenData.access_token) {
        return new Response("Failed to get access token: " + JSON.stringify(tokenData), { status: 500 });
      }

      const payload = { token: tokenData.access_token, provider: "github" };
      const msg1 = "authorization:github:" + JSON.stringify(payload);
      const msg2 = "authorization:github:" + JSON.stringify({ token: tokenData.access_token });

      const html = '<!doctype html><meta charset="utf-8"><title>Login Complete</title>'
        + '<style>body{font:14px/1.5 system-ui;margin:2rem;color:#111}</style>'
        + '<p>✅ GitHub authentication succeeded.</p>'
        + '<p>You can close this window. If it doesn\'t close automatically, switch back to the Admin tab.</p>'
        + '<script>'
        + 'try {'
        + '  console.log("Posting auth messages to opener...");'
        + '  if (window.opener) {'
        + '    window.opener.postMessage(' + JSON.stringify(msg1) + ', "*");'
        + '    window.opener.postMessage(' + JSON.stringify(msg2) + ', "*");'
        + '    console.log("Messages posted.");'
        + '  } else {'
        + '    console.warn("No window.opener; cannot deliver token to CMS.");'
        + '  }'
        + '} catch(e) { console.error("postMessage error:", e); }'
        + 'setTimeout(function(){ try{window.close();}catch(_){ } }, 800);'
        + '</script>';

      const headers = new Headers();
      headers.set("Content-Type", "text/html; charset=utf-8");
      headers.set("Set-Cookie", "decap_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0");
      return new Response(html, { headers });
    }

    // Fallback — serve static assets
    return env.ASSETS.fetch(request);
  }
};
