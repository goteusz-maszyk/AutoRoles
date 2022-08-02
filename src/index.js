const { Client, ApplicationCommandType, ActivityType, AttachmentBuilder, CommandInteraction, GuildMember } = require('discord.js');
const config = require('./config');
const canvacord = require('canvacord')
const data = require('../data.json');
const texts = require('../texts.json');
const guildConfig = require('../guildConfig.json');
const fs = require('fs')

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
});

client.on('messageCreate', async (message) => {
  if(message.author.bot) return
  if (!message.guild) return
  if (!data[message.guild.id + "-" + message.author.id]) data[message.guild.id + "-" + message.author.id] = {level: 0, xp: 0}
  data[message.guild.id + "-" + message.author.id].xp += 20
  const { level, xp } = data[message.guild.id + "-" + message.author.id]
  const requiredXp = 5 * (level ** 2) + (50 * level) + 100

  if(requiredXp - xp <= 0) {
    data[message.guild.id + "-" + message.author.id].xp -= requiredXp
    data[message.guild.id + "-" + message.author.id].level += 1

    const channel = message.guild.channels.cache.get(guildConfig[message.guildId].levelup_channel)

    channel.send(texts.level_up.replace("%level%", level+1))
    
    const roleId = guildConfig[message.guildId].roles[String(level + 1)]
    if (!roleId) return
    const roleToAdd = message.guild.roles.cache.get(roleId)
    if(!roleToAdd) {
      console.log("Can't find role with ID " + roleId)
      return
    }
    message.member.roles.add(roleToAdd)
  }
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.guild || !interaction.member) return
  const { member } = interaction;
  if(!(member instanceof GuildMember)) return
  if (!data[interaction.guild.id + "-" + member.id]) data[interaction.guild.id + "-" + member.id] = {level: 0, xp: 0}
  const { level, xp } = data[interaction.guild.id + "-" + member.id]
  const avatarURL = member.user.avatar ? member.user.avatarURL() : member.user.defaultAvatarURL
  const rank = new canvacord.Rank()
    .setAvatar(avatarURL)
    .setCurrentXP(xp)
    .setRequiredXP(5 * (level ** 2) + (50 * level) + 100)
    .setProgressBar("#ABCDEF", "COLOR")
    .setUsername(member.user.username)
    .setDiscriminator(member.user.discriminator)
    .setLevel(level)
    .setRank(1, "", false);

  rank.build()
    .then(data => {
      const attachment = new AttachmentBuilder(data).setName("rankcard.png");
      if(!(interaction instanceof CommandInteraction)) return
      interaction.reply({files: [attachment]});
  });
});

process.on('SIGINT', function () {
  client.user.setStatus("invisible")
  client.destroy()
  process.exit();
});

process.on('exit', () => {
  client.user.setStatus("invisible")
  client.destroy()

  fs.writeFileSync('data.json', JSON.stringify(data));
})

client.login(token);
