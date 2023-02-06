const { default: cp, exec: _exec } = require("child_process");
const { promisify } = require("util");
let exec = promisify(_exec).bind(cp);
let handler = async (m, { conn, command, text }) => {
	m.reply("Executing...");
	let o;
	try {
		o = await exec(command.trimStart() + " " + text.trimEnd());
	} catch (e) {
		o = e;
	} finally {
		let { stdout, stderr } = o;
		if (stdout.trim()) m.reply(stdout);
		if (stderr.trim()) m.reply(stderr);
	}
};
handler.customPrefix = /^[$] /;
handler.command = new RegExp();
handler.owner = true;
module.exports = handler;
