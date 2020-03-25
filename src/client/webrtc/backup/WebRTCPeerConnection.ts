// import adapter from "webrtc-adapter";
// import { ILoggerFactory } from "../../logger/ILoggerFactory";
// import { ILogger } from "../../logger/ILogger";
// import { EventEmitter } from "events";
// import { WebRTCMedia } from "./WebRTCMedia";

// export class WebRTCPeerConnection {
// 	private _logger: ILogger;
// 	private _eventEmitter = new EventEmitter();

// 	private media: WebRTCMedia;

// 	private peerConnection: RTCPeerConnection;
// 	private trickle: boolean;
// 	private remoteStream: MediaStream;
// 	private iceDone: boolean;
// 	private mySdp: {
// 		"type"?: "offer" | "pranswer" | "answer" | "rollback";
// 		"sdp"?: string;
// 		trickle?: boolean;
// 	};
// 	private sdpSent: boolean;

// 	private remoteSdp: string | undefined;

// 	private volume: {
// 		[stream: string]: {
// 			value?: number;
// 			timer?: NodeJS.Timeout | number;
// 		}
// 	};

// 	private bitrate: {
// 		value?: string;
// 		bsnow?: number;
// 		bsbefore?: number;
// 		tsnow?: number;
// 		tsbefore?: number;
// 		timer?: NodeJS.Timer | number;
// 	};

// 	private mediaConstraints: RTCOfferOptions;

// 	candidates?: (RTCIceCandidateInit & { "completed": true })[];


// 	constructor(
// 		public readonly loggerFactory: ILoggerFactory,
// 		public readonly iceServers?: RTCIceServer[],
// 		private readonly iceTransportPolicy?: RTCIceTransportPolicy,
// 		private bundlePolicy?: RTCBundlePolicy,
// 		private ipv6Support: boolean,
// 		private rtcConstraints: any,
// 		private simulcast?: boolean,
// 	) {

// 		this._logger = loggerFactory.create("WebRTCPeerConnection");
// 		const pc_config = { "iceServers": iceServers, "iceTransportPolicy": iceTransportPolicy, "bundlePolicy": bundlePolicy };
// 		const pc_constraints: {
// 			optional: any[]
// 		} = {
// 			"optional": [{ "DtlsSrtpKeyAgreement": true }]
// 		};
// 		if (ipv6Support === true) {
// 			pc_constraints.optional.push({ "googIPv6": true });
// 		}
// 		// Any custom constraint to add?
// 		if (rtcConstraints && typeof rtcConstraints === "object") {
// 			this._logger.debug("Adding custom PeerConnection constraints:", rtcConstraints);
// 			for (const i in rtcConstraints) {
// 				if (rtcConstraints.hasOwnProperty(i)) {
// 					pc_constraints.optional.push(rtcConstraints[i]);
// 				}
// 			}
// 		}
// 		if (adapter.browserDetails.browser === "edge") {
// 			// This is Edge, enable BUNDLE explicitly
// 			this.bundlePolicy = "max-bundle";
// 		}
// 		this._logger.info("Creating PeerConnection");
// 		this._logger.debug(pc_constraints);
// 		// @ts-ignore
// 		this.peerConnection = new RTCPeerConnection(pc_config, pc_constraints);
// 		this._logger.debug(this.peerConnection);
// 		// @ts-ignore
// 		if (this.peerConnection.getStats) {	// FIXME
// 			this.volume = {};
// 			this.bitrate.value = "0 kbits/sec";
// 		}
// 		this._logger.info("Preparing local SDP and gathering candidates (trickle=" + this.trickle + ")");
// 		this.peerConnection.oniceconnectionstatechange = (e) => {
// 			if (this.peerConnection) {
// 				this._eventEmitter.emit("iceState", this.peerConnection.iceConnectionState);
// 				// pluginHandle.iceState(this.peerConnection.iceConnectionState);
// 			}
// 		};

// 		this.peerConnection.onicecandidate = (event) => {
// 			if (event.candidate == null ||
// 				(adapter.browserDetails.browser === "edge" && event.candidate.candidate.indexOf("endOfCandidates") > 0)) {
// 				this._logger.info("End of candidates.");
// 				this.iceDone = true;
// 				if (this.trickle === true) {
// 					// Notify end of candidates
// 					this.sendTrickleCandidate(handleId, { "completed": true });
// 				} else {
// 					// No trickle, time to send the complete SDP (including all candidates)
// 					this.sendSDP();
// 				}
// 			} else {
// 				// JSON.stringify doesn't work on some WebRTC objects anymore
// 				// See https://code.google.com/p/chromium/issues/detail?id=467366
// 				const candidate = {
// 					"candidate": event.candidate.candidate,
// 					"sdpMid": event.candidate.sdpMid,
// 					"sdpMLineIndex": event.candidate.sdpMLineIndex
// 				};
// 				if (this.trickle === true) {
// 					// Send candidate
// 					this.sendTrickleCandidate(handleId, candidate);
// 				}
// 			}
// 		};
// 		this.peerConnection.ontrack = (event) => {
// 			this._logger.info("Handling Remote Track");
// 			this._logger.debug(event);
// 			if (!event.streams)
// 				return;
// 			this.remoteStream = event.streams[0];
// 			// pluginHandle.onremotestream(this.remoteStream);
// 			this._eventEmitter.emit("onremotestream", this.remoteStream);
// 			if (event.track && !event.track.onended) {
// 				this._logger.info("Adding onended callback to track:", event.track);
// 				event.track.onended = (ev) => {
// 					this._logger.info("Remote track removed:", ev);
// 					if (this.remoteStream) {
// 						this.remoteStream.removeTrack(event.track);
// 						// pluginHandle.onremotestream(this.remoteStream);
// 						this._eventEmitter.emit("onremotestream", this.remoteStream);
// 					}
// 				};
// 			}
// 		};

// 		if (addTracks && stream !== null && stream !== undefined;) {
// 			this._logger.info("Adding local stream");
// 			stream.getTracks().forEach((track) => {
// 				this._logger.info("Adding local track:", track);
// 				this.peerConnection.addTrack(track, stream);
// 			});
// 		}
// 		// Any data channel to create?
// 		if (this.media.isDataEnabled() && !this.dataChannel) {
// 			this._logger.info("Creating data channel");
// 			// TODO: instantiate data channel
// 		}
// 		// If there's a new local stream, let's notify the application
// 		if (this.myStream)
// 			pluginHandle.onlocalstream(this.myStream);
// 		// Create offer/answer now
// 		if (jsep === null || jsep === undefined) {
// 			this.createOffer(simulcast || false);
// 		} else {
// 			await this.prepareWebrtcPeer(jsep);
// 			// Create the answer now
// 			this.createAnswer(simulcast || false);
// 		}
// 	}

