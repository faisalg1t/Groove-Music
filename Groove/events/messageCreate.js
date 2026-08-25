
const {
  Events,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  MessageFlags,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  SeparatorSpacingSize,
} = require("discord.js");

module.exports = {
  name: Events.MessageCreate,
  async execute(message, client) {
    if (message.author.bot) return;
    if (!message.guild) return;
    
    
    if (!message.mentions.users.has(client.user.id)) return;
    if (message.type === 19) return; 
    
    const container = new ContainerBuilder();
    
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `# Hey there!\n\nI'm **${client.user.username}** - Your music companion\nUse \`/help\` to explore all my commands\nNeed support? Join our [server](https://discord.gg/TGF3fCXtRm)`
      )
    );
    
    container.addSeparatorComponents(new SeparatorBuilder());
    
    container.addMediaGalleryComponents(
      new MediaGalleryBuilder().addItems(
        new MediaGalleryItemBuilder().setURL(
          "https://imgs.search.brave.com/8xRwYYZ6NLPeuJ0KYvMOWyFME_ktfqrxonjNL6DkCp0/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9pLnBp/bmltZy5jb20vb3Jp/Z2luYWxzL2ViLzMw/LzcwL2ViMzA3MDNh/YjFkZTY3ZjZjOGM5/OGJkYzE3NjRlMWI3/LmpwZw"
        )
      )
    );
    
    container.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
    );
    
    await message.reply({
      components: [container],
      flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2,
    });
  },
};

/*
 * Project: Groove Music
 * Author: faisalg1t (Faisal)
 * Organization: Eleone Hub
 * GitHub: https://github.com/faisalg1t
 * License: MIT
 * © 2026 Eleone Hub. All rights reserved.
 */
