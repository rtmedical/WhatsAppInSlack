# WhatsAppInSlack

Welcome to the WhatsAppInSlack repository! This project seamlessly integrates your WhatsApp messages into Slack, making your communication much more efficient.

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![Issues](https://img.shields.io/github/issues/rtmedical/WhatsAppInSlack.svg)](https://github.com/rtmedical/WhatsAppInSlack/issues)
[![Forks](https://img.shields.io/github/forks/rtmedical/WhatsAppInSlack.svg)](https://github.com/rtmedical/WhatsAppInSlack/network/members)
[![Stars](https://img.shields.io/github/stars/rtmedical/WhatsAppInSlack.svg)](https://github.com/rtmedical/WhatsAppInSlack/stargazers)


![WhatsApp Slack Integration Screenshot](./img/whatsapp-slack-integration.png)


## Table of Contents
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgments](#acknowledgments)

## Project Structure
```
│   Dockerfile
│   .env.example
│   README.MD
│   docker-compose.yml
└───app
    │   app.js
    │   db.js
    │   package.json
```

- **Dockerfile**: Contains the configuration to create a Docker image for the application.
- **.env.example**: An example environment file that contains key-value pairs for necessary environment variables. Before starting the application, you'll need to copy this file and name it as `.env`.
- **docker-compose.yml**: Docker Compose configuration file to run the entire application stack.
- **app**: This directory contains the main application logic.
  - **app.js**: The main entry point for our application.
  - **db.js**: Responsible for database operations.
  - **package.json**: Contains metadata about the application and its dependencies.

## Getting Started

1. Clone the repository to your local machine:
```bash
git clone https://github.com/rtmedical/WhatsAppInSlack.git
```

2. Navigate into the project directory:
```bash
cd WhatsAppInSlack
```

3. Copy the `.env.example` file and name the copy as `.env`. Modify the necessary environment variables according to your setup.

4. Using Docker Compose, build and run the application:
```bash
docker-compose up --build
```

The application should now be up and running!

## Configuration

Before starting the application, ensure you have set up the environment variables in the `.env` file. Refer to `.env.example` for required variables.

Inside `WhatsAppInSlack/app/db.js`, you will find the following MongoDB connection URI:

```javascript
const uri = "mongodb+srv://<username>:<password>@cluster-url/test?retryWrites=true&w=majority";
```

We recommend using [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) for a hassle-free MongoDB hosting experience. They offer a free tier that is sufficient for most starter projects.


## Contributing

We love contributions! If you'd like to contribute, please follow these steps:

1. Fork the repository.
2. Create a new feature branch.
3. Commit your changes.
4. Push to your feature branch.
5. Create a new Pull Request.

## License

This project is licensed under the GNU GENERAL PUBLIC LICENSE. See the [LICENSE](LICENSE) file for details.

## Acknowledgments

- To all the developers and contributors who made this project possible, thank you!
- This project utilizes several outstanding open-source libraries to achieve its functionalities:
  - **[whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js)**: A high-level API to interact with WhatsApp Web.
  - **[puppeteer](https://github.com/puppeteer/puppeteer)**: A headless Chrome browser provided by Chrome that can be used for rendering web pages and automating web browser interactions.
  - **[@slack/events-api](https://github.com/slackapi/node-slack-sdk/tree/main/packages/events-api)** & **[@slack/web-api](https://github.com/slackapi/node-slack-sdk/tree/main/packages/web-api)**: Libraries to integrate and interact with the Slack platform.
  - **[express](https://github.com/expressjs/express)**: Fast, unopinionated, minimalist web framework for Node.js.
  - **[mongodb](https://github.com/mongodb/node-mongodb-native)**: The official MongoDB driver for Node.js.
  - **[axios](https://github.com/axios/axios)**: Promise-based HTTP client for the browser and Node.js.
  - **[dotenv](https://github.com/motdotla/dotenv)**: Zero-dependency module that loads environment variables from a `.env` file into `process.env`.
  - And many others. A complete list can be found in our [package.json](./app/package.json) file.
- Special thanks to the open-source community for providing invaluable resources and inspiration.

---

For any additional information or questions, please open an issue in the repository. Happy coding! 🚀