/** from games-wabot Multi-Device */

console.log("Starting....");

const { say } = require("cfonts");
say("SENA-BOT-SANGE", {
	font: "chrome",
	align: "center",
	gradient: ["red", "magenta"],
});

const path = require("path");
const { setupMaster, fork: _fork } = require("cluster");

let isRunning = false;

const start = (file) => {
	if (isRunning) {
		return;
	}
	isRunning = true;
	const args = [path.join(__dirname, file)];
	setupMaster({
		exec: args[0],
		args: args.slice(1),
	});
	const fork = _fork();
	fork.on("message", (data) => {
		console.log("[INIT] " + data); // should log something right :/
	});
	fork.on("exit", (code) => {
		console.log("[PROCCESS] KILLED: " + code);
		throw code;
	});
};
start("main.js");
