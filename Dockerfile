FROM node:latest
WORKDIR /app
COPY package*.json ./
RUN npm install
RUN apt-get update && apt-get install
COPY . .
EXPOSE 7861
CMD ["node", "server.js"]
