const syntaxerror = require("syntax-error");
const { format } = require("util");

let handler = async (m, _2) => {
	let { conn, usedPrefix, noPrefix, args, groupMetadata } = _2;
	let _return;
	let _syntax = "";
	let _text = (/^=/.test(usedPrefix) ? "return " : "") + noPrefix;
	try {
		let i = 15;
		let f = {
			exports: {},
		};
		let exec = new (async () => {}).constructor(
			"print",
			"m",
			"handler",
			"require",
			"conn",
			"Array",
			"process",
			"args",
			"groupMetadata",
			"module",
			"exports",
			"argument",
			_text
		);
		_return = await exec.call(
			conn,
			(...args) => {
				if (--i < 1) return;
				console.log(...args);
				return m.reply(format(...args));
			},
			m,
			handler,
			require,
			conn,
			CustomArray,
			process,
			args,
			groupMetadata,
			f,
			f.exports,
			[conn, _2]
		);
	} catch (e) {
		let err = syntaxerror(_text, "Execution Function", {
			allowReturnOutsideFunction: true,
			allowAwaitOutsideFunction: true,
			sourceType: "module",
		});
		if (err) _syntax = "```" + err + "```\n\n";
		_return = e;
	} finally {
		m.reply(_syntax + format(_return));
	}
};
handler.help = ["> ", "=> "];
handler.tags = ["advanced"];
handler.customPrefix = /^=?> /;
handler.command = /(?:)/i;

module.exports = handler;

class CustomArray extends Array {
	constructor(...args) {
		if (typeof args[0] == "number") return super(Math.min(args[0], 10000));
		else return super(...args);
	}
}