// 	public get iceConnectionState(): RTCIceConnectionState {
// 		return this.peerConnection.iceConnectionState;
// 	}

// 	private async prepareWebrtc(
// 		jsep: RTCSessionDescriptionInit | null,
// 		// media: IWebRTCMedia,
// 		stream?: Readonly<MediaStream>,
// 		simulcast?: boolean,
// 		simulcast2?: boolean,
// 		trickle?: boolean
// 	) {
// 		if ((!jsep || !jsep.type || !jsep.sdp)) {
// 			this._logger.error("A valid JSEP is required for createAnswer");
// 			throw new Error("A valid JSEP is required for createAnswer");
// 		}
// 		/* Check that callbacks.media is a (not null) Object */
// 		// media = media || { audio: true, video: true };
// 		// var pluginHandle = pluginHandles[handleId];

// 		this.trickle = this.isTrickleEnabled(trickle);
// 		// Are we updating a session?
// 		if (!this.peerConnection) {
// 			// Nope, new PeerConnection
// 			media.update = false;
// 			media.keepAudio = false;
// 			media.keepVideo = false;
// 		} else {
// 			this._logger.info("Updating existing media session");
// 			media.update = true;
// 			// Check if there's anything to add/remove/replace, or if we
// 			// can go directly to preparing the new SDP offer or answer
// 			if (stream) {
// 				// External stream: is this the same as the one we were using before?
// 				if (stream !== this.myStream) {
// 					this._logger.info("Renegotiation involves a new external stream");
// 				}
// 			} else {
// 				// Check if there are changes on audio
// 				if (media.addAudio) {
// 					media.keepAudio = false;
// 					media.replaceAudio = false;
// 					media.removeAudio = false;
// 					media.audioSend = true;
// 					if (this.myStream && this.myStream.getAudioTracks() && this.myStream.getAudioTracks().length) {
// 						this._logger.error("Can't add audio stream, there already is one");
// 						throw new Error("Can't add audio stream, there already is one");
// 						return;
// 					}
// 				} else if (media.removeAudio) {
// 					media.keepAudio = false;
// 					media.replaceAudio = false;
// 					media.addAudio = false;
// 					media.audioSend = false;
// 				} else if (media.replaceAudio) {
// 					media.keepAudio = false;
// 					media.addAudio = false;
// 					media.removeAudio = false;
// 					media.audioSend = true;
// 				}
// 				if (!this.myStream) {
// 					// No media stream: if we were asked to replace, it's actually an "add"
// 					if (media.replaceAudio) {
// 						media.keepAudio = false;
// 						media.replaceAudio = false;
// 						media.addAudio = true;
// 						media.audioSend = true;
// 					}
// 					if (this.isAudioSendEnabled(media)) {
// 						media.keepAudio = false;
// 						media.addAudio = true;
// 					}
// 				} else {
// 					if (!this.myStream.getAudioTracks() || this.myStream.getAudioTracks().length === 0) {
// 						// No audio track: if we were asked to replace, it's actually an "add"
// 						if (media.replaceAudio) {
// 							media.keepAudio = false;
// 							media.replaceAudio = false;
// 							media.addAudio = true;
// 							media.audioSend = true;
// 						}
// 						if (this.isAudioSendEnabled(media)) {
// 							media.keepVideo = false;
// 							media.addAudio = true;
// 						}
// 					} else {
// 						// We have an audio track: should we keep it as it is?
// 						if (this.isAudioSendEnabled(media) &&
// 							!media.removeAudio && !media.replaceAudio) {
// 							media.keepAudio = true;
// 						}
// 					}
// 				}
// 				// Check if there are changes on video
// 				if (media.addVideo) {
// 					media.keepVideo = false;
// 					media.replaceVideo = false;
// 					media.removeVideo = false;
// 					media.videoSend = true;
// 					if (this.myStream && this.myStream.getVideoTracks() && this.myStream.getVideoTracks().length) {
// 						this._logger.error("Can't add video stream, there already is one");
// 						throw new Error("Can't add video stream, there already is one");
// 						return;
// 					}
// 				} else if (media.removeVideo) {
// 					media.keepVideo = false;
// 					media.replaceVideo = false;
// 					media.addVideo = false;
// 					media.videoSend = false;
// 				} else if (media.replaceVideo) {
// 					media.keepVideo = false;
// 					media.addVideo = false;
// 					media.removeVideo = false;
// 					media.videoSend = true;
// 				}
// 				if (!this.myStream) {
// 					// No media stream: if we were asked to replace, it's actually an "add"
// 					if (media.replaceVideo) {
// 						media.keepVideo = false;
// 						media.replaceVideo = false;
// 						media.addVideo = true;
// 						media.videoSend = true;
// 					}
// 					if (this.isVideoSendEnabled(media)) {
// 						media.keepVideo = false;
// 						media.addVideo = true;
// 					}
// 				} else {
// 					if (!this.myStream.getVideoTracks() || this.myStream.getVideoTracks().length === 0) {
// 						// No video track: if we were asked to replace, it's actually an "add"
// 						if (media.replaceVideo) {
// 							media.keepVideo = false;
// 							media.replaceVideo = false;
// 							media.addVideo = true;
// 							media.videoSend = true;
// 						}
// 						if (this.media.isVideoSendEnabled()) {
// 							media.keepVideo = false;
// 							media.addVideo = true;
// 						}
// 					} else {
// 						// We have a video track: should we keep it as it is?
// 						if (this.media.isVideoSendEnabled() &&
// 							!media.removeVideo && !media.replaceVideo) {
// 							media.keepVideo = true;
// 						}
// 					}
// 				}
// 				// Data channels can only be added
// 				if (media.addData)
// 					media.data = true;
// 			}
// 			// If we're updating and keeping all tracks, let's skip the getUserMedia part
// 			if ((this.media.isAudioSendEnabled() && media.keepAudio) &&
// 				(this.media.isVideoSendEnabled() && media.keepVideo)) {
// 				pluginHandle.consentDialog(false);
// 				this.streamsDone(pluginHandle, jsep, media, this.myStream);
// 				return;
// 			}
// 		}
// 		// If we're updating, check if we need to remove/replace one of the tracks
// 		if (media.update && !this.streamExternal) {
// 			if (media.removeAudio || media.replaceAudio) {
// 				if (this.myStream && this.myStream.getAudioTracks() && this.myStream.getAudioTracks().length) {
// 					const s = this.myStream.getAudioTracks()[0];
// 					this._logger.info("Removing audio track:", s);
// 					this.myStream.removeTrack(s);
// 					try {
// 						s.stop();
// 					} catch (e) {
// 						this._logger.debug("Error Stopping Track", e);
// 					}
// 				}
// 				if (this.peerConnection!.getSenders() && this.peerConnection!.getSenders().length) {
// 					let ra = true;
// 					if (media.replaceAudio && this.unifiedPlan) {
// 						// We can use replaceTrack
// 						ra = false;
// 					}
// 					if (ra) {
// 						for (const s of this.peerConnection!.getSenders()) {
// 							if (s && s.track && s.track.kind === "audio") {
// 								this._logger.info("Removing audio sender:", s);
// 								this.peerConnection!.removeTrack(s);
// 							}
// 						}
// 					}
// 				}
// 			}
// 			if (media.removeVideo || media.replaceVideo) {
// 				if (this.myStream && this.myStream.getVideoTracks() && this.myStream.getVideoTracks().length) {
// 					const s = this.myStream.getVideoTracks()[0];
// 					this._logger.info("Removing video track:", s);
// 					this.myStream.removeTrack(s);
// 					try {
// 						s.stop();
// 					} catch (e) {
// 						this._logger.debug("Error Stopping Track", e);
// 					}
// 				}
// 				if (this.peerConnection!.getSenders() && this.peerConnection!.getSenders().length) {
// 					let rv = true;
// 					if (media.replaceVideo && this.unifiedPlan) {
// 						// We can use replaceTrack
// 						rv = false;
// 					}
// 					if (rv) {
// 						for (const s of this.peerConnection!.getSenders()) {
// 							if (s && s.track && s.track.kind === "video") {
// 								this._logger.info("Removing video sender:", s);
// 								this.peerConnection!.removeTrack(s);
// 							}
// 						}
// 					}
// 				}
// 			}
// 		}
// 		// Was a MediaStream object passed, or do we need to take care of that?
// 		if (stream) {
// 			this._logger.info("MediaStream provided by the application");
// 			this._logger.debug(stream);
// 			// If this is an update, let's check if we need to release the previous stream
// 			if (media.update) {
// 				if (this.myStream && this.myStream !== stream && !this.streamExternal) {
// 					// We're replacing a stream we captured ourselves with an external one
// 					try {
// 						// Try a MediaStreamTrack.stop() for each track
// 						const tracks = this.myStream.getTracks();
// 						for (const mst of tracks) {
// 							this._logger.info(mst);
// 							if (mst)
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
// 			pluginHandle.consentDialog(false);
// 			this.streamsDone(pluginHandle, jsep, media, stream);
// 			return;
// 		}
// 		if (this.media.isAudioSendEnabled() || this.media.isVideoSendEnabled()) {
// 			if (!WebRTC.isGetUserMediaAvailable()) {
// 				throw new Error("getUserMedia not available");
// 			}
// 			let constraints: MediaStreamConstraints = {};
// 			pluginHandle.consentDialog(true);
// 			let audioSupport = this.media.isAudioSendEnabled();
// 			if (audioSupport && media && typeof media.audio === "object")
// 				audioSupport = media.audio;
// 			let videoSupport: boolean | MediaTrackConstraints = this.media.isVideoSendEnabled();
// 			if (videoSupport && media) {
// 				if ((simulcast || simulcast2) && !jsep && !media.video)
// 					media.video = "hires";
// 				if (media.video && media.video !== "screen" && media.video !== "window") {
// 					if (typeof media.video === "object") {
// 						videoSupport = media.video;
// 					} else {
// 						let width = 0;
// 						let height = 0;
// 						let maxHeight = 0;
// 						if (media.video === "lowres") {
// 							// Small resolution, 4:3
// 							height = 240;
// 							maxHeight = 240;
// 							width = 320;
// 						} else if (media.video === "lowres-16:9") {
// 							// Small resolution, 16:9
// 							height = 180;
// 							maxHeight = 180;
// 							width = 320;
// 						} else if (media.video === "hires" || media.video === "hires-16:9" || media.video === "hdres") {
// 							// High(HD) resolution is only 16:9
// 							height = 720;
// 							maxHeight = 720;
// 							width = 1280;
// 						} else if (media.video === "fhdres") {
// 							// Full HD resolution is only 16:9
// 							height = 1080;
// 							maxHeight = 1080;
// 							width = 1920;
// 						} else if (media.video === "4kres") {
// 							// 4K resolution is only 16:9
// 							height = 2160;
// 							maxHeight = 2160;
// 							width = 3840;
// 						} else if (media.video === "stdres") {
// 							// Normal resolution, 4:3
// 							height = 480;
// 							maxHeight = 480;
// 							width = 640;
// 						} else if (media.video === "stdres-16:9") {
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
// 						this._logger.info("Adding media constraint:", media.video);
// 						videoSupport = {
// 							"height": { "ideal": height },
// 							"width": { "ideal": width }
// 						};
// 						this._logger.info("Adding video constraint:", videoSupport);
// 					}
// 				} else if (media.video === "screen" || media.video === "window") {
// 					if (!media.screenshareFrameRate) {
// 						media.screenshareFrameRate = 3;
// 					}
// 					// @ts-ignore
// 					if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
// 						// The new experimental getDisplayMedia API is available, let's use that
// 						// https://groups.google.com/forum/#!topic/discuss-webrtc/Uf0SrR4uxzk
// 						// https://webrtchacks.com/chrome-screensharing-getdisplaymedia/
// 						try {

