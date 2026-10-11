# Production image for Cloud Run. Local development runs the API directly
# (`npm run dev:start`), there is no containerised dev loop.

# --- Build stage
FROM node:24 AS build
WORKDIR /code
COPY package*.json openapi-nodegen-api-file.yml migrate-mongo-config.js migrations ./
RUN npm ci
COPY . .
RUN npm run build

# --- Runtime: the built code plus production dependencies only
FROM node:24-alpine AS runtime
WORKDIR /code
ENV NODE_ENV=production
COPY --from=build /code/package*.json ./
RUN npm ci --omit=dev
COPY --from=build /code/openapi-nodegen-api-file.yml ./
COPY --from=build /code/build ./build
COPY --from=build /code/src ./src
COPY --from=build /code/migrate-mongo-config.js ./
COPY --from=build /code/migrations ./migrations
COPY --from=build /code/emails ./emails

EXPOSE 8080
CMD ["node", "./build/server.js"]
