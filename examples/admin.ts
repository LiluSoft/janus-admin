import * as janus from "../src/index_browser";
import "jquery";
import "jquery-blockui";
import { BrowserLoggerFactory, VideoRoomPlugin, WebRTCMediaSource, WebRTCMediaTarget, WebRTCMediaStream, WebRTCPeerConnection, ICandidate, JanusError, JanusSession, IHandleInfo, PluginHandle, IServerInfoPlugin } from "../src/index_browser";
import "toastr";
import "bootbox";
import "spin";
import adapter from "webrtc-adapter";
import { Stream } from "stream";
import { VideoRoomPublisher } from "./videoroom/VideoRoomPublisher";
import { VideoRoomSubscriber } from "./videoroom/VideoRoomSubscriber";
import "bootstrap";

declare const $: JQueryStatic;
declare const toastr: Toastr;
declare const bootbox: BootboxStatic;


//
// This 'server' variable we use to contact the Admin/Monitor backend is
// constructed in this example pretty much as we do in all the demos, so
// refer to the guidelines there with respect to absolute vs. relative
// paths and the like.
//
let server : string;
if (window.location.protocol === "http:")
	server = "http://" + window.location.hostname + ":7088/admin";
else
	server = "https://" + window.location.hostname + ":7889/admin";
// // If you don't want the page to prompt you for a password, insert it here
let secret = "";

const loggerFactory = new BrowserLoggerFactory("trace");
const logger = loggerFactory.create("MAIN", "trace");

const transport = new janus.HTTPTransport(loggerFactory, "http://192.168.99.100:7088/admin", "janusoverlord", true);
transport.waitForReady();
const admin = new janus.JanusAdmin(transport, "janusoverlord");

let session: janus.JanusSession | undefined;		// Selected session
let handle: janus.PluginHandle | undefined;		// Selected handle
let handleInfo: janus.IHandleInfo | undefined;

let plugins :{[plugin_id: string]: janus.IServerInfoPlugin} = {};
let pluginsIndex :string[]= [];
const settings: any = {};

let currentHandle : janus.PluginHandle | undefined;
let localSdp : string | undefined;// RTCSessionDescriptionInit | undefined;
let remoteSdp : string | undefined;// RTCSessionDescriptionInit | undefined;

$(document).ready(() => {
	$("#admintabs a").click(function (e) {
		e.preventDefault();
		$(this).tab("show");
	});
	if (!server)
		server = "";
	if (!secret)
		secret = "";
	if (server !== "" && secret !== "") {
		updateServerInfo();
	} else {
		promptAccessDetails();
	}
});

let prompting = false;
let alerted = false;
function promptAccessDetails() {
	if (prompting)
		return;
	prompting = true;
	const serverPlaceholder = "Insert the address of the Admin API backend";
	const secretPlaceholder = "Insert the Admin API secret";
	bootbox.alert({
		message: "<div class='input-group margin-bottom-sm'>" +
			"	<span class='input-group-addon'><i class='fa fa-cloud-upload fa-fw'></i></span>" +
			"	<input class='form-control' type='text' value='" + server + "' placeholder='" + serverPlaceholder + "' autocomplete='off' id='server'></input>" +
			"</div>" +
			"<div class='input-group margin-bottom-sm'>" +
			"	<span class='input-group-addon'><i class='fa fa-key fa-fw'></i></span>" +
			"	<input class='form-control' type='password'  value='" + secret + "'placeholder='" + secretPlaceholder + "' autocomplete='off' id='secret'></input>" +
			"</div>",
		closeButton: false,
		callback() {
			prompting = false;
			server = $("#server").val() as string;
			secret = $("#secret").val() as string;
			updateServerInfo();
		}
	});
}

// Helper method to create random identifiers (e.g., transaction)
function randomString(len : number) {
	const charSet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	let value = "";
	for (let i = 0; i < len; i++) {
		const randomPoz = Math.floor(Math.random() * charSet.length);
		value += charSet.substring(randomPoz, randomPoz + 1);
	}
	return value;
}

