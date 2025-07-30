export const onRequestPost: PagesFunction = async ({ request, env }) => {
  const { gameId, stars } = await request.json<any>();

  if (!gameId || !Number.isInteger(stars) || stars < 1 || stars > 5) {
    return new Response("Bad request", { status: 400 });
  }

  const ip = request.headers.get("CF-Connecting-IP") ?? "0.0.0.0";

  const existing = await env.DB
    .prepare(
      "SELECT id FROM ratings WHERE game_id = ?1 AND ip = ?2 LIMIT 1;"
    )
    .bind(gameId, ip)
    .first<{ id: number }>();

  if (existing) {
    await env.DB
      .prepare("UPDATE ratings SET stars = ?1 WHERE id = ?2;")
      .bind(stars, existing.id)
      .run();
  } else {
    await env.DB
      .prepare("INSERT INTO ratings (game_id, stars, ip) VALUES (?1, ?2, ?3);")
      .bind(gameId, stars, ip)
      .run();
  }

  const { count, avg } = await env.DB
    .prepare("SELECT COUNT(*) count, AVG(stars) avg FROM ratings WHERE game_id = ?1;")
    .bind(gameId)
    .first() as { count: number; avg: number };

  return Response.json({ votes: count, average: Number(avg).toFixed(2) });
};
