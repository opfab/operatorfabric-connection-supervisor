FROM node:19.2-alpine
WORKDIR /usr/app
RUN mkdir -p logs
COPY build ./build
COPY startSupervisor.sh ./
RUN mkdir -p config
COPY config/default-docker.json ./config/default.json
COPY package.json ./
RUN ["npm","install"]
ENTRYPOINT ["./startSupervisor.sh"]