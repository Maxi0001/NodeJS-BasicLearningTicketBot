const Discord = require("discord.js");
const fs = require("fs");
const chalk = require("chalk");
const config = require("./config.json");
const client = new Discord.Client();

let token = config.token;
let color = config.color;
let guild = config.guild;
let prefix = config.prefix;
let role = config.support;
let logs = config.logs;

let w = chalk.hex("#FFD800")("[WARNING] ");
let e = chalk.hex("#FF8686")("[ERROR] ");
let s = chalk.hex("#93FF86")("[SUCCESS] ");
let d = chalk.hex("#2273D9")("[INFO] ");
let a = chalk.hex("#6522D9")("[RESPONSE] ");
let regex = new RegExp(/(( |)who'?s?e?m?|( |)how |( |)where |( |)when |( |)why |( |)what |( |)am |( |)are |( |)is |( |)does )/gi);

let values = [];
let question = [];
let answer = [];
let successes = [];
let questionData = [];

let topNumberString = "";
let topPercentInt = 0;

client.on("ready", async () => {
    console.clear();
    console.log(d + "Artificial Intelligence Listening on User " + client.user.tag);
})

client.on("message", async msg => {
    fs.readFile("./Learning/data.json", "utf8", (err, data) => {
        var log = JSON.parse(data);

        let author = msg.author;
        let args = msg.content.split(" ").slice(1);
        let raw = msg.content.split(" ");
        let command = msg.content.split(" ")[0];
        command = command.slice(prefix.length);
        if (msg.channel.type === "dm") return;
        if (msg.guild.id !== guild) return;

        function warning(arg) {
            const embed = new Discord.MessageEmbed()
                .setDescription(":warning: " + arg)
                .setColor(color)
            msg.channel.send(embed);
        };

        function success(arg) {
            const embed = new Discord.MessageEmbed()
                .setDescription(":white_check_mark: " + arg)
                .setColor(color)
            msg.channel.send(embed);
        };

        function embed(arg) {
            const e = new Discord.MessageEmbed()
                .setDescription(arg)
                .setColor(color)
            msg.channel.send(e)
        }

        function embedLog(arg) {
            const e = new Discord.MessageEmbed()
                .setDescription(arg)
                .setColor(color)
            let channel = client.channels.cache.get(logs);
            if (!channel) return console.log(w + "No logs channel found. Could not log success.")
            channel.send(e)
        }

        if (msg.channel.name.startsWith("ticket-")) {
            let support = msg.guild.roles.cache.find(x => x.name === `${role}`);
            if (!support) return console.log(w + "No support role found. Ignoring all messages (Not being trained)")

            if (msg.member.roles.cache.has(support.id)) {
                for (let i in log) {
                    values.push(parseInt(i, 10))
                }
                msg.channel.messages.fetch({
                    limit: 2
                }).then(m => {
                    m.array().forEach(message => {
                        if (message.member.roles.cache.has(support.id)) return;
                        if (message.content.match(regex)) {
                            let newInt = Math.max(...values);
                            message.content.split(" ").forEach(word => {
                                question.push(word);
                            })
                            msg.content.split(" ").forEach(word => {
                                answer.push(word);
                            })
                            log[(newInt + 1).toString()] = {
                                message: question,
                                response: answer,
                                correct: false
                            }
                            const toWrite = JSON.stringify(log, null, 2)
                            fs.writeFileSync('./Learning/data.json', toWrite)
                            question = [];
                            answer = [];
                            values = [];
                            console.log(s + "Received a question with response. Logged to storage.")
                            let channel = client.channels.cache.get(logs);
                            if (!channel) return console.log(w + "No logs channel found. Could not log success.")
                            embedLog("**[SUCCESS]** - Received a question with a staff response. Logged to database.")
                        }
                    });
                    values = []
                })


            } else {
                if (msg.author.id == client.id) return;
                if (msg.content.match(regex)) {
                    msg.content.split(" ").forEach(word => {
                        question.push(word)
                    })

                    for (let i in log) {
                        question.forEach(word => {
                            log[i]["message"].forEach(questionWord => {
                                if (successes.includes(questionWord)) return;
                                questionData.push(questionWord)
                                if (word == questionWord) {
                                    successes.push(questionWord);
                                }
                            })
                        })
                        values.push({
                            [i]: successes.length / log[i]["message"].length
                        })
                        successes = []
                    }

                    values.forEach(v => {
                        for (let i in v) {
                            if (topNumberString == "" || topPercentInt == 0) {
                                topNumberString = i;
                                topPercentInt = v[i]
                            } else if (v[i] > topPercentInt) {
                                topNumberString = i;
                                topPercentInt = v[i]
                            }
                        }
                    })

                    if (topPercentInt >= 0.75) {
                        if (log[topNumberString].correct == true) {
                            msg.channel.send(log[topNumberString].response.join(" "))
                            let channel = client.channels.cache.get(logs);
                            if (channel) {
                                console.log(a + "I responded to message \"" + msg.content + "\" with \"" + log[topNumberString].response.join(" ") + "\" with " + topPercentInt * 100 + "% certainty. (#" + topNumberString + ")")
                                embedLog("**[RESPONDED]** - I responded to message \"" + msg.content + "\" with \"" + log[topNumberString].response.join(" ") + "\" with **" + topPercentInt * 100 + "%** certainty. **(#" + topNumberString + ")**")
                            } else {
                                console.log(w + "No logs channel found. Could not log success.")
                            }
                        } else {
                            let channel = client.channels.cache.get(logs);
                            if (channel) {
                                console.log(a + "I was going to respond to message \"" + msg.content + "\" with \"" + log[topNumberString].response.join(" ") + "\" with " + topPercentInt * 100 + "% certainty. (#" + topNumberString + ")")
                                embedLog("**[AWAIT RESPONSE]** - I was going to respond to message \"" + msg.content + "\" with \"" + log[topNumberString].response.join(" ") + "\" with **" + topPercentInt * 100 + "%** certainty. **(#" + topNumberString + ")**")
                            } else {
                                console.log(w + "No logs channel found. Could not log success.")
                            }
                        }

                        topPercentInt = 0
                        topNumberString = ""
                    } else {
                        let channel = client.channels.cache.get(logs);
                        if (channel) {
                            embedLog("**[NO RESPONSE]** - I Ignored message \"" + msg.content + "\" because it only had **" + topPercentInt * 100 + "%** certainty.")
                        } else {
                            console.log(w + "No logs channel found. Could not log success.")
                        }
                        topPercentInt = 0
                        topNumberString = ""
                    }

                    values = []
                    question = []
                }
            }
        }

        if (command == "confirm") {
            if (!msg.member.hasPermission("ADMINISTRATOR")) return warning("You must have **ADMINISTRATOR** permissions to use this command.");
            if (!args[0]) return warning("Specify a number.");
            if (!log[args[0]]) return warning("Invalid data number");
            log[args[0]].correct = true;
            const toWrite = JSON.stringify(log, null, 2)
            fs.writeFileSync('./Learning/data.json', toWrite)
            success("Confirmed response as successful.")

        } else if (command == "deny") {
            if (!msg.member.hasPermission("ADMINISTRATOR")) return warning("You must have **ADMINISTRATOR** permissions to use this command.");
            if (!args[0]) return warning("Specify a number.");
            if (!log[args[0]]) return warning("Invalid data number");
            delete log[args[0]];
            const toWrite = JSON.stringify(log, null, 2)
            fs.writeFileSync('./Learning/data.json', toWrite)
            success("Deleted response as invalid.")

        }
    })
})

client.login(token)