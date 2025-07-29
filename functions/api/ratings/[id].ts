export const onRequestGet: PagesFunction = async ({ params, env }) => {
  const gameId = params!.id as string;

  const { count, avg } = await env.DB
    .prepare("SELECT COUNT(*) count, AVG(stars) avg FROM ratings WHERE game_id = ?1;")
    .bind(gameId)
    .first() as { count: number; avg: number };

  return Response.json({
    votes: count ?? 0,
    average: avg ? Number(avg).toFixed(2) : 0,
  });
};
