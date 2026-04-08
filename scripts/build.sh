#!/bin/sh
set -eu

pnpm prisma:generate
pnpm nest build

mkdir -p dist/prisma
cp -R prisma/* dist/prisma/
cp package.json pnpm-lock.yaml  dist/
