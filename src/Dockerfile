FROM node:19.2-alpine
WORKDIR /usr/app
RUN mkdir -p logs
COPY *.mjs ./
COPY *.json ./
COPY startSupervisor.sh ./
RUN mkdir -p config
COPY config/default-docker.json ./config/default.json
COPY node_modules ./
RUN ["npm","install"]
ENTRYPOINT ["./startSupervisor.sh"]