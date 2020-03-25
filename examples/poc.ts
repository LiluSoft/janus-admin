import * as janus from "../src/index_browser";
import "jquery";
import "jquery-blockui";
import { BrowserLoggerFactory, VideoRoomPlugin, WebRTCMediaSource, WebRTCMediaTarget, WebRTCMediaStream, WebRTCPeerConnection, ICandidate } from "../src/index_browser";
import "toastr";
import "bootbox";
import "spin";
import adapter from "webrtc-adapter";
import { Stream } from "stream";
// import "webrtc";

declare const $: JQueryStatic;
declare const toastr: Toastr;
declare const bootbox: BootboxStatic;
// declare const Spinner: Spinner;

interface IFeed {
	videoCodec: string;
	simulcastStarted: boolean;
	rfid: number;
	rfdisplay: string;
	rfindex: number;
	detach: () => void;
	spinner: Spinner;
	janusPlugin: janus.VideoRoomPlugin;
	peerConnection: janus.WebRTCPeerConnection;
	sessionEventHandler: janus.JanusSessionEventHandler;
}


const chatroom = 1234;
let myusername: string;
let myPeerConnection: janus.WebRTCPeerConnection;
let myStream: janus.WebRTCMediaStream;
let sessionEventHandler: janus.JanusSessionEventHandler;
const feeds: Partial<IFeed>[] = [];
const bitrateTimer: any[] = [];

let myid: number;
let mypvtid: number;

const doSimulcast = (getQueryStringValue("simulcast") === "yes" || getQueryStringValue("simulcast") === "true");
const doSimulcast2 = (getQueryStringValue("simulcast2") === "yes" || getQueryStringValue("simulcast2") === "true");



const loggerFactory = new BrowserLoggerFactory("trace");
const logger = loggerFactory.create("MAIN", "trace");


const transport = new janus.HTTPTransport(loggerFactory, "http://192.168.99.100:8088/janus", "janusoverlord", false);
const janusClient = new janus.JanusClient(loggerFactory, transport, "examples_token");
const webrtc = new janus.WebRTC(loggerFactory);
let videoRoom: janus.VideoRoomPlugin;

window.onunhandledrejection = err => {
	console.log("onunhandledrejection", err);
};

