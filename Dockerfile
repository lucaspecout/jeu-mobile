FROM node:20-bullseye

WORKDIR /app

COPY package*.json ./
RUN npm install -g npm@latest \
  && npm install \
  && npm cache clean --force

COPY . .

ENV EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0
ENV REACT_NATIVE_PACKAGER_HOSTNAME=0.0.0.0

EXPOSE 19000 19001 19002 8081

CMD ["npm", "run", "start", "--", "--tunnel", "--port", "8081"]
