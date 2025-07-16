# File: Dockerfile

# Stage 1: Build the frontend assets
# Using Node.js 20 LTS on a 'slim' Debian base for a standard environment.
FROM node:20-slim AS builder
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install all dependencies (including devDependencies needed for the build)
RUN npm install

# Copy the rest of your application source code
COPY . .

# Run your frontend build script (defined in package.json)
RUN npm run build:frontend

# ---

# Stage 2: Production image - lean and optimized
# Using the same node:20-slim base for consistency.
FROM node:20-slim
WORKDIR /app

# Set NODE_ENV to production for performance and security
ENV NODE_ENV=production

# --- NEW SECTION TO INSTALL TOOLS ---

# Your existing layer to install base utilities
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    sudo \
    nmap \
    wget \
    netcat-openbsd \
    && rm -rf /var/lib/apt/lists/*

RUN apt-get update && apt-get install -y ca-certificates

# Add a new layer specifically for installing kubectl
RUN curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl" && \
    install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl && \
    rm kubectl


# --- END NEW SECTION ---

# Copy package.json and package-lock.json again
COPY package*.json ./

# Install only production dependencies
RUN npm install --omit=dev

# Copy built frontend assets from the builder stage
COPY --from=builder /app/public ./public

# Copy the backend server file
COPY server.mjs .

# Expose the port the app runs on
EXPOSE 8080

# Command to run your application
CMD ["node", "server.mjs"]
