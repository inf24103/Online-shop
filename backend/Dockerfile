# Verwende die offizielle Node.js LTS Version als Basis-Image
FROM node:18-alpine AS base

# Setze das Arbeitsverzeichnis im Container
WORKDIR /app

# Kopiere package.json und package-lock.json (falls vorhanden)
COPY package*.json ./

# Installiere Abhängigkeiten
RUN npm ci

# Kopiere den Quellcode
COPY . .

# Öffne Port 3000
EXPOSE 3000

# Starte die Anwendung
CMD ["npm", "start"] 