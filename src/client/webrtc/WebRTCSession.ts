// import { ILoggerFactory } from "../../logger/ILoggerFactory";
// import { ILogger } from "../../logger/ILogger";
// import { WebRTCPeerOptions } from "./WebRTCPeerConnection";
// import adapter from "webrtc-adapter";

// export class WebRTCSession {
// 	private _logger: ILogger;

// 	private media: {
// 		audio: boolean;
// 		video: boolean | "screen" | "window" | "lowres" | "lowres-16:9" | "hires" | "hires-16:9" | "hdres" | "fhdres" | "4kres" | "stdres" | "stdres-16:9";
// 		update: boolean;
// 		addAudio: boolean;
// 		replaceAudio: boolean;
// 		audioSend: boolean;
// 		audioRecv: boolean;
// 		videoRecv: boolean;
// 		removeAudio: boolean;
// 		addVideo: boolean;
// 		replaceVideo: boolean;
// 		removeVideo: boolean;
// 		videoSend: boolean;
// 		addData: boolean;
// 		data: boolean;
// 		screenshareFrameRate: number;
// 		failIfNoAudio: boolean;
// 		failIfNoVideo: boolean;
// 		keepAudio: boolean;
// 		keepVideo: boolean;
// 		captureDesktopAudio: boolean;
// 	};
// 	private myStream?: MediaStream;

// 	constructor(
// 		public readonly loggerFactory: ILoggerFactory) {
// 		this._logger = loggerFactory.create("WebRTC");
// 	}

