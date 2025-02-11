import { Client, GatewayIntentBits, TextChannel, Message } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Función para buscar mensajes dentro de un rango de fechas
const fetchMessagesInRange = async (channel: TextChannel, fromDate: Date) => {
    let messages = await channel.messages.fetch({ limit: 100 }); // Obtiene los últimos 100 mensajes
    let filteredMessages: any[] = [];

    messages.forEach((message: Message) => {
        const messageDate = new Date(message.createdTimestamp);
        if (messageDate >= fromDate) {
            const attachments = Array.from(message.attachments.values());

            attachments.forEach((attachment) => {
                const fileType = attachment.url.split('.').pop()?.toLowerCase();
                if (fileType) {
                    let videoExtensions = ['mp4', 'mov', 'avi'];
                    let imageExtensions = ['png', 'jpg', 'jpeg', 'gif'];

                    filteredMessages.push({
                        id: message.id,
                        username: message.author.username,
                        message: message.content,
                        video: videoExtensions.includes(fileType) ? attachment.url : null,
                        imagen: imageExtensions.includes(fileType) ? attachment.url : null,
                    });
                }
            });
        }
    });

    return filteredMessages;
};

const shuffleArray = (array: any[]) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};

// Evento cuando el bot está listo
client.once('ready', async () => {
    console.log(`✅ Bot conectado como ${client.user?.tag}`);
});

// Evento para recibir el comando de búsqueda
client.on('messageCreate', async (message) => {
    if (message.channelId === process.env.DISCORD_CHANNEL_ID && message.content.startsWith('!buscar')) {
        const args = message.content.split(' ');
        if (args.length < 2) {
            message.reply('❌ Debes especificar una fecha en formato YYYY-MM-DD');
            return;
        }

        const fromDate = new Date(args[1]);
        if (isNaN(fromDate.getTime())) {
            message.reply('❌ Fecha inválida. Usa el formato YYYY-MM-DD.');
            return;
        }

        const channel = client.channels.cache.get(process.env.DISCORD_CHANNEL_ID!) as TextChannel;
        if (!channel) {
            console.error('❌ No se pudo acceder al canal.');
            return;
        }

        console.log(`🔍 Buscando mensajes desde ${fromDate.toISOString()}...`);
        let videosYImagenes = await fetchMessagesInRange(channel, fromDate);
        videosYImagenes = shuffleArray(videosYImagenes);

        console.log(`✅ Se encontraron ${videosYImagenes.length} elementos.`);
        message.reply(`🔍 Encontrados ${videosYImagenes.length} elementos. Revisa la app.`);

    }
});

client.login(process.env.DISCORD_BOT_TOKEN);
