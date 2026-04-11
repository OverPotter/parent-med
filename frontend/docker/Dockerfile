FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

ARG VITE_HITKEEP_SCRIPT_URL
ARG VITE_HITKEEP_USER_HASH_SALT
ARG VITE_API_URL
ENV VITE_HITKEEP_SCRIPT_URL=$VITE_HITKEEP_SCRIPT_URL
ENV VITE_HITKEEP_USER_HASH_SALT=$VITE_HITKEEP_USER_HASH_SALT
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/www /usr/share/nginx/html

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
