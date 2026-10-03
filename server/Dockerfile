FROM node:22-alpine

ENV NODE_ENV=production

WORKDIR /app

# Ensure /data exists and is owned by the node user for SQLite
RUN mkdir -p /data && chown -R node:node /data

COPY package.json package-lock.json* ./
RUN npm ci --production=false

COPY tsconfig.json ./
COPY src/ ./src/
COPY scripts/ ./scripts/
RUN npx tsc && chown -R node:node /app

# Remove dev dependencies after build
RUN npm prune --production

# Use the non-root node user
USER node

EXPOSE 3001

CMD ["node", "dist/index.js"]