// 	public prepareWebrtc(jsep: RTCSessionDescriptionInit, stream: MediaStream, opts: WebRTCPeerOptions) {
// 		this.trickle = this.isTrickleEnabled(opts);
// 		// Are we updating a session?
// 		if (this.pc === undefined || this.pc === null) {
// 			// Nope, new PeerConnection
// 			this.media.update = false;
// 		} else if (this.pc !== undefined && this.pc !== null) {
// 			this._logger.info("Updating existing media session");
// 			this.media.update = true;
// 			// Check if there's anything do add/remove/replace, or if we
// 			// can go directly to preparing the new SDP offer or answer
// 			if (stream !== null && stream !== undefined) {
// 				// External stream: is this the same as the one we were using before?
// 				if (stream !== this.myStream) {
// 					this._logger.info("Renegotiation involves a new external stream");
// 				}
// 			} else {
// 				// Check if there are changes on audio
// 				if (this.media.addAudio) {
// 					this.media.replaceAudio = false;
// 					this.media.removeAudio = false;
// 					this.media.audioSend = true;
// 					if (this.myStream && this.myStream.getAudioTracks() && this.myStream.getAudioTracks().length) {
// 						this._logger.error("Can't add audio stream, there already is one");
// 						throw new Error("Can't add audio stream, there already is one");
// 					}
// 				} else if (this.media.removeAudio) {
// 					this.media.replaceAudio = false;
// 					this.media.addAudio = false;
// 					this.media.audioSend = false;
// 				} else if (this.media.replaceAudio) {
// 					this.media.addAudio = false;
// 					this.media.removeAudio = false;
// 					this.media.audioSend = true;
// 				}
// 				if (this.myStream === null || this.myStream === undefined) {
// 					// No media stream: if we were asked to replace, it's actually an "add"
// 					if (this.media.replaceAudio) {
// 						this.media.replaceAudio = false;
// 						this.media.addAudio = true;
// 						this.media.audioSend = true;
// 					}
// 					if (this.isAudioSendEnabled())
// 						this.media.addAudio = true;
// 				} else {
// 					if (this.myStream.getAudioTracks() === null
// 						|| this.myStream.getAudioTracks() === undefined
// 						|| this.myStream.getAudioTracks().length === 0) {
// 						// No audio track: if we were asked to replace, it's actually an "add"
// 						if (this.media.replaceAudio) {
// 							this.media.replaceAudio = false;
// 							this.media.addAudio = true;
// 							this.media.audioSend = true;
// 						}
// 						if (this.isAudioSendEnabled())
// 							this.media.addAudio = true;
// 					}
// 				}
// 				// Check if there are changes on video
// 				if (this.media.addVideo) {
// 					this.media.replaceVideo = false;
// 					this.media.removeVideo = false;
// 					this.media.videoSend = true;
// 					if (this.myStream && this.myStream.getVideoTracks() && this.myStream.getVideoTracks().length) {
// 						this._logger.error("Can't add video stream, there already is one");
// 						throw new Error("Can't add video stream, there already is one");
// 					}
// 				} else if (this.media.removeVideo) {
// 					this.media.replaceVideo = false;
// 					this.media.addVideo = false;
// 					this.media.videoSend = false;
// 				} else if (this.media.replaceVideo) {
// 					this.media.addVideo = false;
// 					this.media.removeVideo = false;
// 					this.media.videoSend = true;
// 				}
// 				if (this.myStream === null || this.myStream === undefined) {
// 					// No media stream: if we were asked to replace, it's actually an "add"
// 					if (this.media.replaceVideo) {
// 						this.media.replaceVideo = false;
// 						this.media.addVideo = true;
// 						this.media.videoSend = true;
// 					}
// 					if (this.isVideoSendEnabled())
// 						this.media.addVideo = true;
// 				} else {
// 					if (this.myStream.getVideoTracks() === null
// 						|| this.myStream.getVideoTracks() === undefined
// 						|| this.myStream.getVideoTracks().length === 0) {
// 						// No video track: if we were asked to replace, it's actually an "add"
// 						if (this.media.replaceVideo) {
// 							this.media.replaceVideo = false;
// 							this.media.addVideo = true;
// 							this.media.videoSend = true;
// 						}
// 						if (this.isVideoSendEnabled())
// 							this.media.addVideo = true;
// 					}
// 				}
// 				// Data channels can only be added
// 				if (this.media.addData)
// 					this.media.data = true;
// 			}
// 		}
// 		// If we're updating, check if we need to remove/replace one of the tracks
// 		if (this.media.update && !this.streamExternal) {
// 			if (this.media.removeAudio || this.media.replaceAudio) {
// 				if (this.myStream && this.myStream.getAudioTracks() && this.myStream.getAudioTracks().length) {
// 					const s = this.myStream.getAudioTracks()[0];
// 					this._logger.info("Removing audio track:", s);
// 					this.myStream.removeTrack(s);
// 					try {
// 						s.stop();
// 					} catch (e) {
// 						this._logger.warn("Unable to stop track", e);
// 					}
// 				}
// 				if (this.pc.getSenders() && this.pc.getSenders().length) {
// 					let ra = true;
// 					if (this.media.replaceAudio && adapter.browserDetails.browser === "firefox") {
// 						// On Firefox we can use replaceTrack
// 						ra = false;
// 					}
// 					if (ra) {
// 						for (const s of this.pc.getSenders()) {
// 							if (s && s.track && s.track.kind === "audio") {
// 								this._logger.info("Removing audio sender:", s);
// 								this.pc.removeTrack(s);
// 							}
// 						}
// 					}
// 				}
// 			}
// 			if (this.media.removeVideo || this.media.replaceVideo) {
// 				if (this.myStream && this.myStream.getVideoTracks() && this.myStream.getVideoTracks().length) {
// 					const s = this.myStream.getVideoTracks()[0];
// 					this._logger.info("Removing video track:", s);
// 					this.myStream.removeTrack(s);
// 					try {
// 						s.stop();
// 					} catch (e) {
// 						this._logger.warn("Unable to stop track", e);
// 					}
// 				}
// 				if (this.pc.getSenders() && this.pc.getSenders().length) {
// 					let rv = true;
// 					if (this.media.replaceVideo && adapter.browserDetails.browser === "firefox") {
// 						// On Firefox we can use replaceTrack
// 						rv = false;
// 					}
// 					if (rv) {
// 						for (const s of this.pc.getSenders()) {
// 							if (s && s.track && s.track.kind === "video") {
// 								this._logger.info("Removing video sender:", s);
// 								this.pc.removeTrack(s);
// 							}
// 						}
// 					}
// 				}
// 			}
// 		}
// 		// Was a MediaStream object passed, or do we need to take care of that?
// 		if (stream !== null && stream !== undefined) {
// 			this._logger.info("MediaStream provided by the application");
// 			this._logger.debug(stream);
// 			// If this is an update, let's check if we need to release the previous stream
// 			if (this.media.update) {
// 				if (this.myStream && this.myStream !== stream && !this.streamExternal) {
// 					// We're replacing a stream we captured ourselves with an external one
// 					try {
// 						// Try a MediaStreamTrack.stop() for each track
// 						const tracks = this.myStream.getTracks();
// 						for (const mst of tracks) {
// 							this._logger.info(mst);
// 							if (mst !== null && mst !== undefined)
// 								mst.stop();
// 						}
// 					} catch (e) {
// 						// Do nothing if this fails
// 					}
// 					this.myStream = undefined;
// 				}
// 			}
// 			// Skip the getUserMedia part
// 			this.streamExternal = true;
// 			streamsDone(handleId, jsep, media, callbacks, stream);
// 			return;
// 		}
// 		if (this.isAudioSendEnabled() || this.isVideoSendEnabled()) {
// 			let constraints = { mandatory: {}, optional: [] };
// 			pluginHandle.consentDialog(true);
// 			let audioSupport = this.isAudioSendEnabled();
// 			if (audioSupport === true && this.media !== undefined && this.media != null) {
// 				if (typeof this.media.audio === "object") {
// 					audioSupport = this.media.audio;
// 				}
// 			}
// 			let videoSupport = this.isVideoSendEnabled();
// 			if (videoSupport === true && this.media !== undefined && this.media != null) {
// 				const simulcast = this.isSimulcast(opts); // callbacks.simulcast === true ? true : false;
// 				if (simulcast && !jsep && (this.media.video === undefined || this.media.video === false))
// 					this.media.video = "hires";
// 				if (this.media.video && this.media.video !== "screen" && this.media.video !== "window") {
// 					if (typeof this.media.video === "object") {
// 						videoSupport = this.media.video;
// 					} else {
// 						let width = 0;
// 						let height = 0;
// 						let maxHeight = 0;
// 						if (this.media.video === "lowres") {
// 							// Small resolution, 4:3
// 							height = 240;
// 							maxHeight = 240;
// 							width = 320;
// 						} else if (this.media.video === "lowres-16:9") {
// 							// Small resolution, 16:9
// 							height = 180;
// 							maxHeight = 180;
// 							width = 320;
// 						} else if (this.media.video === "hires" || this.media.video === "hires-16:9" || this.media.video === "hdres") {
// 							// High(HD) resolution is only 16:9
// 							height = 720;
// 							maxHeight = 720;
// 							width = 1280;
// 						} else if (this.media.video === "fhdres") {
// 							// Full HD resolution is only 16:9
// 							height = 1080;
// 							maxHeight = 1080;
// 							width = 1920;
// 						} else if (this.media.video === "4kres") {
// 							// 4K resolution is only 16:9
// 							height = 2160;
// 							maxHeight = 2160;
// 							width = 3840;
// 						} else if (this.media.video === "stdres") {
// 							// Normal resolution, 4:3
// 							height = 480;
// 							maxHeight = 480;
// 							width = 640;
// 						} else if (this.media.video === "stdres-16:9") {
// 							// Normal resolution, 16:9
// 							height = 360;
// 							maxHeight = 360;
// 							width = 640;
// 						} else {
// 							this._logger.info("Default video setting is stdres 4:3");
// 							height = 480;
// 							maxHeight = 480;
// 							width = 640;
// 						}
// 						this._logger.info("Adding media constraint:", this.media.video);
// 						videoSupport = {
// 							"height": { "ideal": height },
// 							"width": { "ideal": width }
// 						};
// 						this._logger.info("Adding video constraint:", videoSupport);
// 					}
// 				} else if (this.media.video === "screen" || this.media.video === "window") {
// 					if (!this.media.screenshareFrameRate) {
// 						this.media.screenshareFrameRate = 3;
// 					}
// 					// Not a webcam, but screen capture
// 					if (window.location.protocol !== "https:") {
// 						// Screen sharing mandates HTTPS
// 						this._logger.warn("Screen sharing only works on HTTPS, try the https:// version of this page");
// 						pluginHandle.consentDialog(false);
// 						throw new Error("Screen sharing only works on HTTPS, try the https:// version of this page");
// 					}
// 					// We're going to try and use the extension for Chrome 34+, the old approach
// 					// for older versions of Chrome, or the experimental support in Firefox 33+
// 					function callbackUserMedia(error, stream) {
// 						pluginHandle.consentDialog(false);
// 						if (error) {
// 							callbacks.error(error);
// 						} else {
// 							streamsDone(handleId, jsep, media, callbacks, stream);
// 						}
// 					}
// 					function getScreenMedia(constraints, gsmCallback, useAudio) {
// 						this._logger.info("Adding media constraint (screen capture)");
// 						this._logger.debug(constraints);
// 						navigator.mediaDevices.getUserMedia(constraints)
// 							.then(function (stream) {
// 								if (useAudio) {
// 									navigator.mediaDevices.getUserMedia({ audio: true, video: false })
// 										.then(function (audioStream) {
// 											stream.addTrack(audioStream.getAudioTracks()[0]);
// 											gsmCallback(null, stream);
// 										});
// 								} else {
// 									gsmCallback(null, stream);
// 								}
// 							})
// 							.catch(function (error) { pluginHandle.consentDialog(false); gsmCallback(error); });
// 					}
// 					if (adapter.browserDetails.browser === "chrome") {
// 						const chromever = adapter.browserDetails.version!;
// 						let maxver = 33;
// 						if (window.navigator.userAgent.match("Linux"))
// 							maxver = 35;	// "known" crash in chrome 34 and 35 on linux
// 						if (chromever >= 26 && chromever <= maxver) {
// 							// Chrome 26->33 requires some awkward chrome://flags manipulation
// 							constraints = {
// 								video: {
// 									mandatory: {
// 										googLeakyBucket: true,
// 										maxWidth: window.screen.width,
// 										maxHeight: window.screen.height,
// 										minFrameRate: this.media.screenshareFrameRate,
// 										maxFrameRate: this.media.screenshareFrameRate,
// 										chromeMediaSource: "screen"
// 									}
// 								},
// 								audio: this.isAudioSendEnabled()
// 							};
// 							getScreenMedia(constraints, callbackUserMedia);
// 						} else {
// 							// Chrome 34+ requires an extension
// 							Janus.extension.getScreen(function (error, sourceId) {
// 								if (error) {
// 									pluginHandle.consentDialog(false);
// 									return callbacks.error(error);
// 								}
// 								constraints = {
// 									audio: false,
// 									video: {
// 										mandatory: {
// 											chromeMediaSource: "desktop",
// 											maxWidth: window.screen.width,
// 											maxHeight: window.screen.height,
// 											minFrameRate: this.media.screenshareFrameRate,
// 											maxFrameRate: this.media.screenshareFrameRate,
// 										},
// 										optional: [
// 											{ googLeakyBucket: true },
// 											{ googTemporalLayeredScreencast: true }
// 										]
// 									}
// 								};
// 								constraints.video.mandatory.chromeMediaSourceId = sourceId;
// 								getScreenMedia(constraints, callbackUserMedia, isAudioSendEnabled(media));
// 							});
// 						}
// 					} else if (window.navigator.userAgent.match("Firefox")) {
// 						const ffver = parseInt((window.navigator.userAgent.match(/Firefox\/(.*)/) || [])[1], 10);
// 						if (ffver >= 33) {
// 							// Firefox 33+ has experimental support for screen sharing
// 							constraints = {
// 								video: {
// 									mozMediaSource: this.media.video,
// 									mediaSource: this.media.video
// 								},
// 								audio: isAudioSendEnabled(media)
// 							};
// 							getScreenMedia(constraints, function (err, stream) {
// 								callbackUserMedia(err, stream);
// 								// Workaround for https://bugzilla.mozilla.org/show_bug.cgi?id=1045810
// 								if (!err) {
// 									let lastTime = stream.currentTime;
// 									const polly = window.setInterval(function () {
// 										if (!stream)
// 											window.clearInterval(polly);
// 										if (stream.currentTime === lastTime) {
// 											window.clearInterval(polly);
// 											if (stream.onended) {
// 												stream.onended();
// 											}
// 										}
// 										lastTime = stream.currentTime;
// 									}, 500);
// 								}
// 							});
// 						} else {
// 							const error = new Error("NavigatorUserMediaError");
// 							error.name = "Your version of Firefox does not support screen sharing, please install Firefox 33 (or more recent versions)";
// 							pluginHandle.consentDialog(false);
// 							callbacks.error(error);
// 							return;
// 						}
// 					}
// 					return;
// 				}
// 			}
// 			// If we got here, we're not screensharing
// 			if (media === null || media === undefined || this.media.video !== "screen") {
// 				// Check whether all media sources are actually available or not
// 				navigator.mediaDevices.enumerateDevices().then(function (devices) {
// 					const audioExist = devices.some((device) => {
// 						return device.kind === "audioinput";
// 					});
// 					const videoExist = devices.some((device) => {
// 						return device.kind === "videoinput";
// 					});

