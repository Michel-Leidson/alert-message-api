const axios = require('axios');
const config = require('./config.json');

const DISCORD_URL_WEBHOOK = config.discord.url;
const SLACK_URL_WEBHOOK = config.slack.url;
const SLACK_CHANNEL = config.slack.channel;
const NOTIFY_COLOR_MESSAGE = 12263456;

const api = axios.create()


function formatStringValue(string_value_text) {
    const array_key_values = string_value_text.split(" ");
    array_key_values.splice(0, 1);
    array_key_values.splice(array_key_values.length - 1, 1)
    let array_sanitize = array_key_values.filter(value => {
        const raw_text = value.replaceAll(",", "").replaceAll("{", "").replaceAll("}", "").replaceAll("'", "");
        const splited_text = raw_text.split("=");
        if(splited_text[0]==="value"){
            return true
        }
    })
    array_sanitize = array_sanitize.map(value => {
        const raw_text = value.replaceAll(",", "").replaceAll("{", "").replaceAll("}", "").replaceAll("'", "");
        const splited_text = raw_text.split("=");
        return `"${splited_text[0]}":"${splited_text[1]}"`
        
    })
    const message_test = "{" + array_sanitize.join() + "}";
    const parsed_test = JSON.parse(message_test);
    return parsed_test;
}

function appendAdditionDescription(value_string, low_condition, high_condition){
    if (typeof value_string !== 'undefined' && typeof low_condition !== 'undefined' && typeof high_condition !== 'undefined') {
            
        const parsed_test = formatStringValue(value_string);
        console.log(parsed_test)
        let metric_value = parseFloat(parsed_test.value);
        console.log(metric_value)

        const high_limit = parseFloat(high_condition);
        const low_limit = parseFloat(low_condition);

        if (metric_value > high_limit) {
            console.log("HIGH CONDITION")
            return "HIGH"
        }
        if (metric_value < low_limit) {
            console.log("LOW CONDITION")
            return "LOW"
        }
        return ""
    }else{
        return ""
    }
}

async function sendDiscordMessage(message) {
    const { status, alerts, commonAnnotations, commonLabels } = message;
    let embeds = [];

    if (typeof alerts !== 'undefined') {

        const { __value_string__ } = commonAnnotations;
        const { low_condition, high_condition } = commonLabels;
        let aditional_text = appendAdditionDescription(__value_string__,low_condition,high_condition);

        alerts.map(alert => {
            embeds.push({
                "title": `(${alert.status.toUpperCase()}) ${message.commonLabels.alertname.toUpperCase()} ${aditional_text}`,
                "description": `${typeof alert.annotations.summary === 'undefined' ? "" : alert.annotations.summary}\n[Silence Alert](https://telemetry.posbaker.com/alertmanager/#/alerts)`,
                "url": `https://telemetry.posbaker.com/grafana/d/${message.commonAnnotations.__dashboardUid__}?orgId=1&refresh=5s&viewPanel=${message.commonAnnotations.__panelId__}`,
                "color": (alert.status == 'firing' ? NOTIFY_COLOR_MESSAGE : 4109717)
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

    const { status, alerts, commonAnnotations, commonLabels } = message;
    let attachments = [];

    if (typeof alerts !== 'undefined') {

        const { __value_string__ } = commonAnnotations;
        const { low_condition, high_condition } = commonLabels;
        let aditional_text = appendAdditionDescription(__value_string__,low_condition,high_condition);

        alerts.map(alert => {
            attachments.push({
                "title": `(${alert.status.toUpperCase()}) ${message.commonLabels.alertname.toUpperCase()} ${aditional_text}`,
                "text": `${typeof alert.annotations.summary === 'undefined' ? "" : alert.annotations.summary}`,
                "title_link": `https://telemetry.posbaker.com/grafana/d/${message.commonAnnotations.__dashboardUid__}?orgId=1&refresh=5s&viewPanel=${message.commonAnnotations.__panelId__}`,
                "color": (alert.status == 'firing' ? '#FA2C23' : "#2DE64F")

            })

        })

    }

    const json = JSON.stringify({
        "channel": SLACK_CHANNEL,
        "attachments": attachments,
        "blocks": [
            {
                "type": "actions",
                "elements": [
                    {
                        "type": "button",
                        "text": {
                            "type": "plain_text",
                            "text": "Silence Alert",
                            "emoji": true
                        },
                        "value": "click_me_123",
                        "url": "https://telemetry.posbaker.com/alertmanager/#/alerts"
                    }
                ]
            }
        ]
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
