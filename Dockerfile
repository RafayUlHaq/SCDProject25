# Use official Node.js 18 Alpine image
FROM node:18-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy package files
COPY package.json package-lock.json* ./

# Install production dependencies
RUN npm install --production

# Copy the rest of the source code
COPY . .

# Set NODE_ENV to production
ENV NODE_ENV=production

# Expose port 3000
EXPOSE 3000

# Start the application
CMD ["node", "main.js"]