// 					// Check whether a missing device is really a problem
// 					const audioSend = this.isAudioSendEnabled();
// 					const videoSend = this.isVideoSendEnabled();
// 					const needAudioDevice = this.isAudioSendRequired();
// 					const needVideoDevice = this.isVideoSendRequired();
// 					if (audioSend || videoSend || needAudioDevice || needVideoDevice) {
// 						// We need to send either audio or video
// 						const haveAudioDevice = audioSend ? audioExist : false;
// 						const haveVideoDevice = videoSend ? videoExist : false;
// 						if (!haveAudioDevice && !haveVideoDevice) {
// 							// FIXME Should we really give up, or just assume recvonly for both?
// 							pluginHandle.consentDialog(false);
// 							throw new Error("No capture device found");
// 							return false;
// 						} else if (!haveAudioDevice && needAudioDevice) {
// 							pluginHandle.consentDialog(false);
// 							throw new Error("Audio capture is required, but no capture device found");
// 							return false;
// 						} else if (!haveVideoDevice && needVideoDevice) {
// 							pluginHandle.consentDialog(false);
// 							throw new Error("Video capture is required, but no capture device found");
// 							return false;
// 						}
// 					}

// 					const gumConstraints = {
// 						audio: audioExist ? audioSupport : false,
// 						video: videoExist ? videoSupport : false
// 					};
// 					this._logger.debug("getUserMedia constraints", gumConstraints);
// 					navigator.mediaDevices.getUserMedia(gumConstraints)
// 						.then(function (stream) { pluginHandle.consentDialog(false); streamsDone(handleId, jsep, media, callbacks, stream); })
// 						.catch(function (error) { pluginHandle.consentDialog(false); callbacks.error({ code: error.code, name: error.name, message: error.message }); });
// 				})
// 					.catch(function (error) {
// 						pluginHandle.consentDialog(false);
// 						throw new Error("enumerateDevices error", error);
// 					});
// 			}
// 		} else {
// 			// No need to do a getUserMedia, create offer/answer right away
// 			streamsDone(handleId, jsep, media, callbacks);
// 		}
// 	}
// 	private isTrickleEnabled(opts: WebRTCPeerOptions): boolean {
// 		throw new Error("Method not implemented.");
// 	}
// 	private isSimulcast(opts: WebRTCPeerOptions): boolean {
// 		throw new Error("Method not implemented.");
// 	}
// 	private isVideoSendEnabled(): boolean {
// 		throw new Error("Method not implemented.");
// 	}
// 	private isAudioSendEnabled(): boolean {
// 		throw new Error("Method not implemented.");
// 	}


