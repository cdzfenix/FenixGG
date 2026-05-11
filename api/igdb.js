// api/igdb.js — Vercel Serverless Function
// Hace de proxy entre el frontend y la API de IGDB
// Gestiona el token de Twitch automáticamente

let cachedToken = null;
let tokenExpiry = 0;

async function getTwitchToken() {
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  const res = await fetch(
    `https://id.twitch.tv/oauth2/token?client_id=${process.env.TWITCH_CLIENT_ID}&client_secret=${process.env.TWITCH_CLIENT_SECRET}&grant_type=client_credentials`,
    { method: "POST" }
  );

  const data = await res.json();
  cachedToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
  return cachedToken;
}

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: "Missing query" });

    const token = await getTwitchToken();

    const igdbRes = await fetch("https://api.igdb.com/v4/games", {
      method: "POST",
      headers: {
        "Client-ID": process.env.TWITCH_CLIENT_ID,
        Authorization: `Bearer ${token}`,
        "Content-Type": "text/plain",
      },
      body: `
        search "${query}";
        fields name, cover.image_id, first_release_date, genres.name;
        limit 6;
        where version_parent = null;
      `,
    });

    const games = await igdbRes.json();

    // Normaliza la respuesta al mismo formato que usaba RAWG
    const normalized = games.map((g) => ({
      id: g.id,
      name: g.name,
      cover: g.cover?.image_id
        ? `https://images.igdb.com/igdb/image/upload/t_cover_big/${g.cover.image_id}.jpg`
        : "",
      year: g.first_release_date
        ? new Date(g.first_release_date * 1000).getFullYear().toString()
        : "",
      genres: g.genres?.map((x) => x.name).join(", ") || "",
    }));

    return res.status(200).json(normalized);
  } catch (err) {
    console.error("IGDB proxy error:", err);
    return res.status(500).json({ error: "IGDB request failed" });
  }
}
