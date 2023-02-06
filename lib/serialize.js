const {
	proto,
	getContentType,
	jidDecode,
	downloadContentFromMessage,
	generateWAMessageFromContent,
	generateForwardMessageContent,
} = require("@adiwajshing/baileys");
const chalk = require("chalk");
const fs = require("fs");

const downloadMedia = (message, pathFile) =>
	new Promise(async (resolve, reject) => {
		const type = Object.keys(message)[0];
		let mimeMap = {
			imageMessage: "image",
			videoMessage: "video",
			stickerMessage: "sticker",
			documentMessage: "document",
			audioMessage: "audio",
		};
		try {
			if (pathFile) {
				const stream = await downloadContentFromMessage(
					message[type],
					mimeMap[type]
				);
				let buffer = Buffer.from([]);
				for await (const chunk of stream) {
					buffer = Buffer.concat([buffer, chunk]);
				}
				await fs.promises.writeFile(pathFile, buffer);
				resolve(pathFile);
			} else {
				const stream = await downloadContentFromMessage(
					message[type],
					mimeMap[type]
				);
				let buffer = Buffer.from([]);
				for await (const chunk of stream) {
					buffer = Buffer.concat([buffer, chunk]);
				}
				resolve(buffer);
			}
		} catch (e) {
			reject(e);
		}
	});
const decodeJid = (jid) => {
	if (/:\d+@/gi.test(jid)) {
		const decode = jidDecode(jid) || {};
		return (
			(decode.user && decode.server && decode.user + "@" + decode.server) ||
			jid
		).trim();
	} else {
		return jid.trim();
	}
};

exports.serialize = (m, sock) => {
	if (m.key) {
		m.id = m.key.id;
		m.fromMe = m.key.fromMe;
		m.isGroup = m.key?.remoteJid.endsWith("@g.us");
		/** Bring some function from games-wabot @link {./lib/simple.js}*/
		m.chat = decodeJid(
			m.key?.remoteJid ||
				(m.key?.remoteJid && m.key?.remoteJid !== "status@broadcast") ||
				""
		);
		m.sender = decodeJid(
			(m.key?.fromMe && m.conn?.user.id) ||
				m.participant ||
				m.key.participant ||
				m.chat ||
				""
		);
	}
	if (m.message) {
		m.type = getContentType(m.message);
		if (m.type === "ephemeralMessage") {
			m.message = m.message[m.type].message;
			const tipe = Object.keys(m.message)[0];
			m.type = tipe;
			if (tipe === "viewOnceMessage") {
				m.message = m.message[m.type].message;
				m.type = getContentType(m.message);
			}
		}
		if (m.type === "viewOnceMessage") {
			m.message = m.message[m.type].message;
			m.type = getContentType(m.message);
		}

		m.mentions = m.message[m.type]?.contextInfo
			? m.message[m.type]?.contextInfo.mentionedJid
			: null;
		try {
			const quoted = m.message[m.type]?.contextInfo;
			if (quoted.quotedMessage["ephemeralMessage"]) {
				const tipe = Object.keys(
					quoted.quotedMessage.ephemeralMessage.message
				)[0];
				if (tipe === "viewOnceMessage") {
					m.quoted = {
						type: "view_once",
						stanzaId: quoted.stanzaId,
						participant: decodeJid(quoted.participant),
						message:
							quoted.quotedMessage.ephemeralMessage.message.viewOnceMessage
								.message,
					};
				} else {
					m.quoted = {
						type: "ephemeral",
						stanzaId: quoted.stanzaId,
						participant: decodeJid(quoted.participant),
						message: quoted.quotedMessage.ephemeralMessage.message,
					};
				}
			} else if (quoted.quotedMessage["viewOnceMessage"]) {
				m.quoted = {
					type: "view_once",
					stanzaId: quoted.stanzaId,
					participant: decodeJid(quoted.participant),
					message: quoted.quotedMessage.viewOnceMessage.message,
				};
			} else {
				m.quoted = {
					type: "normal",
					stanzaId: quoted.stanzaId,
					participant: decodeJid(quoted.participant),
					message: quoted.quotedMessage,
				};
			}
			m.quoted.fromMe = m.quoted.participant === decodeJid(sock.user.id);
			m.quoted.mtype = Object.keys(m.quoted.message).filter(
				(v) => v.includes("Message") || v.includes("conversation")
			)[0];
			m.quoted.text =
				m.quoted.message[m.quoted.mtype]?.text ||
				m.quoted.message[m.quoted.mtype]?.description ||
				m.quoted.message[m.quoted.mtype]?.caption ||
				m.quoted.message[m.quoted.mtype]?.hydratedTemplate
					?.hydratedContentText ||
				m.quoted.message[m.quoted.mtype] ||
				"";
			m.quoted.key = {
				id: m.quoted.stanzaId,
				fromMe: m.quoted.fromMe,
				remoteJid: m.chat,
			};
			m.quoted.delete = () =>
				sock.sendMessage(m.chat, { delete: m.quoted.key });
			m.quoted.download = (pathFile) =>
				downloadMedia(m.quoted.message, pathFile);
			m.quoted.react = (text) =>
				sock.sendMessage(m.chat, { react: { text, key: m.quoted.key } });
		} catch {
			m.quoted = null;
		}
		m.body =
			m.message?.conversation ||
			m.message?.[m.type]?.text ||
			m.message?.[m.type]?.caption ||
			(m.type === "listResponseMessage" &&
				m.message?.[m.type]?.singleSelectReply?.selectedRowId) ||
			(m.type === "buttonsResponseMessage" &&
				m.message?.[m.type]?.selectedButtonId) ||
			(m.type === "templateButtonReplyMessage" &&
				m.message?.[m.type]?.selectedId) ||
			"";
		m.text = m.body;
		m.name = m?.pushName;
		m.reply = (text) => sock.sendMessage(m.chat, { text }, { quoted: m });
		m.download = (pathFile) => downloadMedia(m.message, pathFile);
		m.react = (text) =>
			sock.sendMessage(m.chat, { react: { text, key: m.key } });
	}
	return m;
};
let file = require.resolve(__filename);
fs.watchFile(file, () => {
	fs.unwatchFile(file);
	console.log(chalk.green("[UPDATED]", chalk.white(__filename)));
	delete require.cache[file];
	require(file);
});
