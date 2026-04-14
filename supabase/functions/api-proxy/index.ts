import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const TARGET_BASE_URL = "http://ae5029355f518b558.awsglobalaccelerator.com:5011";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathWithQuery = url.pathname.replace(/^\/api-proxy/, "") + url.search;
    const targetUrl = `${TARGET_BASE_URL}${pathWithQuery}`;

    const headers = new Headers();
    for (const [key, value] of req.headers.entries()) {
      if (!["host", "connection", "content-length"].includes(key.toLowerCase())) {
        headers.set(key, value);
      }
    }

    const body = req.method !== "GET" && req.method !== "HEAD" ? await req.arrayBuffer() : undefined;

    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
    });

    const responseHeaders = new Headers(corsHeaders);
    for (const [key, value] of response.headers.entries()) {
      if (!["transfer-encoding", "connection"].includes(key.toLowerCase())) {
        responseHeaders.set(key, value);
      }
    }

    return new Response(response.body, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Proxy error", detail: String(err) }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
