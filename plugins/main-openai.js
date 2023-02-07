const axios = require("axios");
const { database: db } = require("../lib/database.js");

// TODO: move the conversation to database and delete it after one day.
// TODO: can we make this code more simple and readble ?
let handler = async (m, { conn, isAdmin, isGroup, isOwner, mess, text }) => {
	conn.openai = conn.openai ? conn.openai : {};
	if (!text) {
		return m.reply("No text.");
	}
	conn.openai[m.sender] = conn.openai[m.sender]
		? conn.openai[m.sender]
		: { prompt: "", context: { YOU: "", AI: "" } };
	let user = conn.openai[m.sender];
	if (!user.context.YOU || !user.context.YOU.length) {
		Object.assign(user.context, {
			YOU: text,
		});
	}
	let prompt = "";
	Object.entries(user.context).forEach(([key, value]) => {
		prompt += `${key}: ${value}\n`;
	});
	const { data: response } = await axios
		.get("https://api.itsrose.my.id/chatGPT/free", {
			params: {
				prompt: user.prompt ? user.prompt + prompt : prompt,
			},
		})
		.catch((e) => (e === null || e === void 0 ? void 0 : e.response));
	if (!response.status || !response.message) {
		return m.reply("Request to api fail");
	}
	m.reply(response.message);
	Object.assign(user, {
		context: {
			YOU: text,
			AI: response.message,
		},
	});
	let _prompt = "";
	Object.entries(user.context).forEach(([key, value]) => {
		_prompt += `${key}: ${value}\n`;
	});

	Object.assign(user, {
		prompt: user.prompt + _prompt,
		context: {
			YOU: "",
			AI: "",
		},
	});
};
handler.command = ["ai", "openai", "rose"];
module.exports = handler;
