type PagesFunction = any;

export const onRequestGet: PagesFunction = async ({ params, env, request }) => {
  const gameId = params!.id as string;

  const ip = request.headers.get("CF-Connecting-IP") ?? "0.0.0.0";

  const { count, avg } = await env.DB
    .prepare("SELECT COUNT(*) count, AVG(stars) avg FROM ratings WHERE game_id = ?1;")
    .bind(gameId)
    .first() as { count: number; avg: number };

  const mineRow = (await env.DB
    .prepare("SELECT stars FROM ratings WHERE game_id = ?1 AND ip = ?2;")
    .bind(gameId, ip)
    .first()) as { stars?: number } | null;

  return Response.json({
    votes: count ?? 0,
    average: avg ? Number(avg).toFixed(2) : 0,
    mine: mineRow?.stars ?? null,
  });
};
