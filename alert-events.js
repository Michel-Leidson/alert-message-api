const axios = require('axios');
const config = require('./config.json');

const DISCORD_URL_WEBHOOK = config.discord.url;
const SLACK_URL_WEBHOOK = config.slack.url;
const SLACK_CHANNEL = config.slack.channel;
const NOTIFY_COLOR_MESSAGE = 12263456;

const api = axios.create()

async function sendDiscordMessage(message) {
    const { status, alerts } = message;
    let embeds = [];

    if (typeof alerts !== 'undefined') {

        alerts.map(alert => {
            embeds.push({
                "title": `(${alert.status.toUpperCase()}) ${message.commonLabels.alertname.toUpperCase()}`,
                "description": `${typeof alert.annotations.summary === 'undefined' ? "" : alert.annotations.summary}`,
                "url": `https://telemetry.posbaker.com/grafana/d/${message.commonAnnotations.__dashboardUid__}?orgId=1&refresh=5s&viewPanel=${message.commonAnnotations.__panelId__}`,
                "color": (alert.status == 'firing' ? NOTIFY_COLOR_MESSAGE : 4109717),
            })

        })

    }

    if (typeof alertname !== 'undefined') {
        fields.push({
            "name": "Alertname",
            "value": `${alertname}`
        })
    }


    const json = JSON.stringify({
        "username": "Grafana Alert",
        "embeds": embeds
    })
    console.log("Send notify change Info to Discord:", json)
    await api.post(DISCORD_URL_WEBHOOK, json, {
        headers: {
            'Content-Type': 'application/json'
        }
    }).catch(err => {
        console.log(err);
    })

}

async function sendSlackMessage(message) {

    const { status, alerts } = message;
    let attachments = [];

    if (typeof alerts !== 'undefined') {

        alerts.map(alert => {
            attachments.push({
                "title": `(${alert.status.toUpperCase()}) ${message.commonLabels.alertname.toUpperCase()}`,
                "text": `${typeof alert.annotations.summary === 'undefined' ? "" : alert.annotations.summary}`,
                "title_link": `https://telemetry.posbaker.com/grafana/d/${message.commonAnnotations.__dashboardUid__}?orgId=1&refresh=5s&viewPanel=${message.commonAnnotations.__panelId__}`,
                "color": (alert.status == 'firing' ? '#FA2C23' : "#2DE64F"),
            })

        })

    }

    const json = JSON.stringify({
        "channel": SLACK_CHANNEL,
        "attachments": attachments
    })

    console.log("Send notify change Info to Slack:", json)
    await api.post(SLACK_URL_WEBHOOK, json, {
        headers: {
            'Content-Type': 'application/json'
        }
    }).catch(err => {
        console.log(err);
    })

}

module.exports = {
    sendDiscordMessage,
    sendSlackMessage
}