async function on_document_ready() {
	logger.info("Document Ready");
	videoRoom = await janus.VideoRoomPlugin.attach(janusClient);

	sessionEventHandler = new janus.JanusSessionEventHandler(loggerFactory, transport, videoRoom.session);
	myPeerConnection = webrtc.newPeerConnection();

	videoRoom.on_joined(async (event) => {
		logger.info("Joined!", event);

		myid = event.plugindata.data.id;
		mypvtid = event.plugindata.data.private_id;


		await publishOwnFeed(true);
		onlocalstream(myStream);

		logger.debug("Got a list of available publishers/feeds:");
		for (const publisher of event.plugindata.data.publishers) {
			const id = publisher["id"];
			const display = publisher["display"];
			const audio = publisher["audio_codec"];
			const video = publisher["video_codec"];
			setTimeout(async () => {
				logger.debug("Publisher  >> [" + id + "] " + display + " (audio: " + audio + ", video: " + video + ")");
				await newRemoteFeed(id);// , display, audio, video
			}, 0);

		}
	});

	videoRoom.on_publishers(async (event) => {
		logger.debug("Got a list of", event.plugindata.data.publishers.length, "new available publishers/feeds");
		for (const publisher of event.plugindata.data.publishers) {
			const id = publisher["id"];
			const display = publisher["display"];
			const audio = publisher["audio_codec"];
			const video = publisher["video_codec"];

			setTimeout(async () => {
				logger.debug("Publisher  >> [" + id + "] " + display + " (audio: " + audio + ", video: " + video + ")");
				await newRemoteFeed(id);// , display, audio, video
			}, 0);

		}
	});

	videoRoom.on_leaving((event) => {
		const leaving = event.plugindata.data.leaving;
		const remoteFeed = feeds.find(v=>v && v.rfid === leaving);
		if (remoteFeed) {
			logger.debug("Feed " + remoteFeed.rfid + " (" + remoteFeed.rfdisplay + ") has left the room, detaching");
			$("#remote" + remoteFeed.rfindex).empty().hide();
			$("#remotevideo" + remoteFeed.rfindex).remove();
			$("#waitingvideo" + remoteFeed.rfindex).remove();
			$("#novideo" + remoteFeed.rfindex).remove();
			$("#curbitrate" + remoteFeed.rfindex).remove();
			$("#curres" + remoteFeed.rfindex).remove();
			if (bitrateTimer[remoteFeed.rfindex!] !== null && bitrateTimer[remoteFeed.rfindex!] !== null)
				clearInterval(bitrateTimer[remoteFeed.rfindex!]);
			bitrateTimer[remoteFeed.rfindex!] = undefined;
			remoteFeed.simulcastStarted = false;
			$("#simulcast" + remoteFeed.rfindex).remove();

			delete feeds[remoteFeed.rfindex!];
		}
		// remoteFeed!.detach();
	});

	videoRoom.on_unpublished((event) => {
		logger.debug("Unpublish local feed", event);
		const unpublished = event.plugindata.data.unpublished;
		logger.info("Publisher left: " ,unpublished, feeds);
		// TODO: remove feed from list of feeds and reset container

		const leaving = event.plugindata.data.unpublished;
		const remoteFeed = feeds.find(v=>v && v.rfid === leaving);
		if (remoteFeed) {
			logger.debug("Feed " + remoteFeed.rfid + " (" + remoteFeed.rfdisplay + ") has left the room, detaching");
			$("#remote" + remoteFeed.rfindex).empty().hide();
			$("#remotevideo" + remoteFeed.rfindex).remove();
			$("#waitingvideo" + remoteFeed.rfindex).remove();
			$("#novideo" + remoteFeed.rfindex).remove();
			$("#curbitrate" + remoteFeed.rfindex).remove();
			$("#curres" + remoteFeed.rfindex).remove();
			if (bitrateTimer[remoteFeed.rfindex!] !== null && bitrateTimer[remoteFeed.rfindex!] !== null)
				clearInterval(bitrateTimer[remoteFeed.rfindex!]);
			bitrateTimer[remoteFeed.rfindex!] = undefined;
			remoteFeed.simulcastStarted = false;
			$("#simulcast" + remoteFeed.rfindex).remove();

			delete feeds[remoteFeed.rfindex!];
		}
	});

	videoRoom.on_destroyed(() => {
		logger.warn("The room has been destroyed!");
		bootbox.alert("The room has been destroyed", () => {
			window.location.reload();
		});
		// transport.dispose();
	});

	videoRoom.on_jsep(async (event) => {
		logger.debug("Handling SDP for local stream as well...", event);
		if (!event.jsep) {
			logger.error("JSEP event was raised without jsep!", event);
			return;
		}

		await myPeerConnection.acceptAnswer(event.jsep);
		// sfutest.handleRemoteJsep({jsep});
		// Check if any of the media we wanted to publish has
		// been rejected (e.g., wrong or unsupported codec)
		const audio = event.plugindata.data["audio_codec"];
		if (myStream && myStream.getAudioTracks() && myStream.getAudioTracks().length > 0 && !audio) {
			logger.warn("Audio Stream Rejected", myStream.getAudioTracks(), audio);
			// Audio has been rejected
			toastr.warning("Our audio stream has been rejected, viewers won't hear us");
		}
		const video = event.plugindata.data["video_codec"];
		if (myStream && myStream.getVideoTracks() && myStream.getVideoTracks().length > 0 && !video) {
			logger.warn("Video Stream Rejected", myStream.getVideoTracks(), video);
			// Video has been rejected
			toastr.warning("Our video stream has been rejected, viewers won't see us");
			// Hide the webcam video
			$("#myvideo").hide();
			$("#videolocal").append(
				"<div class=\"no-video-container\">" +
				"<i class=\"fa fa-video-camera fa-5 no-video-icon\" style=\"height: 100%;\"></i>" +
				"<span class=\"no-video-text\" style=\"font-size: 16px;\">Video rejected, no webcam</span>" +
				"</div>");
		}
	});

	sessionEventHandler!.on_trickle(async (trickleEvent) => {
		if (trickleEvent.candidate.completed === true) {
			await myPeerConnection.addIceCandidate();
		} else {
			await myPeerConnection.addIceCandidate(trickleEvent.candidate as RTCIceCandidateInit);
		}

	});


	sessionEventHandler.on_keepalive(async () => {
		await janusClient.keepalive(videoRoom.session);
	});

	sessionEventHandler!.on_webrtcup(async (event) => {
		logger.info("Janus says this WebRTC PeerConnection is " + (true ? "up" : "down") + " now");
		await webrtcState(true);

	});

	sessionEventHandler.on_hangup(async (event) => {
		logger.info("Janus says this WebRTC PeerConnection is " + (false ? "up" : "down") + " now");
		oncleanup();

	});



	const rooms = await videoRoom.list({
		request: "list"
	});
	if (!rooms.list.find(v => v.room === chatroom)) {
		const roomCreated = await videoRoom.create({
			request: "create",
			room: chatroom,
			is_private: false
		});
	}


	logger.info("Plugin attached! id", videoRoom.handle);


	$("#start").one("click", () => {
		$(this).attr("disabled", "disabled").unbind("click");
		// Make sure the browser supports WebRTC
		if (!webrtc.isWebrtcSupported()) {
			bootbox.alert("No WebRTC support... ");
			return;
		}

		$("#details").remove();
		$("#videojoin").removeClass("hide").show();
		$("#registernow").removeClass("hide").show();
		$("#register").click(registerUsername);
		$("#username").focus();
		$("#start").removeAttr("disabled").html("Stop")
			.click(async () => {
				$(this).attr("disabled", "disabled");
				await videoRoom.leave();
				window.location.reload();
				// transport.dispose();
			});
	});

	// Prepare the username registration


	// const webrtcSource = new WebRTCMediaSource();

	// let stream: WebRTCMediaStream | undefined;

	// try {
	// 	stream = await webrtcSource.startCapture();
	// 	logger.info("stream", stream);
	// 	// stream.stop();
	// } catch (e) {
	// 	logger.error("not working", e);
	// }




	// const devices = await webrtcSource.enumerateDevices();
	// logger.info("devices", devices);

	// // const constraints = navigator.mediaDevices.getSupportedConstraints();
	// // logger.info("constraints", constraints);

	// const testElement = $("#testElement")[0];
	// const stream = await webrtcSource.startCapture();

	// if (stream) {

	// 	const target = new WebRTCMediaTarget(stream);
	// 	target.attachToHTMLVideoElement(testElement as HTMLVideoElement);
	// }
}


