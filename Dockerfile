# use Node.js image
FROM node:14

# set working directory
WORKDIR /usr/src/app

# install additional system dependencies for puppeteer
RUN apt-get update && apt-get install -y gconf-service libgbm-dev libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils  wget gnupg ffmpeg ca-certificates --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*
RUN wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | apt-key add -

RUN echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list

RUN apt-get update

RUN apt-get install -y google-chrome-stable --no-install-recommends

ENV CHROME_BIN=/usr/bin/google-chrome-stable

# copy the app source to the Docker image
COPY app .
RUN npm install

# install npm packages
RUN npm install  qrcode-terminal form-data fs fluent-ffmpeg mongodb axios express dotenv
EXPOSE 3000 80
# start the app
CMD node app.js 
