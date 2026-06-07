FROM node:20-slim

WORKDIR /app

# Copy package manifests and install dependencies
COPY package*.json ./
RUN npm install --include=dev

# Copy application source and build
COPY . .
RUN npm run build

# Production image
FROM node:20-slim
WORKDIR /app

# Install serve globally
RUN npm install -g serve

COPY --from=0 /app/dist ./dist

EXPOSE 5173
CMD ["serve", "-s", "dist", "-l", "5173"]
