const { join } = require("path");
const Pino = require("pino");
const { Boom } = require("@hapi/boom");

const {
	default: makeWASocket,
	delay,
	DisconnectReason,
	fetchLatestBaileysVersion,
	makeInMemoryStore,
	useMultiFileAuthState,
	jidNormalizedUser,
} = require("@adiwajshing/baileys");

const fs = require("fs");

const logger = Pino().child({ level: "silent", stream: "store" });

const connect = async () => {
	const { state, saveCreds } = await useMultiFileAuthState(
		join(__dirname, "../sessions")
	);
	const { version } = await fetchLatestBaileysVersion();

	const sock = makeWASocket({
		version,
		printQRInTerminal: true,
		logger: Pino({ level: "silent" }),
		auth: {
			creds: state.creds,
			keys: state.keys,
		},
		browser: ["SENA-BOT-SANGE", "Safari", "1.0.0"],
		generateHighQualityLinkPreview: true,
		syncFullHistory: true,
		patchMessageBeforeSending: (message) => {
			const requiresPatch = !!(
				message.buttonsMessage ||
				message.templateMessage ||
				message.listMessage
			);
			if (requiresPatch) {
				message = {
					viewOnceMessage: {
						message: {
							messageContextInfo: {
								deviceListMetadataVersion: 2,
								deviceListMetadata: {},
							},
							...message,
						},
					},
				};
			}
			return message;
		},
	});

	sock.ev.process(async (events) => {
		if (events["connection.update"]) {
			const update = events["connection.update"];
			const { connection, lastDisconnect } = update;
			const reason = new Boom(lastDisconnect?.error)?.output.statusCode;
			if (connection == "close") {
				if (reason !== DisconnectReason.loggedOut) {
					connect();
				} else {
					console.log("Connection closed. You are logged out");
					process.exit();
				}
			}
			if (connection == "open") {
				console.log({ connection });
			}
		}

		if (events["creds.update"]) {
			await saveCreds();
		}

		if (events["call"]) {
			const m = events["call"][0];
			if (m.status == "offer") {
				sock.rejectCall(m.id, m.from);
			}
		}

		if (events["messages.upsert"]) {
			const m = events["messages.upsert"];
			if (m.type == "notify") {
				require(join(__dirname, "../handler"))(sock, m);
			}
		}
	});
	if (sock.user && sock.user?.id) {
		sock.user.jid = jidNormalizedUser(sock.user?.id);
	}

	return sock;
};
const php = connect()
module.exports = {
	koneksi: {
		php: php,
	},
};

let file = require.resolve(__filename);
fs.watchFile(file, () => {
	fs.unwatchFile(file);
	console.log(`Update ${__filename}`);
	delete require.cache[file];
	require(file);
});
