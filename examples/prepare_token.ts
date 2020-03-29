import { ServerLoggerFactory, WebSocketTransport, JanusAdmin } from "../src/index_server";


(async () => {
	const loggerFactory = new ServerLoggerFactory("info");

	const adminTransport = new WebSocketTransport(loggerFactory, "ws://192.168.99.100:7188", "janus-admin-protocol");
	await adminTransport.waitForReady();
	const admin = new JanusAdmin(adminTransport, "janusoverlord");

	const clientToken = "examples_token";
	await admin.add_token(clientToken);

	await adminTransport.dispose();
})();

