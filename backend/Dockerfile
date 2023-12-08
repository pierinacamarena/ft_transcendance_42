FROM node:bullseye-slim

COPY ./files /transcendence/backend
COPY ./tools/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

RUN apt-get update -y && apt-get install curl -y

WORKDIR /transcendence/backend/arcade-physics

RUN npm install \
&& npm run build

WORKDIR /transcendence/backend

RUN npm install \
&& npm install ./arcade-physics

EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=5s --start-period=20s \
    CMD curl http://backend:3000/users/connected || exit 1

ENTRYPOINT [ "docker-entrypoint.sh" ]

CMD [ "npm", "run", "backend" ]