// 							// @ts-ignore
// 							const displayMediaStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: media.captureDesktopAudio });
// 							pluginHandle.consentDialog(false);
// 							if (this.media.isAudioSendEnabled() && !media.keepAudio) {
// 								const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
// 								stream!.addTrack(audioStream.getAudioTracks()[0]);
// 								this.streamsDone(pluginHandle, jsep, media, displayMediaStream);
// 							} else {
// 								this.streamsDone(pluginHandle, jsep, media, stream);
// 							}
// 						} catch (error) {
// 							pluginHandle.consentDialog(false);
// 							throw error;
// 						}
// 						return;
// 					}
// 					// We're going to try and use the extension for Chrome 34+, the old approach
// 					// for older versions of Chrome, or the experimental support in Firefox 33+
// 					// function callbackUserMedia(error, stream) {
// 					// 	pluginHandle.consentDialog(false);
// 					// 	if (error) {
// 					// 		throw new Error(error);
// 					// 	} else {
// 					// 		streamsDone(handleId, jsep, media, callbacks, stream);
// 					// 	}
// 					// }

// 					if (adapter.browserDetails.browser === "chrome") {
// 						const chromever = adapter.browserDetails.version!;
// 						let maxver = 33;
// 						if (window.navigator.userAgent.match("Linux"))
// 							maxver = 35;	// "known" crash in chrome 34 and 35 on linux
// 						if (chromever >= 26 && chromever <= maxver) {
// 							// Chrome 26->33 requires some awkward chrome://flags manipulation
// 							constraints = {
// 								video: {
// 									width: {
// 										ideal: window.screen.width,
// 									},
// 									height: {
// 										ideal: window.screen.height,
// 									},
// 									frameRate: {
// 										ideal: media.screenshareFrameRate
// 									},
// 									deviceId: {
// 										exact: "screen"
// 									}
// 								},
// 								audio: this.media.isAudioSendEnabled()
// 							};
// 							try {
// 								await this.getScreenMedia(pluginHandle, constraints);
// 								pluginHandle.consentDialog(false);
// 								this.streamsDone(pluginHandle, jsep, media, stream);
// 							} catch (error) {
// 								pluginHandle.consentDialog(false);
// 								throw error;
// 							}
// 						} else {
// 							// Chrome 34+ requires an extension
// 							try {
// 								const sourceId = await JanusExtension.getScreen();

