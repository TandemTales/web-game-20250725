type PagesFunction = any;

export const onRequestGet: PagesFunction = async ({ params, env, request }) => {
  try {
    const gameId = params!.id as string;

    if (!gameId) {
      return new Response("Game ID required", { status: 400 });
    }

    const ip = request.headers.get("CF-Connecting-IP") ?? "0.0.0.0";

    const statsResult = await env.DB
      .prepare("SELECT COUNT(*) as count, AVG(stars) as avg FROM ratings WHERE game_id = ?1;")
      .bind(gameId)
      .first() as { count: number; avg: number } | null;

    const mineRow = await env.DB
      .prepare("SELECT stars FROM ratings WHERE game_id = ?1 AND ip = ?2;")
      .bind(gameId, ip)
      .first() as { stars?: number } | null;

    return Response.json({
      votes: statsResult?.count ?? 0,
      average: statsResult?.avg ? Number(statsResult.avg).toFixed(2) : "0.00",
      mine: mineRow?.stars ?? null,
    });
  } catch (error) {
    console.error('Ratings endpoint error:', error);
    return new Response("Internal server error", { status: 500 });
  }
};
