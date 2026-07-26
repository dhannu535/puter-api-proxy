FROM node:22-alpine AS base

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
COPY dashboard/package.json ./dashboard/
RUN npm install --production
RUN cd dashboard && npm install

# Copy source
COPY server/ ./server/
COPY dashboard/ ./dashboard/

# Build dashboard
RUN cd dashboard && npm run build

# Production stage
FROM node:22-alpine
WORKDIR /app

COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/server ./server
COPY --from=base /app/dashboard/dist ./dashboard/dist
COPY package.json ./

ENV NODE_ENV=production
ENV PORT=3800

EXPOSE 3800

CMD ["node", "server/index.mjs"]