// 								constraints = {
// 									audio: false,
// 									video: {
// 										width: {
// 											ideal: window.screen.width,
// 										},
// 										height: {
// 											ideal: window.screen.height,
// 										},
// 										frameRate: {
// 											ideal: media.screenshareFrameRate
// 										},
// 										deviceId: {
// 											exact: sourceId
// 										}
// 									},
// 								};
// 								try {
// 									await this.getScreenMedia(pluginHandle, constraints, this.isAudioSendEnabled(media) && !media.keepAudio);
// 									pluginHandle.consentDialog(false);
// 									await this.streamsDone(pluginHandle, jsep, media, stream);
// 								} catch (error) {
// 									pluginHandle.consentDialog(false);
// 									throw error;

// 								}
// 							} catch (error) {
// 								if (error) {
// 									pluginHandle.consentDialog(false);
// 									return; throw new Error(error);
// 								}
// 							}
// 						}
// 					} else if (adapter.browserDetails.browser === "firefox") {
// 						if (adapter.browserDetails.version! >= 33) {
// 							// Firefox 33+ has experimental support for screen sharing
// 							constraints = {
// 								video: {
// 									deviceId: media.video,
// 								},
// 								audio: this.isAudioSendEnabled(media)
// 							};
// 							try {
// 								const screenStream = await this.getScreenMedia(pluginHandle, constraints);
// 								pluginHandle.consentDialog(false);
// 								this.streamsDone(pluginHandle, jsep, media, screenStream);
// 								// Workaround for https://bugzilla.mozilla.org/show_bug.cgi?id=1045810
// 								// let lastTime = screenStream.currentTime;
// 								// const polly = window.setInterval(() => {
// 								// 	if (!screenStream)
// 								// 		window.clearInterval(polly);
// 								// 	if (screenStream.currentTime === lastTime) {
// 								// 		window.clearInterval(polly);
// 								// 		if (screenStream.onended) {
// 								// 			screenStream.onended();
// 								// 		}
// 								// 	}
// 								// 	lastTime = screenStream.currentTime;
// 								// }, 500);
// 							} catch (error) {
// 								pluginHandle.consentDialog(false);
// 							}
// 						} else {
// 							const error = new Error("NavigatorUserMediaError");
// 							error.name = "Your version of Firefox does not support screen sharing, please install Firefox 33 (or more recent versions)";
// 							pluginHandle.consentDialog(false);
// 							throw error;
// 							return;
// 						}
// 					}
// 					return;
// 				}
// 			}
// 			// If we got here, we're not screensharing
// 			if (!media || media.video !== "screen") {
// 				// Check whether all media sources are actually available or not
// 				try {
// 					const devices = await navigator.mediaDevices.enumerateDevices();
// 					const audioExist = devices.some((device) => {
// 						return device.kind === "audioinput";
// 					});
// 					const videoExist = this.isScreenSendEnabled(media) || devices.some((device) => {
// 						return device.kind === "videoinput";
// 					});

// 					// Check whether a missing device is really a problem
// 					const audioSend = this.isAudioSendEnabled(media);
// 					const videoSend = this.isVideoSendEnabled(media);
// 					const needAudioDevice = this.isAudioSendRequired(media);
// 					const needVideoDevice = this.isVideoSendRequired(media);
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
// 						audio: (audioExist && !media.keepAudio) ? audioSupport : false,
// 						video: (videoExist && !media.keepVideo) ? videoSupport : false
// 					};
// 					this._logger.debug("getUserMedia constraints", gumConstraints);
// 					if (!gumConstraints.audio && !gumConstraints.video) {
// 						pluginHandle.consentDialog(false);
// 						await this.streamsDone(pluginHandle, jsep, media, stream);
// 					} else {
// 						try {
// 							const gumStream = await navigator.mediaDevices.getUserMedia(gumConstraints);

// 							pluginHandle.consentDialog(false);
// 							await this.streamsDone(pluginHandle, jsep, media, gumStream);
// 						} catch (error) {
// 							pluginHandle.consentDialog(false);
// 							throw error;
// 						}
// 					}
// 				} catch (error) {
// 					pluginHandle.consentDialog(false);
// 					// throw new Error("enumerateDevices error", error);
// 					throw error;
// 				}
// 			}
// 		} else {
// 			// No need to do a getUserMedia, create offer/answer right away
// 			await this.streamsDone(pluginHandle, jsep, media);
// 		}
// 	}



// 	private addAudio(stream: MediaStream) {
// 		if (stream.getAudioTracks().length > 0) {
// 			this.myStream.addTrack(stream.getAudioTracks()[0]);
// 		} else {
// 			this._logger.warn("No audio tracks available to add");
// 		}
// 	}

// 	// todo: add video
// 	// todo: replace video
// 	// todo: replace audio
// 	// todo all transceivers should be under unified plan check


