export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 1) Start OAuth
    if (url.pathname === "/api/auth") {
      const CLIENT_ID = env.GITHUB_CLIENT_ID;
      const REDIRECT = env.OAUTH_REDIRECT_URL || "https://digital-insight.pages.dev/api/callback";
      if (!CLIENT_ID) return new Response("Missing GITHUB_CLIENT_ID", { status: 500 });

      const arr = new Uint8Array(16); crypto.getRandomValues(arr);
      const state = Array.from(arr).map(b => b.toString(16).padStart(2,"0")).join("");
      const scopes = "public_repo,user:email"; // use "repo,user:email" if your repo is private

      const gh = new URL("https://github.com/login/oauth/authorize");
      gh.searchParams.set("client_id", CLIENT_ID);
      gh.searchParams.set("redirect_uri", REDIRECT);
      gh.searchParams.set("scope", scopes);
      gh.searchParams.set("state", state);

      return new Response(null, {
        status: 302,
        headers: {
          "Set-Cookie": "decap_state=" + state + "; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600",
          "Location": gh.toString()
        }
      });
    }

    // 2) Complete OAuth
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

      const token = tokenData.access_token;
      const origin = "https://digital-insight.pages.dev";
      const strWithProvider = "authorization:github:" + JSON.stringify({ token, provider: "github" });
      const strNoProvider   = "authorization:github:" + JSON.stringify({ token });
      const objFormat       = { type: "authorization:github", token, provider: "github" };

      const html = '<!doctype html><meta charset="utf-8"><title>Login Complete</title>'
        + '<style>body{font:14px/1.5 system-ui;margin:2rem;color:#111}</style>'
        + '<p>✅ GitHub authentication succeeded.</p>'
        + '<p>If this window doesn’t close, switch back to the Admin tab.</p>'
        + '<script>'
        + 'function sendAll(){'
        + '  try{ if(window.opener){'
        + '    // String formats Decap has used historically'
        + '    window.opener.postMessage(' + JSON.stringify(strWithProvider) + ', ' + JSON.stringify(origin) + ');'
        + '    window.opener.postMessage(' + JSON.stringify(strNoProvider)   + ', ' + JSON.stringify(origin) + ');'
        + '    // Object event some builds listen for'
        + '    window.opener.postMessage(' + JSON.stringify(objFormat)       + ', ' + JSON.stringify(origin) + ');'
        + '    console.log("Auth messages posted to ' + origin + '");'
        + '  }}catch(e){ console.error("postMessage error", e); }'
        + '}'
        + 'sendAll(); setTimeout(sendAll, 300); setTimeout(sendAll, 900); setTimeout(sendAll, 1800);'
        + 'setTimeout(function(){ try{ window.close(); }catch(_){} }, 2000);'
        + '</script>';

      return new Response(html, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Set-Cookie": "decap_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0"
        }
      });
    }

    // 3) Static fallback
    return env.ASSETS.fetch(request);
  }
};
