const { spawn } = require("child_process");
const { format } = require("util");

let handler = async (m, { conn }) => {
	const q = m.quoted ? m.quoted : m;
	const mime = (q.message || q).mimetype || q.mtype || q.type || "";
	if (/sticker/i.test(mime)) {
		const buffer = await q.download();
		const chunks = [];

		const _meki = spawn("gm", [
			"convert",
			"webp:-",
			"png:-"
		]);
		_meki.on("error", () => {
			m.reply("Gagal convert media!")
		});
		_meki.stdout.on("data", (chunk) => {
			chunks.push(chunk)
		})
		_meki.stdin.write(buffer);
		_meki.stdin.end();
		_meki.on("exit", () => {
			conn.sendMessage(m.chat, {
				image: Buffer.concat(chunks),
				caption: "Converted :)"
			}, { quoted: m })
		})
	}
}
handler.command = ["toimg"];
handler.help = ["toimg"];
handler.tags = ["sticker"];
module.exports = handler;