// 	private sendSDP() {
// 		this._logger.info("Sending offer/answer SDP...");
// 		if (this.mySdp === null || this.mySdp === undefined) {
// 			this._logger.warn("Local SDP instance is invalid, not sending anything...");
// 			return;
// 		}
// 		this.mySdp = {
// 			"type": (this.peerConnection.localDescription) ? this.peerConnection.localDescription.type : undefined,
// 			"sdp": (this.peerConnection.localDescription) ? this.peerConnection.localDescription.sdp : undefined
// 		};
// 		if (this.trickle === false)
// 			this.mySdp.trickle = false;
// 		this.sdpSent = true;
// 		return this.mySdp;
// 	}

// 	public async prepareWebrtcPeer(jsep: RTCSessionDescriptionInit) {
// 		if (jsep !== undefined && jsep !== null) {
// 			if (this.peerConnection === null) {
// 				this._logger.warn("Wait, no PeerConnection?? if this is an answer, use createAnswer and not handleRemoteJsep");
// 				throw new Error("No PeerConnection: if this is an answer, use createAnswer and not handleRemoteJsep");
// 			}
// 			await this.peerConnection.setRemoteDescription(new RTCSessionDescription(jsep));
// 			this._logger.info("Remote description accepted!");
// 			this.remoteSdp = jsep.sdp;
// 			// Any trickle candidate we cached?
// 			if (this.candidates && this.candidates.length > 0) {
// 				for (const candidate of this.candidates) {
// 					this._logger.debug("Adding remote candidate:", candidate);
// 					if (!candidate || candidate.completed === true) {
// 						// end-of-candidates
// 						// @ts-ignore
// 						this.peerConnection.addIceCandidate(null);
// 					} else {
// 						// New candidate
// 						this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
// 					}
// 				}
// 				this.candidates = [];
// 			}
// 		} else {
// 			throw new Error("Invalid JSEP");
// 		}
// 	}

// 	public createOffer(opts: {simulcast: boolean, iceRestart?: boolean, audioSend: boolean, audioRecv: boolean, videoSend: boolean, videoRecv: boolean}) {
// 		if (!opts.simulcast) {
// 			this._logger.info("Creating offer (iceDone=" + this.iceDone + ")");
// 		} else {
// 			this._logger.info("Creating offer (iceDone=" + this.iceDone + ", simulcast=" + opts.simulcast + ")");
// 		}
// 		// https://code.google.com/p/webrtc/issues/detail?id=3508
// 		const mediaConstraints: RTCOfferOptions = {};
// 		this.setAudioTransceiver(opts.audioSend, opts.audioRecv);
// 		this.setVideoTransceiver(opts.videoSend, opts.videoRecv);

// 		mediaConstraints["offerToReceiveAudio"] = opts.audioRecv;
// 		mediaConstraints["offerToReceiveVideo"] = opts.videoRecv;

// 		if (opts.iceRestart) {
// 			mediaConstraints["iceRestart"] = true;
// 		}
// 		this._logger.debug(mediaConstraints);
// 		// Check if this is Firefox and we've been asked to do simulcasting
// 		this.setSenderSimulcast(opts.videoSend, opts.simulcast);

// 		const offer = await this.peerConnection.createOffer(mediaConstraints);
// 		this._logger.debug(offer);
// 		this._logger.info("Setting local description");
// 		if (opts.videoSend && opts.simulcast) {
// 			// This SDP munging only works with Chrome
// 			if (adapter.browserDetails.browser === "chrome") {
// 				this._logger.info("Enabling Simulcasting for Chrome (SDP munging)");
// 				offer.sdp = this.mungeSdpForSimulcasting(offer.sdp);
// 			} else if (adapter.browserDetails.browser !== "firefox") {
// 				this._logger.warn("simulcast=true, but this is not Chrome nor Firefox, ignoring");
// 			}
// 		}
// 		this.mySdp = offer;
// 		this.peerConnection.setLocalDescription(offer);
// 		this.mediaConstraints = mediaConstraints;
// 		if (!this.iceDone && !this.trickle) {
// 			// Don't do anything until we have all candidates
// 			this._logger.info("Waiting for all candidates...");
// 			return;
// 		}
// 		this._logger.info("Offer ready");
// 		// JSON.stringify doesn't work on some WebRTC objects anymore
// 		// See https://code.google.com/p/chromium/issues/detail?id=467366
// 		const jsep = {
// 			"type": offer.type,
// 			"sdp": offer.sdp
// 		};
// 		return (jsep);
// 	}

// 	private createAnswer(simulcast: boolean, audioSend: boolean, audioRecv: boolean, videoSend: boolean, videoRecv: boolean) {
// 		if (!simulcast) {
// 			this._logger.info("Creating answer (iceDone=" + this.iceDone + ")");
// 		} else {
// 			this._logger.info("Creating answer (iceDone=" + this.iceDone + ", simulcast=" + simulcast + ")");
// 		}
// 		const mediaConstraints: RTCOfferOptions = {};

// 		this.setAudioTransceiver(audioSend, audioRecv);
// 		this.setVideoTransceiver(videoSend, videoRecv);


// 		this._logger.debug(mediaConstraints);
// 		// Check if this is Firefox and we've been asked to do simulcasting
// 		this.setSenderSimulcast(videoSend, simulcast);

// 		const answer = await this.peerConnection.createAnswer(mediaConstraints);
// 		this._logger.debug(answer);
// 		this._logger.info("Setting local description");
// 		if (videoSend && simulcast) {
// 			// This SDP munging only works with Chrome
// 			if (adapter.browserDetails.browser === "chrome") {
// 				// FIXME Apparently trying to simulcast when answering breaks video in Chrome...
// 				// ~ this._logger.info("Enabling Simulcasting for Chrome (SDP munging)");
// 				// ~ answer.sdp = mungeSdpForSimulcasting(answer.sdp);
// 				this._logger.warn("simulcast=true, but this is an answer, and video breaks in Chrome if we enable it");
// 			} else if (adapter.browserDetails.browser !== "firefox") {
// 				this._logger.warn("simulcast=true, but this is not Chrome nor Firefox, ignoring");
// 			}
// 		}
// 		this.mySdp = answer;
// 		this.peerConnection.setLocalDescription(answer);
// 		this.mediaConstraints = mediaConstraints;
// 		if (!this.iceDone && !this.trickle) {
// 			// Don't do anything until we have all candidates
// 			this._logger.info("Waiting for all candidates...");
// 			return;
// 		}
// 		// JSON.stringify doesn't work on some WebRTC objects anymore
// 		// See https://code.google.com/p/chromium/issues/detail?id=467366
// 		const jsep = {
// 			"type": answer.type,
// 			"sdp": answer.sdp
// 		};
// 		return (jsep);
// 	}


