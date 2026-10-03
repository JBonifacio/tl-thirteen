FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --production=false

COPY tsconfig.json ./
COPY src/ ./src/
COPY scripts/ ./scripts/
RUN npx tsc

# Remove dev dependencies after build
RUN npm prune --production

# Create data directory for SQLite
RUN mkdir -p /data && chown -R node:node /data /app

USER node

EXPOSE 3001

CMD ["node", "dist/index.js"]