// Server info
async function updateServerInfo() {
	plugins = {};
	pluginsIndex = [];
	let serverInfo: janus.IServerInfoResponse;

	try {
		serverInfo = await admin.info();
	} catch (error) {
		logger.info("Ooops: ", error);
		if (!prompting && !alerted) {
			alerted = true;
			bootbox.alert(error.message, () => {
				promptAccessDetails();
				alerted = false;
			});
		}
		return;

		// logger.error("Error getting Admin info", error);
		// if (!prompting && !alerted) {
		// 	alerted = true;
		// 	bootbox.alert("Couldn't contact the backend: is Janus down, or is the Admin/Monitor interface disabled?", () => {
		// 		promptAccessDetails();
		// 		alerted = false;
		// 	});
		// }

	}

	// if (json["janus"] !== "server_info") {
	// 	logger.info("Ooops: " + json["error"].code + " " + json["error"].reason);	// FIXME
	// 	if (!prompting && !alerted) {
	// 		alerted = true;
	// 		bootbox.alert(json["error"].reason, () => {
	// 			promptAccessDetails();
	// 			alerted = false;
	// 		});
	// 	}
	// 	return;
	// }
	logger.info("Got server info:",serverInfo);
	const pluginsJson = serverInfo.plugins;
	const transportsJson = serverInfo.transports;
	const eventsJson = serverInfo.events;
	// delete json.janus;
	// delete json.transaction;
	// delete json.plugins;
	// delete json.transports;
	// delete json.events;
	$("#server-details").empty();
	for (const k of Object.keys(serverInfo)) {
		if (k === "dependencies") {
			$("#server-deps").html(
				"<tr>" +
				"	<th>Library</th>" +
				"	<th>Version</th>" +
				"</tr>"
			);
			for (const ln of Object.keys(serverInfo[k])) {
				$("#server-deps").append(
					"<tr>" +
					"	<td>" + ln + "</td>" +
					"	<td>" + serverInfo[k][ln] + "</td>" +
					"</tr>"
				);
			}
			continue;
		}
		// @ts-ignore
		const v = serverInfo[k];
		$("#server-details").append(
			"<tr>" +
			"	<td><b>" + k + ":</b></td>" +
			"	<td>" + v + "</td>" +
			"</tr>");
	}
	$("#server-plugins").html(
		"<tr>" +
		"	<th>Name</th>" +
		"	<th>Author</th>" +
		"	<th>Description</th>" +
		"	<th>Version</th>" +
		"</tr>"
	);
	$("#plugins-list").empty();
	for (const p of Object.keys(pluginsJson)) {
		const v = pluginsJson[p];
		plugins = pluginsJson;
		$("#server-plugins").append(
			"<tr>" +
			"	<td>" + v.name + "</td>" +
			"	<td>" + v.author + "</td>" +
			"	<td>" + v.description + "</td>" +
			"	<td>" + v.version_string + "</td>" +
			"</tr>");
		pluginsIndex.push(p);
		$("#plugins-list").append(
			"<a id=\"plugin-" + (pluginsIndex.length - 1) + "\" href=\"#\" class=\"list-group-item\">" + p + "</a>"
		);
		$("#plugin-" + (pluginsIndex.length - 1)).click(function (event) {
			event.preventDefault();
			const pi = parseInt($(this).attr("id")!.split("plugin-")[1]);
			const plugin = pluginsIndex[pi];
			logger.info("Selected plugin:", plugin);
			$("#plugins-list a").removeClass("active");
			$("#plugin-" + pi).addClass("active");
			resetPluginRequest();
		});
	}
	$("#server-transports").html(
		"<tr>" +
		"	<th>Name</th>" +
		"	<th>Author</th>" +
		"	<th>Description</th>" +
		"	<th>Version</th>" +
		"</tr>"
	);
	for (const t of Object.keys(transportsJson)) {
		const v = transportsJson[t];
		$("#server-transports").append(
			"<tr>" +
			"	<td>" + v.name + "</td>" +
			"	<td>" + v.author + "</td>" +
			"	<td>" + v.description + "</td>" +
			"	<td>" + v.version_string + "</td>" +
			"</tr>");
	}
	$("#server-handlers").html(
		"<tr>" +
		"	<th>Name</th>" +
		"	<th>Author</th>" +
		"	<th>Description</th>" +
		"	<th>Version</th>" +
		"</tr>"
	);
	for (const e of Object.keys(eventsJson)) {
		const v = eventsJson[e];
		$("#server-handlers").append(
			"<tr>" +
			"	<td>" + v.name + "</td>" +
			"	<td>" + v.author + "</td>" +
			"	<td>" + v.description + "</td>" +
			"	<td>" + v.version_string + "</td>" +
			"</tr>");
	}
	// Unlock tabs
	$("#admintabs li").removeClass("disabled");
	// Refresh settings now
	updateSettings();
	// Refresh sessions and handles now
	$("#handles").hide();
	$("#info").hide();
	$("#update-sessions").click(updateSessions);
	$("#update-handles").click(updateHandles);
	$("#update-handle").click(async () => {
		await updateHandleInfo();
	});
	updateSessions();
	$("#autorefresh").change((ev) => {
		if ((ev.target as HTMLInputElement).checked) {
			updateHandleInfo(true);
		}
	});
	$("#prettify").change((ev) => {
		if ((ev.target as HTMLInputElement).checked) {
			prettyHandleInfo();
		} else {
			rawHandleInfo();
		}
	});
	$("#capture").change((ev) => {
		if ((ev.target as HTMLInputElement).checked) {
			// We're trying to start a new capture, show a dialog
			$("#capturetext").html("Stop capture");
			captureTrafficPrompt();
		} else {
			// We're trying to stop a capture
			$("#capturetext").html("Start capture");
			// @ts-ignore
			captureTrafficRequest(false, handleInfo["dump-to-text2pcap"] === true);
		}
	});
	// Only check tokens if the mechanism is enabled
	if (!serverInfo["auth_token"]) {
		$("a[href=#tokens]").parent().addClass("disabled");
		$("a[href=#tokens]").attr("href", "#").unbind("click").click((e) => {
			e.preventDefault();
			return false;
		});
	} else {
		updateTokens();
	}

	// $.ajax({
	// 	type: "GET",
	// 	url: server + "/info",
	// 	cache: false,
	// 	contentType: "application/json",
	// 	success(json) {
	// 		if(json["janus"] !== "server_info") {
	// 			logger.info("Ooops: " + json["error"].code + " " + json["error"].reason);	// FIXME
	// 			if(!prompting && !alerted) {
	// 				alerted = true;
	// 				bootbox.alert(json["error"].reason, function() {
	// 					promptAccessDetails();
	// 					alerted = false;
	// 				});
	// 			}
	// 			return;
	// 		}
	// 		logger.info("Got server info:");
	// 		logger.info(json);
	// 		const pluginsJson = json.plugins;
	// 		const transportsJson = json.transports;
	// 		const eventsJson = json.events;
	// 		delete json.janus;
	// 		delete json.transaction;
	// 		delete json.plugins;
	// 		delete json.transports;
	// 		delete json.events;
	// 		$("#server-details").empty();
	// 		for(const k of Object.keys(json)) {
	// 			if(k === "dependencies") {
	// 				$("#server-deps").html(
	// 					"<tr>" +
	// 					"	<th>Library</th>" +
	// 					"	<th>Version</th>" +
	// 					"</tr>"
	// 				);
	// 				for(const ln of Object.keys(json[k])) {
	// 					$("#server-deps").append(
	// 						"<tr>" +
	// 						"	<td>" + ln + "</td>" +
	// 						"	<td>" + json[k][ln] + "</td>" +
	// 						"</tr>"
	// 					);
	// 				}
	// 				continue;
	// 			}
	// 			const v = json[k];
	// 			$("#server-details").append(
	// 				"<tr>" +
	// 				"	<td><b>" + k + ":</b></td>" +
	// 				"	<td>" + v + "</td>" +
	// 				"</tr>");
	// 		}
	// 		$("#server-plugins").html(
	// 			"<tr>" +
	// 			"	<th>Name</th>" +
	// 			"	<th>Author</th>" +
	// 			"	<th>Description</th>" +
	// 			"	<th>Version</th>" +
	// 			"</tr>"
	// 		);
	// 		$("#plugins-list").empty();
	// 		for(const p of Object.keys(pluginsJson)) {
	// 			plugins.push(p);
	// 			const v = pluginsJson[p];
	// 			$("#server-plugins").append(
	// 				"<tr>" +
	// 				"	<td>" + v.name + "</td>" +
	// 				"	<td>" + v.author + "</td>" +
	// 				"	<td>" + v.description + "</td>" +
	// 				"	<td>" + v.version_string + "</td>" +
	// 				"</tr>");
	// 			pluginsIndex.push(p);
	// 			$("#plugins-list").append(
	// 				"<a id=\"plugin-"+(pluginsIndex.length-1)+"\" href=\"#\" class=\"list-group-item\">"+p+"</a>"
	// 			);
	// 			$("#plugin-"+(pluginsIndex.length-1)).click(function(event) {
	// 				event.preventDefault();
	// 				const pi = parseInt($(this).attr("id").split("plugin-")[1]);
	// 				const plugin = pluginsIndex[pi];
	// 				logger.info("Selected plugin:", plugin);
	// 				$("#plugins-list a").removeClass("active");
	// 				$("#plugin-"+pi).addClass("active");
	// 				resetPluginRequest();
	// 			});
	// 		}
	// 		$("#server-transports").html(
	// 			"<tr>" +
	// 			"	<th>Name</th>" +
	// 			"	<th>Author</th>" +
	// 			"	<th>Description</th>" +
	// 			"	<th>Version</th>" +
	// 			"</tr>"
	// 		);
	// 		for(const t of Object.keys(transportsJson)) {
	// 			const v = transportsJson[t];
	// 			$("#server-transports").append(
	// 				"<tr>" +
	// 				"	<td>" + v.name + "</td>" +
	// 				"	<td>" + v.author + "</td>" +
	// 				"	<td>" + v.description + "</td>" +
	// 				"	<td>" + v.version_string + "</td>" +
	// 				"</tr>");
	// 		}
	// 		$("#server-handlers").html(
	// 			"<tr>" +
	// 			"	<th>Name</th>" +
	// 			"	<th>Author</th>" +
	// 			"	<th>Description</th>" +
	// 			"	<th>Version</th>" +
	// 			"</tr>"
	// 		);
	// 		for(const e of Object.keys(eventsJson)) {
	// 			const v = eventsJson[e];
	// 			$("#server-handlers").append(
	// 				"<tr>" +
	// 				"	<td>" + v.name + "</td>" +
	// 				"	<td>" + v.author + "</td>" +
	// 				"	<td>" + v.description + "</td>" +
	// 				"	<td>" + v.version_string + "</td>" +
	// 				"</tr>");
	// 		}
	// 		// Unlock tabs
	// 		$("#admintabs li").removeClass("disabled");
	// 		// Refresh settings now
	// 		updateSettings();
	// 		// Refresh sessions and handles now
	// 		$("#handles").hide();
	// 		$("#info").hide();
	// 		$("#update-sessions").click(updateSessions);
	// 		$("#update-handles").click(updateHandles);
	// 		$("#update-handle").click(async ()=>{
	// await updateHandleInfo();
	// });
	// 		updateSessions();
	// 		$("#autorefresh").change(function() {
	// 			if(this.checked) {
	// 				updateHandleInfo(true);
	// 			}
	// 		});
	// 		$("#prettify").change(function() {
	// 			if(this.checked) {
	// 				prettyHandleInfo();
	// 			} else {
	// 				rawHandleInfo();
	// 			}
	// 		});
	// 		$("#capture").change(function() {
	// 			if(this.checked) {
	// 				// We're trying to start a new capture, show a dialog
	// 				$("#capturetext").html("Stop capture");
	// 				captureTrafficPrompt();
	// 			} else {
	// 				// We're trying to stop a capture
	// 				$("#capturetext").html("Start capture");
	// 				captureTrafficRequest(false, handleInfo["dump-to-text2pcap"] === true);
	// 			}
	// 		});
	// 		// Only check tokens if the mechanism is enabled
	// 		if(!json["auth_token"]) {
	// 			$("a[href=#tokens]").parent().addClass("disabled");
	// 			$("a[href=#tokens]").attr("href", "#").unbind("click").click(function (e) { e.preventDefault(); return false; });
	// 		} else {
	// 			updateTokens();
	// 		}
	// 	},
	// 	error(XMLHttpRequest, textStatus, errorThrown) {
	// 		logger.info(textStatus + ": " + errorThrown);	// FIXME
	// 		if(!prompting && !alerted) {
	// 			alerted = true;
	// 			bootbox.alert("Couldn't contact the backend: is Janus down, or is the Admin/Monitor interface disabled?", function() {
	// 				promptAccessDetails();
	// 				alerted = false;
	// 			});
	// 		}
	// 	},
	// 	dataType: "json"
	// });
}

