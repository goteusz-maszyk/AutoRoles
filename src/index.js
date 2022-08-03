const { Client, ApplicationCommandType, ActivityType, OAuth2Scopes } = require('discord.js');
const config = require('./config');
const fs = require('fs')
const https = require('https');
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
const DBClient = require("@replit/database")
const dbClient = new DBClient();
client.on('ready', async () => {
  console.log(`Logged in as: ${client.user?.tag}`);

  client.application?.commands.create({
    name: "rank",
    description: "Check your level",
    type: ApplicationCommandType.ChatInput
  })

  client.texts = require('../texts.json');
  client.dbClient = dbClient
  try {
    client.guildConfig = require('../guildConfig.json');
  } catch (e) { client.guildConfig = {} }
  try {
    client.data = require('../data.json');
  } catch (e) { client.data = {} }

  (await dbClient.list()).forEach(async key => {
    client.data[key] = await dbClient.get(key)
  });

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

  Object.keys(client.data).forEach(key => {
    dbClient.set(key, client.data[key])
  })

  fs.writeFileSync('data.json', JSON.stringify(client.data));
})

const server = require('http').createServer().listen(8080);
server.on('request', (req, res) => {
  console.log("Running " + req.method + " \"" + req.url + "\" for " + req.socket.remoteAddress + " at " + new Date())
  if (req.url == "/invite") {
    res.writeHead(302, {
      'Location': client.generateInvite({ scopes: [OAuth2Scopes.Bot, OAuth2Scopes.ApplicationsCommands], permissions: ['Administrator'] })
    });
    res.end();
    return
  }
  res.write("I'm alive\nPath: ");
  res.write(req.url)
  res.end();
})

setInterval(() => {
  https.request("https://Discord-AutoRoles.goteuszmaszyk.repl.co").end()
}, 30 * 1000)

client.login(token);
