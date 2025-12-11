FROM node:20-bullseye

WORKDIR /app

COPY package*.json ./

# Avoid inheriting proxy settings from the host that can block access to the
# public npm registry inside the build context.
ENV HTTP_PROXY="" \
    HTTPS_PROXY="" \
    http_proxy="" \
    https_proxy="" \
    npm_config_proxy="" \
    npm_config_http_proxy="" \
    npm_config_https_proxy=""

RUN npm install \
  && npm cache clean --force

COPY . .

ENV EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0
ENV REACT_NATIVE_PACKAGER_HOSTNAME=0.0.0.0

EXPOSE 19000 19001 19002 8081

CMD ["npm", "run", "start", "--", "--tunnel", "--port", "8081"]
