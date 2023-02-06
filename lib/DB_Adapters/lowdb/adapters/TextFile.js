/** Little bit funny in here. */
const fs = require("fs");
const Writer = async () => {
	return await (
		await import("steno")
	).Writer;
};

class TextFile {
	constructor(filename) {
		this.filename = filename;
		Writer().then((_Writer) => {
			this.writer = new _Writer(filename);
		});
	}
	async read() {
		let data;
		try {
			data = await fs.promises.readFile(this.filename, "utf-8");
		} catch (e) {
			if (e.code === "ENOENT") {
				return null;
			}
			throw e;
		}
		return data;
	}
	write(str) {
		return this.writer.write(str);
	}
}
module.exports = { TextFile };
