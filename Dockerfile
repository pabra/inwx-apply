# use node:lts-alpine
# build hangs for arm/v7 platform on alpine image
# https://github.com/nodejs/docker-node/issues/2077
# let's use slim for now
ARG BASE_IMAGE=node:20.14.0-alpine

FROM --platform=$BUILDPLATFORM ${BASE_IMAGE} AS builder

WORKDIR /app

COPY package.json \
    package-lock.json  \
    ./

RUN npm install

COPY tsconfig.json \
    tsconfig.cjs.json \
    jest.config.js \
    .prettierrc.js \
    .eslintrc.js \
    .eslintignore \
    ./
COPY __tests__ __tests__/
COPY src src/

RUN npm run test:before-publish


FROM --platform=$BUILDPLATFORM ${BASE_IMAGE}

WORKDIR /app

COPY --from=builder /app/package.json \
                    /app/package-lock.json \
                    ./
RUN NODE_ENV=production npm install
COPY --from=builder /app/dist dist/

RUN NODE_ENV=production npm install -g

USER nobody

WORKDIR /data

ENTRYPOINT [ "inwx-apply" ]
