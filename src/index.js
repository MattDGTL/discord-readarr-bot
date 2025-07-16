require('dotenv').config();
const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ComponentType,
} = require('discord.js');

if (!process.env.DISCORD_TOKEN) {
  console.error('DISCORD_TOKEN is not set in the .env file!');
  process.exit(1); // Exit with an error code
} else {
  console.log('DISCORD_TOKEN is set. Attempting to log in...');
}
const { searchBooks } = require('./open-library');
const { addBook } = require('./readarr');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

const prefix = '!';

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', async (msg) => {
  if (msg.author.bot || !msg.content.startsWith(prefix)) return;

  const args = msg.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (command === 'searchbook') {
    const query = args.join(' ');
    if (!query) {
      msg.reply('Please provide a search query (e.g., `!searchbook The Hobbit`).');
      return;
    }

    const books = await searchBooks(query);

    if (books.length === 0) {
      msg.reply('No books found for your query.');
      return;
    }

    const options = books.map((book, index) => ({
      label: book.title.substring(0, 100), // Max 100 chars for label
      description: (book.author_name ? book.author_name.join(', ') : 'Unknown Author').substring(0, 100), // Max 100 chars
      value: index.toString(), // Use the array index as a simple unique value
    }));

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('select_book')
      .setPlaceholder('Select a book to see details')
      .addOptions(options);

    const row = new ActionRowBuilder().addComponents(selectMenu);

    const selectionMessage = await msg.reply({ content: 'Please select a book from the list below:', components: [row] });

    // --- Collector for the selection menu ---
    const selectionCollector = selectionMessage.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      time: 60000, // 60 seconds to choose
    });

    selectionCollector.on('collect', async (i) => {
      if (i.user.id !== msg.author.id) {
        await i.reply({ content: 'This menu is not for you.', ephemeral: true });
        return;
      }

      const selectedBookIndex = parseInt(i.values[0], 10);
      const book = books[selectedBookIndex];

      const embed = new EmbedBuilder()
        .setTitle(book.title)
        .setURL(book.key ? `https://openlibrary.org${book.key}` : null)
        .setAuthor({ name: book.author_name ? book.author_name.join(', ') : 'Unknown Author' })
        .setImage(book.cover_i ? `http://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg` : null)
        .setDescription(book.first_sentence ? book.first_sentence.join(' ') : 'No description available.')
        .setFooter({ text: book.isbn ? `ISBN: ${book.isbn[0]}` : 'No ISBN found' });

      const addOrCancelRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('add_book').setLabel('Add to Readarr').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('cancel').setLabel('Cancel').setStyle(ButtonStyle.Secondary)
      );

      // Update the message to show the selected book and the add button
      await i.update({ content: 'Is this the book you want to add?', embeds: [embed], components: [addOrCancelRow] });

      // --- Collector for the Add/Cancel buttons ---
      const buttonCollector = selectionMessage.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 60000,
      });

      buttonCollector.on('collect', async (buttonInteraction) => {
        if (buttonInteraction.user.id !== msg.author.id) {
          await buttonInteraction.reply({ content: 'These buttons are not for you.', ephemeral: true });
          return;
        }

        // Stop both collectors once a button is pressed
        selectionCollector.stop();
        buttonCollector.stop();

        if (buttonInteraction.customId === 'add_book') {
          await buttonInteraction.deferUpdate();
          const result = await addBook(book);
          if (result) {
            await buttonInteraction.editReply({ content: `Successfully added *${book.title}* to Readarr.`, embeds: [], components: [] });
          } else {
            await buttonInteraction.editReply({ content: `Failed to add *${book.title}* to Readarr. Check console for details.`, embeds: [], components: [] });
          }
        } else if (buttonInteraction.customId === 'cancel') {
          await buttonInteraction.update({ content: 'Search cancelled.', embeds: [], components: [] });
        }
      });
    });

    selectionCollector.on('end', (collected, reason) => {
      if (reason === 'time') {
        selectionMessage.edit({ content: 'Search timed out.', components: [] });
      }
    });
  }
});

client.login(process.env.DISCORD_TOKEN);