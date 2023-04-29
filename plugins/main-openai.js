const axios = require("axios");
const { database: db } = require("../lib/database.js");

const defaults_ = {
	// Same as openai API turbo
	// you can set role for OpenAI
	// for more information you can visit official opanai docs
	system: "You are help AI assistant, your name is sena.",
	// your openai apikey
	apikey: "sk-YOUR-APIKEY",
	// max_tokens
	max_tokens: 500,
	// model
	model: "gpt-3.5-turbo"
}
const createRequest = async(messages) => {
	const { data } = await axios.request({
		baseURL: "https://api.openapi.com",
		url: "/v1/chat/completions",
		headers: {
			["Authorization"]: "Bearer " + defaults_["apikey"],
			["Content-Type"]: "application/json"
		},
		data: {
			max_tokens: defaults_["max_tokens"],
			model: defaults_["model"],
			// this is a chat conversation
			messages
		}
	}).catch((e) => e === null || e === void 0 ? void 0 : e.response);
	if (data.error) {
		return {
			error: true,
		}
	}
	return {
		messages: {
			role: "assistant",
			content: data.choices[0]["message"]["content"]
		}
	}
}

let handler = async (m, { conn, isAdmin, isGroup, isOwner, mess, text }) => {
	conn.openai = conn.openai ? conn.openai : {};
	if (!text) {
		return m.reply("No text.");
	}
	/**
	 * @warning HIGH-MEMORY-USAGE for large chat
	 * create stored variable in memory
	 * stored chat conversation in memory.
	 */
	conn.waitInQueue = conn.waitInQueu ? conn.waitInQueu : {}
	conn.openai[m.sender] = conn.openai[m.sender]
		? conn.openai[m.sender]
		: [
			{
				role: "system",
				content: defaults_["system"]
			}
		];
	const storedChat = conn.openai[m.sender]
	const { error, messages } = await createRequest([
		...storedChat,
		{
			role: "user",
			content: text
		}
	]);
	if (error) {
		// delete stored chat if API error to avoid unnecesary BUG;
		delete conn.openai[m.sender]
	} else {
		// push AI response to stored data;
		storedChat.push({
			role: "user",
			content: text
		},
		{
			...messages
		})
	}
	m.reply(messages["content"])
};
handler.command = ["ai", "openai", "rose"];
module.exports = handler;