// Settings
async function updateSettings() {
	$("#update-settings").unbind("click").addClass("fa-spin");

	let status: janus.IServerStatusResponse;

	try {
		status = await admin.get_status();
	} catch (error) {
		logger.error(error);	// FIXME
		$("#update-settings").removeClass("fa-spin").click(updateSettings);
		const authenticate = (error.code === 403);
		if (!authenticate || (authenticate && !prompting && !alerted)) {
			alerted = true;
			bootbox.alert("Couldn't contact the backend: " + (error as JanusError).message, () => {
				promptAccessDetails();
				alerted = false;
			});
		}
		setTimeout(() => {
			$("#update-settings").removeClass("fa-spin").click(updateSettings);
		}, 1000);
		return;
	}


	logger.info("Got status:", status);
	setTimeout(() => {
		$("#update-settings").removeClass("fa-spin").click(updateSettings);
	}, 1000);
	$("#server-settings").empty();
	for (const k of Object.keys(status)) {
		// @ts-ignore
		settings[k] = status[k];
		$("#server-settings").append(
			"<tr>" +
			"	<td><b>" + k + ":</b></td>" +
			"	<td>" + settings[k] + "</td>" +
			"	<td id=\"" + k + "\"></td>" +
			"</tr>");
		if (k === "session_timeout") {
			$("#" + k).append("<button id=\"" + k + "_button\" type=\"button\" class=\"btn btn-xs btn-primary\">Edit session timeout value</button>");
			$("#" + k + "_button").click(() => {
				bootbox.prompt("Set the new session timeout value (in seconds, currently " + settings["session_timeout"] + ")", async (result) => {
					const normalizedResult = parseInt(result);
					if (isNaN(normalizedResult)) {
						bootbox.alert("Invalid session timeout value");
						return;
					}
					if (normalizedResult < 0) {
						logger.info(isNaN(normalizedResult));
						logger.info(normalizedResult < 0);
						bootbox.alert("Invalid session timeout value");
						return;
					}
					await admin.set_session_timeout(normalizedResult);
				});
			});
		} else if (k === "log_level") {
			$("#" + k).append("<button id=\"" + k + "_button\" type=\"button\" class=\"btn btn-xs btn-primary\">Edit log level</button>");
			$("#" + k + "_button").click(() => {
				bootbox.prompt("Set the new desired log level (0-7, currently " + settings["log_level"] + ")", async (result) => {
					const normalizedResult = parseInt(result);
					if (isNaN(normalizedResult)) {
						bootbox.alert("Invalid log level (should be [0,7])");
						return;
					}
					if (normalizedResult < 0 || normalizedResult > 7) {
						logger.info(isNaN(normalizedResult));
						logger.info(normalizedResult < 0);
						logger.info(normalizedResult > 7);
						bootbox.alert("Invalid log level (should be [0,7])");
						return;
					}
					await admin.set_log_level(normalizedResult);
				});
			});
		} else if (k === "min_nack_queue") {
			$("#" + k).append("<button id=\"" + k + "_button\" type=\"button\" class=\"btn btn-xs btn-primary\">Edit min NACK queue</button>");
			$("#" + k + "_button").click(() => {
				bootbox.prompt("Set the new desired min NACK queue (a positive integer, currently " + settings["min_nack_queue"] + ")", async (result) => {
					const normalizedResult = parseInt(result);
					if (isNaN(normalizedResult)) {
						bootbox.alert("Invalid min NACK queue (should be a positive integer)");
						return;
					}

					if (normalizedResult < 0) {
						bootbox.alert("Invalid min NACK queue (should be a positive integer)");
						return;
					}
					await admin.set_min_nack_queue(normalizedResult);
				});
			});
		} else if (k === "no_media_timer") {
			$("#" + k).append("<button id=\"" + k + "_button\" type=\"button\" class=\"btn btn-xs btn-primary\">Edit no-media timer value</button>");
			$("#" + k + "_button").click(() => {
				bootbox.prompt("Set the new desired no-media timer value (in seconds, currently " + settings["no_media_timer"] + ")", async (result) => {
					const normalizedResult = parseInt(result);
					if (isNaN(normalizedResult)) {
						bootbox.alert("Invalid no-media timer (should be a positive integer)");
						return;
					}

					if (normalizedResult < 0) {
						bootbox.alert("Invalid no-media timer (should be a positive integer)");
						return;
					}
					await admin.set_no_media_timer(normalizedResult);
				});
			});
		} else if (k === "slowlink_threshold") {
			$("#" + k).append("<button id=\"" + k + "_button\" type=\"button\" class=\"btn btn-xs btn-primary\">Edit slowlink-threshold value</button>");
			$("#" + k + "_button").click(() => {
				bootbox.prompt("Set the new desired slowlink-threshold value (in lost packets per seconds, currently " + settings["slowlink_threshold"] + ")", async (result) => {
					const normalizedResult = parseInt(result);
					if (isNaN(normalizedResult)) {
						bootbox.alert("Invalid slowlink-threshold timer (should be a positive integer)");
						return;
					}

					if (normalizedResult < 0) {
						bootbox.alert("Invalid slowlink-threshold timer (should be a positive integer)");
						return;
					}
					await admin.set_slowlink_threshold(normalizedResult);
				});
			});
		} else if (k === "locking_debug") {
			$("#" + k).append("<button id=\"" + k + "_button\" type=\"button\" class=\"btn btn-xs\"></button>");
			$("#" + k + "_button")
				.addClass(!settings[k] ? "btn-success" : "btn-danger")
				.html(!settings[k] ? "Enable locking debug" : "Disable locking debug");
			$("#" + k + "_button").click(() => {
				const text = (!settings["locking_debug"] ?
					"Are you sure you want to enable the locking debug?<br/>This will print a line on the console any time a mutex is locked/unlocked"
					: "Are you sure you want to disable the locking debug?");
				bootbox.confirm(text, async (result) => {
					if (result) {
						await admin.set_locking_debug(!settings["locking_debug"]);
					}
				});
			});
		} else if (k === "refcount_debug") {
			$("#" + k).append("<button id=\"" + k + "_button\" type=\"button\" class=\"btn btn-xs\"></button>");
			$("#" + k + "_button")
				.addClass(!settings[k] ? "btn-success" : "btn-danger")
				.html(!settings[k] ? "Enable reference counters debug" : "Disable reference counters debug");
			$("#" + k + "_button").click(() => {
				const text = (!settings["refcount_debug"] ?
					"Are you sure you want to enable the reference counters debug?<br/>This will print a line on the console any time a reference counter is increased/decreased"
					: "Are you sure you want to disable the reference counters debug?");
				bootbox.confirm(text, async (result) => {
					if (result) {
						await admin.set_refcount_debug(!settings["refcount_debug"]);
					}
				});
			});
		} else if (k === "log_timestamps") {
			$("#" + k).append("<button id=\"" + k + "_button\" type=\"button\" class=\"btn btn-xs\"></button>");
			$("#" + k + "_button")
				.addClass(!settings[k] ? "btn-success" : "btn-danger")
				.html(!settings[k] ? "Enable log timestamps" : "Disable log timestamps");
			$("#" + k + "_button").click(() => {
				const text = (!settings["log_timestamps"] ?
					"Are you sure you want to enable the log timestamps?<br/>This will print the current date/time for each new line on the console"
					: "Are you sure you want to disable the log timestamps?");
				bootbox.confirm(text, async (result) => {
					if (result) {
						await admin.set_log_timestamps(!settings["log_timestamps"]);
					}
				});
			});
		} else if (k === "log_colors") {
			$("#" + k).append("<button id=\"" + k + "_button\" type=\"button\" class=\"btn btn-xs\"></button>");
			$("#" + k + "_button")
				.addClass(!settings[k] ? "btn-success" : "btn-danger")
				.html(!settings[k] ? "Enable log colors" : "Disable log colors");
			$("#" + k + "_button").click(() => {
				const text = (!settings["log_colors"] ?
					"Are you sure you want to enable the log colors?<br/>This will strip the colors from events like warnings, errors, etc. on the console"
					: "Are you sure you want to disable the log colors?");
				bootbox.confirm(text, async (result) => {
					if (result) {
						await admin.set_log_colors(!settings["log_colors"]);
					}
				});
			});
		} else if (k === "libnice_debug") {
			$("#" + k).append("<button id=\"" + k + "_button\" type=\"button\" class=\"btn btn-xs\"></button>");
			$("#" + k + "_button")
				.addClass(!settings[k] ? "btn-success" : "btn-danger")
				.html(!settings[k] ? "Enable libnice debug" : "Disable libnice debug");
			$("#" + k + "_button").click(() => {
				const text = (!settings["libnice_debug"] ?
					"Are you sure you want to enable the libnice debug?<br/>This will print the a very verbose debug of every libnice-related operation on the console"
					: "Are you sure you want to disable the libnice debug?");
				bootbox.confirm(text, async (result) => {
					if (result) {
						await admin.set_libnice_debug(!settings["libnice_debug"]);
					}
				});
			});
		}
	}

}


