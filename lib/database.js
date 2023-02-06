/** from games-wabot Multi-Device */
const chalk = require("chalk");
const { Low, JSONFile } = require("./DB_Adapters/lowdb/index.js");
const {
	cloudDBAdapter,
	mongoDB,
	mongoDBV2,
} = require("./DB_Adapters/index.js");
const lodash = require("lodash");

// Not yet.
const databaseUrl = process.env.MONGO_URI || "";

const databaseAdapter = /https?:\/\//.test(databaseUrl)
	? new cloudDBAdapter(databaseUrl)
	: /mongodb(\+srv)?:\/\//i.test(databaseUrl)
	? process.env.mongodbv2
		? new mongoDBV2(databaseUrl)
		: new mongoDB(databaseUrl)
	: new JSONFile(`database.json`);
let database = new Low(databaseAdapter);

loadDatabase();

async function loadDatabase() {
	// If database is processed to be loaded from cloud, wait for it to be done
	if (database._read) await database._read;
	if (database.data !== null) return database.data;
	database._read = database.read().catch(console.error);
	await database._read;
	console.log(chalk.green("- Database loaded -"));
	database.data = {
		users: {},
		chats: {},
		stats: {},
		msgs: {},
		sticker: {},
		settings: {},
		...(database.data || {}),
	};
	database.chain = lodash.chain(database.data);

	return database.data;
}

module.exports = { databaseUrl, databaseAdapter, database, loadDatabase };
/** @type {typeof database & { chain: ReturnType<lodash.chain>, READ: boolean }} */
exports.default = database;