function onlocalstream(stream: WebRTCMediaStream) {
	logger.debug(" ::: Got a local stream :::", stream);
	$("#videojoin").hide();
	$("#videos").removeClass("hide").show();
	if ($("#myvideo").length === 0) {
		$("#videolocal").append("<video class=\"rounded centered\" id=\"myvideo\" width=\"100%\" height=\"100%\" autoplay playsinline muted=\"muted\"/>");
		// Add a 'mute' button
		$("#videolocal").append("<button class=\"btn btn-warning btn-xs\" id=\"mute\" style=\"position: absolute; bottom: 0px; left: 0px; margin: 15px;\">Mute</button>");
		$("#mute").click(toggleMute);
		// Add an 'unpublish' button
		$("#videolocal").append("<button class=\"btn btn-warning btn-xs\" id=\"unpublish\" style=\"position: absolute; bottom: 0px; right: 0px; margin: 15px;\">Unpublish</button>");
		$("#unpublish").click(unpublishOwnFeed);
	}
	$("#publisher").removeClass("hide").html(myusername).show();

	const htmlConnector = new janus.WebRTCMediaTarget(loggerFactory, stream);
	const myvideo = htmlConnector.attachToHTMLVideoElement($("#myvideo").get(0) as HTMLVideoElement);
	myvideo.muted = true;


	// Janus.attachMediaStream($("#myvideo").get(0), stream);
	// $("#myvideo").get(0).muted = "muted";
	if (myPeerConnection.iceConnectionState !== "completed" &&
		myPeerConnection.iceConnectionState !== "connected") {
		$("#videolocal").parent().parent().block({
			message: "<b>Publishing...</b>",
			css: {
				border: "none",
				backgroundColor: "transparent",
				color: "white"
			}
		});
	}
	const videoTracks = stream.getVideoTracks();
	if (videoTracks === null || videoTracks === undefined || videoTracks.length === 0) {
		// No webcam
		$("#myvideo").hide();
		if ($("#videolocal .no-video-container").length === 0) {
			$("#videolocal").append(
				"<div class=\"no-video-container\">" +
				"<i class=\"fa fa-video-camera fa-5 no-video-icon\"></i>" +
				"<span class=\"no-video-text\">No webcam available</span>" +
				"</div>");
		}
	} else {
		$("#videolocal .no-video-container").remove();
		$("#myvideo").removeClass("hide").show();
	}
}

function oncleanup() {
	logger.info(" ::: Got a cleanup notification: we are unpublished now :::");
	// myStream = undefined;
	$("#videolocal").html("<button id=\"publish\" class=\"btn btn-primary\">Publish</button>");
	$("#publish").click(() => { publishOwnFeed(true).catch((error) => logger.error("Unable to publish", error)); });
	$("#videolocal").parent().parent().unblock();
	$("#bitrate").parent().parent().addClass("hide");
	$("#bitrate a").unbind("click");
}


async function registerUsername() {
	if ($("#username").length === 0) {
		// Create fields to register
		$("#register").click(registerUsername);
		$("#username").focus();
	} else {
		// Try a registration
		$("#username").attr("disabled", "disabled");
		$("#register").attr("disabled", "disabled").unbind("click");
		const username = $("#username").val() as string;
		if (username === "") {
			$("#you")
				.removeClass().addClass("label label-warning")
				.html("Insert your display name (e.g., pippo)");
			$("#username").removeAttr("disabled");
			$("#register").removeAttr("disabled").click(registerUsername);
			return;
		}
		if (/[^a-zA-Z0-9]/.test(username)) {
			$("#you")
				.removeClass().addClass("label label-warning")
				.html("Input is not alphanumeric");
			$("#username").removeAttr("disabled").val("");
			$("#register").removeAttr("disabled").click(registerUsername);
			return;
		}

		myusername = username;
		await videoRoom.join_publisher({
			request: "join",
			room: chatroom,
			ptype: "publisher",
			display: username
		});


		// const register = { "request": "join", "room": myroom, "ptype": "publisher", "display": username };
		// myusername = username;
		// sfutest.send({"message": register});
	}
}

function consentDialog(on: boolean) {
	logger.debug("Consent dialog should be " + (on ? "on" : "off") + " now");
	if (on) {
		// Darken screen and show hint
		$.blockUI!({
			message: "<div><img src=\"up_arrow.png\"/></div>",
			css: {
				border: "none",
				padding: "15px",
				backgroundColor: "transparent",
				color: "#aaa",
				top: "10px",
				left: (adapter.browserDetails.browser === "firefox" ? "-100px" : "300px")
			}
		});
	} else {
		// Restore screen
		$.unblockUI!();
	}
}

function mediaState(medium: string, on: boolean) {
	logger.debug("Janus " + (on ? "started" : "stopped") + " receiving our " + medium);
}

async function webrtcState(on: boolean) {
	logger.debug("Janus says our WebRTC PeerConnection is " + (on ? "up" : "down") + " now");
	$("#videolocal").parent().parent().unblock();
	if (!on)
		return;
	$("#publish").remove();
	// This controls allows us to override the global room bitrate cap
	$("#bitrate").parent().parent().removeClass("hide").show();
	$("#bitrate a").click(async (event) => {

		const id = $(event.target).attr("id");
		const bitrate = parseInt(id!) * 1000;
		if (bitrate === 0) {
			logger.debug("Not limiting bandwidth via REMB");
		} else {
			logger.debug("Capping bandwidth to " + bitrate + " via REMB");
		}
		$("#bitrateset").html($(event.target).html() + "<span class=\"caret\"></span>").parent().removeClass("open");
		await videoRoom.configure({
			request: "configure",
			bitrate
		});
		return false;
	});
}

$(document).ready(() => {
	setTimeout(async () => {
		on_document_ready();
	}, 0);
});



