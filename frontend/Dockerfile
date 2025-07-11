# Verwende die offizielle Node.js LTS Version als Basis-Image
FROM node:18-alpine

# Zeitzonenpaket installieren
RUN apk add --no-cache tzdata

# Setze Zeitzone
ENV TZ=Europe/Berlin

# Setze das Arbeitsverzeichnis im Container
WORKDIR /app

# Kopiere package.json und package-lock.json (falls vorhanden)
COPY package*.json ./

# Installiere Abhängigkeiten
RUN npm install

# Kopiere den Quellcode
COPY . .

# Öffne Port 5000
EXPOSE 5000

# Starte die Anwendung
CMD ["npm", "start"]