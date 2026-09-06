const express = require('express');
const { makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');

const app = express();
app.use(express.json());

let sock;

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    sock = makeWASocket({ auth: state, printQRInTerminal: true });

    sock.ev.on('creds.update', saveCreds);
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) connectToWhatsApp();
        } else if (connection === 'open') {
            console.log('✅ WhatsApp Connected Successfully!');
        }
    });
}

connectToWhatsApp();

app.post('/send-msg', async (req, res) => {
    try {
        const { phone, message } = req.body;
        const formattedPhone = phone.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
        await sock.sendMessage(formattedPhone, { text: message });
        res.status(200).json({ success: true, message: 'Sent' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
