const { Interaction, Client, AttachmentBuilder, CommandInteraction, GuildMember } = require("discord.js");
const canvacord = require('canvacord');

/**
 * @param {Client} client
 * @param {Interaction} interaction 
 */
module.exports = (client, interaction) => {
  const { data } = client
  if (!interaction.guild || !interaction.member) return
  const { user } = interaction.member;
  if (!(interaction.member instanceof GuildMember)) return

  if (!data[interaction.guild.id + "-" + user.id]) data[interaction.guild.id + "-" + user.id] = { level: 0, xp: 0 }
  const { level, xp } = data[interaction.guild.id + "-" + user.id]

  const avatarURL = user.avatar ? user.avatarURL() : user.defaultAvatarURL
  const rank = new canvacord.Rank()
    .setAvatar(avatarURL)
    .setCurrentXP(xp)
    .setRequiredXP(5 * (level ** 2) + (50 * level) + 100)
    .setProgressBar("#ABCDEF", "COLOR")
    .setUsername(user.username)
    .setDiscriminator(user.discriminator)
    .setLevel(level)
    .setRank(1, "", false);

  rank.build()
    .then(data => {
      const attachment = new AttachmentBuilder(data).setName("rankcard.png");
      if (!(interaction instanceof CommandInteraction)) return
      interaction.reply({ files: [attachment] });
    });
}