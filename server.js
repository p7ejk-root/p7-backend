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

// يدور على العضو بعدة طرق: اليوزرنيم، الاسم الظاهر (Global Name)، ونك نيم السيرفر
// عشان نظام ديسكورد الجديد للأسماء (بدون أرقام #) صار الناس يستخدمون الاسم الظاهر أكثر من اليوزرنيم
function findMemberByAnyName(guild, username) {
    const target = username.toLowerCase().trim().replace(/^@/, '');
    let member = guild.members.cache.find(m =>
        m.user.username.toLowerCase() === target ||
        (m.user.globalName && m.user.globalName.toLowerCase() === target) ||
        (m.nickname && m.nickname.toLowerCase() === target)
    );
    if (member) return member;

    // مطابقة جزئية احتياطية (لو كتب جزء من الاسم بس)
    return guild.members.cache.find(m =>
        m.user.username.toLowerCase().includes(target) ||
        (m.user.globalName && m.user.globalName.toLowerCase().includes(target)) ||
        (m.nickname && m.nickname.toLowerCase().includes(target))
    );
}

app.post('/api/discord-ban', async (req, res) => {
    const { username, reason } = req.body;
    if (!username) return res.status(400).send({ success: false, message: 'لم يتم إرسال اسم المستخدم' });

    try {
        const guild = await client.guilds.fetch(GUILD_ID);
        await guild.members.fetch(); // يتطلب تفعيل SERVER MEMBERS INTENT من Discord Developer Portal

        let member = findMemberByAnyName(guild, username);

        // احتياط إضافي: لو ما لقاه في الكاش، جرب بحث مباشر عبر API ديسكورد
        if (!member) {
            try {
                const searchResults = await guild.members.search({ query: username, limit: 5 });
                member = searchResults.find(m =>
                    m.user.username.toLowerCase() === username.toLowerCase() ||
                    (m.user.globalName && m.user.globalName.toLowerCase() === username.toLowerCase())
                ) || searchResults.first();
            } catch (searchErr) { /* تجاهل، بنرجع 404 تحت */ }
        }

        if (!member) {
            return res.status(404).send({
                success: false,
                message: 'تعذر العثور على العضو في ديسكورد. تأكد إنك كاتب اليوزرنيم أو الاسم الظاهر بالضبط، وتأكد إن SERVER MEMBERS INTENT مفعّل للبوت من Discord Developer Portal.'
            });
        }

        await member.ban({ reason: reason || 'باند رسمي من الموقع' });
        res.status(200).send({ success: true, message: 'تم بنجاح حظر العضو من الديسكورد' });
    } catch (error) {
        console.error('discord-ban error:', error);
        res.status(500).send({ success: false, error: error.message });
    }
});

// فك الباند: العضو المحظور مو موجود في guild.members (لأنه مطرود)،
// فلازم نجيبه من قائمة المحظورين نفسها (guild.bans) مو من الأعضاء
app.post('/api/discord-unban', async (req, res) => {
    const { username, reason } = req.body;
    if (!username) return res.status(400).send({ success: false, message: 'لم يتم إرسال اسم المستخدم' });

    try {
        const guild = await client.guilds.fetch(GUILD_ID);
        const bans = await guild.bans.fetch();
        const target = username.toLowerCase().trim().replace(/^@/, '');
        const bannedEntry = bans.find(b =>
            b.user.username.toLowerCase() === target ||
            (b.user.globalName && b.user.globalName.toLowerCase() === target)
        ) || bans.find(b =>
            b.user.username.toLowerCase().includes(target) ||
            (b.user.globalName && b.user.globalName.toLowerCase().includes(target))
        );

        if (!bannedEntry) {
            return res.status(404).send({ success: false, message: 'العضو غير موجود في قائمة المحظورين بديسكورد' });
        }

        await guild.members.unban(bannedEntry.user.id, reason || 'فك باند رسمي من الموقع');
        res.status(200).send({ success: true, message: 'تم بنجاح فك حظر العضو من الديسكورد' });
    } catch (error) {
        console.error('discord-unban error:', error);
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
