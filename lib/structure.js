const { database: db } = require("./database.js");

exports.structure = (sock, m) => {
	try {
		const structure = {
			user: {
				exp: 0,
				limit: 10,
				lastclaim: 0,
				registered: {
					name: m.name,
					age: -1,
					regTime: -1,
				},
				afk: -1,
				afkReason: "",
				banned: false,
				warn: 0,
				level: 0,
				role: "Beginner",
				level: 0,
				autolevelup: false,
				language: "en",
				openai: {
					prompt: "",
					context: {
						YOU: "",
						AI: "",
					},
				},

				money: 0,
				health: 100,
				potion: 0,
				trash: 0,
				wood: 0,
				string: 0,
				petFood: 0,
				emerald: 0,
				diamond: 0,
				gold: 0,
				iron: 0,

				common: 0,
				uncommon: 0,
				mythic: 0,
				legendary: 0,

				pet: 0,
				horse: 0,
				horseexp: 0,
				horselastfeed: 0,
				cat: 0,
				catexp: 0,
				catlastfeed: 0,
				fox: 0,
				foxexp: 0,
				foxlastfeed: 0,
				dog: 0,
				dogexp: 0,
				doglastfeed: 0,

				armor: 0,
				armordurability: 0,
				pickaxe: 0,
				pickaxedurability: 0,
				fishingrod: 0,
				fishingroddurability: 0,

				lastclaim: 0,
				lastadventure: 0,
				lastfishing: 0,
				lastdungeon: 0,
				lastduel: 0,
				lastmining: 0,
				lasthunt: 0,
				lastweekly: 0,
				lastmonthly: 0,
			},
			chat: {
				isBanned: false,
				welcome: false,
				detect: false,
				sWelcome: "",
				sBye: "",
				sPromote: "",
				sDemote: "",
				delete: true,
				antiLink: false,
				viewonce: false,
				antiToxic: true,
				expired: 0,
			},
			settings: {
				self: false,
				autoread: false,
				restrict: false,
			},
		};
		let user = db.data.users[m.sender];
		if (typeof user !== "object") {
			db.data.users[m.sender] = {};
		}
		/** TODO: Make code more optimize */
		if (user) {
			Object.keys(user).forEach(([key, value]) => {
				if (
					key in structure.user &&
					typeof user[key] === typeof structure.user[key]
				) {
					Object.assign(user, {
						[key]: value,
					});
				}
			});
		} else {
			db.data.users[m.sender] = { ...structure.user };
		}
		if (m.isGroup) {
			let chat = db.data.chats[m.chat];
			if (typeof chat !== "object") {
				db.data.chats[m.chat] = {};
			}
			if (chat) {
				Object.keys(chat).forEach(([key, value]) => {
					if (
						key in structure.chat &&
						typeof chat[key] === typeof structure.chat[key]
					) {
						Object.assign(chat, {
							[key]: value,
						});
					}
				});
			} else {
				db.data.chats[m.chat] = { ...structure.chat };
			}
		}

		let settings = db.data.settings[sock.user.jid];
		if (typeof settings !== "object") {
			db.data.settings[sock.user.jid] = {};
		}
		if (settings) {
			Object.keys(settings).forEach(([key, value]) => {
				if (
					key in structure.settings &&
					typeof settings[key] === typeof structure.settings[key]
				) {
					Object.assign(settings, {
						[key]: value,
					});
				}
			});
		} else {
			db.data.settings[sock.user.jid] = {...structure.settings}
		}
	} catch (e) {
		console.error(e);
	}
};