// Plugins
function resetPluginRequest() {
	$("#plugin-request").empty().append(
		"<tr style=\"background: #f9f9f9;\">" +
		"	<th width=\"25%\">Name</th>" +
		"	<th width=\"25%\">Value</th>" +
		"	<th width=\"25%\">Type</th>" +
		"	<th></th>" +
		"</tr>" +
		"<tr>" +
		"	<td><i id=\"addattr\" class=\"fa fa-plus-circle\" style=\"cursor: pointer;\"></i></td>" +
		"	<td></td>" +
		"	<td></td>" +
		"	<td><button id=\"sendmsg\" type=\"button\" class=\"btn btn-xs btn-success pull-right\">Send message</button></td>" +
		"</tr>");
	$("#addattr").click(addPluginMessageAttribute).click();
	$("#sendmsg").click(async () => {
		const message: { [name: string]: string | number | boolean } = {};
		const num = $(".pm-property").length;
		for (let i = 0; i < num; i++) {
			const name = $("#attrname" + i).val() as string;
			if (name === "") {
				bootbox.alert("Missing name in attribute #" + (i + 1));
				return;
			}
			if (message[name]) {
				bootbox.alert("Duplicate attribute '" + name + "'");
				return;
			}
			let value = $("#attrvalue" + i).val() as string | number | boolean;
			if (value === "") {
				bootbox.alert("Missing value in attribute #" + (i + 1));
				return;
			}
			const type = $("#attrtype" + i).val();
			if (type === "number") {
				value = parseInt(value as string);
				if (isNaN(value)) {
					bootbox.alert("Invalid value in attribute #" + (i + 1) + " (expecting a number)");
					return;
				}
			} else if (type === "boolean") {
				if ((value as string).toLowerCase() === "true") {
					value = true;
				} else if ((value as string).toLowerCase() === "false") {
					value = false;
				} else {
					bootbox.alert("Invalid value in attribute #" + (i + 1) + " (expecting a boolean)");
					return;
				}
			}
			logger.info("Type:", type);
			message[name] = value;
		}
		await sendPluginMessage($("#plugins-list .active").text(), message);
	});
	$("#plugin-message").removeClass("hide");
}

