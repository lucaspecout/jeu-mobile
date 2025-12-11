FROM nginx:alpine

WORKDIR /usr/share/nginx/html
COPY index.html ./
COPY styles.css ./
COPY main.js ./

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
