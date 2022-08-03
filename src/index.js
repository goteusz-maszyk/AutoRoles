const { Client, ApplicationCommandType, ActivityType } = require('discord.js');
const config = require('./config');
const fs = require('fs')
require('dotenv').config()

const { intents, token } = config;

const client = new Client({
  intents,
  presence: {
    status: 'online',
    activities: [{
      name: `/rank`,
      type: ActivityType.Listening
    }]
  }
});

client.on('ready', () => {
  console.log(`Logged in as: ${client.user?.tag}`);

  client.application?.commands.create({
    name: "rank",
    description: "Check your level",
    type: ApplicationCommandType.ChatInput
  })

  client.texts = require('../texts.json');
  try{
    client.guildConfig = require('../guildConfig.json');
  } catch (e) { client.guildConfig = {} }
  try {
    client.data = require('../data.json');
  } catch (e) { client.data = {} }

  const events = fs.readdirSync(`src/events`).filter(d => d.endsWith('.js'));
  for (let file of events) {
    const evt = require(`./events/${file}`);
    let eName = file.split('.')[0];
    client.on(eName, evt.bind(null, client));
  };
});

process.on('SIGINT', function () {
  client.user.setStatus("invisible")
  client.destroy()
  process.exit();
});

process.on('exit', () => {
  client.user.setStatus("invisible")
  client.destroy()

  fs.writeFileSync('data.json', JSON.stringify(client.data));
})

const server = require('http').createServer().listen(8080);
server.on('request', (req, res) => {
  res.write("I'm alive\nPath: ");
  res.write(req.url)
  res.end();
})

client.login(token);