function addPluginMessageAttribute() {
	const num = $(".pm-property").length;
	$("#addattr").parent().parent().before(
		"<tr>" +
		"	<td><input type=\"text\" id=\"attrname" + num + "\" placeholder=\"Attribute name\" onkeypress=\"return checkEnter(this, event);\" style=\"width: 100%;\" class=\"pm-property form-control input-sm\"></td>" +
		"	<td><input type=\"text\" id=\"attrvalue" + num + "\" placeholder=\"Attribute value\" onkeypress=\"return checkEnter(this, event);\" style=\"width: 100%;\" class=\"form-control input-sm\"></td>" +
		"	<td>" +
		"		<select id=\"attrtype" + num + "\" class=\"form-control input-sm\">" +
		"			<option>string</option>" +
		"			<option>number</option>" +
		"			<option>boolean</option>" +
		"		</select>" +
		"	</td>" +
		"	<td></td>" +
		"</tr>"
	);
}

async function sendPluginMessage(plugin:string, message:any) {

	logger.info("Sending message to " + plugin + ":", message);
	try {
		const result = await admin.message_plugin(plugin, message);
		$("#plugin-response").text(JSON.stringify(result, null, 4));
	} catch (error) {
		logger.error("Ooops: ", error);
		const authenticate = error.code === 403;
		if (!authenticate || (authenticate && !prompting && !alerted)) {
			if (authenticate)
				alerted = true;
			bootbox.alert(error.message, () => {
				if (authenticate) {
					promptAccessDetails();
					alerted = false;
				}
			});
		}
	}
}


// Handles
async function updateSessions() {
	$("#update-sessions").unbind("click").addClass("fa-spin");
	$("#update-handles").unbind("click");
	$("#update-handle").unbind("click");

	try {
		const sessions = await admin.list_sessions();

		logger.info("Got sessions:");
		logger.info(sessions);
		$("#sessions-list").empty();
		$("#sessions-num").text(sessions.length);
		// for (let i = 0; i < sessions.length; i++) {
		for (const s of sessions) {
			// const s = sessions[i];
			$("#sessions-list").append(
				"<a id=\"session-" + s + "\" href=\"#\" class=\"list-group-item\">" + s + "</a>"
			);
			$("#session-" + s).click(() => {
				const sh = $(this).text();
				logger.info("Getting session " + sh + " handles");
				session = new JanusSession(parseInt(sh));
				$("#sessions-list a").removeClass("active");
				$("#session-" + sh).addClass("active");
				handle = undefined;
				currentHandle = undefined;
				$("#handles-list").empty();
				$("#handles").show();
				$("#handle-info").empty();
				$("#options").hide();
				$("#info").hide();
				updateHandles();
			});
		}
		if (session !== null && session !== undefined) {
			if ($("#session-" + session).length) {
				$("#session-" + session).addClass("active");
			} else {
				// The session that was selected has disappeared
				session = undefined;
				handle = undefined;
				currentHandle = undefined;
				$("#handles-list").empty();
				$("#handles").hide();
				$("#handle-info").empty();
				$("#options").hide();
				$("#info").hide();
			}
		}
		setTimeout(() => {
			$("#update-sessions").removeClass("fa-spin").click(updateSessions);
			$("#update-handles").click(updateHandles);
			$("#update-handle").click(async () => {
				await updateHandleInfo();
			});
		}, 1000);
	} catch (error) {
		const authenticate = (error.code === 403);
		if (!authenticate || (authenticate && !prompting && !alerted)) {
			if (authenticate)
				alerted = true;
			bootbox.alert(error.message, () => {
				if (authenticate) {
					promptAccessDetails();
					alerted = false;
				}
			});
		}
		setTimeout(() => {
			$("#update-sessions").removeClass("fa-spin").click(updateSessions);
			$("#update-handles").click(updateHandles);
			$("#update-handle").click(async () => {
				await updateHandleInfo();
			});
		}, 1000);
		session = undefined;
		handle = undefined;
		currentHandle = undefined;
		$("#handles-list").empty();
		$("#handles").hide();
		$("#handle-info").empty();
		$("#options").hide();
		$("#info").hide();
		return;
	}

}

