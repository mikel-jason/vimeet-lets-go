ARG VIMEET_SERVER_ADDRESS

FROM node:lts-alpine AS ionic

ARG VIMEET_SERVER_ADDRESS
RUN test -n "$VIMEET_SERVER_ADDRESS" || (echo "Docker build-arg VIMEET_SERVER_ADDRESS not set" && false)

RUN npm install --global @ionic/cli

FROM ionic AS builder
ARG VIMEET_SERVER_ADDRESS

WORKDIR /usr/vimeet-lets-go

COPY . .
RUN sed -ie "s/vimeet_server_base_uri:.*/vimeet_server_base_uri: '${VIMEET_SERVER_ADDRESS}',/g" ./src/environments/environment.prod.ts

RUN npm install
RUN ionic build --prod

FROM nginx:stable-alpine
LABEL Maintainer "Mikel Muennekhoff <inf18207@lehre.dhbw-stuttgart.de>"

COPY --from=builder /usr/vimeet-lets-go/www/ /usr/share/nginx/html
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
