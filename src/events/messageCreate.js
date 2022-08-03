const { Message, Client } = require("discord.js");

/**
 * @param {Client} client
 * @param {Message} message 
 */
module.exports = async (client, message) => {
  const { data, guildConfig, texts } = client
  if (message.author.bot) return
  if (!message.guild) return
  if (!data[message.guild.id + "-" + message.author.id]) data[message.guild.id + "-" + message.author.id] = { level: 0, xp: 0 }
  data[message.guild.id + "-" + message.author.id].xp += 20
  const { level, xp } = data[message.guild.id + "-" + message.author.id]
  const requiredXp = 5 * (level ** 2) + (50 * level) + 100

  if (requiredXp - xp <= 0) {
    data[message.guild.id + "-" + message.author.id].xp -= requiredXp
    data[message.guild.id + "-" + message.author.id].level += 1

    const channel = message.guild.channels.cache.get(guildConfig[message.guildId].levelup_channel)

    channel.send(texts.level_up.replace("%level%", level + 1).replace("%user%", "<@" + message.author.id + ">"))

    const roleId = guildConfig[message.guildId].roles[String(level + 1)]
    if (!roleId) return
    const roleToAdd = message.guild.roles.cache.get(roleId)
    if (!roleToAdd) {
      console.log("Can't find role with ID " + roleId)
      return
    }
    message.member.roles.add(roleToAdd)
  }
}