const express = require('express');
const { Client, GatewayIntentBits } = require('discord.js');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

// سحب التوكن والآي دي من إعدادات سحابية آمنة
const TOKEN = process.env.TOKEN;
const GUILD_ID = process.env.GUILD_ID;

app.post('/api/discord-ban', async (req, res) => {
    const { username, reason } = req.body;
    try {
        const guild = await client.guilds.fetch(GUILD_ID);
        await guild.members.fetch();
        const member = guild.members.cache.find(m => m.user.username.toLowerCase() === username.toLowerCase());

        if (!member) {
            return res.status(404).send({ success: false, message: 'العضو غير موجود في سيرفر الديسكورد' });
        }

        await member.ban({ reason: reason || 'باند رسمي من الموقع' });
        res.status(200).send({ success: true, message: 'تم بنجاح حظر العضو من الديسكورد' });
    } catch (error) {
        res.status(500).send({ success: false, error: error.message });
    }
});

client.once('ready', () => {
    console.log(`Bot connected as ${client.user.tag}`);
});

client.login(TOKEN);

app.listen(3000, () => {
    console.log('P7 Backend running on port 3000');
});