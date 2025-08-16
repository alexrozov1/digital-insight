export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Start OAuth
    if (url.pathname === "/api/auth") {
      const CLIENT_ID = env.GITHUB_CLIENT_ID;
      const REDIRECT  = env.OAUTH_REDIRECT_URL || "https://digital-insight.pages.dev/api/callback";
      if (!CLIENT_ID) return new Response("Missing GITHUB_CLIENT_ID", { status: 500 });

      const arr = new Uint8Array(16); crypto.getRandomValues(arr);
      const state  = Array.from(arr).map(b => b.toString(16).padStart(2,"0")).join("");
      const scopes = "public_repo,user:email"; // use "repo,user:email" if your repo becomes private

      const gh = new URL("https://github.com/login/oauth/authorize");
      gh.searchParams.set("client_id",    CLIENT_ID);
      gh.searchParams.set("redirect_uri", REDIRECT);
      gh.searchParams.set("scope",        scopes);
      gh.searchParams.set("state",        state);

      return new Response(null, {
        status: 302,
        headers: {
          "Location": gh.toString(),
          "Set-Cookie": `decap_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`
        }
      });
    }

    // Callback: exchange code and deliver token once
    if (url.pathname === "/api/callback") {
      const code  = url.searchParams.get("code");
      const state = url.searchParams.get("state");
      if (!code || !state) return new Response("Missing code or state", { status: 400 });

      const cookies = request.headers.get("Cookie") || "";
      if (!cookies.includes(`decap_state=${state}`)) return new Response("Invalid state", { status: 400 });

      const form = new URLSearchParams();
      form.set("client_id",     env.GITHUB_CLIENT_ID     || "");
      form.set("client_secret", env.GITHUB_CLIENT_SECRET || "");
      form.set("code",          code);
      form.set("redirect_uri",  env.OAUTH_REDIRECT_URL || "https://digital-insight.pages.dev/api/callback");

      const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST", headers: { Accept: "application/json" }, body: form
      });
      const tokenData = await tokenRes.json();
      if (!tokenData.access_token) {
        return new Response("Failed to get token: " + JSON.stringify(tokenData), { status: 500 });
      }

      const token  = tokenData.access_token;
      const origin = "https://digital-insight.pages.dev";

      const STR_WITH = "authorization:github:" + JSON.stringify({ token, provider: "github" });
      const OBJ      = { type: "authorization:github", token, provider: "github" };

      const html = `<!doctype html><meta charset="utf-8"><title>Login Complete</title>
<style>body{font:14px system-ui;margin:1.5rem}</style>
<p>✅ GitHub authentication succeeded.</p>
<script>
  function sendOnce() {
    try {
      if (!window.opener) return;
      window.opener.postMessage(${JSON.stringify(STR_WITH)}, ${JSON.stringify(origin)});
      window.opener.postMessage(${JSON.stringify(OBJ)},      ${JSON.stringify(origin)});
      // also wildcard once for safety
      window.opener.postMessage(${JSON.stringify(STR_WITH)}, "*");
      window.opener.postMessage(${JSON.stringify(OBJ)},      "*");
    } catch (e) { console.error(e); }
  }
  sendOnce(); setTimeout(sendOnce, 200); setTimeout(sendOnce, 500);
  setTimeout(function(){ try{ window.close(); }catch(_){} }, 800);
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
