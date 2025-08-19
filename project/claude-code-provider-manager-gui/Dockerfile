# Build stage
FROM node:18-alpine AS builder

# Install build dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    linux-headers \
    udev

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY pnpm-lock.yaml ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS runtime

# Install runtime dependencies
RUN apk add --no-cache \
    udev \
    ttf-freefont \
    ca-certificates \
    && update-ca-certificates

# Create app user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Set working directory
WORKDIR /app

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

# Copy static assets if any
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Create necessary directories
RUN mkdir -p /app/config && \
    chown -R nextjs:nodejs /app/config

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 1420

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:1420', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })" || exit 1

# Start the application
CMD ["npm", "start"]