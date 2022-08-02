const { IntentsBitField } = require('discord.js');

module.exports = {
  token: process.env.DISCORD_TOKEN,
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMessages
  ]
}
