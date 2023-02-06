let handler = async (m, { conn, isAdmin, isGroup, isOwner, mess }) => {
	conn.sendMessage(m.chat, { text: "this just a test" }, { quoted: m });
};
handler.group = true;
handler.command = ["test", "testing"];
module.exports = handler;
