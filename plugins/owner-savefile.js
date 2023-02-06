const fs = require("fs");
const syntaxError = require("syntax-error");
const path = require("path");
const util = require("util");

const _fs = fs.promises;

let handler = async (m, { text, usedPrefix, command, __dirname }) => {
	if (!text)
		throw `
usage: ${usedPrefix}${command} <name file>
example: ${usedPrefix}savefile main.js
${usedPrefix}saveplugin owner
`.trim();
	if (!m.quoted) throw `Reply text you want to save`;
	if (/p(lugin)?/i.test(command)) {
		let filename =
			text.replace(/plugin(s)\//i, "") + (/\.js$/i.test(text) ? "" : ".js");
		const error = syntaxError(m.quoted.text, filename, {
			sourceType: "module",
			allowReturnOutsideFunction: true,
			allowAwaitOutsideFunction: true,
		});
		if (error) throw error;
		const pathFile = path.join(__dirname, "plugins/" + filename);
		// TODO: make confirmation to save if file already exists
		// if (fs.existSync(pathFile, fs.constants.R_OK)) return m.reply(`File ${filename} sudah ada`)
		await _fs.writeFile(pathFile, m.quoted.text);
		m.reply(
			`
Successfully saved to *${filename}*

\`\`\`
${util.format(m.quoted.text)}
\`\`\`
`.trim()
		);
	} else {
		const isJavascript =
			m.quoted.text && !m.quoted.mediaMessage && /\.js/.test(text);
		if (isJavascript) {
			const error = syntaxError(m.quoted.text, text, {
				sourceType: "module",
				allowReturnOutsideFunction: true,
				allowAwaitOutsideFunction: true,
			});
			if (error) throw error;
			await _fs.writeFile(text, m.quoted.text);
			m.reply(
				`
Successfully saved to *${text}*

\`\`\`
${util.format(m.quoted.text)}
\`\`\`
`.trim()
			);
		} else if (m.quoted.mediaMessage) {
			const media = await m.quoted.download();
			await _fs.writeFile(text, media);
			m.reply(
				`
Successfully saved media to *${text}*
`.trim()
			);
		} else {
			throw "Not supported!!";
		}
	}
};
handler.help = ["plugin", "file"].map((v) => `save${v} <name file>`);
handler.tags = ["owner"];
handler.command = /^(save|s)(p(lugin)?|(f(ile)?))$/i;

handler.rowner = true;

module.exports = handler;
