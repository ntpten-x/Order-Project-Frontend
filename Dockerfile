# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# These envs are compiled into the frontend bundle at build time.
# Defaults are for local/dev; override via `--build-arg` for production.
ARG NEXT_PUBLIC_API_URL=http://localhost:3001
ARG NEXT_PUBLIC_BACKEND_API=http://localhost:3000
ARG NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
ARG NEXT_PUBLIC_SOCKET_PATH=/socket.io

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_BACKEND_API=$NEXT_PUBLIC_BACKEND_API
ENV NEXT_PUBLIC_SOCKET_URL=$NEXT_PUBLIC_SOCKET_URL
ENV NEXT_PUBLIC_SOCKET_PATH=$NEXT_PUBLIC_SOCKET_PATH

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy only necessary files for next start
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/next.config.mjs ./

EXPOSE 3001

# Next.js by default runs on 3000, we can override it with PORT env
ENV PORT=3001

CMD ["npm", "start"]