// 	private getAudioTransceiver() {
// 		let audioTransceiver: RTCRtpTransceiver | undefined;
// 		const transceivers = this.peerConnection.getTransceivers();
// 		if (transceivers) {
// 			for (const t of transceivers) {
// 				if ((t.sender && t.sender.track && t.sender.track.kind === "audio") ||
// 					(t.receiver && t.receiver.track && t.receiver.track.kind === "audio")) {
// 					if (!audioTransceiver)
// 						audioTransceiver = t;
// 					continue;
// 				}
// 			}
// 		}

// 		return audioTransceiver;
// 	}

// 	private setAudioTransceiver(send: boolean, receive: boolean) {
// 		// todo: replace check with unified plan check
// 		if (adapter.browserDetails.browser === "firefox" && adapter.browserDetails.version! >= 59) {
// 			let audioTransceiver = this.getAudioTransceiver();

// 			if (!send && !receive) {
// 				// Audio disabled: have we removed it?
// 				if (audioTransceiver) {
// 					audioTransceiver.direction = "inactive";
// 					this._logger.info("Setting audio transceiver to inactive:", audioTransceiver);
// 				}
// 			} else {
// 				if (send && receive) {
// 					if (audioTransceiver) {
// 						audioTransceiver.direction = "sendrecv";
// 						this._logger.info("Setting audio transceiver to sendrecv:", audioTransceiver);
// 					}
// 				} else if (send && !receive) {
// 					if (audioTransceiver) {
// 						audioTransceiver.direction = "sendonly";
// 						this._logger.info("Setting audio transceiver to sendonly:", audioTransceiver);
// 					}
// 				} else if (!send && receive) {
// 					if (audioTransceiver) {
// 						audioTransceiver.direction = "recvonly";
// 						this._logger.info("Setting audio transceiver to recvonly:", audioTransceiver);
// 					} else {
// 						// In theory, this is the only case where we might not have a transceiver yet
// 						audioTransceiver = this.peerConnection.addTransceiver("audio", { direction: "recvonly" });
// 						this._logger.info("Adding recvonly audio transceiver:", audioTransceiver);
// 					}
// 				}
// 			}
// 		}
// 	}

// 	private getVideoTransceiver() {
// 		let videoTransceiver: RTCRtpTransceiver | undefined;
// 		const transceivers = this.peerConnection.getTransceivers();
// 		if (transceivers) {
// 			for (const t of transceivers) {
// 				if ((t.sender && t.sender.track && t.sender.track.kind === "video") ||
// 					(t.receiver && t.receiver.track && t.receiver.track.kind === "video")) {
// 					if (!videoTransceiver)
// 						videoTransceiver = t;
// 					continue;
// 				}
// 			}
// 		}
// 		return videoTransceiver;

// 	}

// 	private setVideoTransceiver(send: boolean, receive: boolean) {
// 		if (adapter.browserDetails.browser === "firefox" && adapter.browserDetails.version! >= 59) {
// 			let videoTransceiver = this.getVideoTransceiver();

// 			if (!send && !receive) {
// 				// Audio disabled: have we removed it?
// 				if (videoTransceiver) {
// 					videoTransceiver.direction = "inactive";
// 					this._logger.info("Setting video transceiver to inactive:", videoTransceiver);
// 				}
// 			} else {
// 				if (send && receive) {
// 					if (videoTransceiver) {
// 						videoTransceiver.direction = "sendrecv";
// 						this._logger.info("Setting video transceiver to sendrecv:", videoTransceiver);
// 					}
// 				} else if (send && !receive) {
// 					if (videoTransceiver) {
// 						videoTransceiver.direction = "sendonly";
// 						this._logger.info("Setting video transceiver to sendonly:", videoTransceiver);
// 					}
// 				} else if (!send && receive) {
// 					if (videoTransceiver) {
// 						videoTransceiver.direction = "recvonly";
// 						this._logger.info("Setting video transceiver to recvonly:", videoTransceiver);
// 					} else {
// 						// In theory, this is the only case where we might not have a transceiver yet
// 						videoTransceiver = this.peerConnection.addTransceiver("video", { direction: "recvonly" });
// 						this._logger.info("Adding recvonly video transceiver:", videoTransceiver);
// 					}
// 				}
// 			}
// 		}
// 	}

// 	private setSenderSimulcast(send: boolean, simulcast: boolean) {
// 		if (send && simulcast && adapter.browserDetails.browser === "firefox") {
// 			// FIXME Based on https://gist.github.com/voluntas/088bc3cc62094730647b
// 			this._logger.info("Enabling Simulcasting for Firefox (RID)");
// 			const sender = this.peerConnection.getSenders()[1];
// 			this._logger.info(sender);
// 			const parameters = sender.getParameters();
// 			this._logger.info(parameters);
// 			parameters.encodings = [
// 				{ rid: "high", active: true, priority: "high", maxBitrate: 1000000 },
// 				{ rid: "medium", active: true, priority: "medium", maxBitrate: 300000 },
// 				{ rid: "low", active: true, priority: "low", maxBitrate: 100000 }
// 			];
// 			sender.setParameters(parameters);
// 		}
// 	}


