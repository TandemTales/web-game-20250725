type PagesFunction = any;

export const onRequestPost: PagesFunction = async ({ request, env }) => {
  const { gameId, stars } = await request.json() as any;
  const rating = parseInt(stars, 10);

  if (!gameId || isNaN(rating) || rating < 1 || rating > 5) {
    return new Response("Bad request", { status: 400 });
  }

  const ip = request.headers.get("CF-Connecting-IP") ?? "0.0.0.0";

  await env.DB
    .prepare(
      "INSERT INTO ratings (game_id, stars, ip) VALUES (?1, ?2, ?3) " +
        "ON CONFLICT(game_id, ip) DO UPDATE SET stars = excluded.stars;"
    )
    .bind(gameId, rating, ip)
    .run();

  const { count, avg } = await env.DB
    .prepare("SELECT COUNT(*) count, AVG(stars) avg FROM ratings WHERE game_id = ?1;")
    .bind(gameId)
    .first() as { count: number; avg: number };

  return Response.json({ votes: count, average: Number(avg).toFixed(2) });
};
