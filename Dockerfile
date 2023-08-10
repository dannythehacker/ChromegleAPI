FROM        node:16-bullseye-slim AS BASE

LABEL       author="Isaac Kogan" maintainer="info@isaackogan.com"

# System Utilities
RUN         apt update \
            && apt -y install ffmpeg iproute2 git libsqlite3-dev python3 python3-dev ca-certificates dnsutils  \
            tzdata zip tar curl build-essential libtool unixodbc libgssapi-krb5-2

# Libraries
COPY        package.json ./

RUN         npm install

ENV         IS_DOCKER YES

FROM        base as final

# Set workdir
WORKDIR     ./

# Copy code
COPY        ./src ./src

# Copy files
COPY        ./resources ./resources

# Start server
CMD         ["node", "./src/server.js"]
