const express = require('express');
const { sendDiscordMessage, sendSlackMessage } = require('./alert-events');
const cors = require('cors');
const app = express();

try {
    app.use(cors());
    app.use(express.json());

    app.post('/discord', (req, res) => {
        
        sendDiscordMessage(req.body);
        res.status(200).send()
    });

    app.post('/slack', (req, res) => {
        
        sendSlackMessage(req.body);
        res.status(200).send()
    });

    app.listen(5002);
} catch (err) {
    console.log("timestamp=" + new Date().toISOString(), "level=ERROR", err.message);
}

