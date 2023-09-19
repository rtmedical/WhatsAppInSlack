const express = require('express');
const { createEventAdapter } = require('@slack/events-api');
const { WebClient } = require('@slack/web-api');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const { connect, getDB } = require('./db.js');
const axios = require('axios');
const ffmpeg = require('fluent-ffmpeg');
const FormData = require('form-data');
const fs = require('fs');
const qrcode = require('qrcode-terminal');
const pathNode = require('path');
const dotenv = require('dotenv');


dotenv.config();

async function main() {
  // Config  Express Server 
  const app = express();
  const port = process.env.PORT || 3000;

  // Configs  Slack
  const slackSigningSecret = process.env.SLACK_SIGNING_SECRET;
  const slackToken = process.env.SLACK_TOKEN;
  const slackEvents = createEventAdapter(slackSigningSecret);
  const slackClient = new WebClient(slackToken);
  const SLACK_CHAT_POST_MESSAGE_URL = process.env.SLACK_CHAT_POST_MESSAGE_URL;
  const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;
  const SLACK_API_URL = process.env.SLACK_API_URL;

  // Configs  WhatsApp
  const path = require('path');
  const tmp = require('tmp');
  const puppeteerExecutablePath = process.env.WHATSAPP_PUPPETEER_EXECUTABLE_PATH;
  const CHANNEL_NAME = process.env.WHATSAPP_CHANNEL_NAME;
  const client = new Client({
    puppeteer: {
      executablePath: puppeteerExecutablePath,
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

  // Connect Database  
  await connect();
  const db = getDB();
  const collection = db.collection('userThreads');

  // Express middleware to handle Slack events
  app.use('/slack', slackEvents.expressMiddleware());

  // Handling Slack events
  slackEvents.on('message', async (event) => {
    if (event.bot_id) {
      return;
    }
    // console.log('event: ', event);
     try {
      const userInfo = await slackClient.users.info({ user: event.user });

      // if the message is from ROBO it does not send the file.
      if (userInfo.user && userInfo.user.profile && userInfo.user.profile.api_app_id) {
        return;
      }

         // Use the database
       const db = getDB();
       const collection = db.collection('userThreads');
   
       let userThreads = await collection.findOne({ thread_ts: event.thread_ts });
       let userId = userThreads ? userThreads.userId : null;
       let thread_ts = userThreads.thread_ts
       //console.log(userId)
      // console.log(userThreads.thread_ts)
   
       if (event.thread_ts === thread_ts) {
   
         // Get user info
         console.log('userInfo: ', userInfo);
   
         const username = userInfo.user ? userInfo.user.real_name : 'Client Say:';
   
         if (event.files) {
           //console.log('event.files: ', event.files);
           for (let file of event.files) {
             let url = file.url_private;
             let response = await axios({
               url,
               method: 'GET',
               responseType: 'stream',
               headers: {
                 'Authorization': `Bearer ${slackToken}`,
               },
             });
   
             let dir = `${__dirname}/downloads`;
             if (!fs.existsSync(dir)) {
               fs.mkdirSync(dir, { recursive: true });
             }
             let filename = `${dir}/${file.name}`;
             let writer = fs.createWriteStream(filename);
   
             response.data.pipe(writer);
   
   
             await new Promise((resolve, reject) => {
               writer.on('finish', resolve);
               writer.on('error', reject);
             });
   
             let fileType = file.mimetype.split('/')[0];
             let mimetype;
   
             if (fileType === 'audio') {
               mimetype = 'audio/ogg; codecs=opus';
               let outputFilename = `${filename}.ogg`;
               await new Promise((resolve, reject) => {
                 ffmpeg(filename)
                   .audioCodec('libopus')
                   .format('ogg')
                   .output(outputFilename)
                   .on('end', resolve)
                   .on('error', reject)
                   .run();
               });
               fs.unlinkSync(filename);
               filename = outputFilename;
             }
             else if (fileType === 'video') {
               mimetype = 'video/mp4';
               let outputFilename = `${filename}.mp4`;
               await new Promise((resolve, reject) => {
                 ffmpeg(filename)
                   .output(outputFilename)
                   .on('end', resolve)
                   .on('error', reject)
                   .run();
               });
               fs.unlinkSync(filename);
               filename = outputFilename;
             } else {
               mimetype = file.mimetype;
             }
   
             let fileData = fs.readFileSync(filename);
             let base64Data = Buffer.from(fileData).toString('base64');
   
             let media = new MessageMedia(mimetype, base64Data, file.name);
   
             // Get file info including initial_comment from Slack
             let slackFileInfo = await slackClient.files.info({ file: file.id });
             let initial_comment = '';
             let replies = await slackClient.conversations.replies({channel: event.channel, ts: event.ts});
             
             if (replies.messages && replies.messages.length > 0) {
               // The initial comment should be the first reply
               initial_comment = `_*${username} diz:*_\n${replies.messages[0].text}\n`;
             }
            // console.log(initial_comment);
             await client.sendMessage(userId, initial_comment);
             await client.sendMessage(userId, media);
           }
         } else {
           await client.sendMessage(userId, `_*${username} Say:*_\n${event.text}`);
         }
       }
     } catch (error) {
       console.error(error);
     }
   });

// WhatsApp event handling
  client.on('message', async msg => {
   
    // code to not respond to messages sent by the bot
    if (msg.fromMe) {
      return;
    }
    
    if (msg.type === 'sticker' && msg.caption === 'status') {
      // Ignore sticker messages with the caption "status"
      return;
    }

    
   // console.log('MESSAGE RECEIVED', msg.body);
    const chat = await msg.getChat();
    //console.log(chat);
    let userUID = '';
    if (chat.isGroup) {
      ///console.log(chat.groupMetadata.id._serialized);
      ///console.log(chat.groupMetadata.subject);
      //console.log('Mensagem de grupo:', msg.body);
      userUID = chat.groupMetadata.id._serialized;
    } else {
    //  console.log('Mensagem de contato individual:', msg.body);
      userUID = chat.id._serialized;
     // console.log(userUID);
    }

    const contact = await msg.getContact();
    let pp = '';
  
    pp = await contact.getProfilePicUrl();
    if (!pp || Object.keys(pp).length === 0) {
        pp = 'https://rtmedical.com.br/wp-content/uploads/2022/08/user_logo-300x300.png';
    }
    let msgDate = new Date(msg.timestamp * 1000);
    const userThreadsCollection = db.collection('userThreads');
    let userThread = await userThreadsCollection.findOne({ userId: userUID });
    let thread_ts = userThread ? userThread.thread_ts : null;

    if (!thread_ts) {
      let blocks = [];

      if (chat.isGroup) {
        blocks = [
          {
            "type": "divider"
          },
          {
            "type": "context",
            "elements": [
              {
                "type": "mrkdwn",
                "text": "Send By "
              },
              {
                "type": "image",
                "image_url": "https://rtmedical.com.br/wp-content/uploads/2023/05/people.png",
                "alt_text": ""
              },
              {
                "type": "mrkdwn",
                "text": `*${chat.name}*`
              }
            ]
          },
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": `*${chat.name || 'N/A'}*\Description: *${chat.groupMetadata.desc || 'N/A'}*\n`
            },
            "accessory": {
              "type": "image",
              "image_url": "https://rtmedical.com.br/wp-content/uploads/2023/05/people.png",
              "alt_text": "plane"
            }
          }
        ];
      } else {
        blocks = [
          {
            "type": "divider"
          },
          {
            "type": "context",
            "elements": [
              {
                "type": "mrkdwn",
                "text": "Send by"
              },
              {
                "type": "image",
                "image_url": pp,
                "alt_text": `${contact.pushname}`
              },
              {
                "type": "mrkdwn",
                "text": `*${contact.pushname}*`
              }
            ]
          },
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": `*${contact.name || 'N/A'}*\nName: *${contact.pushname}*\nPhone: *${contact.number}*`
            },
            "accessory": {
              "type": "image",
              "image_url": pp,
              "alt_text": `${contact.pushname}`
            }
          }
        ];
      }

      let response = await axios.post(SLACK_CHAT_POST_MESSAGE_URL, {
        channel: CHANNEL_NAME,
        blocks,
        text: '' // Needed for thread creation fallback
      }, {
        headers: {
          'Authorization': `Bearer ${slackToken}`,
          'Content-type': 'application/json'
        }
      });

      thread_ts = response.data.ts;
      await userThreadsCollection.insertOne({
        userId: userUID,
        thread_ts
      });
    }

    await axios.post(SLACK_CHAT_POST_MESSAGE_URL, {
      channel: CHANNEL_NAME,
      thread_ts,
      blocks: [
        {
          "type": "divider"
        },
        {
          "type": "context",
          "elements": [
            {
              "type": "mrkdwn",
              "text": `${new Date(chat.timestamp * 1000).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
            },
            {
              "type": "image",
              "image_url": pp,
              "alt_text": ""
            },
            {
              "type": "mrkdwn",
              "text": `*${contact.pushname}*`
            }
          ]
        },
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": `${msg.body}`
          }
        }
      ],
      text: '' // Needed for thread reply fallback
    }, {
      headers: {
        'Authorization': `Bearer ${slackToken}`,
        'Content-type': 'application/json'
      }
    });

    if (msg.hasMedia) {
      const attachmentData = await msg.downloadMedia();
      const mediaBuffer = Buffer.from(attachmentData.data, 'base64');

      tmp.file({ postfix: `.${attachmentData.mimetype.split('/')[1]}` }, async function _tempFileCreated(err, path, fd, cleanupCallback) {
        if (err) {
          console.error(`Error creating temp file: ${err}`);
          return;
        }

        fs.write(fd, mediaBuffer, 0, mediaBuffer.length, async function (err, written, buffer) {
          if (err) {
            console.error(`Error writing to temp file: ${err}`);
            cleanupCallback();
            return;
          }

          let inputFile = path;
          let outputFile = `${pathNode.parse(inputFile).name}.mp3`;

          if (attachmentData.mimetype.startsWith('audio')) {
            ffmpeg(inputFile)
              .output(outputFile)
              .on('end', async function () {
                console.log('Conversion completed');

                let form = new FormData();
                form.append('file', fs.createReadStream(outputFile));
                form.append('channels', CHANNEL_NAME);
                form.append('thread_ts', thread_ts);

                let messageDetails = ` `;
                form.append('initial_comment', messageDetails);

                try {
                  const response = await axios.post(SLACK_API_URL, form, {
                    headers: {
                      'Authorization': `Bearer ${slackToken}`,
                      ...form.getHeaders()
                    }
                  });
                  console.log(`Slack API response: ${JSON.stringify(response.data)}`);
                } catch (error) {
                  console.error(`Error sending to Slack API: ${error}`);
                }

                // Excluir mídia do canal principal
                await msg.deleteMedia();

                cleanupCallback();
              })
              .on('error', function (err) {
                console.log('Error occurred during conversion: ' + err.message);
                cleanupCallback();
              })
              .run();
          } else {
            let form = new FormData();
            form.append('file', fs.createReadStream(path));
            form.append('channels', CHANNEL_NAME);
            form.append('thread_ts', thread_ts);

            let messageDetails = ` `;
            form.append('initial_comment', messageDetails);

            try {
              const response = await axios.post(SLACK_API_URL, form, {
                headers: {
                  'Authorization': `Bearer ${slackToken}`,
                  ...form.getHeaders()
                }
              });
              console.log(`Slack API response: ${JSON.stringify(response.data)}`);
            } catch (error) {
              console.error(`Error sending to Slack API: ${error}`);
            }

            // Delete media from main channel            
            await msg.deleteMedia();

            cleanupCallback();
          }
        });
      });
    }
  });

// Start the Express server
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
// Initialize the WhatsApp client
  await client.initialize();
}

main().catch((error) => {
  console.error('An error occurred:', error);
});
