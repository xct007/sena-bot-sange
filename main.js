// process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0"; // not now.

const { spawn } = require("child_process");
const chalk = require("chalk");

const { koneksi } = require("./lib/koneksi.php");
const { database: db, loadDatabase } = require("./lib/database.js");
const {
	plugins,
	filesInit,
	reload,
	pluginFolder,
	pluginFilter,
} = require("./lib/plugins.js");

if (db.data == null) loadDatabase();

filesInit(pluginFolder, pluginFilter, koneksi.php);
console.log(chalk.green("- Plugins loaded -"));
Object.freeze(reload);

setInterval(async () => {
	await Promise.allSettled([
		db.data ? db.write() : Promise.reject("db.data is null"),
	]);
}, 60 * 1000);

// Quick test
const quickTest = async () => {
	const test = await Promise.all(
		[
			spawn("ffmpeg"),
			spawn("ffprobe"),
			spawn("ffmpeg", [
				"-hide_banner",
				"-loglevel",
				"error",
				"-filter_complex",
				"color",
				"-frames:v",
				"1",
				"-f",
				"webp",
				"-",
			]),
			spawn("convert"),
			spawn("magick"),
			spawn("gm"),
			spawn("find", ["--version"]),
		].map((p) => {
			return Promise.race([
				new Promise((resolve) => {
					p.on("close", (code) => {
						resolve(code !== 127);
					});
				}),
				new Promise((resolve) => {
					p.on("error", () => resolve(false));
				}),
			]);
		})
	);
	const [ffmpeg, ffprobe, ffmpegWebp, convert, magick, gm, find] = test;

	// Ignore 1 global variable
	let s = (global.support = {
		ffmpeg,
		ffprobe,
		ffmpegWebp,
		convert,
		magick,
		gm,
		find,
	});
	Object.freeze(global.support);

	if (!s.ffmpeg) {
		console.log(chalk.red("please install ffmpeg on your operating system."));
	}
	if (s.ffmpeg && !s.ffmpegWebp) {
		console.log(
			chalk.red(
				"sticker may not animated without ffmpegWebp installed on your operating system."
			)
		);
	}
	if (!s.convert && !s.magick) {
		console.log(
			chalk.red(
				"sticker may not work without imagemagick if libwebo on ffmpeg doesn't installed on your operating system."
			)
		);
	}
};
quickTest()
	.then(() => {
		console.log(chalk.yellow("- Quick Test Done -"));
	})
	.catch((e) => {
		console.error(e);
	});