// 	/**
// 	 * munge an SDP to enable simulcasting (Chrome only)
// 	 * @param sdp
// 	 */
// 	private mungeSdpForSimulcasting(sdp?: string) {
// 		// Let's munge the SDP to add the attributes for enabling simulcasting
// 		// (based on https://gist.github.com/ggarber/a19b4c33510028b9c657)
// 		const lines = (sdp || "").split("\r\n");
// 		let video = false;
// 		const ssrc: (string | number)[] = [-1];
// 		const ssrc_fid: (string | number)[] = [-1];
// 		let cname = null;
// 		let msid = null;
// 		let mslabel = null;
// 		let label = null;
// 		let insertAt = -1;
// 		for (let i = 0; i < lines.length; i++) {
// 			const mline = lines[i].match(/m=(\w+) */);
// 			if (mline) {
// 				const medium = mline[1];
// 				if (medium === "video") {
// 					// New video m-line: make sure it's the first one
// 					if (ssrc[0] < 0) {
// 						video = true;
// 					} else {
// 						// We're done, let's add the new attributes here
// 						insertAt = i;
// 						break;
// 					}
// 				} else {
// 					// New non-video m-line: do we have what we were looking for?
// 					if (ssrc[0] > -1) {
// 						// We're done, let's add the new attributes here
// 						insertAt = i;
// 						break;
// 					}
// 				}
// 				continue;
// 			}
// 			if (!video)
// 				continue;
// 			const fid = lines[i].match(/a=ssrc-group:FID (\d+) (\d+)/);
// 			if (fid) {
// 				ssrc[0] = fid[1];
// 				ssrc_fid[0] = fid[2];
// 				lines.splice(i, 1); i--;
// 				continue;
// 			}
// 			if (ssrc[0]) {
// 				let match = lines[i].match("a=ssrc:" + ssrc[0] + " cname:(.+)");
// 				if (match) {
// 					cname = match[1];
// 				}
// 				match = lines[i].match("a=ssrc:" + ssrc[0] + " msid:(.+)");
// 				if (match) {
// 					msid = match[1];
// 				}
// 				match = lines[i].match("a=ssrc:" + ssrc[0] + " mslabel:(.+)");
// 				if (match) {
// 					mslabel = match[1];
// 				}
// 				match = lines[i].match("a=ssrc:" + ssrc[0] + " label:(.+)");
// 				if (match) {
// 					label = match[1];
// 				}
// 				if (lines[i].indexOf("a=ssrc:" + ssrc_fid[0]) === 0) {
// 					lines.splice(i, 1); i--;
// 					continue;
// 				}
// 				if (lines[i].indexOf("a=ssrc:" + ssrc[0]) === 0) {
// 					lines.splice(i, 1); i--;
// 					continue;
// 				}
// 			}
// 			if (lines[i].length === 0) {
// 				lines.splice(i, 1); i--;
// 				continue;
// 			}
// 		}
// 		if (ssrc[0] < 0) {
// 			// Couldn't find a FID attribute, let's just take the first video SSRC we find
// 			insertAt = -1;
// 			video = false;
// 			for (let i = 0; i < lines.length; i++) {
// 				const mline = lines[i].match(/m=(\w+) */);
// 				if (mline) {
// 					const medium = mline[1];
// 					if (medium === "video") {
// 						// New video m-line: make sure it's the first one
// 						if (ssrc[0] < 0) {
// 							video = true;
// 						} else {
// 							// We're done, let's add the new attributes here
// 							insertAt = i;
// 							break;
// 						}
// 					} else {
// 						// New non-video m-line: do we have what we were looking for?
// 						if (ssrc[0] > -1) {
// 							// We're done, let's add the new attributes here
// 							insertAt = i;
// 							break;
// 						}
// 					}
// 					continue;
// 				}
// 				if (!video)
// 					continue;
// 				if (ssrc[0] < 0) {
// 					const value = lines[i].match(/a=ssrc:(\d+)/);
// 					if (value) {
// 						ssrc[0] = value[1];
// 						lines.splice(i, 1); i--;
// 						continue;
// 					}
// 				} else {
// 					let match = lines[i].match("a=ssrc:" + ssrc[0] + " cname:(.+)");
// 					if (match) {
// 						cname = match[1];
// 					}
// 					match = lines[i].match("a=ssrc:" + ssrc[0] + " msid:(.+)");
// 					if (match) {
// 						msid = match[1];
// 					}
// 					match = lines[i].match("a=ssrc:" + ssrc[0] + " mslabel:(.+)");
// 					if (match) {
// 						mslabel = match[1];
// 					}
// 					match = lines[i].match("a=ssrc:" + ssrc[0] + " label:(.+)");
// 					if (match) {
// 						label = match[1];
// 					}
// 					if (lines[i].indexOf("a=ssrc:" + ssrc_fid[0]) === 0) {
// 						lines.splice(i, 1); i--;
// 						continue;
// 					}
// 					if (lines[i].indexOf("a=ssrc:" + ssrc[0]) === 0) {
// 						lines.splice(i, 1); i--;
// 						continue;
// 					}
// 				}
// 				if (lines[i].length === 0) {
// 					lines.splice(i, 1); i--;
// 					continue;
// 				}
// 			}
// 		}
// 		if (ssrc[0] < 0) {
// 			// Still nothing, let's just return the SDP we were asked to munge
// 			this._logger.warn("Couldn't find the video SSRC, simulcasting NOT enabled");
// 			return sdp;
// 		}
// 		if (insertAt < 0) {
// 			// Append at the end
// 			insertAt = lines.length;
// 		}
// 		// Generate a couple of SSRCs (for retransmissions too)
// 		// Note: should we check if there are conflicts, here?
// 		ssrc[1] = Math.floor(Math.random() * 0xFFFFFFFF);
// 		ssrc[2] = Math.floor(Math.random() * 0xFFFFFFFF);
// 		ssrc_fid[1] = Math.floor(Math.random() * 0xFFFFFFFF);
// 		ssrc_fid[2] = Math.floor(Math.random() * 0xFFFFFFFF);
// 		// Add attributes to the SDP
// 		for (let i = 0; i < ssrc.length; i++) {
// 			if (cname) {
// 				lines.splice(insertAt, 0, "a=ssrc:" + ssrc[i] + " cname:" + cname);
// 				insertAt++;
// 			}
// 			if (msid) {
// 				lines.splice(insertAt, 0, "a=ssrc:" + ssrc[i] + " msid:" + msid);
// 				insertAt++;
// 			}
// 			if (mslabel) {
// 				lines.splice(insertAt, 0, "a=ssrc:" + ssrc[i] + " mslabel:" + mslabel);
// 				insertAt++;
// 			}
// 			if (label) {
// 				lines.splice(insertAt, 0, "a=ssrc:" + ssrc[i] + " label:" + label);
// 				insertAt++;
// 			}
// 			// Add the same info for the retransmission SSRC
// 			if (cname) {
// 				lines.splice(insertAt, 0, "a=ssrc:" + ssrc_fid[i] + " cname:" + cname);
// 				insertAt++;
// 			}
// 			if (msid) {
// 				lines.splice(insertAt, 0, "a=ssrc:" + ssrc_fid[i] + " msid:" + msid);
// 				insertAt++;
// 			}
// 			if (mslabel) {
// 				lines.splice(insertAt, 0, "a=ssrc:" + ssrc_fid[i] + " mslabel:" + mslabel);
// 				insertAt++;
// 			}
// 			if (label) {
// 				lines.splice(insertAt, 0, "a=ssrc:" + ssrc_fid[i] + " label:" + label);
// 				insertAt++;
// 			}
// 		}
// 		lines.splice(insertAt, 0, "a=ssrc-group:FID " + ssrc[2] + " " + ssrc_fid[2]);
// 		lines.splice(insertAt, 0, "a=ssrc-group:FID " + ssrc[1] + " " + ssrc_fid[1]);
// 		lines.splice(insertAt, 0, "a=ssrc-group:FID " + ssrc[0] + " " + ssrc_fid[0]);
// 		lines.splice(insertAt, 0, "a=ssrc-group:SIM " + ssrc[0] + " " + ssrc[1] + " " + ssrc[2]);
// 		sdp = lines.join("\r\n");
// 		if (!sdp.endsWith("\r\n"))
// 			sdp += "\r\n";
// 		return sdp;
// 	}