async function publishOwnFeed(useAudio: boolean) {
	// Publish our stream
	$("#publish").attr("disabled", "disabled").unbind("click");
	const stream = await webrtc.sources.startCapture({ audio: true, video: true });
	myStream = stream;

	myPeerConnection.on_connectionstatechange((state) => {
		if (state === "failed") {
			logger.warn("Connection Failed");
			// Video has been rejected
			toastr.warning("Connection Failed");
			// Hide the webcam video
			$("#myvideo").hide();
			$("#videolocal").append(
				"<div class=\"no-video-container\">" +
				"<i class=\"fa fa-video-camera fa-5 no-video-icon\" style=\"height: 100%;\"></i>" +
				"<span class=\"no-video-text\" style=\"font-size: 16px;\">Connection Failed</span>" +
				"</div>");
		}

		if (state === "disconnected") {
			logger.warn("Connection Lost");
			// Video has been rejected
			toastr.warning("Connection Lost");
			// Hide the webcam video
			$("#myvideo").hide();
			$("#videolocal").append(
				"<div class=\"no-video-container\">" +
				"<i class=\"fa fa-video-camera fa-5 no-video-icon\" style=\"height: 100%;\"></i>" +
				"<span class=\"no-video-text\" style=\"font-size: 16px;\">Connection Lost</span>" +
				"</div>");
		}

		if (state === "closed") {
			logger.warn("Connection Closed");
			// Video has been rejected
			toastr.warning("Connection Closed");
			// Hide the webcam video
			$("#myvideo").hide();
			$("#videolocal").append(
				"<div class=\"no-video-container\">" +
				"<i class=\"fa fa-video-camera fa-5 no-video-icon\" style=\"height: 100%;\"></i>" +
				"<span class=\"no-video-text\" style=\"font-size: 16px;\">Connection Closed</span>" +
				"</div>");
		}
	});

	myPeerConnection.on_icecandidate(async (event) => {
		if (event) {
			logger.debug("got ice candidate", event);
		} else {
			logger.debug("got ice candidate list end");
		}
		if (event) {
			const result = await videoRoom.trickle({
				janus: "trickle",
				candidate: event as ICandidate
			});
			logger.debug("trickle", event, "result", result);
		} else {
			const result = await videoRoom.trickle({
				janus: "trickle",
				candidate: { completed: true }
			});
			logger.debug("trickle", event, "result", result);
		}
	});

	// const peerConnection = new WebRTCPeerConnection(loggerFactory);

	// mandatory for janus
	const dataChannel = myPeerConnection.getDataChannel();
	let offerOptions: janus.WebRTCPeerOptions = 0;
	offerOptions |= janus.WebRTCPeerOptions.VideoSend;
	if (useAudio) {
		offerOptions |= janus.WebRTCPeerOptions.AudioSend;
	}

	// If you want to test simulcasting (Chrome and Firefox only), then
	// pass a ?simulcast=true when opening this demo page: it will turn
	// the following 'simulcast' property to pass to janus.js to true
	if (doSimulcast) {
		offerOptions |= janus.WebRTCPeerOptions.Simulcast;
	}

	myPeerConnection.addTracks(myStream);

	try {
		const jsep = await myPeerConnection.createOffer(offerOptions);

		logger.debug("Got publisher SDP!", jsep);

		const configureAnswer = await videoRoom.configure({
			request: "configure",
			audio: useAudio,
			video: true,
		}, jsep);


		// You can force a specific codec to use when publishing by using the
		// audiocodec and videocodec properties, for instance:
		// 		publish["audiocodec"] = "opus"
		// to force Opus as the audio codec to use, or:
		// 		publish["videocodec"] = "vp9"
		// to force VP9 as the videocodec to use. In both case, though, forcing
		// a codec will only work if: (1) the codec is actually in the SDP (and
		// so the browser supports it), and (2) the codec is in the list of
		// allowed codecs in a room. With respect to the point (2) above,
		// refer to the text in janus.plugin.videoroom.jcfg for more details
	} catch (error) {
		logger.error("WebRTC error:", error);
		if (useAudio) {
			await publishOwnFeed(false);
		} else {
			bootbox.alert("WebRTC error... " + JSON.stringify(error));
			$("#publish").removeAttr("disabled").click(() => {
				publishOwnFeed(true).catch((error) => {
					logger.error("Error publishing", error);
				});
			});
		}
	}

}

function toggleMute() {
	let muted = myStream.isAudioMuted();
	logger.info((muted ? "Unmuting" : "Muting") + " local stream...");
	if (muted)
		myStream.unmuteAudio();
	else
		myStream.muteAudio();
	muted = myStream.isAudioMuted();
	$("#mute").html(muted ? "Unmute" : "Mute");
}

async function unpublishOwnFeed() {
	// Unpublish our stream
	$("#unpublish").attr("disabled", "disabled").unbind("click");

	await videoRoom.unpublish();
}

