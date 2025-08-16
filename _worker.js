export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // ---- 1) Start OAuth
    if (url.pathname === "/api/auth") {
      const CLIENT_ID = env.GITHUB_CLIENT_ID;
      const REDIRECT = env.OAUTH_REDIRECT_URL || "https://digital-insight.pages.dev/api/callback";
      if (!CLIENT_ID) return new Response("Missing GITHUB_CLIENT_ID", { status: 500 });

      const arr = new Uint8Array(16); crypto.getRandomValues(arr);
      const state = Array.from(arr).map(b => b.toString(16).padStart(2,"0")).join("");
      const scopes = "public_repo,user:email"; // use "repo,user:email" for private repos

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

    // ---- 2) Complete OAuth and deliver token to the admin page
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
        method: "POST", headers: { Accept: "application/json" }, body
      });
      const tokenData = await tokenRes.json();
      if (!tokenData.access_token) {
        return new Response("Failed to get access token: " + JSON.stringify(tokenData), { status: 500 });
      }

      // Decap listens for: "authorization:github:<json>"
      const payload = { token: tokenData.access_token, provider: "github" };
      const msg = "authorization:github:" + JSON.stringify(payload);

      const targetOrigin = "https://digital-insight.pages.dev"; // post to exact origin

      const html = '<!doctype html><meta charset="utf-8"><title>Login Complete</title>'
        + '<style>body{font:14px/1.5 system-ui;margin:2rem;color:#111}</style>'
        + '<p>✅ GitHub authentication succeeded.</p>'
        + '<p>You can close this window. If it doesn’t close automatically, switch back to the Admin tab.</p>'
        + '<script>'
        + 'function send(){try{if(window.opener){window.opener.postMessage(' + JSON.stringify(msg) + ', ' + JSON.stringify(targetOrigin) + ');console.log("Auth message posted to ' + targetOrigin + '");}}catch(e){console.error(e);}}'
        + 'send(); setTimeout(send, 400); setTimeout(send, 900); setTimeout(send, 1500);'
        + 'setTimeout(function(){try{window.close();}catch(_){ }}, 1800);'
        + '</script>';

      const headers = new Headers();
      headers.set("Content-Type", "text/html; charset=utf-8");
      headers.set("Set-Cookie", "decap_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0");
      return new Response(html, { headers });
    }

    // ---- 3) Static fallback
    return env.ASSETS.fetch(request);
  }
};
