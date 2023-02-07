/** bring this code from https://github.com/Nurutomo/wabot-aq/blob/master/main.js */
/** and code from games-wabot */

const { watchFile, unwatchFile } = require("fs");
const chalk = require("chalk");
const axios = require("axios");
const { format } = require("util");

const { serialize } = require("./lib/serialize");
const { plugins } = require("./lib/plugins.js");
const { owner, wm, languages } = require("./config.js");
const { database: db, loadDatabase } = require("./lib/database.js");
const { structure } = require("./lib/structure.js");

const langCode = require("./lib/languages-code.json");

// TODO: you know.
const prefix = new RegExp(
	"^[" +
		"‎xzXZ/i!#$%+£¢€¥^°=¶∆×÷π√✓©®:;?&.\\-".replace(
			/[|\\{}()[\]^$+*?.\-\^]/g,
			"\\$&"
		) +
		"]"
);

module.exports = handler = async (sock, m) => {
	if (!m) return;
	if (db.data == null) await loadDatabase();
	m = serialize(JSON.parse(JSON.stringify(m.messages[0])), sock);
	try {
		m.exp = 0;
		m.limit = false;
		/** Its Probably the correct way to insert data using loop @link {./lib/structure.js} */
		structure(sock, m);

		let { body } = m;

		for (const name in plugins) {
			const plugin = plugins[name];
			if (!plugin) {
				continue;
			}
			if (plugin.disabled) {
				continue;
			}
			if (!plugin.all) {
				continue;
			}
			if (typeof plugin.all !== "function") {
				continue;
			}
			try {
				await plugin.all.call(sock, m);
			} catch (e) {
				if (typeof e === "string") {
					continue;
				}
				console.error(e);
			}
		}
		let usedPrefix;
		const { pushName, isGroup, sender, chat } = m;
		const groupMetadata = isGroup ? await sock.groupMetadata(chat) : "";
		const gcName = isGroup ? groupMetadata.subject : "";
		const participants = isGroup ? groupMetadata.participants : [] || [];

		const name = pushName === undefined ? sender.split("@")[0] : pushName;
		const user = isGroup ? participants.find((v) => v.jid == sender) : {};
		const bot = isGroup ? participants.find((v) => v.jid == sock.user.jid) : {};

		const isROwner = [sock.user.jid, ...owner.map(([number]) => number)]
			.map((v) => v?.replace(/[^0-9]/g, "") + "@s.whatsapp.net")
			.includes(m.sender);
		const isOwner = isROwner;
		const isAdmin =
			user?.admin ||
			user?.admin == "admin" ||
			user?.admin == "superadmin" ||
			false;
		const isBotAdmin = bot?.admin || false;
		const isBlocked = sock.blocklist
			? sock.blocklist
					.map((v) => v.replace(/[^0-9]/g, "") + "@s.whatsapp.net")
					.filter((v) => v != sock.user.jid)
					.includes(sender)
			: false;
		const { mess } = await languages(db.data.users[m.sender].language);
		for (const name in plugins) {
			const plugin = plugins[name];
			if (!plugin) {
				continue;
			}
			if (plugin.disabled) {
				continue;
			}

			const str2Regex = (str) => str.replace(/[|\\{}()[\]^$+*?.]/g, "\\$&");
			const _prefix = plugin.customPrefix ? plugin.customPrefix : prefix;
			let match = (
				_prefix instanceof RegExp // RegExp Mode?
					? [[_prefix.exec(body), _prefix]]
					: Array.isArray(_prefix) // Array?
					? _prefix.map((p) => {
							let re =
								p instanceof RegExp // RegExp in Array?
									? p
									: new RegExp(str2Regex(p));
							return [re.exec(body), re];
					  })
					: typeof _prefix === "string" // String?
					? [
							[
								new RegExp(str2Regex(_prefix)).exec(body),
								new RegExp(str2Regex(_prefix)),
							],
					  ]
					: [[[], new RegExp()]]
			).find((p) => p[1]);
			if (typeof plugin.before === "function") {
				if (
					await plugin.before.call(sock, m, {
						match,
						conn: sock,
						participants,
						user,
						bot,
						isAdmin,
						isBotAdmin,
						isBlocked,
					})
				)
					continue;
			}
			if (typeof plugin !== "function") {
				continue;
			}
			if ((usedPrefix = (match[0] || "")[0])) {
				let noPrefix = body.replace(usedPrefix, "");
				let [command, ...args] = noPrefix.trim().split` `.filter((v) => v);
				args = args || [];
				let _args = noPrefix.trim().split` `.slice(1);
				let text = _args.join` `;
				command = (command || "").toLowerCase();
				let fail = plugin.fail || "";
				let isAccept =
					plugin.command instanceof RegExp
						? plugin.command.test(command)
						: Array.isArray(plugin.command)
						? plugin.command.some((cmd) =>
								cmd instanceof RegExp ? cmd.test(command) : cmd === command
						  )
						: typeof plugin.command === "string"
						? plugin.command === command
						: false;
				if (!isAccept) {
					continue;
				}
				m.plugin = name;

				if (plugin.rowner && plugin.owner && !(isROwner || isOwner)) {
					m.reply(mess.rowner);
					continue;
				}
				if (plugin.rowner && !isROwner) {
					m.reply(mess.owner);
					continue;
				}
				if (plugin.group && !isGroup) {
					m.reply(mess.group);
					continue;
				} else if (plugin.botAdmin && isBotAdmin) {
					m.reply(mess.botAdmin);
					continue;
				} else if (plugin.admin && !isAdmin) {
					m.reply(mess.admin);
					continue;
				}
				if (plugin.private && isGroup) {
					m.reply(mess.private);
					continue;
				}

				m.isCommand = true;

				const extra = {
					match,
					usedPrefix,
					noPrefix,
					args,
					command,
					text,
					conn: sock,
					participants,
					groupMetadata,
					user,
					bot,
					isAdmin,
					isOwner,
					isBotAdmin,
					isBlocked,
					mess,
					langCode,
					__dirname,
				};
				try {
					await plugin.call(sock, m, extra);
				} catch (e) {
					m.error = e;
					console.log(e);
					if (e) {
						let text = format(e.message ? e.message : e);
						/** @note not realy need it right now.
						for (const key of Object.values(APIKeys)) {
							text = text.replace(new RegExp(key, "g"), "#HIDEN#")
						}
						for (const [jid] of owner.filter(
							([number, _, isDeveloper]) => isDeveloper && number
						)) {
							const data = (await sock.onWhatsApp(jid))[0] || {};
							if (data && data.exists) {
								sock.sendMessage(
									jid,
									{
										text: `*Plugin:* ${m.plugin}\n*Sender:* ${
											m.sender
										}\n*Chat:* ${
											m.chat
										}\n*Command:* ${usedPrefix}${command} ${args.join(
											" "
										)}\n\n\`\`\`${text}\`\`\``.trim(),
									},
									{ quoted: m }
								);
							}
						}
						*/
						console.log(text);
					}
				} finally {
					if (typeof plugin.after === "function") {
						try {
							await plugin.after.call(sock, m, extra);
						} catch (e) {
							console.error(e);
						}
					}
				}
				break;
			}
		}
	} finally {
		// from wabot-aq/games-wabot
		let user,
			stats = db.data.stats;
		if (m) {
			if (m.sender && (user = db.data.users[m.sender])) {
				Object.assign(user, {
					exp: +m.exp,
					limit: -m.limit * 1,
				});
			}

			let stat;
			if (m.plugin) {
				let now = +new Date();
				if (m.plugin in stats) {
					const isNumber = (x) => typeof x === "number" && !isNaN(x);
					stat = stats[m.plugin];
					if (!isNumber(stat.total)) {
						stat.total = 1;
					}
					if (!isNumber(stat.success)) {
						stat.success = m.error != null ? 0 : 1;
					}
					if (!isNumber(stat.last)) {
						stat.last = now;
					}
					if (!isNumber(stat.lastSuccess)) {
						stat.lastSuccess = m.error != null ? 0 : now;
					}
				} else
					stat = stats[m.plugin] = {
						total: 1,
						success: m.error != null ? 0 : 1,
						last: now,
						lastSuccess: m.error != null ? 0 : now,
					};
				stat.total += 1;
				stat.last = now;
				if (m.error == null) {
					stat.success += 1;
					stat.lastSuccess = now;
				}
			}
			// console.log(m);
		}
	}
};

const file = require.resolve(__filename);
watchFile(file, () => {
	unwatchFile(file);
	console.log(chalk.green("[UPDATED]", chalk.white(__filename)));
	delete require.cache[file];
	require(file);
});