async function newRemoteFeed(id: number) {
	logger.debug("New Remote Feed", id);

	const existing = feeds.find(v => v && v.rfid === id);
	if (existing) {
		logger.debug("remote feed", id, "already exists");
		return;
	}


	// A new feed has been published, create a new plugin handle and attach to it as a subscriber
	let newRoomHandle: VideoRoomPlugin;
	let remoteFeed: Partial<IFeed>;
	try {
		newRoomHandle = await VideoRoomPlugin.attach(janusClient);
		logger.info("Subscriber Plugin attached!");

		remoteFeed = {
			janusPlugin: newRoomHandle,
			rfid: id,
			spinner: new Spinner({ top: "100" }),
			peerConnection: webrtc.newPeerConnection(),
			sessionEventHandler: new janus.JanusSessionEventHandler(loggerFactory, transport, newRoomHandle.session)
		};
		// feeds.push(feed);
		for (let i = 1; i < 6; i++) {
			if (feeds[i] === undefined || feeds[i] === null) {
				logger.debug("setting", id, "as feed number", i);
				feeds[i] = remoteFeed;
				remoteFeed.rfindex = i;
				break;
			}
		}

		logger.debug("Joining the room", id, chatroom);
		const subscription = await newRoomHandle.join_subscriber({
			request: "join",
			room: chatroom,
			ptype: "subscriber",
			feed: id,
			private_id: mypvtid,
		});

		// logger.debug("Handling SDP as well...", event);
		// if (!subscription.jsep) {
		// 	logger.error("JSEP event was raised without jsep!", event);
		// 	return;
		// }
		// // Answer and attach
		// try {
		// 	await remoteFeed.peerConnection!.acceptOffer(subscription.jsep);
		// 	const jsep = await remoteFeed.peerConnection!.createAnswer(janus.WebRTCPeerOptions.AudioSend | janus.WebRTCPeerOptions.VideoSend);
		// 	await remoteFeed.janusPlugin!.start(jsep);
		// } catch (error) {
		// 	logger.error("WebRTC error:", error);
		// 	bootbox.alert("WebRTC error... " + JSON.stringify(error));
		// }
		// We wait for the plugin to send us an offer
		// const subscribe = { "request": "join", "room": myroom, "ptype": "subscriber", "feed": id, "private_id": mypvtid };
		// In case you don't want to receive audio, video or data, even if the
		// publisher is sending them, set the 'offer_audio', 'offer_video' or
		// 'offer_data' properties to false (they're true by default), e.g.:
		// 		subscribe["offer_video"] = false;
		// For example, if the publisher is VP8 and this is Safari, let's avoid video
		// if (adapter.browserDetails.browser === "safari" &&
		// 	(video === "vp9" || (video === "vp8" && !Janus.safariVp8))) {
		// 	if (video)
		// 		video = video.toUpperCase();
		// 	toastr.warning("Publisher is using " + video + ", but Safari doesn't support it: disabling video");
		// 	subscribe["offer_video"] = false;
		// }
		// remoteFeed.videoCodec = video;
		// remoteFeed.send({ "message": subscribe });
	} catch (error) {
		logger.error("  -- Error attaching plugin...", error);
		bootbox.alert("Error attaching plugin... " + error);
		throw error;
	}

	// newRoomHandle.on_error((error)=>{
	// 	bootbox.alert(msg["error"]);
	// });

	newRoomHandle.on_attached(async (event) => {
		logger.debug("attached", id, event);
		remoteFeed.rfdisplay = event.plugindata.data.display;
		// Subscriber created and attached

		// remoteFeed.rfid = msg["id"];
		// remoteFeed.rfdisplay = msg["display"];
		// if (remoteFeed.spinner === undefined || remoteFeed.spinner === null) {
		// 	const target = document.getElementById("videoremote" + remoteFeed.rfindex);
		// 	remoteFeed.spinner = new Spinner({ top: 100 }).spin(target);
		// } else {
		// 	remoteFeed.spinner.spin();
		// }
		logger.info("Successfully attached to feed ", remoteFeed, "in room", event.plugindata.data.room);
		$("#remote" + remoteFeed.rfindex!).removeClass("hide").html(remoteFeed.rfdisplay!).show();


		remoteFeed.sessionEventHandler!.on_trickle(async (trickleEvent) => {
			if ((!trickleEvent.candidate) || trickleEvent.candidate.completed === true) {
				await remoteFeed.peerConnection!.addIceCandidate();
			} else {
				await remoteFeed.peerConnection!.addIceCandidate(trickleEvent.candidate as RTCIceCandidateInit);
			}

		});

		remoteFeed.sessionEventHandler!.on_keepalive(async () => {
			await janusClient.keepalive(remoteFeed.sessionEventHandler!.session);
		});

		remoteFeed.sessionEventHandler!.on_webrtcup((upEvent) => {
			logger.info("Janus says this WebRTC PeerConnection (feed #" + remoteFeed.rfindex + ") is " + (true ? "up" : "down") + " now");

			$("#videoremote" + remoteFeed.rfindex + " .error-video-container").remove();
			$("#remotevideo" + remoteFeed.rfindex).removeClass("hide").show();
		});

		remoteFeed.sessionEventHandler!.on_hangup((hangupEvent) => {
			logger.info("Janus says this WebRTC PeerConnection (feed #" + remoteFeed.rfindex + ") is " + (false ? "up" : "down") + " now");
			// $("#videoremote" + remoteFeed.rfindex).html(`<div>Not Connected - ${hangupEvent.reason}</div>`);

			// No remote video
			$("#remotevideo" + remoteFeed.rfindex).hide();
			if ($("#videoremote" + remoteFeed.rfindex + " .no-video-container").length === 0) {
				$("#videoremote" + remoteFeed.rfindex).append(
					"<div class=\"error-video-container\">" +
					"<i class=\"fa fa-video-camera fa-5 no-video-icon\"></i>" +
					`<span class=\"no-video-text\">Not Connected - ${hangupEvent.reason}</span>` +
					"</div>");
			}


		});

		remoteFeed.sessionEventHandler!.on_media((mediaEvent) => {
			logger.info("Janus says this WebRTC PeerConnection is", mediaEvent.receiving ? "receiving" : "not receiving", mediaEvent.type);
		});

		remoteFeed.peerConnection!.on_icecandidate(async (iceEvent) => {
			if (iceEvent) {
				logger.debug("got ice candidate for remote feed", iceEvent.candidate);
			} else {
				logger.debug("got ice candidate list end for remote feed");
			}
			if (iceEvent) {
				const result = await newRoomHandle.trickle({
					janus: "trickle",
					candidate: iceEvent as ICandidate
				});
				logger.debug("remote trickle", iceEvent, "result", result);
			} else {
				const result = await newRoomHandle.trickle({
					janus: "trickle",
					candidate: { completed: true }
				});
				logger.debug("remote trickle", iceEvent, "result", result);
			}
		});

		remoteFeed.peerConnection!.on_remotestreams((streams) => {
			logger.debug("Remote feed #" + remoteFeed.rfindex);
			let addButtons = false;
			if ($("#remotevideo" + remoteFeed.rfindex).length === 0) {
				addButtons = true;
				// No remote video yet
				$("#videoremote" + remoteFeed.rfindex).append("<video class=\"rounded centered\" id=\"waitingvideo" + remoteFeed.rfindex + "\" width=320 height=240 />");
				$("#videoremote" + remoteFeed.rfindex).append("<video class=\"rounded centered relative hide\" id=\"remotevideo" + remoteFeed.rfindex + "\" width=\"100%\" height=\"100%\" autoplay playsinline/>");
				$("#videoremote" + remoteFeed.rfindex).append(
					"<span class=\"label label-primary hide\" id=\"curres" + remoteFeed.rfindex + "\" style=\"position: absolute; bottom: 0px; left: 0px; margin: 15px;\"></span>" +
					"<span class=\"label label-info hide\" id=\"curbitrate" + remoteFeed.rfindex + "\" style=\"position: absolute; bottom: 0px; right: 0px; margin: 15px;\"></span>");
				// Show the video, hide the spinner and show the resolution when we get a playing event
				$("#remotevideo" + remoteFeed.rfindex).bind("playing", (playingEvent) => {
					const thisVideoElement = playingEvent.target as HTMLVideoElement;
					if (remoteFeed.spinner !== undefined && remoteFeed.spinner !== null)
						remoteFeed.spinner.stop();
					remoteFeed.spinner = undefined;
					$("#waitingvideo" + remoteFeed.rfindex).remove();
					if (thisVideoElement.videoWidth)
						$("#remotevideo" + remoteFeed.rfindex).removeClass("hide").show();
					const elWidth = thisVideoElement.videoWidth;
					const elHeight = thisVideoElement.videoHeight;
					$("#curres" + remoteFeed.rfindex).removeClass("hide").text(elWidth + "x" + elHeight).show();
					if (adapter.browserDetails.browser === "firefox") {
						// Firefox Stable has a bug: width and height are not immediately available after a playing
						setTimeout(() => {
							const width = ($("#remotevideo" + remoteFeed.rfindex).get(0) as HTMLVideoElement).videoWidth;
							const height = ($("#remotevideo" + remoteFeed.rfindex).get(0) as HTMLVideoElement).videoHeight;
							$("#curres" + remoteFeed.rfindex).removeClass("hide").text(width + "x" + height).show();
						}, 2000);
					}
				});
			}

			const mediaTarget = new janus.WebRTCMediaTarget(loggerFactory, streams[0]);
			mediaTarget.attachToHTMLVideoElement($("#remotevideo" + remoteFeed.rfindex).get(0) as HTMLVideoElement);
			// Janus.attachMediaStream(($("#remotevideo" + remoteFeed.rfindex).get(0) as HTMLVideoElement), streams[0].mediaStream);
			const videoTracks = streams[0].getVideoTracks();
			if (videoTracks === null || videoTracks === undefined || videoTracks.length === 0) {
				// No remote video
				$("#remotevideo" + remoteFeed.rfindex).hide();
				if ($("#videoremote" + remoteFeed.rfindex + " .no-video-container").length === 0) {
					$("#videoremote" + remoteFeed.rfindex).append(
						"<div class=\"no-video-container\">" +
						"<i class=\"fa fa-video-camera fa-5 no-video-icon\"></i>" +
						"<span class=\"no-video-text\">No remote video available</span>" +
						"</div>");
				}
			} else {
				$("#videoremote" + remoteFeed.rfindex + " .no-video-container").remove();
				$("#remotevideo" + remoteFeed.rfindex).removeClass("hide").show();
			}
			if (!addButtons)
				return;
			if (adapter.browserDetails.browser === "chrome" || adapter.browserDetails.browser === "firefox" ||
				adapter.browserDetails.browser === "safari") {
				$("#curbitrate" + remoteFeed.rfindex).removeClass("hide").show();
				bitrateTimer[remoteFeed.rfindex!] = setInterval(() => {
					// Display updated bitrate, if supported
					const bitrate = remoteFeed.peerConnection!.getBitrate() || "";
					$("#curbitrate" + remoteFeed.rfindex!).text(bitrate);
					// Check if the resolution changed too
					const width = ($("#remotevideo" + remoteFeed.rfindex).get(0) as HTMLVideoElement).videoWidth;
					const height = ($("#remotevideo" + remoteFeed.rfindex).get(0) as HTMLVideoElement).videoHeight;
					if (width > 0 && height > 0)
						$("#curres" + remoteFeed.rfindex).removeClass("hide").text(width + "x" + height).show();
				}, 1000);
			}
		});


		// oncleanup
		remoteFeed.janusPlugin!.on_leaving((leavingEvent) => {
			logger.info(" ::: Got a cleanup notification (remote feed " + id + ") :::");
			if (remoteFeed.spinner !== undefined && remoteFeed.spinner !== null)
				remoteFeed.spinner.stop();
			remoteFeed.spinner = undefined;
			$("#remotevideo" + remoteFeed.rfindex).remove();
			$("#waitingvideo" + remoteFeed.rfindex).remove();
			$("#novideo" + remoteFeed.rfindex).remove();
			$("#curbitrate" + remoteFeed.rfindex).remove();
			$("#curres" + remoteFeed.rfindex).remove();
			if (bitrateTimer[remoteFeed.rfindex!] !== null && bitrateTimer[remoteFeed.rfindex!] !== null)
				clearInterval(bitrateTimer[remoteFeed.rfindex!]);
			bitrateTimer[remoteFeed.rfindex!] = undefined;
			remoteFeed.simulcastStarted = false;
			$("#simulcast" + remoteFeed.rfindex).remove();
		});
	});

	newRoomHandle.on_temporal_substream((event) => {
		logger.debug("received temporal substream", id, event);
		// Check if we got an event on a simulcast-related event from this publisher
		const substream = event.plugindata.data.substream;
		const temporal = event.plugindata.data.temporal;
		if ((substream) || (temporal)) {
			if (!remoteFeed.simulcastStarted) {
				remoteFeed.simulcastStarted = true;
				// Add some new buttons
				addSimulcastButtons(remoteFeed.rfindex!, remoteFeed.videoCodec === "vp8" || remoteFeed.videoCodec === "h264");
			}
			// We just received notice that there's been a switch, update the buttons
			updateSimulcastButtons(remoteFeed.rfindex!, substream!, temporal!);
		}
	});

	newRoomHandle.on_jsep(async (event) => {
		logger.debug("Handling SDP as well...", event);
		if (!event.jsep) {
			logger.error("JSEP event was raised without jsep!", event);
			return;
		}
		// Answer and attach
		try {
			await remoteFeed.peerConnection!.acceptOffer(event.jsep);
			// const dataChannel = remoteFeed.peerConnection!.getDataChannel();

			// | janus.WebRTCPeerOptions.iceRestart
			const jsep = await remoteFeed.peerConnection!.createAnswer(janus.WebRTCPeerOptions.AudioReceive | janus.WebRTCPeerOptions.VideoReceive );
			logger.debug("created answer", jsep);
			await remoteFeed.janusPlugin!.start(jsep);
		} catch (error) {
			logger.error("WebRTC error:", error);
			bootbox.alert("WebRTC error... " + JSON.stringify(error));
		}
	});









}

