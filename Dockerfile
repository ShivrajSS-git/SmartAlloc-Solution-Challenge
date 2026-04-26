# Stage 1: Build the React frontend
FROM node:20 AS build-stage
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Stage 2: Setup the Node.js backend
FROM node:20
WORKDIR /app
COPY server/package*.json ./server/
RUN cd server && npm install
COPY server/ ./server/

# Copy the built frontend to the server's dist folder
COPY --from=build-stage /app/client/dist ./server/dist

EXPOSE 8080
ENV PORT=8080

CMD ["node", "server/index.js"]
