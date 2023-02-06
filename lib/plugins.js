/** bring this code from https://github.com/Nurutomo/wabot-aq/blob/master/main.js @line 171 - 253 */
/** and code from games-wabot */

const { join, resolve } = require("path");
const { readdirSync, existsSync, readFileSync, watch } = require("fs");
const chalk = require("chalk");
const syntaxerror = require("syntax-error");
const { format } = require("util");

const pluginFolder = join(__dirname, "../plugins");
const pluginFilter = (file) => /\.js$/.test(file);

let watcher,
	plugins,
	pluginFolders = [];
watcher = plugins = {};

function filesInit(
	pluginFolder = pluginFolder,
	pluginFilter = pluginFilter,
	conn
) {
	const folder = resolve(pluginFolder);
	if (folder in watcher) return;
	pluginFolders.push(folder);

	readdirSync(folder)
		.filter(pluginFilter)
		.map((filename) => {
			try {
				Object.assign(plugins, {
					[filename]: require(join(pluginFolder, filename)),
				});
			} catch (e) {
				console.log(chalk.red("[PLUGIN-ERROR]", chalk.white(filename)));
				console.log(format(e));
				delete plugins[filename];
			}
		});

	const watching = watch(folder, reload.bind(null, conn, folder, pluginFilter));
	watching.on("close", () => deletePluginFolder(folder, true));
	watcher[folder] = watching;

	return plugins;
}
function deletePluginFolder(folder, isAlreadyClosed = false) {
	const resolved = resolve(folder);
	if (!(resolved in watcher)) return;
	if (!isAlreadyClosed) watcher[resolved].close();
	delete watcher[resolved];
	pluginFolders.splice(pluginFolders.indexOf(resolved), 1);
}
function reload(
	conn,
	pluginFolder = pluginFolder,
	pluginFilter = pluginFilter,
	_ev,
	filename
) {
	if (pluginFilter(filename)) {
		let dir = join(pluginFolder, filename);
		if (filename in plugins) {
			if (existsSync(dir)) {
				console.log(` updated plugin - '${filename}'`);
			} else {
				console.log(`deleted plugin - '${filename}'`);
				delete require.cache[dir]; // solve issue plugin not reload
				return delete plugins[filename];
			}
		} else {
			console.log(`new plugin - '${filename}'`);
		}
		let err = syntaxerror(readFileSync(dir), filename, {
			allowAwaitOutsideFunction: true,
		});
		if (err) {
			console.log(`syntax error while loading '${filename}'\n${format(err)}`);
		} else
			try {
				delete require.cache[dir]; // solve issue plugin not reload
				Object.assign(plugins, {
					[filename]: require(dir),
				});
			} catch (e) {
				console.log(`error require plugin '${filename}\n${format(e)}'`);
			} finally {
				plugins = Object.fromEntries(
					Object.entries(plugins).sort(([a], [b]) => a.localeCompare(b))
				);
			}
	}
}
module.exports = {
	pluginFolder,
	pluginFilter,
	plugins,
	reload,
	filesInit,
	watcher,
};