// Helper to parse query string
function getQueryStringValue(name: string) {
	name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
	const regex = new RegExp("[\\?&]" + name + "=([^&#]*)");
	const results = regex.exec(location.search);
	return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

// Helpers to create Simulcast-related UI, if enabled
function addSimulcastButtons(feed: number, temporal: boolean) {
	const index = feed;
	$("#remote" + index).parent().append(
		"<div id=\"simulcast" + index + "\" class=\"btn-group-vertical btn-group-vertical-xs pull-right\">" +
		"	<div class\"row\">" +
		"		<div class=\"btn-group btn-group-xs\" style=\"width: 100%\">" +
		"			<button id=\"sl" + index + "-2\" type=\"button\" class=\"btn btn-primary\" data-toggle=\"tooltip\" title=\"Switch to higher quality\" style=\"width: 33%\">SL 2</button>" +
		"			<button id=\"sl" + index + "-1\" type=\"button\" class=\"btn btn-primary\" data-toggle=\"tooltip\" title=\"Switch to normal quality\" style=\"width: 33%\">SL 1</button>" +
		"			<button id=\"sl" + index + "-0\" type=\"button\" class=\"btn btn-primary\" data-toggle=\"tooltip\" title=\"Switch to lower quality\" style=\"width: 34%\">SL 0</button>" +
		"		</div>" +
		"	</div>" +
		"	<div class\"row\">" +
		"		<div class=\"btn-group btn-group-xs hide\" style=\"width: 100%\">" +
		"			<button id=\"tl" + index + "-2\" type=\"button\" class=\"btn btn-primary\" data-toggle=\"tooltip\" title=\"Cap to temporal layer 2\" style=\"width: 34%\">TL 2</button>" +
		"			<button id=\"tl" + index + "-1\" type=\"button\" class=\"btn btn-primary\" data-toggle=\"tooltip\" title=\"Cap to temporal layer 1\" style=\"width: 33%\">TL 1</button>" +
		"			<button id=\"tl" + index + "-0\" type=\"button\" class=\"btn btn-primary\" data-toggle=\"tooltip\" title=\"Cap to temporal layer 0\" style=\"width: 33%\">TL 0</button>" +
		"		</div>" +
		"	</div>" +
		"</div>"
	);
	// Enable the simulcast selection buttons
	$("#sl" + index + "-0").removeClass("btn-primary btn-success").addClass("btn-primary")
		.unbind("click").click(() => {
			toastr.info("Switching simulcast substream, wait for it... (lower quality)", undefined, { timeOut: 2000 });
			if (!$("#sl" + index + "-2").hasClass("btn-success"))
				$("#sl" + index + "-2").removeClass("btn-primary btn-info").addClass("btn-primary");
			if (!$("#sl" + index + "-1").hasClass("btn-success"))
				$("#sl" + index + "-1").removeClass("btn-primary btn-info").addClass("btn-primary");
			$("#sl" + index + "-0").removeClass("btn-primary btn-info btn-success").addClass("btn-info");
			feeds[index].janusPlugin!.configure({ request: "configure", substream: 0 });
		});
	$("#sl" + index + "-1").removeClass("btn-primary btn-success").addClass("btn-primary")
		.unbind("click").click(() => {
			toastr.info("Switching simulcast substream, wait for it... (normal quality)", undefined, { timeOut: 2000 });
			if (!$("#sl" + index + "-2").hasClass("btn-success"))
				$("#sl" + index + "-2").removeClass("btn-primary btn-info").addClass("btn-primary");
			$("#sl" + index + "-1").removeClass("btn-primary btn-info btn-success").addClass("btn-info");
			if (!$("#sl" + index + "-0").hasClass("btn-success"))
				$("#sl" + index + "-0").removeClass("btn-primary btn-info").addClass("btn-primary");
			feeds[index].janusPlugin!.configure({ request: "configure", substream: 1 });
		});
	$("#sl" + index + "-2").removeClass("btn-primary btn-success").addClass("btn-primary")
		.unbind("click").click(() => {
			toastr.info("Switching simulcast substream, wait for it... (higher quality)", undefined, { timeOut: 2000 });
			$("#sl" + index + "-2").removeClass("btn-primary btn-info btn-success").addClass("btn-info");
			if (!$("#sl" + index + "-1").hasClass("btn-success"))
				$("#sl" + index + "-1").removeClass("btn-primary btn-info").addClass("btn-primary");
			if (!$("#sl" + index + "-0").hasClass("btn-success"))
				$("#sl" + index + "-0").removeClass("btn-primary btn-info").addClass("btn-primary");
			feeds[index].janusPlugin!.configure({ request: "configure", substream: 2 });
		});
	if (!temporal)	// No temporal layer support
		return;
	$("#tl" + index + "-0").parent().removeClass("hide");
	$("#tl" + index + "-0").removeClass("btn-primary btn-success").addClass("btn-primary")
		.unbind("click").click(() => {
			toastr.info("Capping simulcast temporal layer, wait for it... (lowest FPS)", undefined, { timeOut: 2000 });
			if (!$("#tl" + index + "-2").hasClass("btn-success"))
				$("#tl" + index + "-2").removeClass("btn-primary btn-info").addClass("btn-primary");
			if (!$("#tl" + index + "-1").hasClass("btn-success"))
				$("#tl" + index + "-1").removeClass("btn-primary btn-info").addClass("btn-primary");
			$("#tl" + index + "-0").removeClass("btn-primary btn-info btn-success").addClass("btn-info");
			feeds[index].janusPlugin!.configure({ request: "configure", temporal: 0 });
		});
	$("#tl" + index + "-1").removeClass("btn-primary btn-success").addClass("btn-primary")
		.unbind("click").click(() => {
			toastr.info("Capping simulcast temporal layer, wait for it... (medium FPS)", undefined, { timeOut: 2000 });
			if (!$("#tl" + index + "-2").hasClass("btn-success"))
				$("#tl" + index + "-2").removeClass("btn-primary btn-info").addClass("btn-primary");
			$("#tl" + index + "-1").removeClass("btn-primary btn-info").addClass("btn-info");
			if (!$("#tl" + index + "-0").hasClass("btn-success"))
				$("#tl" + index + "-0").removeClass("btn-primary btn-info").addClass("btn-primary");
			feeds[index].janusPlugin!.configure({ request: "configure", temporal: 1 });
		});
	$("#tl" + index + "-2").removeClass("btn-primary btn-success").addClass("btn-primary")
		.unbind("click").click(() => {
			toastr.info("Capping simulcast temporal layer, wait for it... (highest FPS)", undefined, { timeOut: 2000 });
			$("#tl" + index + "-2").removeClass("btn-primary btn-info btn-success").addClass("btn-info");
			if (!$("#tl" + index + "-1").hasClass("btn-success"))
				$("#tl" + index + "-1").removeClass("btn-primary btn-info").addClass("btn-primary");
			if (!$("#tl" + index + "-0").hasClass("btn-success"))
				$("#tl" + index + "-0").removeClass("btn-primary btn-info").addClass("btn-primary");
			feeds[index].janusPlugin!.configure({ request: "configure", temporal: 2 });
		});
}

function updateSimulcastButtons(feed: number, substream: number, temporal: number) {
	// Check the substream
	const index = feed;
	if (substream === 0) {
		toastr.success("Switched simulcast substream! (lower quality)", undefined, { timeOut: 2000 });
		$("#sl" + index + "-2").removeClass("btn-primary btn-success").addClass("btn-primary");
		$("#sl" + index + "-1").removeClass("btn-primary btn-success").addClass("btn-primary");
		$("#sl" + index + "-0").removeClass("btn-primary btn-info btn-success").addClass("btn-success");
	} else if (substream === 1) {
		toastr.success("Switched simulcast substream! (normal quality)", undefined, { timeOut: 2000 });
		$("#sl" + index + "-2").removeClass("btn-primary btn-success").addClass("btn-primary");
		$("#sl" + index + "-1").removeClass("btn-primary btn-info btn-success").addClass("btn-success");
		$("#sl" + index + "-0").removeClass("btn-primary btn-success").addClass("btn-primary");
	} else if (substream === 2) {
		toastr.success("Switched simulcast substream! (higher quality)", undefined, { timeOut: 2000 });
		$("#sl" + index + "-2").removeClass("btn-primary btn-info btn-success").addClass("btn-success");
		$("#sl" + index + "-1").removeClass("btn-primary btn-success").addClass("btn-primary");
		$("#sl" + index + "-0").removeClass("btn-primary btn-success").addClass("btn-primary");
	}
	// Check the temporal layer
	if (temporal === 0) {
		toastr.success("Capped simulcast temporal layer! (lowest FPS)", undefined, { timeOut: 2000 });
		$("#tl" + index + "-2").removeClass("btn-primary btn-success").addClass("btn-primary");
		$("#tl" + index + "-1").removeClass("btn-primary btn-success").addClass("btn-primary");
		$("#tl" + index + "-0").removeClass("btn-primary btn-info btn-success").addClass("btn-success");
	} else if (temporal === 1) {
		toastr.success("Capped simulcast temporal layer! (medium FPS)", undefined, { timeOut: 2000 });
		$("#tl" + index + "-2").removeClass("btn-primary btn-success").addClass("btn-primary");
		$("#tl" + index + "-1").removeClass("btn-primary btn-info btn-success").addClass("btn-success");
		$("#tl" + index + "-0").removeClass("btn-primary btn-success").addClass("btn-primary");
	} else if (temporal === 2) {
		toastr.success("Capped simulcast temporal layer! (highest FPS)", undefined, { timeOut: 2000 });
		$("#tl" + index + "-2").removeClass("btn-primary btn-info btn-success").addClass("btn-success");
		$("#tl" + index + "-1").removeClass("btn-primary btn-success").addClass("btn-primary");
		$("#tl" + index + "-0").removeClass("btn-primary btn-success").addClass("btn-primary");
	}
}