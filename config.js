/** bit different from games-wabot Multi-Device @link {./config.js} */
const translate = require("translate-google");
const chalk = require("chalk");
const fs = require("fs");

const langCode = require("./lib/languages-code.json");

module.exports = {
	// [ [ number, name, develover? ] ]
	owner: [
		["6282177862043", "David", true],
		["621230498560", "Syntia", false],
	],
	wm: "Powered by https://itsrose.my.id",
	languages: async (code) =>
		new Promise(async (resolve) => {
			// default language is english
			// TODO: paraphrase
			const lang = {
				mess: {
					owner: "This feature only for the owner!",
					rowner: "This feature only for rowner!",
					wait: "Please wait...",
					fail: "Failed to process!",
					group: "This feature can be use in groups only!",
					private: "This feature only for private chat!",
					admin: "This feature only for groups admins!",
					premium: "Only premium users can use this feature!",
					botAdmin: "BOT must be admin of this group, to use this feature!",
					restrict: "This feature is disabled!",
				},
			};
			if (code === "en") {
				resolve(lang);
			} else {
				if (code && translate.languages.isSupported(code)) {
					await translate(lang, { to: code }).then((res) => {
						resolve(res);
					});
				} else {
					resolve(lang);
				}
			}
		}),
};

let file = require.resolve(__filename);
fs.watchFile(file, () => {
	fs.unwatchFile(file);
	console.log(chalk.green("[UPDATED]", chalk.white(__filename)));
	delete require.cache[file];
	require(file);
});
