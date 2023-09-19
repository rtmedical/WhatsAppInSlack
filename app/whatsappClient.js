const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');

async function initializeClient() {
  const client = new Client({
    puppeteer: {
      executablePath: '/usr/bin/google-chrome-stable',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    },
    authStrategy: new LocalAuth(),
  });

  client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
  });

  client.on('ready', () => {
    console.log('Client is ready!');
  });

  await client.initialize();

  return client;
}

module.exports = initializeClient();
