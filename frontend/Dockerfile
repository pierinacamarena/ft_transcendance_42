FROM	node:bullseye-slim

COPY ./files /transcendence/frontend

WORKDIR	/transcendence/frontend

RUN npm install
RUN npm install process

ENTRYPOINT [ "npm", "run", "start" ]