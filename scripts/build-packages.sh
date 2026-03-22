#!/bin/bash
set -e
for pkg in "@sportsbook/shared-types" "@sportsbook/logger" "@sportsbook/auth-middleware" "@sportsbook/redis-client" "@sportsbook/kafka-client" "@sportsbook/db-client"; do
  echo "Building $pkg..."
  pnpm --filter "$pkg" build
done
echo "All packages built!"
