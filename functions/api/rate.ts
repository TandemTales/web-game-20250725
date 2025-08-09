type PagesFunction = any;

export const onRequestPost: PagesFunction = async ({ request, env }) => {
  try {
    if (!env.DB) {
      return Response.json({ error: "Database not configured" }, { status: 500 });
    }

    const { gameId, stars } = await request.json() as any;
    const rating = parseInt(stars, 10);

    if (!gameId || isNaN(rating) || rating < 1 || rating > 5) {
      return Response.json({ error: "Bad request" }, { status: 400 });
    }

    const ip = request.headers.get("CF-Connecting-IP") ?? "0.0.0.0";

    // First, delete any existing rating from this IP for this game
    try {
      await env.DB
        .prepare("DELETE FROM ratings WHERE game_id = ? AND ip = ?")
        .bind(gameId, ip)
        .run();

      // Then insert the new rating
      const insertResult = await env.DB
        .prepare("INSERT INTO ratings (game_id, stars, ip) VALUES (?, ?, ?)")
        .bind(gameId, rating, ip)
        .run();

      if (!insertResult.success) {
        return Response.json({ error: "Database error" }, { status: 500 });
      }
    } catch (dbError) {
      console.error('Database operation failed:', dbError);
      return Response.json({ error: "Database operation failed" }, { status: 500 });
    }

    // Get updated stats
    const statsResult = await env.DB
      .prepare("SELECT COUNT(*) as count, AVG(stars) as avg FROM ratings WHERE game_id = ?")
      .bind(gameId)
      .first() as { count: number; avg: number } | null;

    return Response.json({ 
      votes: statsResult?.count || 0, 
      average: statsResult?.avg ? Number(statsResult.avg).toFixed(2) : "0.00"
    });
  } catch (error) {
    console.error('Rate endpoint error:', error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
};
