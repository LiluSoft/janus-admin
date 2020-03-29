import * as janus from "../src/index_browser";
import "jquery";
import "jquery-blockui";
import { BrowserLoggerFactory, VideoRoomPlugin, WebRTCMediaSource, WebRTCMediaTarget, WebRTCMediaStream, WebRTCPeerConnection, ICandidate } from "../src/index_browser";
import "toastr";
import "bootbox";
import "spin";
import adapter from "webrtc-adapter";
import { Stream } from "stream";
import { VideoRoomPublisher } from "./videoroom/VideoRoomPublisher";
import { VideoRoomSubscriber } from "./videoroom/VideoRoomSubscriber";

declare const $: JQueryStatic;
declare const toastr: Toastr;
declare const bootbox: BootboxStatic;
// declare const Spinner: Spinner;

const chatroom = 1234;
let myusername: string;

const doSimulcast = (getQueryStringValue("simulcast") === "yes" || getQueryStringValue("simulcast") === "true");
const doSimulcast2 = (getQueryStringValue("simulcast2") === "yes" || getQueryStringValue("simulcast2") === "true");



const loggerFactory = new BrowserLoggerFactory("trace");
const logger = loggerFactory.create("MAIN", "trace");


const transport = new janus.HTTPTransport(loggerFactory, "http://192.168.99.100:8088/janus", "janusoverlord", false);
const janusClient = new janus.JanusClient(loggerFactory, transport, "examples_token");
const webrtc = new janus.WebRTC(loggerFactory);

const publisher = new VideoRoomPublisher(loggerFactory, janusClient, webrtc);

window.onunhandledrejection = err => {
	console.log("onunhandledrejection", err);
};

const subscriptions: {
	[publisher_id: number]: Partial<{
		subscriber: VideoRoomSubscriber,
		rfindex: number;
	}>
} = {};