// 	private streamsDone(stream: MediaStream) {
// 		this._logger.debug("streamsDone:", stream);
// 		if(stream) {
// 			this._logger.debug("  -- Audio tracks:", stream.getAudioTracks());
// 			this._logger.debug("  -- Video tracks:", stream.getVideoTracks());
// 		}
// 		// We're now capturing the new stream: check if we're updating or if it's a new thing
// 		let addTracks = false;
// 		if(!this.myStream || !this.media.update || this.streamExternal) {
// 			this.myStream = stream;
// 			addTracks = true;
// 		} else {
// 			// We only need to update the existing stream
// 			if(((!media.update && this.isAudioSendEnabled()) || (media.update && (media.addAudio || media.replaceAudio))) &&
// 					stream.getAudioTracks() && stream.getAudioTracks().length) {
// 				this.myStream.addTrack(stream.getAudioTracks()[0]);
// 				if(media.replaceAudio && adapter.browserDetails.browser === "firefox") {
// 					this._logger.info("Replacing audio track:", stream.getAudioTracks()[0]);
// 					for(const s of this.pc.getSenders()) {
// 						if(s && s.track && s.track.kind === "audio") {
// 							s.replaceTrack(stream.getAudioTracks()[0]);
// 						}
// 					}
// 				} else {
// 					if(adapter.browserDetails.browser === "firefox" && adapter.browserDetails.version! >= 59) {
// 						// Firefox >= 59 uses Transceivers
// 						this._logger.info((media.replaceVideo ? "Replacing" : "Adding") + " video track:", stream.getVideoTracks()[0]);
// 						let audioTransceiver = null;
// 						const transceivers = this.pc.getTransceivers();
// 						if(transceivers && transceivers.length > 0) {
// 							for(const t of transceivers) {
// 								if((t.sender && t.sender.track && t.sender.track.kind === "audio") ||
// 										(t.receiver && t.receiver.track && t.receiver.track.kind === "audio")) {
// 									audioTransceiver = t;
// 									break;
// 								}
// 							}
// 						}
// 						if(audioTransceiver && audioTransceiver.sender) {
// 							audioTransceiver.sender.replaceTrack(stream.getVideoTracks()[0]);
// 						} else {
// 							this.pc.addTrack(stream.getVideoTracks()[0], stream);
// 						}
// 					} else {
// 						this._logger.info((media.replaceAudio ? "Replacing" : "Adding") + " audio track:", stream.getAudioTracks()[0]);
// 						this.pc.addTrack(stream.getAudioTracks()[0], stream);
// 					}
// 				}
// 			}
// 			if(((!media.update && this.isVideoSendEnabled(media)) || (media.update && (media.addVideo || media.replaceVideo))) &&
// 					stream.getVideoTracks() && stream.getVideoTracks().length) {
// 				this.myStream.addTrack(stream.getVideoTracks()[0]);
// 				if(media.replaceVideo && adapter.browserDetails.browser === "firefox") {
// 					this._logger.info("Replacing video track:", stream.getVideoTracks()[0]);
// 					for(const s of this.pc.getSenders()) {
// 						if(s && s.track && s.track.kind === "video") {
// 							s.replaceTrack(stream.getVideoTracks()[0]);
// 						}
// 					}
// 				} else {
// 					if(adapter.browserDetails.browser === "firefox" && adapter.browserDetails.version >= 59) {
// 						// Firefox >= 59 uses Transceivers
// 						this._logger.info((media.replaceVideo ? "Replacing" : "Adding") + " video track:", stream.getVideoTracks()[0]);
// 						let videoTransceiver = null;
// 						const transceivers = this.pc.getTransceivers();
// 						if(transceivers && transceivers.length > 0) {
// 							for(const t of transceivers) {
// 								if((t.sender && t.sender.track && t.sender.track.kind === "video") ||
// 										(t.receiver && t.receiver.track && t.receiver.track.kind === "video")) {
// 									videoTransceiver = t;
// 									break;
// 								}
// 							}
// 						}
// 						if(videoTransceiver && videoTransceiver.sender) {
// 							videoTransceiver.sender.replaceTrack(stream.getVideoTracks()[0]);
// 						} else {
// 							this.pc.addTrack(stream.getVideoTracks()[0], stream);
// 						}
// 					} else {
// 						this._logger.info((media.replaceVideo ? "Replacing" : "Adding") + " video track:", stream.getVideoTracks()[0]);
// 						this.pc.addTrack(stream.getVideoTracks()[0], stream);
// 					}
// 				}
// 			}
// 		}
// 		// If we still need to create a PeerConnection, let's do that
// 		if(!this.pc) {
// 			const pc_config = {"iceServers": iceServers, "iceTransportPolicy": iceTransportPolicy, "bundlePolicy": bundlePolicy};
// 			// ~ var pc_constraints = {'mandatory': {'MozDontOfferDataChannel':true}};
// 			const pc_constraints = {
// 				"optional": [{"DtlsSrtpKeyAgreement": true}]
// 			};
// 			if(ipv6Support === true) {
// 				pc_constraints.optional.push({"googIPv6":true});
// 			}
// 			// Any custom constraint to add?
// 			if(callbacks.rtcConstraints && typeof callbacks.rtcConstraints === "object") {
// 				this._logger.debug("Adding custom PeerConnection constraints:", callbacks.rtcConstraints);
// 				for(const i in callbacks.rtcConstraints) {
// 					pc_constraints.optional.push(callbacks.rtcConstraints[i]);
// 				}
// 			}
// 			if(adapter.browserDetails.browser === "edge") {
// 				// This is Edge, enable BUNDLE explicitly
// 				pc_config.bundlePolicy = "max-bundle";
// 			}
// 			this._logger.info("Creating PeerConnection");
// 			this._logger.debug(pc_constraints);
// 			this.pc = new RTCPeerConnection(pc_config, pc_constraints);
// 			this._logger.debug(this.pc);
// 			if(this.pc.getStats) {	// FIXME
// 				this.volume = {};
// 				this.bitrate.value = "0 kbits/sec";
// 			}
// 			this._logger.info("Preparing local SDP and gathering candidates (trickle=" + this.trickle + ")");
// 			this.pc.oniceconnectionstatechange = function(e) {
// 				if(this.pc)
// 					pluginHandle.iceState(this.pc.iceConnectionState);
// 			};
// 			this.pc.onicecandidate = function(event) {
// 				if (event.candidate == null ||
// 						(adapter.browserDetails.browser === "edge" && event.candidate.candidate.indexOf("endOfCandidates") > 0)) {
// 					this._logger.info("End of candidates.");
// 					this.iceDone = true;
// 					if(this.trickle === true) {
// 						// Notify end of candidates
// 						sendTrickleCandidate(handleId, {"completed": true});
// 					} else {
// 						// No trickle, time to send the complete SDP (including all candidates)
// 						sendSDP(handleId, callbacks);
// 					}
// 				} else {
// 					// JSON.stringify doesn't work on some WebRTC objects anymore
// 					// See https://code.google.com/p/chromium/issues/detail?id=467366
// 					const candidate = {
// 						"candidate": event.candidate.candidate,
// 						"sdpMid": event.candidate.sdpMid,
// 						"sdpMLineIndex": event.candidate.sdpMLineIndex
// 					};
// 					if(this.trickle === true) {
// 						// Send candidate
// 						sendTrickleCandidate(handleId, candidate);
// 					}
// 				}
// 			};
// 			this.pc.ontrack = function(event) {
// 				this._logger.info("Handling Remote Track");
// 				this._logger.debug(event);
// 				if(!event.streams)
// 					return;
// 				this.remoteStream = event.streams[0];
// 				pluginHandle.onremotestream(this.remoteStream);
// 				if(event.track && !event.track.onended) {
// 					this._logger.info("Adding onended callback to track:", event.track);
// 					event.track.onended = function(ev) {
// 						this._logger.info("Remote track removed:", ev);
// 						if(this.remoteStream) {
// 							this.remoteStream.removeTrack(ev.target);
// 							pluginHandle.onremotestream(this.remoteStream);
// 						}
// 					};
// 				}
// 			};
// 		}
// 		if(addTracks && stream !== null && stream !== undefined) {
// 			this._logger.info("Adding local stream");
// 			stream.getTracks().forEach(function(track) {
// 				this._logger.info("Adding local track:", track);
// 				this.pc.addTrack(track, stream);
// 			});
// 		}
// 		// Any data channel to create?
// 		if(isDataEnabled(media) && !this.dataChannel) {
// 			this._logger.info("Creating data channel");
// 			const onDataChannelMessage = function(event) {
// 				this._logger.info("Received message on data channel: " + event.data);
// 				pluginHandle.ondata(event.data);	// FIXME
// 			};
// 			const onDataChannelStateChange = function() {
// 				const dcState = this.dataChannel !== null ? this.dataChannel.readyState : "null";
// 				this._logger.info("State change on data channel: " + dcState);
// 				if(dcState === "open") {
// 					pluginHandle.ondataopen();	// FIXME
// 				}
// 			};
// 			const onDataChannelError = function(error) {
// 				Janus.error("Got error on data channel:", error);
// 				// TODO
// 			};
// 			// Until we implement the proxying of open requests within the Janus core, we open a channel ourselves whatever the case
// 			this.dataChannel = this.pc.createDataChannel("JanusDataChannel", {ordered:false});	// FIXME Add options (ordered, maxRetransmits, etc.)
// 			this.dataChannel.onmessage = onDataChannelMessage;
// 			this.dataChannel.onopen = onDataChannelStateChange;
// 			this.dataChannel.onclose = onDataChannelStateChange;
// 			this.dataChannel.onerror = onDataChannelError;
// 		}
// 		// If there's a new local stream, let's notify the application
// 		if(this.myStream)
// 			pluginHandle.onlocalstream(this.myStream);
// 		// Create offer/answer now
// 		if(jsep === null || jsep === undefined) {
// 			createOffer(handleId, media, callbacks);
// 		} else {
// 			this.pc.setRemoteDescription(
// 					new RTCSessionDescription(jsep),
// 					function() {
// 						this._logger.info("Remote description accepted!");
// 						this.remoteSdp = jsep.sdp;
// 						// Any trickle candidate we cached?
// 						if(this.candidates && this.candidates.length > 0) {
// 							for(const i in this.candidates) {
// 								const candidate = this.candidates[i];
// 								this._logger.debug("Adding remote candidate:", candidate);
// 								if(!candidate || candidate.completed === true) {
// 									// end-of-candidates
// 									this.pc.addIceCandidate();
// 								} else {
// 									// New candidate
// 									this.pc.addIceCandidate(new RTCIceCandidate(candidate));
// 								}
// 							}
// 							this.candidates = [];
// 						}
// 						// Create the answer now
// 						createAnswer(handleId, media, callbacks);
// 					}, callbacks.error);
// 		}
// 	}

// }