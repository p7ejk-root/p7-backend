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

// ضع توكن البوت هنا بين علامتي التنصيص في سطر واحد فقط دون نزول لأسطر جديدة
const TOKEN = MTU0ODU1NDgwMzc0NjA1NDE2NQ.GndIhs.8U0CtQaMXqHn21_uhk06UdwXNuH0D5dpwSTxtk 

// آي دي السيرفر الخاص بك
const GUILD_ID = '1095578118963486444';

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