async function updateHandles() {
	if (session === null || session === undefined)
		return;
	$("#update-sessions").unbind("click");
	$("#update-handles").unbind("click").addClass("fa-spin");
	$("#update-handle").unbind("click");

	try {
		const handles = await admin.list_handles(session);

		logger.info("Got handles:");
		logger.info(handles);
		$("#handles-list").empty();
		$("#handles-num").text(handles.length);
		// for (let i = 0; i < handles.length; i++) {
		for (const h of handles) {
			// const h = handles[i];
			$("#handles-list").append(
				"<a id=\"handle-" + h + "\" href=\"#\" class=\"list-group-item\">" + h + "</a>"
			);
			$("#handle-" + h).click(() => {
				const hi = $(this).text();
				logger.info("Getting handle " + hi + " info");
				handle = new PluginHandle(parseInt(hi), session!, "unknown");
				if (handle === currentHandle)
					return;	// The self-refresh takes care of that
				$("#handles-list a").removeClass("active");
				$("#handle-" + hi).addClass("active");
				$("#handle-info").empty();
				$("#options").hide();
				$("#info").show();
				updateHandleInfo();
			});
		}
		if (handle !== null && handle !== undefined) {
			if ($("#handle-" + handle).length) {
				$("#handle-" + handle).addClass("active");
			} else {
				// The handle that was selected has disappeared
				handle = undefined;
				currentHandle = undefined;
				$("#handle-info").empty();
				$("#options").hide();
				$("#info").hide();
			}
		}
		setTimeout(() => {
			$("#update-handles").removeClass("fa-spin").click(updateHandles);
			$("#update-sessions").click(updateSessions);
			$("#update-handle").click(async () => {
				await updateHandleInfo();
			});
		}, 1000);
	} catch (error) {
		const authenticate = error.code === 403;
		if (!authenticate || (authenticate && !prompting && !alerted)) {
			if (authenticate)
				alerted = true;
			bootbox.alert(error.message, () => {
				if (authenticate) {
					promptAccessDetails();
					alerted = false;
				}
			});
		}
		setTimeout(() => {
			$("#update-handles").removeClass("fa-spin").click(updateHandles);
			$("#update-sessions").click(updateSessions);
			$("#update-handle").click(async () => {
				await updateHandleInfo();
			});
		}, 1000);
		return;
	}

}

async function updateHandleInfo(refresh?: boolean) {
	if (handle === null || handle === undefined)
		return;
	if (refresh !== true) {
		if (handle === currentHandle && ($("#autorefresh").get(0) as HTMLInputElement).checked)
			return;	// The self-refresh takes care of that
		currentHandle = handle;
	}
	const updateHandle = currentHandle;
	$("#update-sessions").unbind("click");
	$("#update-handles").unbind("click");
	$("#update-handle").unbind("click").addClass("fa-spin");
	$("#capture").removeAttr("checked");
	$("#capturetext").html("Start capture");

	try {
		handleInfo = await admin.handle_info(session!, handle, false);

		logger.info("Got info:");
		logger.info(handleInfo);
		if (($("#prettify").get(0) as HTMLInputElement).checked) {
			prettyHandleInfo();
		} else {
			rawHandleInfo();
		}
		// @ts-ignore
		if (handleInfo["dump-to-pcap"] || handleInfo["dump-to-text2pcap"]) {
			$("#capture").attr("checked", "checked");
			$("#capturetext").html("Stop capture");
		}
		setTimeout(() => {
			$("#update-sessions").click(updateSessions);
			$("#update-handles").click(updateHandles);
			$("#update-handle").removeClass("fa-spin").click(async () => {
				await updateHandleInfo();
			});
		}, 1000);
		// Show checkboxes
		$("#options").removeClass("hide").show();
		// If the related box is checked, autorefresh this handle info every tot seconds
		if (($("#autorefresh").get(0) as HTMLInputElement).checked) {
			setTimeout(() => {
				if (updateHandle !== currentHandle) {
					// The handle changed in the meanwhile, don't autorefresh
					return;
				}
				if (!($("#autorefresh").get(0) as HTMLInputElement).checked) {
					// Unchecked in the meantime
					return;
				}
				updateHandleInfo(true);
			}, 5000);
		}
	} catch (error) {
		logger.info("Ooops: ", error);
		if (refresh !== true) {
			const authenticate = error.code === 403;
			if (!authenticate || (authenticate && !prompting && !alerted)) {
				if (authenticate)
					alerted = true;
				bootbox.alert(error.message, () => {
					if (authenticate) {
						promptAccessDetails();
						alerted = false;
					}
				});
			}
		}
		setTimeout(() => {
			$("#update-sessions").click(updateSessions);
			$("#update-handles").click(updateHandles);
			$("#update-handle").removeClass("fa-spin").click(async () => {
				await updateHandleInfo();
			});
		}, 1000);
	}

}

function rawHandleInfo() {
	// Just use <pre> and show the handle info as it is
	$("#handle-info").html("<pre>" + JSON.stringify(handleInfo, null, 4) + "</pre>");
}

