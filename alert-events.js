const axios = require('axios');
const config = require('./config.json');

const DISCORD_URL_WEBHOOK = config.discord.url;
const SLACK_URL_WEBHOOK = config.slack.url;
const GRAFANA_URL = config.grafana.url;
const ALERT_MANAGER_URL = config.alertmanager.url;
const NOTIFY_COLOR_MESSAGE = 12263456;

const api = axios.create()


function formatStringValue(string_value_text) {
    if (string_value_text === '') {
        throw new Error('Content of __value_string__ is empty!!!')
    }
    const array_key_values = string_value_text.split(" ");
    array_key_values.splice(0, 1);
    array_key_values.splice(array_key_values.length - 1, 1)
    let array_sanitize = array_key_values.filter(value => {
        const raw_text = value.replaceAll(",", "").replaceAll("{", "").replaceAll("}", "").replaceAll("'", "");
        const splited_text = raw_text.split("=");
        if (splited_text[0] === "value") {
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

function appendAdditionDescription(value_string, low_condition, high_condition) {
    if (typeof value_string !== 'undefined' && typeof low_condition !== 'undefined' && typeof high_condition !== 'undefined') {

        const parsed_test = formatStringValue(value_string);
        let metric_value = parseFloat(parsed_test.value);

        const high_limit = parseFloat(high_condition);
        const low_limit = parseFloat(low_condition);

        if (metric_value > high_limit) {
            return "HIGH"
        }
        if (metric_value < low_limit) {
            return "LOW"
        }
        return ""
    } else {
        return ""
    }
}

async function sendDiscordMessage(message) {
    try {
        console.log("timestamp=" + new Date().toISOString(), "level=DEBUG", "labels=input-message,discord", "message=" + JSON.stringify(message))
        const { alerts } = message;
        if (typeof alerts !== 'undefined') {
            alerts.map(alert => {
                let embeds = [];
                console.log("timestamp=" + new Date().toISOString(), "level=DEBUG", "labels=alert-content,slack", "message:", alert.status, alert.labels.alertname)

                const { __value_string__ } = alert.annotations;
                const { low_condition, high_condition } = alert.labels;
                let aditional_text = appendAdditionDescription(__value_string__, low_condition, high_condition);

                let { value } = formatStringValue(__value_string__);
                if (typeof value === 'undefined') {
                    throw new Error('Content of __value_string__ is null!!!')
                }
                const embed={
                    "title": `(${alert.status.toUpperCase()}) ${alert.labels.alertname.toUpperCase()} ${aditional_text}`,
                    "description": `Value: ${value === 'undefined' ? "-" : parseFloat(value).toFixed(2)}\n${typeof alert.annotations.summary === 'undefined' ? "" : alert.annotations.summary}\n[Silence Alert](${ALERT_MANAGER_URL}/#/alerts)`,
                    "url": `${GRAFANA_URL}/d/${alert.annotations.__dashboardUid__}?orgId=1&refresh=5s&viewPanel=${alert.annotations.__panelId__}`,
                    "color": (alert.status == 'firing' ? NOTIFY_COLOR_MESSAGE : 4109717)
                }
                const json = JSON.stringify({
                    "username": "Grafana Alert",
                    "embeds": [embed]
                })
                console.log("Send notify change Info to Discord:", json)
                try {
                    api.post(DISCORD_URL_WEBHOOK, json, {
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    })
                } catch (err) {
                    console.log("timestamp=" + new Date().toISOString(), "level=ERROR", "message=" + err.message);
                }
            });

        }

    } catch (err) {
        console.log("timestamp=" + new Date().toISOString(), err.message);
    }

}

async function sendSlackMessage(message) {
    try {
        console.log("timestamp=" + new Date().toISOString(), "level=DEBUG", "labels=input-message,slack", "message=" + JSON.stringify(message))
        const { alerts } = message;
        let attachments = [];

        if (typeof alerts !== 'undefined') {


            alerts.map(alert => {
                console.log("timestamp=" + new Date().toISOString(), "level=DEBUG", "labels=alert-content,slack", "message:", alert.status, alert.labels.alertname)
                const { __value_string__ } = alert.annotations;
                const { low_condition, high_condition } = alert.labels;
                let aditional_text = appendAdditionDescription(__value_string__, low_condition, high_condition);

                let { value } = formatStringValue(__value_string__);
                if (typeof value === 'undefined') {
                    throw new Error('Content of __value_string__ is null!!!')
                }
                attachments.push({
                    "title": `(${alert.status.toUpperCase()}) ${alert.labels.alertname.toUpperCase()} ${aditional_text}`,
                    "text": `Value: ${value === 'undefined' ? "-" : parseFloat(value).toFixed(2)}\n${typeof alert.annotations.summary === 'undefined' ? "" : alert.annotations.summary}`,
                    "title_link": `${GRAFANA_URL}/d/${alert.annotations.__dashboardUid__}?orgId=1&refresh=5s&viewPanel=${alert.annotations.__panelId__}`,
                    "color": (alert.status == 'firing' ? '#FA2C23' : "#2DE64F")

                })


            })

            const json = JSON.stringify({
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
                                "url": `${ALERT_MANAGER_URL}/#/alerts`
                            }
                        ]
                    }
                ]
            })

            console.log("Send notify change Info to Slack:", json)
            try {
                api.post(SLACK_URL_WEBHOOK, json, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                })
            } catch (err) {
                console.log("timestamp=" + new Date().toISOString(), "level=ERROR", "message=" + err.message);
            }

        }

    } catch (err) {
        console.log("timestamp=" + new Date().toISOString(), "level=ERROR", err.message);
    }

}

module.exports = {
    sendDiscordMessage,
    sendSlackMessage
}
