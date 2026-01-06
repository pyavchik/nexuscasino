FROM node:20-alpine
WORKDIR /app
ARG VITE_API_BASE_URL=http://localhost:8080/api
ARG VITE_WS_URL=ws://localhost:8080/ws
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_WS_URL=$VITE_WS_URL
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