function prettyHandleInfo() {
	// Prettify the handle info, processing it and turning it into tables
	$("#handle-info").html("<table class=\"table table-striped\" id=\"handle-info-table\"></table>");
	$("#options").hide();
	// @ts-ignore
	for (const k of Object.keys(handleInfo)) {
		// @ts-ignore
		const v = handleInfo[k];
		if (k === "plugin_specific") {
			$("#handle-info").append(
				"<h4>Plugin specific details</h4>" +
				"<table class=\"table table-striped\" id=\"plugin-specific\">" +
				"</table>");
			for (const kk of Object.keys(v)) {
				const vv = v[kk];
				$("#plugin-specific").append(
					"<tr>" +
					"	<td><b>" + kk + ":</b></td>" +
					"	<td>" + vv + "</td>" +
					"</tr>");
			}
		} else if (k === "flags") {
			$("#handle-info").append(
				"<h4>Flags</h4>" +
				"<table class=\"table table-striped\" id=\"flags\">" +
				"</table>");
			for (const kk of Object.keys(v)) {
				const vv = v[kk];
				$("#flags").append(
					"<tr>" +
					"	<td><b>" + kk + ":</b></td>" +
					"	<td>" + vv + "</td>" +
					"</tr>");
			}
		} else if (k === "sdps") {
			localSdp = undefined;
			remoteSdp = undefined;
			$("#handle-info").append(
				"<h4>Session descriptions (SDP)</h4>" +
				"<table class=\"table table-striped\" id=\"sdps\">" +
				"</table>");
			for (const kk of Object.keys(v)) {
				const vv = v[kk];
				if (kk === "local") {
					localSdp = vv;
				} else if (kk === "remote") {
					remoteSdp = vv;
				} else {
					// What? Skip
					continue;
				}
				$("#sdps").append(
					"<tr>" +
					"	<td><b>" + kk + ":</b></td>" +
					"	<td><a id=\"" + kk + "\" href=\"#\">" + vv.substring(0, 40) + "...</a></td>" +
					"</tr>");
				$("#" + kk).click(function (event) {
					event.preventDefault();
					const sdp = $(this).attr("id") === "local" ? localSdp : remoteSdp;
					bootbox.dialog({
						title: "SDP (" + $(this).attr("id") + ")",
						message: "<div style=\"max-height: " + ($(window).height()! * 2 / 3) + "px; overflow-y: auto;\">" + sdp!.split("\r\n").join("<br/>") + "</div>"
					});
				});
			}
		} else if (k === "streams") {
			$("#handle-info").append(
				"<h4>ICE streams</h4>" +
				"<div id=\"streams\"></table>");
			for (const kk of Object.keys(v)) {
				$("#streams").append(
					"<h5>Stream #" + (parseInt(kk) + 1) + "</h5>" +
					"<table class=\"table table-striped\" id=\"stream" + kk + "\">" +
					"</table>");
				const vv = v[kk];
				logger.info(vv);
				for (const sk of Object.keys(vv)) {
					const sv = vv[sk];
					if (sk === "ssrc") {
						$("#stream" + kk).append(
							"<tr>" +
							"<td colspan=\"2\">" +
							"<h6>SSRC</h6>" +
							"<table class=\"table\" id=\"ssrc" + kk + "\">" +
							"</table>" +
							"</td>" +
							"</tr>");
						for (const ssk of Object.keys(sv)) {
							const ssv = sv[ssk];
							$("#ssrc" + kk).append(
								"<tr>" +
								"	<td><b>" + ssk + ":</b></td>" +
								"	<td>" + ssv + "</td>" +
								"</tr>");
						}
					} else if (sk === "components") {
						$("#stream" + kk).append(
							"<tr>" +
							"<td colspan=\"2\">" +
							"<h6>Components of Stream #" + (parseInt(kk) + 1) + "</h6>" +
							"<table class=\"table\" id=\"components" + kk + "\">" +
							"</table>" +
							"</td>" +
							"</tr>");
						for (const ssk of Object.keys(sv)) {
							const ssv = sv[ssk];
							$("#components" + kk).append(
								"<tr>" +
								"<td colspan=\"2\">" +
								"<h6>Component #" + (parseInt(ssk) + 1) + "</h6>" +
								"<table class=\"table\" id=\"stream" + kk + "component" + ssk + "\">" +
								"</table>" +
								"</td>" +
								"</tr>");
							for (const cssk of Object.keys(ssv)) {
								const cssv = ssv[cssk];
								if (cssk === "local-candidates" || cssk === "remote-candidates") {
									let candidates = "<ul>";
									for (const c in cssv)
										candidates += "<li>" + cssv[c] + "</li>";
									candidates += "</ul>";
									$("#stream" + kk + "component" + ssk).append(
										"<tr>" +
										"	<td><b>" + cssk + ":</b></td>" +
										"	<td>" + candidates + "</td>" +
										"</tr>");
								} else if (cssk === "dtls" || cssk === "in_stats" || cssk === "out_stats") {
									let dtls = "<table class=\"table\">";
									for (const d of Object.keys(cssv)) {
										dtls +=
											"<tr>" +
											"<td style=\"width:150px;\"><b>" + d + "</b></td>" +
											"<td>" + cssv[d] + "</td>" +
											"</tr>";
									}
									dtls += "</table>";
									$("#stream" + kk + "component" + ssk).append(
										"<tr>" +
										"	<td style=\"width:150px;\"><b>" + cssk + ":</b></td>" +
										"	<td>" + dtls + "</td>" +
										"</tr>");
								} else {
									$("#stream" + kk + "component" + ssk).append(
										"<tr>" +
										"	<td><b>" + cssk + ":</b></td>" +
										"	<td>" + cssv + "</td>" +
										"</tr>");
								}
							}
						}
					} else {
						$("#stream" + kk).append(
							"<tr>" +
							"	<td><b>" + sk + ":</b></td>" +
							"	<td>" + sv + "</td>" +
							"</tr>");
					}
				}
			}
		} else {
			$("#handle-info-table").append(
				"<tr>" +
				"	<td><b>" + k + ":</b></td>" +
				"	<td>" + v + "</td>" +
				"</tr>");
		}
	}
	$("#options").show();
}