async function on_document_ready() {
	logger.info("Document Ready");
	await publisher.initialize(doSimulcast);
	publisher.on_localstream((stream) => {
		onlocalstream(stream);
	});

	publisher.on_consentDialog(consentDialog);
	publisher.on_remotefeed(async (subscriber) => {
		await newRemoteStream(subscriber);
	});

	publisher.on_leaving(async (publisher_id) => {
		logger.info("Publisher", publisher_id, "has left the room");
		const remoteFeed = subscriptions[publisher_id];
		if (remoteFeed && remoteFeed.subscriber) {
			logger.debug("Feed " + remoteFeed.subscriber.subscription.id + " (" + remoteFeed.subscriber.subscription.display + ") has left the room, detaching");
			await remoteFeed.subscriber.dispose();

			$("#remote" + remoteFeed.rfindex).empty().hide();
			$("#remotevideo" + remoteFeed.rfindex).remove();
			$("#waitingvideo" + remoteFeed.rfindex).remove();
			$("#novideo" + remoteFeed.rfindex).remove();
			$("#curbitrate" + remoteFeed.rfindex).remove();
			$("#curres" + remoteFeed.rfindex).remove();
			await remoteFeed.subscriber!.dispose();
			// remoteFeed.simulcastStarted = false;
			$("#simulcast" + remoteFeed.rfindex).remove();

			delete subscriptions[publisher_id];
		}
	});

	publisher.on_destroyed(() => {
		logger.warn("The room has been destroyed!");
		bootbox.alert("The room has been destroyed", () => {
			window.location.reload();
		});
	});


	publisher.on_acceptedAnswer(async (answer) => {
		logger.debug("answer was accepted", answer);

		const myStream = publisher.getStream();
		const audio = answer["audio_codec"];
		if (myStream && myStream.getAudioTracks() && myStream.getAudioTracks().length > 0 && !audio) {
			logger.warn("Audio Stream Rejected", myStream.getAudioTracks(), audio);
			// Audio has been rejected
			toastr.warning("Our audio stream has been rejected, viewers won't hear us");
		}
		const video = answer["video_codec"];
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

	publisher.on_mediaState((type, receiving) => {
		mediaState(type, receiving);
	});

	publisher.on_connectionstatechange((iceConnectionState) => {
		if (iceConnectionState !== "connected") {
			$("#videolocal").parent().parent().block({
				message: "<b>Publishing...</b>",
				css: {
					border: "none",
					backgroundColor: "transparent",
					color: "white"
				}
			});
		}

		if (iceConnectionState === "failed") {
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

		if (iceConnectionState === "disconnected") {
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

		if (iceConnectionState === "closed") {
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


	publisher.on_webrtcState(async (on) => {

		logger.info("Janus says this WebRTC PeerConnection is " + (on ? "up" : "down") + " now");
		await webrtcState(on);
		if (!on) {
			oncleanup();
		}
	});


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
				await publisher.unpublish();
				window.location.reload();
				// transport.dispose();
			});
	});

}


function onlocalstream(stream: WebRTCMediaStream) {
	logger.debug(" ::: Got a local stream :::", stream);
	$("#videojoin").hide();
	$("#videos").removeClass("hide").show();
	if ($("#myvideo").length === 0) {
		$("#videolocal").append("<video class=\"rounded centered\" id=\"myvideo\" width=\"100%\" height=\"100%\" autoplay playsinline muted=\"muted\"/>");
		// Add a 'mute' button
		$("#videolocal").append("<button class=\"btn btn-warning btn-xs\" id=\"mute\" style=\"position: absolute; bottom: 0px; left: 0px; margin: 15px;\">Mute</button>");
		$("#mute").click(() => {
			publisher.toggleMute();
		});
		// Add an 'unpublish' button
		$("#videolocal").append("<button class=\"btn btn-warning btn-xs\" id=\"unpublish\" style=\"position: absolute; bottom: 0px; right: 0px; margin: 15px;\">Unpublish</button>");
		$("#unpublish").click(unpublishOwnFeed);
	}
	$("#publisher").removeClass("hide").html(myusername).show();

	const htmlConnector = new janus.WebRTCMediaTarget(loggerFactory, stream);
	const myvideo = htmlConnector.attachToHTMLVideoElement($("#myvideo").get(0) as HTMLVideoElement);
	myvideo.muted = true;

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

async function newRemoteStream(subscriber: janus.IPublisher) {
	if (!subscriptions[subscriber.id]) {
		try {
			const videoSubscriber = new VideoRoomSubscriber(loggerFactory, janusClient, webrtc, chatroom, subscriber, publisher.private_id);

			videoSubscriber.on_attached((subscriber_id) => {
				const rfindex = subscriptions[subscriber.id].rfindex!; // should be populated by this time
				const rfdisplay = videoSubscriber.subscription.display;
				$("#remote" + rfindex).removeClass("hide").html(rfdisplay).show();
			});

			videoSubscriber.on_webrtcState((on, reason) => {
				const rfindex = subscriptions[subscriber.id].rfindex!; // should be populated by this time
				logger.info("Janus says this WebRTC PeerConnection (feed #" + rfindex + ") is " + (on ? "up" : "down") + " now");

				if (on) {
					$("#videoremote" + rfindex + " .error-video-container").remove();
					$("#remotevideo" + rfindex).removeClass("hide").show();
				} else {
					// No remote video
					$("#remotevideo" + rfindex).hide();
					if ($("#videoremote" + rfindex + " .no-video-container").length === 0) {
						$("#videoremote" + rfindex).append(
							"<div class=\"error-video-container\">" +
							"<i class=\"fa fa-video-camera fa-5 no-video-icon\"></i>" +
							`<span class=\"no-video-text\">Not Connected - ${reason}</span>` +
							"</div>");
					}

				}
			});

			videoSubscriber.on_bitrate((bitrate) => {
				const rfindex = subscriptions[subscriber.id].rfindex!; // should be populated by this time
				$("#curbitrate" + rfindex).removeClass("hide").show();
				$("#curbitrate" + rfindex).text(bitrate);
				// Check if the resolution changed too
				const width = ($("#remotevideo" + rfindex).get(0) as HTMLVideoElement).videoWidth;
				const height = ($("#remotevideo" + rfindex).get(0) as HTMLVideoElement).videoHeight;
				if (width > 0 && height > 0) {
					$("#curres" + rfindex).removeClass("hide").text(width + "x" + height).show();
				}
			});


			videoSubscriber.on_connectionstatechange((iceConnectionState) => {
				const rfindex = subscriptions[subscriber.id].rfindex!; // should be populated by this time
				if (iceConnectionState !== "connected") {
					$("#videoremote" + rfindex).parent().block({
						message: "<b>Receiving...</b>",
						css: {
							border: "none",
							backgroundColor: "transparent",
							color: "white"
						}
					});
				} else {
					$("#videoremote" + rfindex).parent().unblock();
				}

				if (iceConnectionState === "failed") {
					logger.error("Connection Failed", videoSubscriber.subscription);
					// Video has been rejected
					toastr.warning("Connection Failed to " + videoSubscriber.subscription.display);
					// Hide the webcam video
				}

				if (iceConnectionState === "disconnected") {
					logger.warn("Connection Lost", videoSubscriber.subscription);
					// Video has been rejected
					toastr.warning("Connection Lost to " + videoSubscriber.subscription.display);
					// Hide the webcam video
				}

				if (iceConnectionState === "closed") {
					logger.warn("Connection Closed", videoSubscriber.subscription);
					// Video has been rejected
					toastr.warning("Connection Closed to " + videoSubscriber.subscription.display);
					// Hide the webcam video
				}


			});


			videoSubscriber.on_remotestreams((streams) => {
				const rfindex = subscriptions[subscriber.id].rfindex!; // should be populated by this time
				logger.debug("Remote feed #" + rfindex);

				let addButtons = false;
				if ($("#remotevideo" + rfindex).length === 0) {
					addButtons = true;
					// No remote video yet
					$("#videoremote" + rfindex).append("<video class=\"rounded centered\" id=\"waitingvideo" + rfindex + "\" width=320 height=240 />");
					$("#videoremote" + rfindex).append("<video class=\"rounded centered relative hide\" id=\"remotevideo" + rfindex + "\" width=\"100%\" height=\"100%\" autoplay playsinline/>");
					$("#videoremote" + rfindex).append(
						"<span class=\"label label-primary hide\" id=\"curres" + rfindex + "\" style=\"position: absolute; bottom: 0px; left: 0px; margin: 15px;\"></span>" +
						"<span class=\"label label-info hide\" id=\"curbitrate" + rfindex + "\" style=\"position: absolute; bottom: 0px; right: 0px; margin: 15px;\"></span>");
					// Show the video, hide the spinner and show the resolution when we get a playing event
					$("#remotevideo" + rfindex).bind("playing", (playingEvent) => {
						const thisVideoElement = playingEvent.target as HTMLVideoElement;
						// if (remoteFeed.spinner !== undefined && remoteFeed.spinner !== null)
						// 	remoteFeed.spinner.stop();
						// remoteFeed.spinner = undefined;
						$("#waitingvideo" + rfindex).remove();
						if (thisVideoElement.videoWidth)
							$("#remotevideo" + rfindex).removeClass("hide").show();
						const elWidth = thisVideoElement.videoWidth;
						const elHeight = thisVideoElement.videoHeight;
						$("#curres" + rfindex).removeClass("hide").text(elWidth + "x" + elHeight).show();
						if (adapter.browserDetails.browser === "firefox") {
							// Firefox Stable has a bug: width and height are not immediately available after a playing
							setTimeout(() => {
								const width = ($("#remotevideo" + rfindex).get(0) as HTMLVideoElement).videoWidth;
								const height = ($("#remotevideo" + rfindex).get(0) as HTMLVideoElement).videoHeight;
								$("#curres" + rfindex).removeClass("hide").text(width + "x" + height).show();
							}, 2000);
						}
					});
				}

				const mediaTarget = new janus.WebRTCMediaTarget(loggerFactory, streams[0]);
				mediaTarget.attachToHTMLVideoElement($("#remotevideo" + rfindex).get(0) as HTMLVideoElement);
				// Janus.attachMediaStream(($("#remotevideo" + rfindex).get(0) as HTMLVideoElement), streams[0].mediaStream);
				const videoTracks = streams[0].getVideoTracks();
				if (videoTracks === null || videoTracks === undefined || videoTracks.length === 0) {
					// No remote video
					$("#remotevideo" + rfindex).hide();
					if ($("#videoremote" + rfindex + " .no-video-container").length === 0) {
						$("#videoremote" + rfindex).append(
							"<div class=\"no-video-container\">" +
							"<i class=\"fa fa-video-camera fa-5 no-video-icon\"></i>" +
							"<span class=\"no-video-text\">No remote video available</span>" +
							"</div>");
					}
				} else {
					$("#videoremote" + rfindex + " .no-video-container").remove();
					$("#remotevideo" + rfindex).removeClass("hide").show();
				}
				if (!addButtons)
					return;

			});

			videoSubscriber.on_temporal_substream((event) => {
				const subscription = subscriptions[subscriber.id];
				const rfindex = subscription.rfindex!; // should be populated by this time
				const videoCodec = subscription.subscriber!.subscription.video_codec;
				// Check if we got an event on a simulcast-related event from this publisher
				const substream = event.substream;
				const temporal = event.temporal;
				if ((substream) || (temporal)) {
					if (!this.simulcastStarted) {
						this.simulcastStarted = true;
						// Add some new buttons
						addSimulcastButtons(rfindex, videoCodec === "vp8" || videoCodec === "h264");
					}
					// We just received notice that there's been a switch, update the buttons
					updateSimulcastButtons(rfindex, substream!, temporal!);
				}
			});



			subscriptions[subscriber.id] = {
				subscriber: videoSubscriber
			};

			for (let i = 1; i < 6; i++) {
				const existing_subscriber = Object.keys(subscriptions).find(v => subscriptions[v as any].rfindex === i);
				if (!existing_subscriber) {
					logger.debug("setting", subscriber.id, "as feed number", i);
					subscriptions[subscriber.id].rfindex = i;
					break;
				}
			}

			await videoSubscriber.initialize();

		} catch (error) {
			logger.error("  -- Error attaching plugin...", error);
			bootbox.alert("Error attaching plugin... " + error);
		}




	}
}

function oncleanup() {
	logger.info(" ::: Got a cleanup notification: we are unpublished now :::");
	// myStream = undefined;
	$("#videolocal").html("<button id=\"publish\" class=\"btn btn-primary\">Publish</button>");
	$("#publish").click(() => { publisher.publishOwnFeed(true, doSimulcast).catch((error) => logger.error("Unable to publish", error)); });
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
		await publisher.joinRoom(chatroom, username);

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
		await publisher.configureBitrate(bitrate);
		return false;
	});
}

$(document).ready(() => {
	setTimeout(async () => {
		on_document_ready();
	}, 0);
});



async function unpublishOwnFeed() {
	// Unpublish our stream
	$("#unpublish").attr("disabled", "disabled").unbind("click");

	await publisher.unpublish();
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
		.unbind("click").click(async () => {
			toastr.info("Switching simulcast substream, wait for it... (lower quality)", undefined, { timeOut: 2000 });
			if (!$("#sl" + index + "-2").hasClass("btn-success"))
				$("#sl" + index + "-2").removeClass("btn-primary btn-info").addClass("btn-primary");
			if (!$("#sl" + index + "-1").hasClass("btn-success"))
				$("#sl" + index + "-1").removeClass("btn-primary btn-info").addClass("btn-primary");
			$("#sl" + index + "-0").removeClass("btn-primary btn-info btn-success").addClass("btn-info");
			await subscriptions[index].subscriber!.configureSubstream(0);
		});
	$("#sl" + index + "-1").removeClass("btn-primary btn-success").addClass("btn-primary")
		.unbind("click").click(async () => {
			toastr.info("Switching simulcast substream, wait for it... (normal quality)", undefined, { timeOut: 2000 });
			if (!$("#sl" + index + "-2").hasClass("btn-success"))
				$("#sl" + index + "-2").removeClass("btn-primary btn-info").addClass("btn-primary");
			$("#sl" + index + "-1").removeClass("btn-primary btn-info btn-success").addClass("btn-info");
			if (!$("#sl" + index + "-0").hasClass("btn-success"))
				$("#sl" + index + "-0").removeClass("btn-primary btn-info").addClass("btn-primary");
			await subscriptions[index].subscriber!.configureSubstream(1);
		});
	$("#sl" + index + "-2").removeClass("btn-primary btn-success").addClass("btn-primary")
		.unbind("click").click(async () => {
			toastr.info("Switching simulcast substream, wait for it... (higher quality)", undefined, { timeOut: 2000 });
			$("#sl" + index + "-2").removeClass("btn-primary btn-info btn-success").addClass("btn-info");
			if (!$("#sl" + index + "-1").hasClass("btn-success"))
				$("#sl" + index + "-1").removeClass("btn-primary btn-info").addClass("btn-primary");
			if (!$("#sl" + index + "-0").hasClass("btn-success"))
				$("#sl" + index + "-0").removeClass("btn-primary btn-info").addClass("btn-primary");

			await subscriptions[index].subscriber!.configureSubstream(2);

		});
	if (!temporal)	// No temporal layer support
		return;
	$("#tl" + index + "-0").parent().removeClass("hide");
	$("#tl" + index + "-0").removeClass("btn-primary btn-success").addClass("btn-primary")
		.unbind("click").click(async () => {
			toastr.info("Capping simulcast temporal layer, wait for it... (lowest FPS)", undefined, { timeOut: 2000 });
			if (!$("#tl" + index + "-2").hasClass("btn-success"))
				$("#tl" + index + "-2").removeClass("btn-primary btn-info").addClass("btn-primary");
			if (!$("#tl" + index + "-1").hasClass("btn-success"))
				$("#tl" + index + "-1").removeClass("btn-primary btn-info").addClass("btn-primary");
			$("#tl" + index + "-0").removeClass("btn-primary btn-info btn-success").addClass("btn-info");
			await subscriptions[index].subscriber!.configureTemporal(0);

		});
	$("#tl" + index + "-1").removeClass("btn-primary btn-success").addClass("btn-primary")
		.unbind("click").click(async () => {
			toastr.info("Capping simulcast temporal layer, wait for it... (medium FPS)", undefined, { timeOut: 2000 });
			if (!$("#tl" + index + "-2").hasClass("btn-success"))
				$("#tl" + index + "-2").removeClass("btn-primary btn-info").addClass("btn-primary");
			$("#tl" + index + "-1").removeClass("btn-primary btn-info").addClass("btn-info");
			if (!$("#tl" + index + "-0").hasClass("btn-success"))
				$("#tl" + index + "-0").removeClass("btn-primary btn-info").addClass("btn-primary");

			await subscriptions[index].subscriber!.configureTemporal(1);

		});
	$("#tl" + index + "-2").removeClass("btn-primary btn-success").addClass("btn-primary")
		.unbind("click").click(async () => {
			toastr.info("Capping simulcast temporal layer, wait for it... (highest FPS)", undefined, { timeOut: 2000 });
			$("#tl" + index + "-2").removeClass("btn-primary btn-info btn-success").addClass("btn-info");
			if (!$("#tl" + index + "-1").hasClass("btn-success"))
				$("#tl" + index + "-1").removeClass("btn-primary btn-info").addClass("btn-primary");
			if (!$("#tl" + index + "-0").hasClass("btn-success"))
				$("#tl" + index + "-0").removeClass("btn-primary btn-info").addClass("btn-primary");

			await subscriptions[index].subscriber!.configureTemporal(2);

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