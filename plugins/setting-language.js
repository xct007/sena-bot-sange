const { default: translate, languages } = require("translate-google");
const { database: db } = require("../lib/database.js");

let handler = async (m, { conn, args, langCode, wm }) => {
	if (!args[0]) {
		const arrCode = Object.keys(langCode).sort().map(String);
		const listMsg = [];
		arrCode.forEach((v) => {
			listMsg.push({
				title: languages[v],
				rowId: "/setlang " + v,
			});
		});
		return await conn.sendMessage(
			m.chat,
			{
				text: "Language change",
				footer: wm,
				title: "Setting",
				buttonText: "Select",
				sections: [
					{
						title: "Language change",
						rows: listMsg,
					},
				],
			},
			{ quoted: m }
		);
	}
	const user = db.data.users[m.sender];
	const isValidLang = languages.isSupported(args[0].toLowerCase());
	if (isValidLang) {
		user.language = args[0].toLowerCase();
		m.reply(`Language set to '${languages[args[0].toLowerCase()]}'`);
	} else {
		return m.reply("Invalid language code!");
	}
};
handler.command = ["setlang", "setlanguage"];
module.exports = handler;