// 	private getVolume(remote: boolean) {
// 		const stream = remote ? "remote" : "local";
// 		if (!this.volume[stream])
// 			this.volume[stream] = { value: 0 };
// 		// Start getting the volume, if getStats is supported
// 		if (this.peerConnection.getStats && adapter.browserDetails.browser === "chrome") {
// 			if (remote && (this.remoteStream === null || this.remoteStream === undefined)) {
// 				this._logger.warn("Remote stream unavailable");
// 				return 0;
// 			} else if (!remote && (this.myStream === null || this.myStream === undefined)) {
// 				this._logger.warn("Local stream unavailable");
// 				return 0;
// 			}
// 			if (this.volume[stream].timer === null || this.volume[stream].timer === undefined) {
// 				this._logger.info("Starting " + stream + " volume monitor");
// 				this.volume[stream].timer = setInterval(() => {
// 					const stats = await this.peerConnection.getStats();
// 					stats.forEach((res) => {
// 						if (res.type === "ssrc") {
// 							if (remote && res.stat("audioOutputLevel"))
// 								this.volume[stream].value = parseInt(res.stat("audioOutputLevel"));
// 							else if (!remote && res.stat("audioInputLevel"))
// 								this.volume[stream].value = parseInt(res.stat("audioInputLevel"));
// 						}
// 					});
// 				}, 200);
// 				return 0;	// We don't have a volume to return yet
// 			}
// 			return this.volume[stream].value;
// 		} else {
// 			// audioInputLevel and audioOutputLevel seem only available in Chrome? audioLevel
// 			// seems to be available on Chrome and Firefox, but they don't seem to work
// 			this._logger.warn("Getting the " + stream + " volume unsupported by browser");
// 			return 0;
// 		}
// 	}

// 	private getBitrate() {

// 		if (this.peerConnection === null || this.peerConnection === undefined)
// 			return new Error("Invalid PeerConnection");
// 		// Start getting the bitrate, if getStats is supported
// 		// @ts-ignore
// 		if (this.peerConnection.getStats) {
// 			if (this.bitrate.timer === null || this.bitrate.timer === undefined) {
// 				this._logger.info("Starting bitrate timer (via getStats)");
// 				this.bitrate.timer = setInterval(() => {
// 					const stats = await this.peerConnection.getStats();
// 					stats.forEach((res) => {
// 						if (!res)
// 							return;
// 						let inStats = false;
// 						// Check if these are statistics on incoming media
// 						if ((res.mediaType === "video" || res.id.toLowerCase().indexOf("video") > -1) &&
// 							res.type === "inbound-rtp" && res.id.indexOf("rtcp") < 0) {
// 							// New stats
// 							inStats = true;
// 						} else if (res.type === "ssrc" && res.bytesReceived &&
// 							(res.googCodecName === "VP8" || res.googCodecName === "")) {
// 							// Older Chrome versions
// 							inStats = true;
// 						}
// 						// Parse stats now
// 						if (inStats) {
// 							this.bitrate.bsnow = res.bytesReceived;
// 							this.bitrate.tsnow = res.timestamp;
// 							if (this.bitrate.bsbefore === null || this.bitrate.tsbefore === null) {
// 								// Skip this round
// 								this.bitrate.bsbefore = this.bitrate.bsnow;
// 								this.bitrate.tsbefore = this.bitrate.tsnow;
// 							} else {
// 								// Calculate bitrate
// 								let timePassed = (this.bitrate.tsnow || 0) - (this.bitrate.tsbefore || 0);
// 								if (adapter.browserDetails.browser === "safari")
// 									timePassed = timePassed / 1000;	// Apparently the timestamp is in microseconds, in Safari
// 								const bitRate = Math.round(((this.bitrate.bsnow || 0) - (this.bitrate.bsbefore || 0)) * 8 / timePassed);
// 								this.bitrate.value = bitRate + " kbits/sec";
// 								// ~ Janus.log("Estimated bitrate is " + this.bitrate.value);
// 								this.bitrate.bsbefore = this.bitrate.bsnow;
// 								this.bitrate.tsbefore = this.bitrate.tsnow;
// 							}
// 						}
// 					});
// 				}, 1000);
// 				return "0 kbits/sec";	// We don't have a bitrate value yet
// 			}
// 			return this.bitrate.value;
// 		} else {
// 			this._logger.warn("Getting the video bitrate unsupported by browser");
// 			return new Error("Feature unsupported by browser");
// 		}
// 	}

// 	public cleanup() {
// 		this._logger.info("Cleaning WebRTC stuff");
// 		// Cleanup stack
// 		if (this.volume) {
// 			if (this.volume["local"] && this.volume["local"].timer)
// 				clearInterval(this.volume["local"].timer as number);
// 			if (this.volume["remote"] && this.volume["remote"].timer)
// 				clearInterval(this.volume["remote"].timer as number);
// 		}
// 		this.volume = {};
// 		if (this.bitrate.timer)
// 			clearInterval(this.bitrate.timer as number);
// 		this.bitrate.timer = undefined;
// 		this.bitrate.bsnow = undefined;
// 		this.bitrate.bsbefore = undefined;
// 		this.bitrate.tsnow = undefined;
// 		this.bitrate.tsbefore = undefined;
// 		this.bitrate.value = undefined;

// 		// Close PeerConnection
// 		try {
// 			this.peerConnection.close();
// 		} catch (e) {
// 			// Do nothing
// 			this._logger.warn("Error closing peerConnection", e);
// 		}
// 		// this.peerConnection = null;
// 		this.iceDone = false;
// 		// this.dataChannel = null;
// 		// this.dtmfSender = null;


// 		this._eventEmitter.emit("cleanup");

// 	}

// 	public on_iceState(handler: (iceConnectionState: RTCIceConnectionState) => void) {
// 		this._eventEmitter.on("iceState", handler);
// 	}

// 	public on_remotestream(handler: (remoteStream: MediaStream) => void) {
// 		this._eventEmitter.on("onremotestream", handler);
// 	}

// 	public on_cleanup(handler: ()=>void){
// 		this._eventEmitter.on("cleanup", handler);
// 	}

// }