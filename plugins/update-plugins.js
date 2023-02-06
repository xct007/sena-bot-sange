const axios = require("axios");

let handler = async (m, { conn, command, text, usedPrefix }) => {
	m.reply("Udating...");
};
handler.help = ["plugin <url>"];
handler.tags = ["owner"];
handler.command = ["plugin"];

module.exports = handler;
