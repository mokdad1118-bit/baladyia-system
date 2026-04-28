#!/bin/sh
set -e
mkdir -p public/uploads
npx prisma migrate deploy
exec npx next start -p "${PORT:-3000}"
