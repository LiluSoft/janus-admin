import * as janus from "../src/index_browser";
import $ = require("jquery");
import { BrowserLoggerFactory } from "../src/index_browser";

const loggerFactory = new BrowserLoggerFactory();

$("#b").click(() => {
	const transport = new janus.HTTPBrowserTransport(loggerFactory, "hello", "test", true);
	const client = new janus.JanusClient(loggerFactory, transport, "token");
});