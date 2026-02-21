const BOT_UA = /facebookexternalhit|Facebot|Twitterbot|LinkedInBot|Slackbot|TelegramBot|WhatsApp|Discordbot|Googlebot|bingbot|Applebot|iMessageBot/i;

// SUPABASE_URL and SUPABASE_ANON_KEY are set in Cloudflare Pages > Settings > Environment Variables
const SITE_URL = "https://my-maps-v2.pages.dev";
const SITE_NAME = "MyMaps";

function esc(s: string) { return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

function ogHtml(o: { title: string; desc: string; image?: string; url: string }) {
  const img = o.image || `${SITE_URL}/og-image.png`;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(o.title)}</title>
<meta property="og:title" content="${esc(o.title)}" /><meta property="og:description" content="${esc(o.desc)}" />
<meta property="og:image" content="${esc(img)}" /><meta property="og:url" content="${esc(o.url)}" />
<meta property="og:site_name" content="${SITE_NAME}" /><meta name="twitter:card" content="summary_large_image" />
<meta http-equiv="refresh" content="0;url=${esc(o.url)}" /></head><body></body></html>`;
}

async function sbGet(table: string, query: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}&limit=1`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  });
  if (!res.ok) return null;
  const arr = await res.json();
  return arr[0] || null;
}

interface Env {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
}

export const onRequest: PagesFunction<Env> = async (ctx) => {
  const ua = ctx.request.headers.get("user-agent") || "";
  if (!BOT_UA.test(ua)) return ctx.next();

  const SUPABASE_URL = ctx.env.SUPABASE_URL || "";
  const SUPABASE_KEY = ctx.env.SUPABASE_ANON_KEY || "";

  const url = new URL(ctx.request.url);

  if (url.pathname === "/post" || url.pathname === "/post/") {
    const id = url.searchParams.get("id");
    if (id) {
      const p = await sbGet("posts", `id=eq.${id}&select=place_name,city,caption,rating,photo_urls,user_id`);
      if (p) {
        const title = `${p.place_name}${p.city ? ` — ${p.city}` : ""} | ${SITE_NAME}`;
        const desc = [p.rating > 0 ? `${"⭐".repeat(p.rating)} ${p.rating}/5` : "", p.caption].filter(Boolean).join(" · ") || `Check out ${p.place_name}`;
        return new Response(ogHtml({ title, desc: desc.slice(0, 200), image: p.photo_urls?.[0], url: `${SITE_URL}/post?id=${id}` }), { headers: { "Content-Type": "text/html;charset=UTF-8" } });
      }
    }
  }

  if (url.pathname === "/user" || url.pathname === "/user/") {
    const username = url.searchParams.get("u");
    if (username) {
      const u = await sbGet("users", `username=eq.${encodeURIComponent(username)}&select=display_name,username,bio,post_count,photo_url`);
      if (u) {
        const title = `${u.display_name} (@${u.username}) | ${SITE_NAME}`;
        const desc = u.bio || `${u.display_name} has shared ${u.post_count || 0} restaurants on ${SITE_NAME}`;
        return new Response(ogHtml({ title, desc: desc.slice(0, 200), image: u.photo_url, url: `${SITE_URL}/user?u=${username}` }), { headers: { "Content-Type": "text/html;charset=UTF-8" } });
      }
    }
  }

  if (url.pathname === "/place" || url.pathname === "/place/") {
    const placeId = url.searchParams.get("id");
    if (placeId) {
      const p = await sbGet("posts", `place_id=eq.${encodeURIComponent(placeId)}&visibility=eq.public&select=place_name,city,photo_urls`);
      if (p) {
        return new Response(ogHtml({ title: `${p.place_name}${p.city ? ` — ${p.city}` : ""} | ${SITE_NAME}`, desc: `See posts about ${p.place_name}`, image: p.photo_urls?.[0], url: `${SITE_URL}/place?id=${placeId}` }), { headers: { "Content-Type": "text/html;charset=UTF-8" } });
      }
    }
  }

  return ctx.next();
};
