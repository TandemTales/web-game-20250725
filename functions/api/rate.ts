type PagesFunction = any;

export const onRequestPost: PagesFunction = async ({ request, env }) => {
  try {
    // Debug: Check if env.DB exists
    if (!env.DB) {
      console.error('Database binding not found');
      return new Response("Database not configured", { status: 500 });
    }

    // Debug: Log request details
    console.log('Request method:', request.method);
    console.log('Content-Type:', request.headers.get('Content-Type'));

    const body = await request.json() as any;
    console.log('Request body:', body);

    const { gameId, stars } = body;
    const rating = parseInt(stars, 10);

    console.log('Parsed values:', { gameId, stars, rating });

    if (!gameId || isNaN(rating) || rating < 1 || rating > 5) {
      console.log('Validation failed:', { gameId, rating });
      return new Response("Bad request", { status: 400 });
    }

    const ip = request.headers.get("CF-Connecting-IP") ?? "0.0.0.0";
    console.log('IP:', ip);

    // Try a simple insert first (without UPSERT)
    try {
      const insertResult = await env.DB
        .prepare("INSERT OR REPLACE INTO ratings (game_id, stars, ip) VALUES (?, ?, ?)")
        .bind(gameId, rating, ip)
        .run();

      console.log('Insert result:', insertResult);

      if (!insertResult.success) {
        console.error('Database insert failed:', insertResult.error);
        return new Response(`Database error: ${insertResult.error}`, { status: 500 });
      }
    } catch (dbError) {
      console.error('Database operation failed:', dbError);
      return new Response(`Database operation failed: ${dbError}`, { status: 500 });
    }

    // Get updated stats
    const statsResult = await env.DB
      .prepare("SELECT COUNT(*) as count, AVG(stars) as avg FROM ratings WHERE game_id = ?")
      .bind(gameId)
      .first() as { count: number; avg: number } | null;

    console.log('Stats result:', statsResult);

    return Response.json({ 
      votes: statsResult?.count || 0, 
      average: statsResult?.avg ? Number(statsResult.avg).toFixed(2) : "0.00"
    });
  } catch (error) {
    console.error('Rate endpoint error:', error);
    return new Response(`Internal server error: ${error}`, { status: 500 });
  }
};
