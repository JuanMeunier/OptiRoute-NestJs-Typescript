# Usa Node 18 Alpine para una imagen ligera
FROM node:18.17-alpine

# Carpeta de trabajo dentro del contenedor
WORKDIR /app


COPY package*.json ./

# Instalamos dependencias
RUN npm install

# Copiamos el resto del código
COPY . .

# Compilamos TypeScript a JavaScript en /dist
RUN npm run build

# Puerto expuesto 
EXPOSE 3000

# Comando para producción: ejecuta el JS compilado en dist/
CMD ["npm", "run", "start:prod"]