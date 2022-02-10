const express = require('express');
const { sendDiscordMessage , sendSlackMessage} = require('./alert-events');
const cors = require('cors');
const app = express();
 
app.use(cors());
app.use(express.json());

app.post('/discord', (req,res)=>{
    console.log(req.body)
    sendDiscordMessage(req.body);
    res.status(200).send()
});

app.post('/slack', (req,res)=>{
    console.log(req)
    sendSlackMessage(req.body);
    res.status(200).send()
});

app.listen(5002);
