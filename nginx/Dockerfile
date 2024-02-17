FROM nginx:1.21.0-alpine

RUN rm -rf /usr/share/nginx/html/*

COPY build /usr/share/nginx/html

COPY static /usr/share/nginx/django_static

COPY nginx.conf /etc/nginx/conf.d/default.conf

CMD ["nginx", "-g", "daemon off;"]
