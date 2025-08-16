export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // --- Start OAuth ---
    if (url.pathname === "/api/auth") {
      const CLIENT_ID = env.GITHUB_CLIENT_ID;
      const REDIRECT  = env.OAUTH_REDIRECT_URL || "https://digital-insight.pages.dev/api/callback";
      if (!CLIENT_ID) return new Response("Missing GITHUB_CLIENT_ID", { status: 500 });

      const arr = new Uint8Array(16); crypto.getRandomValues(arr);
      const state  = Array.from(arr).map(b=>b.toString(16).padStart(2,"0")).join("");
      const scopes = "public_repo,user:email"; // use "repo,user:email" if the repo is private

      const gh = new URL("https://github.com/login/oauth/authorize");
      gh.searchParams.set("client_id",    CLIENT_ID);
      gh.searchParams.set("redirect_uri", REDIRECT);
      gh.searchParams.set("scope",        scopes);
      gh.searchParams.set("state",        state);

      return new Response(null, {
        status: 302,
        headers: {
          "Location": gh.toString(),
          "Set-Cookie": "decap_state="+state+"; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600"
        }
      });
    }

    // --- OAuth callback ---
    if (url.pathname === "/api/callback") {
      const code  = url.searchParams.get("code");
      const state = url.searchParams.get("state");
      if (!code || !state) return new Response("Missing code or state", { status: 400 });

      const cookies = request.headers.get("Cookie") || "";
      if (!cookies.includes("decap_state="+state)) return new Response("Invalid state", { status: 400 });

      // exchange code for token
      const form = new URLSearchParams();
      form.set("client_id",     env.GITHUB_CLIENT_ID  || "");
      form.set("client_secret", env.GITHUB_CLIENT_SECRET || "");
      form.set("code",          code);
      form.set("redirect_uri",  env.OAUTH_REDIRECT_URL || "https://digital-insight.pages.dev/api/callback");

      const r = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST", headers: { Accept: "application/json" }, body: form
      });
      const data = await r.json();
      if (!data.access_token) return new Response("Failed to get token: "+JSON.stringify(data), { status: 500 });

      const token  = data.access_token;
      const origin = "https://digital-insight.pages.dev";

      // Formats various Decap builds accept
      const MSG_STR_WITH   = "authorization:github:" + JSON.stringify({ token, provider: "github" });
      const MSG_STR_NO     = "authorization:github:" + JSON.stringify({ token });
      const MSG_OBJ        = { type: "authorization:github", token, provider: "github" };

      const html = `<!doctype html><meta charset="utf-8"><title>Login Complete</title>
<style>body{font:14px system-ui;margin:1.5rem;color:#111}</style>
<p>✅ GitHub authentication succeeded.</p>
<p>This window will close shortly…</p>
<script>
  function blast() {
    try {
      if (!window.opener) return;
      // send to exact origin
      window.opener.postMessage(${JSON.stringify(MSG_STR_WITH)}, ${JSON.stringify(origin)});
      window.opener.postMessage(${JSON.stringify(MSG_STR_NO)},   ${JSON.stringify(origin)});
      window.opener.postMessage(${JSON.stringify(MSG_OBJ)},      ${JSON.stringify(origin)});
      // also send to wildcard (some builds listen only with *)
      window.opener.postMessage(${JSON.stringify(MSG_STR_WITH)}, "*");
      window.opener.postMessage(${JSON.stringify(MSG_STR_NO)},   "*");
      window.opener.postMessage(${JSON.stringify(MSG_OBJ)},      "*");
      console.log("Auth messages posted to opener");
    } catch (e) { console.error("postMessage error", e); }
  }
  // try repeatedly for 5s to beat race conditions
  let tries = 0;
  const timer = setInterval(()=>{ blast(); if(++tries>=15){ clearInterval(timer); try{window.close();}catch(_){}} }, 350);
  // also try immediately
  blast();
</script>`;
      return new Response(html, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Set-Cookie": "decap_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0"
        }
      });
    }

    return env.ASSETS.fetch(request);
  }
};
