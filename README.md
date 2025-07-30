# AI Game of the Day

This site hosts several small HTML games and can optionally collect star ratings using Cloudflare Pages Functions and a D1 database.

## Developing locally

1. Install the [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install/):
   ```bash
   npm install -g wrangler
   ```
2. Create a D1 database:
   ```bash
   wrangler d1 create gameday_ratings
   ```
3. Update `wrangler.toml` with your new database ID.
4. Create the table:
   ```bash
   wrangler d1 execute gameday_ratings --command "CREATE TABLE IF NOT EXISTS ratings (id INTEGER PRIMARY KEY AUTOINCREMENT, game_id TEXT NOT NULL, stars INTEGER NOT NULL CHECK(stars BETWEEN 1 AND 5), ip TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);"
   ```
5. Start the development server:
   ```bash
   wrangler pages dev
   ```

## Deployment

Deploy the current `./` directory with:
```bash
wrangler pages deploy ./
```

This exposes the rating API under `/api/rate` and `/api/ratings/:gameId`.