// Tokens
async function updateTokens() {
	$("#update-tokens").unbind("click").addClass("fa-spin");

	try {
		const tokens = await admin.list_tokens();

		logger.info("Got tokens:");
		logger.info(tokens);
		setTimeout(() => {
			$("#update-tokens").removeClass("fa-spin").click(updateTokens);
		}, 1000);
		$("#auth-tokens").html(
			"<tr>" +
			"	<th>Token</th>" +
			"	<th>Permissions</th>" +
			"	<th></th>" +
			"</tr>");
		for (const token of tokens) {
			const tokenPlugins = token.allowed_plugins.toString().replace(/,/g, "<br/>");
			$("#auth-tokens").append(
				"<tr>" +
				"	<td>" + token.token + "</td>" +
				"	<td>" + tokenPlugins + "</td>" +
				"	<td><button  id=\"" + token.token + "\" type=\"button\" class=\"btn btn-xs btn-danger\">Remove token</button></td>" +
				"</tr>");
			$("#" + token.token).click(() => {
				const token_from_click = $(this).attr("id");
				bootbox.confirm("Are you sure you want to remove token " + token_from_click + "?", async (result) => {
					if (result) {
						await admin.remove_token(token_from_click!);
					}
				});
			});
		}
		$("#auth-tokens").append(
			"<tr>" +
			"	<td><input type=\"text\" id=\"token\" placeholder=\"Token to add\" onkeypress=\"return checkEnter(this, event);\" style=\"width: 100%;\"></td>" +
			"	<td><div id=\"permissions\"></div></td>" +
			"	<td><button id=\"addtoken\" type=\"button\" class=\"btn btn-xs btn-success\">Add token</button></td>" +
			"</tr>");
		let pluginsCheckboxes = "";
		for (const plugin_id of Object.keys(plugins)) {
			console.log("plugin", plugin_id, plugins[plugin_id]);
			pluginsCheckboxes +=
				"<div class=\"checkbox\">" +
				"	<label>" +
				"		<input checked type=\"checkbox\" value=\"" + plugin_id + "\">" + plugins[plugin_id].name + "</input>" +
				"</div>";
		}
		$("#permissions").html(pluginsCheckboxes);
		$("#addtoken").click(() => {
			const token = ($("#token").val() as string).replace(/ /g, "");
			if (token === "") {
				bootbox.alert("Please insert a valid token string");
				return;
			}
			const checked = $(":checked");
			if (checked.length === 0) {
				bootbox.alert("Please allow the token access to at least a plugin");
				return;
			}
			const pluginPermissions :string[]= [];
			// for (let i = 0; i < checked.length; i++)
			for (const checkedElement of checked)
				pluginPermissions.push((checkedElement as HTMLInputElement).value);
			let text = "Are you sure you want to add the new token " + token + " with access to the following plugins?" +
				"<br/><ul>";
			for (const i in pluginPermissions)
				text += "<li>" + pluginPermissions[i] + "</li>";
			text += "</ul>";
			bootbox.confirm(text, async (result) => {
				if (result) {
					await admin.add_token(token, pluginPermissions);
				}
			});
		});
	} catch (error) {
		const authenticate = error.code === 403;
		if (!authenticate || (authenticate && !prompting && !alerted)) {
			if (authenticate)
				alerted = true;
			bootbox.alert(error.message, () => {
				if (authenticate) {
					promptAccessDetails();
					alerted = false;
				}
			});
		}
		setTimeout(() => {
			$("#update-tokens").removeClass("fa-spin").click(updateTokens);
		}, 1000);
	}

}


// text2pcap and pcap requests
function captureTrafficPrompt() {
	// @ts-ignore
	bootbox.dialog({
		title: "Start capturing traffic",
		message:
			"<div class=\"form-content\">" +
			"	<form class=\"form\" role=\"form\">" +
			"		<div class=\"form-group\">" +
			"			<label for=\"type\">Capture Type</label>" +
			"			<select class=\"form-control\" id=\"type\" name=\"type\" value=\"pcal\">" +
			"				<option value=\"pcap\">pcap</option>" +
			"				<option value=\"text2pcap\">text2pcap</option>" +
			"			</select>" +
			"		</div>" +
			"		<div class=\"form-group\">" +
			"			<label for=\"extra\">Folder to save in</label>" +
			"			<input type=\"text\" class=\"form-control\" id=\"folder\" name=\"folder\" placeholder=\"Insert a path to the target folder\" value=\"\"></input>" +
			"		</div>" +
			"		<div class=\"form-group\">" +
			"			<label for=\"extra\">Filename</label>" +
			"			<input type=\"text\" class=\"form-control\" id=\"filename\" name=\"filename\" placeholder=\"Insert the target filename\" value=\"\"></input>" +
			"		</div>" +
			"		<div class=\"form-group\">" +
			"			<label for=\"extra\">Truncate</label>" +
			"			<input type=\"text\" class=\"form-control\" id=\"truncate\" name=\"truncate\" placeholder=\"Bytes to truncate at (0 or omit to save the whole packet)\" value=\"\"></input>" +
			"		</div>" +
			"	</form>" +
			"</div>",
			// @ts-ignore
		buttons: [
			{
				label: "Start",
				className: "btn btn-primary pull-left",
				callback() {
					const text = $("#type").val() === "text2pcap";
					const folder = $("#folder").val() !== "" ? $("#folder").val() as string: undefined;
					const filename = $("#filename").val() !== "" ? $("#filename").val() as string: undefined;
					let truncate = parseInt($("#truncate").val() as string);
					if (!truncate || isNaN(truncate))
						truncate = 0;
					captureTrafficRequest(true, text, folder, filename, truncate);
				}
			},
			{
				label: "Close",
				className: "btn btn-default pull-left",
				callback() {
					$("#capture").removeAttr("checked");
					$("#capturetext").html("Start capture");
				}
			}
		]
	});
}

async function captureTrafficRequest(start:boolean, text:boolean, folder?:string, filename?:string, truncate?:number) {
	try {
		if (start) {
			if (text) {
				await admin.start_text2pcap(handle!, folder as string, filename as string, truncate as number);
			} else {
				await admin.start_pcap(handle!, folder as string, filename as string, truncate as number);
			}
		} else {
			if (text) {
				await admin.stop_text2pcap(handle!);
			} else {
				await admin.stop_pcap(handle!);
			}
		}
	} catch (error) {
		logger.info(error);	// FIXME
		if (!prompting && !alerted) {
			alerted = true;
			bootbox.alert("Couldn't contact the backend: is Janus down, or is the Admin/Monitor interface disabled?", () => {
				promptAccessDetails();
				alerted = false;
			});
		}
	}

}

function checkEnter(field : HTMLInputElement, event:{keyCode:number, which: number, charCode:number}) {
	const theCode = event.keyCode ? event.keyCode : event.which ? event.which : event.charCode;
	if (theCode === 13) {
		if (field.id === "token")
			$("#addtoken").click((x)=>x);
		else if (field.id.indexOf("attr") !== -1)
			$("#sendmsg").click();
		return false;
	} else {
		return true;
	}
}