const { plugins } = require("../lib/plugins.js");

const defaultMenu = {
	header: `├─━━━━━━━━━━━━─
│ %category`,
	body: "│ %cmd ",
	footer: "│",
	after: `╰─━━━━━━━━━━━━─╯`,
};
let handler = (m, { conn, command, usedPrefix: _P, args }) => {
	const Help = Object.values(plugins)
		.filter((p) => !p?.default?.disabled)
		.map((p) => {
			return {
				help: Array.isArray(p?.default?.help)
					? p?.default?.help
					: p?.default?.help
					? [p?.default?.help]
					: "",
				tags: Array.isArray(p?.default?.tags)
					? p?.default?.tags
					: p?.default?.tags
					? [p?.default?.tags]
					: "",
				prefix: p?.default?.customPrefix ? true : false,
				limit: p?.default?.limit,
				premium: p?.default?.premium,
				enabled: !p?.default?.disabled,
			};
		});
	let tags = {};
	Help.forEach((p) => {
		if (p.tags && p.tags.length) {
			Object.assign(tags, {
				[p.tags]: Array.isArray(p.tags)
					? p.tags.map(
							(v) =>
								v.charAt(v.length >= 1 ? 0 : v.length).toUpperCase() +
								v.slice(1)
					  )
					: [p.tags],
			});
		}
	});
	conn.menu = conn.menu ? conn.menu : {};
	let header = conn.header || defaultMenu.header;
	let body = conn.body || defaultMenu.body;
	let footer = conn.footer || defaultMenu.footer;
	let after = conn.after || defaultMenu.after;

	let _text = [
		...Object.keys(tags)
			.sort()
			.map((tag) => {
				return header.replace(
					/%category/g,
					`*${tags[tag]}*` +
						"\n" +
						[
							...Help.filter(
								(menu) => menu.tags && menu.tags.includes(tag) && menu.help
							).map((menu) => {
								return menu.help
									.map((help) => {
										return body
											.replace(/%cmd/g, menu.prefix ? help : "%P" + help)
											.trim();
									})
									.join("\n");
							}),
						].join("\n")
				);
			}),
		after,
	].join("\n");
	let text =
		typeof conn.menu === "string"
			? conn.menu
			: typeof conn.menu === "object"
			? _text
			: "";
	const replace = {
		"%": "%",
		P: _P,
	};
	text = text.replace(
		new RegExp(
			`%(${Object.keys(replace)
				.sort((a, b) => b.length - a.length)
				.join("|")})`,
			"g"
		),
		(_, name) => "" + replace[name]
	);
	conn.sendMessage(
		m.chat,
		{
			text,
			mentions: [m.sender],
		},
		{ quoted: m }
	);
};
handler.help = ["menu", "help"];
handler.tags = ["main"];
handler.command = ["menu", "help"];

module.exports = handler;
