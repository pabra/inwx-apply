# use node:lts-alpine
ARG BASE_IMAGE=node:14.17.4-alpine3.11

FROM ${BASE_IMAGE} AS builder

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


FROM ${BASE_IMAGE}

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
