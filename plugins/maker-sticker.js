const { writeExifVid, writeExifImg } = require("../lib/exif.js");

const PACKNAME = "PACKNAME";
const AUTHOR = "AUTHOR";

let handler = async (m, { conn }) => {
	const q = m.quoted ? m.quoted : m;
	const mime = (q.message || q).mimetype || q.mtype || q.type || "";
	if (/webp|image|video/g.test(mime)) {
		const file = await q.download?.();
		let sticker;
		if (/video/g.test(mime)) {
			if ((q.msg || q).seconds > 11) {
				return m.reply("Max 10 second");
			}
			sticker = await writeExifVid(file, {
				packname: PACKNAME,
				author: AUTHOR,
			});
		} else {
			sticker = await writeExifImg(file, {
				packname: PACKNAME,
				author: AUTHOR,
			});
		}
		await conn.sendMessage(
			m.chat,
			{
				sticker: {
					url: sticker,
				},
			},
			{ quoted: m }
		);
	} else {
		m.reply("no image/video");
	}
};
handler.tags = ["sticker"];
handler.help = ["sticker"];
handler.command = ["sticker", "stiker", "s"];
module.exports = handler;
