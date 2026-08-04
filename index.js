require('dotenv').config();

const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
    ],
});

const TARGET_CHANNEL_ID = process.env.TARGET_CHANNEL_ID;
const TOKEN = process.env.DISCORD_TOKEN;

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}! Monitoring channel ID: ${TARGET_CHANNEL_ID}`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (message.channel.id !== TARGET_CHANNEL_ID) return;

    try {
        const authorId = message.author.id;
        console.log(`Target message detected from user ID: ${authorId}`);

        const member = await message.guild.members.fetch(authorId).catch(() => null);
        
        if (member && member.bannable) {
            await message.guild.members.ban(authorId, { 
                reason: `Sent a message in the restricted channel` 
            });
            console.log(`Successfully banned user ID: ${authorId}`);
        } else {
            console.log(`Could not ban user ${authorId}. Check bot role hierarchy or permissions.`);
        }
      
        const fetchedMessages = await message.channel.messages.fetch({ limit: 100 });
        const userMessages = fetchedMessages.filter(msg => msg.author.id === authorId);

        if (userMessages.size > 0) {
            await message.channel.bulkDelete(userMessages, true);
            console.log(`Deleted ${userMessages.size} messages from user ${authorId}`);
        }

    } catch (error) {
        console.error('An error occurred while processing the automated action:', error);
    }
});

client.login(TOKEN);
