FROM node:20-alpine

WORKDIR /app

# Instalează dependințele de sistem pentru Prisma
RUN apk add --no-cache openssl

# Copiază fișierele de dependințe
COPY package.json package-lock.json* ./

# Instalează dependințele Node.js
RUN npm install

# Copiază codul sursă
COPY . .

# Generează Prisma Client
RUN npx prisma generate

# Expune portul
EXPOSE 5000

# Rulează migrarea apoi pornește serverul
CMD ["sh", "-c", "npx prisma migrate deploy && node src/index.js"]
