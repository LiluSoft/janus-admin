// // import "webrtc";

// export class WebRTC {
// 	public safariVp8: boolean = false;
// 	public unifiedPlan: boolean = false;
// 	private _logger: ILogger;
// 	private readonly dataChanDefaultLabel = "JanusDataChannel";

// 	private pluginHandles: { [handleId: string]: IPluginHandle } = {};

// 	constructor(
// 		public readonly loggerFactory: ILoggerFactory,
// 		public readonly janusClient: JanusClient,
// 		public readonly janusVideoRoom: VideoRoomPlugin,
// 		public readonly iceServers?: string[],
// 		public readonly iceTransportPolicy?: RTCIceTransportPolicy,
// 		public readonly bundlePolicy?: RTCBundlePolicy,
// 		public readonly ipv6Support?: boolean) {
// 		this._logger = loggerFactory.create("JanusClient");

// 		// Detect tab close: make sure we don't loose existing onbeforeunload handlers
// 		// (note: for iOS we need to subscribe to a different event, 'pagehide', see
// 		// https://gist.github.com/thehunmonkgroup/6bee8941a49b86be31a787fe8f4b8cfe)
// 		const iOS = ["iPad", "iPhone", "iPod"].indexOf(navigator.platform) >= 0;
// 		const eventName = iOS ? "pagehide" : "beforeunload";
// 		const oldOBF: () => void = window["on" + eventName as any] as any;
// 		window.addEventListener(eventName, (event) => {
// 			this._logger.info("Closing window");
// 			// TODO: implement
// 			// for (const s in Janus.sessions) {
// 			// 	if (Janus.sessions[s] && Janus.sessions[s].destroyOnUnload) {
// 			// 		this._logger.info("Destroying session " + s);
// 			// 		Janus.sessions[s].destroy({ unload: true, notifyDestroyed: false });
// 			// 	}
// 			// }
// 			if (oldOBF && typeof oldOBF === "function")
// 				oldOBF();
// 		});
// 		// If this is a Safari Technology Preview, check if VP8 is supported
// 		this.safariVp8 = false;
// 		if (adapter.browserDetails.browser === "safari" &&
// 			adapter.browserDetails.version! >= 605) {
// 			// Let's see if RTCRtpSender.getCapabilities() is there
// 			const videoCapabilities = (RTCRtpSender && RTCRtpSender.getCapabilities) ? RTCRtpSender.getCapabilities("video") : undefined;
// 			if (videoCapabilities && videoCapabilities.codecs && videoCapabilities.codecs.length) {
// 				for (const codec of videoCapabilities.codecs) {
// 					if (codec && codec.mimeType && codec.mimeType.toLowerCase() === "video/vp8") {
// 						this.safariVp8 = true;
// 						break;
// 					}
// 				}
// 				if (this.safariVp8) {
// 					this._logger.info("This version of Safari supports VP8");
// 				} else {
// 					this._logger.warn("This version of Safari does NOT support VP8: if you're using a Technology Preview, " +
// 						"try enabling the 'WebRTC VP8 codec' setting in the 'Experimental Features' Develop menu");
// 				}
// 			} else {
// 				// We do it in a very ugly way, as there's no alternative...
// 				// We create a PeerConnection to see if VP8 is in an offer
// 				setTimeout(async () => {
// 					let testpc: RTCPeerConnection | undefined = new RTCPeerConnection({});
// 					const offer = await testpc.createOffer({ offerToReceiveVideo: true });
// 					this.safariVp8 = (offer.sdp || "").indexOf("VP8") !== -1;
// 					if (this.safariVp8) {
// 						this._logger.info("This version of Safari supports VP8");
// 					} else {
// 						this._logger.warn("This version of Safari does NOT support VP8: if you're using a Technology Preview, " +
// 							"try enabling the 'WebRTC VP8 codec' setting in the 'Experimental Features' Develop menu");
// 					}
// 					testpc.close();
// 					testpc = undefined;
// 				}, 0);

// 			}
// 		}

// 		// Check if this browser supports Unified Plan and transceivers
// 		// Based on https://codepen.io/anon/pen/ZqLwWV?editors=0010
// 		this.unifiedPlan = false;
// 		if (adapter.browserDetails.browser === "firefox" &&
// 			adapter.browserDetails.version! >= 59) {
// 			// Firefox definitely does, starting from version 59
// 			this.unifiedPlan = true;
// 		} else if (adapter.browserDetails.browser === "chrome" &&
// 			adapter.browserDetails.version! < 72) {
// 			// Chrome does, but it's only usable from version 72 on
// 			this.unifiedPlan = false;
// 		} else if (!window.RTCRtpTransceiver || !("currentDirection" in RTCRtpTransceiver.prototype)) {
// 			// Safari supports addTransceiver() but not Unified Plan when
// 			// currentDirection is not defined (see codepen above).
// 			this.unifiedPlan = false;
// 		} else {
// 			// Check if addTransceiver() throws an exception
// 			const tempPc = new RTCPeerConnection();
// 			try {
// 				tempPc.addTransceiver("audio");
// 				this.unifiedPlan = true;
// 			} catch (e) {
// 				this._logger.debug("Unified Plan is not working", e);
// 			}
// 			tempPc.close();
// 		}
// 		// Janus.initDone = true;
// 		// options.callback();



// 		this.janusClient.transport.subscribe_plugin_events( async (event) => {
// 			await this.handleEvent(event);
// 		},this.janusVideoRoom.session);
// 	}

// 	// Private event handler: this will trigger plugin callbacks, if set
// 	private async handleEvent(json: IEvent) {
// 		if (json.janus === "keepalive") {
// 			this._logger.debug("Got a keepalive on session " + this.janusVideoRoom.session);
// 		}
// 		else if (json.janus === "trickle") {
// 			const event = json as IEventTrickle;
// 			// We got a trickle candidate from Janus
// 			const sender = json.sender;
// 			if (!sender) {
// 				this._logger.warn("Missing sender...");
// 				return;
// 			}
// 			const pluginHandle: IPluginHandle = this.pluginHandles[sender];
// 			if (!pluginHandle) {
// 				this._logger.debug("This handle is not attached to this session");
// 				return;
// 			}
// 			const candidate = event.candidate;
// 			this._logger.debug("Got a trickled candidate on session " + this.janusVideoRoom.handle.session.session_id);
// 			this._logger.debug(candidate);
// 			const config = pluginHandle.webrtcStuff;
// 			if (config.pc && config.remoteSdp) {
// 				// Add candidate right now
// 				this._logger.debug("Adding remote candidate:", candidate);
// 				if (candidate) {
// 					// New candidate
// 					config.pc.addIceCandidate(candidate);
// 				}
// 			} else {
// 				// We didn't do setRemoteDescription (trickle got here before the offer?)
// 				this._logger.debug("We didn't do setRemoteDescription (trickle got here before the offer?), caching candidate");
// 				if (!config.candidates)
// 					config.candidates = [];
// 				config.candidates.push(candidate);
// 				this._logger.debug(config.candidates);
// 			}
// 		} else if (json.janus === "webrtcup") {
// 			// The PeerConnection with the server is up! Notify this
// 			this._logger.debug("Got a webrtcup event on session", this.janusVideoRoom.handle.session.session_id);
// 			this._logger.debug(json);
// 			const sender = json.sender;
// 			if (!sender) {
// 				this._logger.warn("Missing sender...");
// 				return;
// 			}
// 			const pluginHandle: IPluginHandle = this.pluginHandles[sender];
// 			if (!pluginHandle) {
// 				this._logger.debug("This handle is not attached to this session");
// 				return;
// 			}
// 			pluginHandle.webrtcState(true);
// 			return;
// 		} else if (json.janus === "hangup") {
// 			const event = json as IEventHangup;
// 			// A plugin asked the core to hangup a PeerConnection on one of our handles
// 			this._logger.debug("Got a hangup event on session " + this.janusVideoRoom.handle.session.session_id);
// 			this._logger.debug(json);
// 			const sender = json["sender"];
// 			if (!sender) {
// 				this._logger.warn("Missing sender...");
// 				return;
// 			}
// 			const pluginHandle: IPluginHandle = this.pluginHandles[sender];
// 			if (!pluginHandle) {
// 				this._logger.debug("This handle is not attached to this session");
// 				return;
// 			}
// 			pluginHandle.webrtcState(false, event.reason);
// 			pluginHandle.hangup();
// 		} else if (json.janus === "detached") {
// 			// A plugin asked the core to detach one of our handles
// 			this._logger.debug("Got a detached event on session " + this.janusVideoRoom.handle.session.session_id);
// 			this._logger.debug(json);
// 			const sender = json["sender"];
// 			if (!sender) {
// 				this._logger.warn("Missing sender...");
// 				return;
// 			}
// 			const pluginHandle: IPluginHandle = this.pluginHandles[sender];
// 			if (!pluginHandle) {
// 				// Don't warn here because destroyHandle causes this situation.
// 				return;
// 			}
// 			pluginHandle.detached = true;
// 			pluginHandle.ondetached();
// 			pluginHandle.detach();
// 		} else if (json.janus === "media") {
// 			const event = json as IEventMedia;
// 			// Media started/stopped flowing
// 			this._logger.debug("Got a media event on session " + this.janusVideoRoom.handle.session.session_id);
// 			this._logger.debug(json);
// 			const sender = json["sender"];
// 			if (!sender) {
// 				this._logger.warn("Missing sender...");
// 				return;
// 			}
// 			const pluginHandle: IPluginHandle = this.pluginHandles[sender];
// 			if (!pluginHandle) {
// 				this._logger.debug("This handle is not attached to this session");
// 				return;
// 			}
// 			pluginHandle.mediaState(event.type, event.receiving);
// 		} else if (json.janus === "slowlink") {
// 			const event = json as IEventSlowlink;
// 			this._logger.debug("Got a slowlink event on session " + this.janusVideoRoom.handle.session.session_id);
// 			this._logger.debug(json);
// 			// Trouble uplink or downlink
// 			const sender = json["sender"];
// 			if (!sender) {
// 				this._logger.warn("Missing sender...");
// 				return;
// 			}
// 			const pluginHandle: IPluginHandle = this.pluginHandles[sender];
// 			if (!pluginHandle) {
// 				this._logger.debug("This handle is not attached to this session");
// 				return;
// 			}
// 			pluginHandle.slowLink(event.uplink, event.lost);
// 			// } else
// 			// if (json["janus"] === "error") {
// 			// 	// Oops, something wrong happened
// 			// 	this._logger.error("Ooops: " + json["error"].code + " " + json["error"].reason);	// FIXME
// 			// 	this._logger.debug(json);
// 			// 	return;
// 		} else if (json.janus === "event") {
// 			const event = json as IEventData<unknown>;
// 			this._logger.debug("Got a plugin event on session " + this.janusVideoRoom.handle.session.session_id);
// 			this._logger.debug(json);
// 			const sender = json["sender"];
// 			if (!sender) {
// 				this._logger.warn("Missing sender...");
// 				return;
// 			}
// 			const plugindata = event.plugindata;
// 			if (!plugindata) {
// 				this._logger.warn("Missing plugindata...");
// 				return;
// 			}
// 			this._logger.debug("  -- Event is coming from " + sender + " (" + plugindata["plugin"] + ")");
// 			const data = plugindata["data"];
// 			this._logger.debug(data);
// 			const pluginHandle: IPluginHandle = this.pluginHandles[sender];
// 			if (!pluginHandle) {
// 				this._logger.warn("This handle is not attached to this session");
// 				return;
// 			}
// 			const jsep: RTCSessionDescriptionInit = (json as IEventJSEP).jsep;
// 			if (jsep) {
// 				this._logger.debug("Handling SDP as well...");
// 				this._logger.debug(jsep);
// 			}
// 			const callback = pluginHandle.onmessage;
// 			if (callback) {
// 				this._logger.debug("Notifying application...");
// 				// Send to callback specified when attaching plugin handle
// 				callback(event.plugindata.data, jsep);
// 			} else {
// 				// Send to generic callback (?)
// 				this._logger.debug("No provided notification callback");
// 			}
// 		} else if (json["janus"] === "timeout") {
// 			const sender = json["sender"];
// 			this._logger.error("Timeout on session " + this.janusVideoRoom.handle.session.session_id);
// 			const pluginHandle: IPluginHandle = this.pluginHandles[sender];
// 			this._logger.debug(json);
// 			if (pluginHandle && pluginHandle.ontimeout) {
// 				this._logger.warn("Gateway timeout");
// 				pluginHandle.ontimeout();
// 				await this.janusClient.transport.dispose();
// 			}
// 			return;
// 		} else {
// 			this._logger.warn("Unknown message/event  '" + json["janus"] + "' on session " + this.janusVideoRoom.handle.session.session_id);
// 			this._logger.debug(json);
// 		}
// 	}

// 	public static isGetUserMediaAvailable() {
// 		return (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) ? true : false;
// 	}

// 	/**
// 	 *  Attach MediaStream to Video Element
// 	 *
// 	 * @param element
// 	 * @param stream
// 	 */
// 	public attachMediaStream(element: HTMLVideoElement, stream: MediaStream) {
// 		try {
// 			element.srcObject = stream;
// 		} catch (e) {
// 			try {
// 				element.src = URL.createObjectURL(stream);
// 			} catch (e) {
// 				this._logger.error("Error attaching stream to element");
// 			}
// 		}
// 	}

// 	/**
// 	 * Reattach VideoStream from VideoElement to VideoElement
// 	 *
// 	 * @param to
// 	 * @param from
// 	 */
// 	public reattachMediaStream(to: HTMLVideoElement, from: HTMLVideoElement) {
// 		try {
// 			to.srcObject = from.srcObject;
// 		} catch (e) {
// 			try {
// 				to.src = from.src;
// 			} catch (e) {
// 				this._logger.error("Error reattaching stream to element");
// 			}
// 		}
// 	}




// 	public static isWebrtcSupported() {
// 		return window.RTCPeerConnection ? true : false;
// 	}

// 	private isTrickleEnabled(trickle?: boolean) {
// 		this._logger.debug("isTrickleEnabled:", trickle);
// 		if (trickle === undefined || trickle === null)
// 			return true;	// Default is true
// 		return (trickle === true);
// 	}

// 	private isAudioSendEnabled(media: { audio: boolean, audioSend: boolean }) {
// 		this._logger.debug("isAudioSendEnabled:", media);
// 		if (media === undefined || media === null)
// 			return true;	// Default
// 		if (media.audio === false)
// 			return false;	// Generic audio has precedence
// 		if (media.audioSend === undefined || media.audioSend === null)
// 			return true;	// Default
// 		return (media.audioSend === true);
// 	}


// 	private isVideoSendEnabled(media: IWebRTCMedia) {
// 		this._logger.debug("isVideoSendEnabled:", media);
// 		// if(media === undefined || media === null)
// 		if (!media) {
// 			return true;	// Default
// 		}
// 		// if(media.video === false)
// 		if (!(media.video)) {
// 			return false;	// Generic video has precedence
// 		}
// 		// if(media.videoSend === undefined || media.videoSend === null)
// 		if (!(media.videoSend)) {
// 			return true;	// Default
// 		}
// 		return (media.videoSend === true);
// 	}

// 	private isAudioSendRequired(media: IWebRTCMedia) {
// 		this._logger.debug("isAudioSendRequired:", media);
// 		if (media === undefined || media === null)
// 			return false;	// Default
// 		if (media.audio === false || media.audioSend === false)
// 			return false;	// If we're not asking to capture audio, it's not required
// 		if (media.failIfNoAudio === undefined || media.failIfNoAudio === null)
// 			return false;	// Default
// 		return (media.failIfNoAudio === true);
// 	}

// 	private isVideoSendRequired(media: IWebRTCMedia) {
// 		this._logger.debug("isVideoSendRequired:", media);
// 		if (media === undefined || media === null)
// 			return false;	// Default
// 		if (media.video === false || media.videoSend === false)
// 			return false;	// If we're not asking to capture video, it's not required
// 		if (media.failIfNoVideo === undefined || media.failIfNoVideo === null)
// 			return false;	// Default
// 		return (media.failIfNoVideo === true);
// 	}

// 	private isDataEnabled(media: { data: boolean }) {
// 		this._logger.debug("isDataEnabled:", media);
// 		if (adapter.browserDetails.browser === "edge") {
// 			this._logger.warn("Edge doesn't support data channels yet");
// 			return false;
// 		}
// 		if (media === undefined || media === null)
// 			return false;	// Default
// 		return (media.data === true);
// 	}


// 	private sendSDP(pluginHandle: IPluginHandle) {
// 		if (pluginHandle === null || pluginHandle === undefined ||
// 			pluginHandle.webrtcStuff === null || pluginHandle.webrtcStuff === undefined) {
// 			this._logger.warn("Invalid handle, not sending anything");
// 			return;
// 		}
// 		const config = pluginHandle.webrtcStuff;
// 		this._logger.info("Sending offer/answer SDP...");
// 		if (config.mySdp === null || config.mySdp === undefined) {
// 			this._logger.warn("Local SDP instance is invalid, not sending anything...");
// 			return;
// 		}
// 		config.mySdp = {
// 			"type": config.pc!.localDescription!.type,
// 			"sdp": config.pc!.localDescription!.sdp
// 		};
// 		if (config.trickle === false)
// 			config.mySdp["trickle"] = false;
// 		config.sdpSent = true;
// 		return config.mySdp;
// 	}

// 	public async sendTrickleCandidate(pluginHandle: IPluginHandle, candidate: ICandidate | { "completed": true }) {
// 		// if(!connected) {
// 		// 	this._logger.warn("Is the gateway down? (connected=false)");
// 		// 	return;
// 		// }
// 		if (pluginHandle === null || pluginHandle === undefined ||
// 			pluginHandle.webrtcStuff === null || pluginHandle.webrtcStuff === undefined) {
// 			this._logger.warn("Invalid handle");
// 			return;
// 		}

// 		try {
// 			await this.janusClient.trickle({
// 				janus: "trickle",
// 				candidate,
// 			}, this.janusVideoRoom.handle);
// 			this._logger.debug("Candidate sent", candidate);
// 		} catch (e) {
// 			this._logger.error("Unable to trickle", e);
// 		}

// 	}

// 	public async streamsDone(pluginHandle: IPluginHandle, jsep: RTCSessionDescriptionInit | null, media: IWebRTCMedia, rtcConstraints?: any, stream?: MediaStream, simulcast2?: boolean, simulcastMaxBitrates?: ISimulcastBitrate) {
// 		if (!pluginHandle || !pluginHandle.webrtcStuff) {
// 			this._logger.warn("Invalid handle");
// 			throw new Error("Invalid handle");
// 		}
// 		const config = pluginHandle.webrtcStuff;
// 		this._logger.debug("streamsDone:", stream);
// 		if (stream) {
// 			this._logger.debug("  -- Audio tracks:", stream.getAudioTracks());
// 			this._logger.debug("  -- Video tracks:", stream.getVideoTracks());
// 		}
// 		// We're now capturing the new stream: check if we're updating or if it's a new thing
// 		let addTracks = false;
// 		if (!config.myStream || !media.update || config.streamExternal) {
// 			config.myStream = stream;
// 			addTracks = true;
// 		} else {
// 			// We only need to update the existing stream
// 			if ((
// 				(!media.update && this.isAudioSendEnabled(media)) ||
// 				(media.update && (media.addAudio || media.replaceAudio))
// 			) && stream &&
// 				stream.getAudioTracks() && stream.getAudioTracks().length) {
// 				config.myStream.addTrack(stream.getAudioTracks()[0]);
// 				if (this.unifiedPlan) {
// 					// Use Transceivers
// 					this._logger.info((media.replaceAudio ? "Replacing" : "Adding") + " audio track:", stream.getAudioTracks()[0]);
// 					let audioTransceiver = null;
// 					const transceivers = config.pc!.getTransceivers();
// 					if (transceivers && transceivers.length > 0) {
// 						for (const t of transceivers) {
// 							if ((t.sender && t.sender.track && t.sender.track.kind === "audio") ||
// 								(t.receiver && t.receiver.track && t.receiver.track.kind === "audio")) {
// 								audioTransceiver = t;
// 								break;
// 							}
// 						}
// 					}
// 					if (audioTransceiver && audioTransceiver.sender) {
// 						audioTransceiver.sender.replaceTrack(stream.getAudioTracks()[0]);
// 					} else {
// 						config.pc!.addTrack(stream.getAudioTracks()[0], stream);
// 					}
// 				} else {
// 					this._logger.info((media.replaceAudio ? "Replacing" : "Adding") + " audio track:", stream.getAudioTracks()[0]);
// 					config.pc!.addTrack(stream.getAudioTracks()[0], stream);
// 				}
// 			}
// 			if (
// 				((!media.update && this.isVideoSendEnabled(media)) ||
// 					(media.update && (media.addVideo || media.replaceVideo))) &&
// 				stream && stream.getVideoTracks() && stream.getVideoTracks().length) {
// 				config.myStream.addTrack(stream.getVideoTracks()[0]);
// 				if (this.unifiedPlan) {
// 					// Use Transceivers
// 					this._logger.info((media.replaceVideo ? "Replacing" : "Adding") + " video track:", stream.getVideoTracks()[0]);
// 					let videoTransceiver = null;
// 					const transceivers = config.pc!.getTransceivers();
// 					if (transceivers && transceivers.length > 0) {
// 						for (const t of transceivers) {
// 							if ((t.sender && t.sender.track && t.sender.track.kind === "video") ||
// 								(t.receiver && t.receiver.track && t.receiver.track.kind === "video")) {
// 								videoTransceiver = t;
// 								break;
// 							}
// 						}
// 					}
// 					if (videoTransceiver && videoTransceiver.sender) {
// 						videoTransceiver.sender.replaceTrack(stream.getVideoTracks()[0]);
// 					} else {
// 						config.pc!.addTrack(stream.getVideoTracks()[0], stream);
// 					}
// 				} else {
// 					this._logger.info((media.replaceVideo ? "Replacing" : "Adding") + " video track:", stream.getVideoTracks()[0]);
// 					config.pc!.addTrack(stream.getVideoTracks()[0], stream);
// 				}
// 			}
// 		}
// 		// If we still need to create a PeerConnection, let's do that
// 		if (!config.pc) {
// 			// const pc_config = {"iceServers": iceServers, "iceTransportPolicy": iceTransportPolicy, "bundlePolicy": bundlePolicy};
// 			const pc_config: {
// 				iceServers?: string[];
// 				iceTransportPolicy?: RTCIceTransportPolicy;
// 				bundlePolicy?: RTCBundlePolicy;
// 				sdpSemantics?: string;
// 			} = {
// 				"iceServers": this.iceServers,
// 				"iceTransportPolicy": this.iceTransportPolicy,
// 				"bundlePolicy": this.bundlePolicy
// 			};
// 			if (adapter.browserDetails.browser === "chrome") {
// 				// For Chrome versions before 72, we force a plan-b semantic, and unified-plan otherwise
// 				pc_config["sdpSemantics"] = (adapter.browserDetails.version! < 72) ? "plan-b" : "unified-plan";
// 			}
// 			const pc_constraints: {
// 				optional: any[]
// 			} = {
// 				"optional": [{ "DtlsSrtpKeyAgreement": true }]
// 			};
// 			if (this.ipv6Support) {
// 				pc_constraints.optional.push({ "googIPv6": true });
// 			}
// 			// Any custom constraint to add?
// 			if (rtcConstraints && typeof rtcConstraints === "object") {
// 				this._logger.debug("Adding custom PeerConnection constraints:", rtcConstraints);
// 				for (const i in rtcConstraints) {
// 					if (rtcConstraints.hasOwnProperty(i)) {
// 						pc_constraints.optional.push(rtcConstraints[i]);
// 					}
// 				}
// 			}
// 			if (adapter.browserDetails.browser === "edge") {
// 				// This is Edge, enable BUNDLE explicitly
// 				pc_config.bundlePolicy = "max-bundle";
// 			}
// 			this._logger.info("Creating PeerConnection");
// 			this._logger.debug(pc_constraints);
// 			// @ts-ignore
// 			config.pc = new RTCPeerConnection(pc_config, pc_constraints);
// 			this._logger.debug(config.pc);
// 			// @ts-ignore
// 			if (config.pc.getStats) {	// FIXME
// 				config.volume = {};
// 				config.bitrate.value = "0 kbits/sec";
// 			}
// 			this._logger.info("Preparing local SDP and gathering candidates (trickle=" + config.trickle + ")");
// 			config.pc!.oniceconnectionstatechange = (e) => {
// 				if (config.pc)
// 					pluginHandle.iceState(config.pc.iceConnectionState);
// 			};
// 			config.pc!.onicecandidate = async (event) => {
// 				if (!event.candidate ||
// 					(adapter.browserDetails.browser === "edge" && event.candidate.candidate.indexOf("endOfCandidates") > 0)) {
// 					this._logger.info("End of candidates.");
// 					config.iceDone = true;
// 					if (config.trickle === true) {
// 						// Notify end of candidates
// 						await this.sendTrickleCandidate(pluginHandle, { "completed": true });
// 					} else {
// 						// No trickle, time to send the complete SDP (including all candidates)
// 						this.sendSDP(pluginHandle);
// 					}
// 				} else {
// 					// JSON.stringify doesn't work on some WebRTC objects anymore
// 					// See https://code.google.com/p/chromium/issues/detail?id=467366
// 					const candidate = {
// 						"candidate": event.candidate.candidate,
// 						"sdpMid": event.candidate.sdpMid,
// 						"sdpMLineIndex": event.candidate.sdpMLineIndex
// 					};
// 					if (config.trickle === true) {
// 						// Send candidate
// 						this.sendTrickleCandidate(pluginHandle, candidate);
// 					}
// 				}
// 			};
// 			config.pc!.ontrack = (event) => {
// 				this._logger.info("Handling Remote Track");
// 				this._logger.debug(event);
// 				if (!event.streams)
// 					return;
// 				config.remoteStream = event.streams[0];
// 				pluginHandle.onremotestream(config.remoteStream);
// 				if (event.track.onended)
// 					return;
// 				this._logger.info("Adding onended callback to track:", event.track);
// 				event.track.onended = (ev) => {
// 					this._logger.info("Remote track muted/removed:", ev);
// 					if (config.remoteStream) {
// 						// @ts-ignore
// 						config.remoteStream.removeTrack(ev.target);
// 						pluginHandle.onremotestream(config.remoteStream);
// 					}
// 				};
// 				event.track.onmute = event.track.onended;
// 				event.track.onunmute = (ev) => {
// 					this._logger.info("Remote track flowing again:", ev);
// 					try {
// 						// @ts-ignore
// 						config.remoteStream!.addTrack(ev.target);
// 						pluginHandle.onremotestream(config.remoteStream!);
// 					} catch (e) {
// 						this._logger.error(e);
// 					}
// 				};
// 			};
// 		}
// 		if (addTracks && stream) {
// 			this._logger.info("Adding local stream");
// 			stream.getTracks().forEach((track) => {
// 				this._logger.info("Adding local track:", track);
// 				if (!simulcast2) {
// 					config.pc!.addTrack(track, stream);
// 				} else {
// 					if (track.kind === "audio") {
// 						config.pc!.addTrack(track, stream);
// 					} else {
// 						this._logger.info("Enabling rid-based simulcasting:", track);
// 						const maxBitrates = this.getMaxBitrates(simulcastMaxBitrates);
// 						config.pc!.addTransceiver(track, {
// 							direction: "sendrecv",
// 							streams: [stream],
// 							sendEncodings: [
// 								{ rid: "h", active: true, maxBitrate: maxBitrates.high },
// 								{ rid: "m", active: true, maxBitrate: maxBitrates.medium, scaleResolutionDownBy: 2 },
// 								{ rid: "l", active: true, maxBitrate: maxBitrates.low, scaleResolutionDownBy: 4 }
// 							]
// 						});
// 					}
// 				}
// 			});
// 		}
// 		// Any data channel to create?
// 		if (this.isDataEnabled(media) && !config.dataChannel![this.dataChanDefaultLabel]) {
// 			this._logger.info("Creating data channel");
// 			this.createDataChannel(pluginHandle, this.dataChanDefaultLabel);
// 			config.pc!.ondatachannel = (event) => {
// 				this._logger.info("Data channel created by Janus:", event);
// 				this.createDataChannel(pluginHandle, event.channel.label, event.channel);
// 			};
// 		}
// 		// If there's a new local stream, let's notify the application
// 		if (config.myStream)
// 			pluginHandle.onlocalstream(config.myStream);
// 		// Create offer/answer now
// 		if (!jsep) {
// 			await this.createOffer(pluginHandle, media);
// 		} else {
// 			await config.pc!.setRemoteDescription(jsep);
// 			this._logger.info("Remote description accepted!");
// 			config.remoteSdp = jsep.sdp;
// 			// Any trickle candidate we cached?
// 			if (config.candidates && config.candidates.length > 0) {
// 				for (const candidate of config.candidates) {
// 					this._logger.debug("Adding remote candidate:", candidate);
// 					// New candidate
// 					config.pc!.addIceCandidate(candidate);
// 				}
// 				config.candidates = [];
// 			}
// 			// Create the answer now
// 			this.createAnswer(pluginHandle, media);
// 		}
// 	}



// 	private async  createAnswer(pluginHandle: IPluginHandle, media: IWebRTCMedia, simulcast?: boolean, customizeSdp?: (jsep: RTCSessionDescriptionInit) => void, simulcastMaxBitrates?: ISimulcastBitrate) {
// 		if (!pluginHandle || !pluginHandle.webrtcStuff) {
// 			this._logger.warn("Invalid handle");
// 			throw new Error("Invalid handle");
// 			return;
// 		}
// 		const config = pluginHandle.webrtcStuff;
// 		if (!simulcast) {
// 			this._logger.info("Creating answer (iceDone=" + config.iceDone + ")");
// 		} else {
// 			this._logger.info("Creating answer (iceDone=" + config.iceDone + ", simulcast=" + simulcast + ")");
// 		}
// 		let mediaConstraints: RTCOfferOptions;
// 		if (this.unifiedPlan) {
// 			// We can use Transceivers
// 			mediaConstraints = {};
// 			let audioTransceiver: (RTCRtpTransceiver | undefined);
// 			let videoTransceiver: (RTCRtpTransceiver | undefined);
// 			const transceivers = config.pc!.getTransceivers();
// 			if (transceivers && transceivers.length > 0) {
// 				for (const t of transceivers) {
// 					if ((t.sender && t.sender.track && t.sender.track.kind === "audio") ||
// 						(t.receiver && t.receiver.track && t.receiver.track.kind === "audio")) {
// 						if (!audioTransceiver)
// 							audioTransceiver = t;
// 						continue;
// 					}
// 					if ((t.sender && t.sender.track && t.sender.track.kind === "video") ||
// 						(t.receiver && t.receiver.track && t.receiver.track.kind === "video")) {
// 						if (!videoTransceiver)
// 							videoTransceiver = t;
// 						continue;
// 					}
// 				}
// 			}
// 			// Handle audio (and related changes, if any)
// 			const audioSend = this.isAudioSendEnabled(media);
// 			const audioRecv = this.isAudioRecvEnabled(media);
// 			if (!audioSend && !audioRecv) {
// 				// Audio disabled: have we removed it?
// 				if (media.removeAudio && audioTransceiver) {
// 					try {
// 						// @ts-ignore
// 						if (audioTransceiver.setDirection) {
// 							// @ts-ignore
// 							audioTransceiver.setDirection("inactive");
// 						} else {
// 							audioTransceiver.direction = "inactive";
// 						}
// 						this._logger.info("Setting audio transceiver to inactive:", audioTransceiver);
// 					} catch (e) {
// 						throw (e);
// 					}
// 				}
// 			} else {
// 				// Take care of audio m-line
// 				if (audioSend && audioRecv) {
// 					if (audioTransceiver) {
// 						try {
// 							// @ts-ignore
// 							if (audioTransceiver.setDirection) {
// 								// @ts-ignore
// 								audioTransceiver.setDirection("sendrecv");
// 							} else {
// 								audioTransceiver.direction = "sendrecv";
// 							}
// 							this._logger.info("Setting audio transceiver to sendrecv:", audioTransceiver);
// 						} catch (e) {
// 							throw (e);
// 						}
// 					}
// 				} else if (audioSend && !audioRecv) {
// 					try {
// 						if (audioTransceiver) {
// 							// @ts-ignore
// 							if (audioTransceiver.setDirection) {
// 								// @ts-ignore
// 								audioTransceiver.setDirection("sendonly");
// 							} else {
// 								audioTransceiver.direction = "sendonly";
// 							}
// 							this._logger.info("Setting audio transceiver to sendonly:", audioTransceiver);
// 						}
// 					} catch (e) {
// 						throw (e);
// 					}
// 				} else if (!audioSend && audioRecv) {
// 					if (audioTransceiver) {
// 						try {
// 							// @ts-ignore
// 							if (audioTransceiver.setDirection) {
// 								// @ts-ignore
// 								audioTransceiver.setDirection("recvonly");
// 							} else {
// 								audioTransceiver.direction = "recvonly";
// 							}
// 							this._logger.info("Setting audio transceiver to recvonly:", audioTransceiver);
// 						} catch (e) {
// 							throw (e);
// 						}
// 					} else {
// 						// In theory, this is the only case where we might not have a transceiver yet
// 						audioTransceiver = config.pc!.addTransceiver("audio", { direction: "recvonly" });
// 						this._logger.info("Adding recvonly audio transceiver:", audioTransceiver);
// 					}
// 				}
// 			}
// 			// Handle video (and related changes, if any)
// 			const videoSend = this.isVideoSendEnabled(media);
// 			const videoRecv = this.isVideoRecvEnabled(media);
// 			if (!videoSend && !videoRecv) {
// 				// Video disabled: have we removed it?
// 				if (media.removeVideo && videoTransceiver) {
// 					try {
// 						// @ts-ignore
// 						if (videoTransceiver.setDirection) {
// 							// @ts-ignore
// 							videoTransceiver.setDirection("inactive");
// 						} else {
// 							videoTransceiver.direction = "inactive";
// 						}
// 						this._logger.info("Setting video transceiver to inactive:", videoTransceiver);
// 					} catch (e) {
// 						throw (e);
// 					}
// 				}
// 			} else {
// 				// Take care of video m-line
// 				if (videoSend && videoRecv) {
// 					if (videoTransceiver) {
// 						try {
// 							// @ts-ignore
// 							if (videoTransceiver.setDirection) {
// 								// @ts-ignore
// 								videoTransceiver.setDirection("sendrecv");
// 							} else {
// 								videoTransceiver.direction = "sendrecv";
// 							}
// 							this._logger.info("Setting video transceiver to sendrecv:", videoTransceiver);
// 						} catch (e) {
// 							throw (e);
// 						}
// 					}
// 				} else if (videoSend && !videoRecv) {
// 					if (videoTransceiver) {
// 						try {
// 							// @ts-ignore
// 							if (videoTransceiver.setDirection) {
// 								// @ts-ignore
// 								videoTransceiver.setDirection("sendonly");
// 							} else {
// 								videoTransceiver.direction = "sendonly";
// 							}
// 							this._logger.info("Setting video transceiver to sendonly:", videoTransceiver);
// 						} catch (e) {
// 							throw (e);
// 						}
// 					}
// 				} else if (!videoSend && videoRecv) {
// 					if (videoTransceiver) {
// 						try {
// 							// @ts-ignore
// 							if (videoTransceiver.setDirection) {
// 								// @ts-ignore
// 								videoTransceiver.setDirection("recvonly");
// 							} else {
// 								videoTransceiver.direction = "recvonly";
// 							}
// 							this._logger.info("Setting video transceiver to recvonly:", videoTransceiver);
// 						} catch (e) {
// 							throw (e);
// 						}
// 					} else {
// 						// In theory, this is the only case where we might not have a transceiver yet
// 						videoTransceiver = config.pc!.addTransceiver("video", { direction: "recvonly" });
// 						this._logger.info("Adding recvonly video transceiver:", videoTransceiver);
// 					}
// 				}
// 			}
// 		} else {
// 			if (adapter.browserDetails.browser === "firefox" || adapter.browserDetails.browser === "edge") {
// 				mediaConstraints = {
// 					offerToReceiveAudio: this.isAudioRecvEnabled(media),
// 					offerToReceiveVideo: this.isVideoRecvEnabled(media)
// 				};
// 			} else {
// 				mediaConstraints = {
// 					offerToReceiveAudio: this.isAudioRecvEnabled(media),
// 					offerToReceiveVideo: this.isVideoRecvEnabled(media)
// 				};
// 			}
// 		}
// 		this._logger.debug(mediaConstraints);
// 		// Check if this is Firefox and we've been asked to do simulcasting
// 		const sendVideo = this.isVideoSendEnabled(media);
// 		if (sendVideo && simulcast && adapter.browserDetails.browser === "firefox") {
// 			// FIXME Based on https://gist.github.com/voluntas/088bc3cc62094730647b
// 			this._logger.info("Enabling Simulcasting for Firefox (RID)");
// 			const sender = config.pc!.getSenders()[1];
// 			this._logger.info(sender);
// 			const parameters = sender.getParameters();
// 			this._logger.info(parameters);

// 			const maxBitrates = this.getMaxBitrates(simulcastMaxBitrates);
// 			// TODO: rewrite, probably a bug
// 			// @ts-ignore
// 			sender.setParameters({
// 				encodings: [
// 					{ rid: "high", active: true, priority: "high", maxBitrate: maxBitrates.high },
// 					{ rid: "medium", active: true, priority: "medium", maxBitrate: maxBitrates.medium },
// 					{ rid: "low", active: true, priority: "low", maxBitrate: maxBitrates.low }
// 				]
// 			});
// 		}
// 		const answer = await config.pc!.createAnswer(mediaConstraints);
// 		this._logger.debug(answer);
// 		// JSON.stringify doesn't work on some WebRTC objects anymore
// 		// See https://code.google.com/p/chromium/issues/detail?id=467366
// 		const jsep = {
// 			"type": answer.type,
// 			"sdp": answer.sdp
// 		};
// 		if (customizeSdp) {
// 			customizeSdp(jsep);
// 		}
// 		answer.sdp = jsep.sdp;
// 		this._logger.info("Setting local description");
// 		if (sendVideo && simulcast) {
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
// 		config.mySdp = answer;
// 		await config.pc!.setLocalDescription(answer);
// 		config.mediaConstraints = mediaConstraints;
// 		if (!config.iceDone && !config.trickle) {
// 			// Don't do anything until we have all candidates
// 			this._logger.info("Waiting for all candidates...");
// 			return;
// 		}
// 		return (answer);
// 	}



// 	private async createOffer(pluginHandle: IPluginHandle, media: IWebRTCMedia, customizeSdp?: (jsep: RTCSessionDescriptionInit) => void, simulcast?: boolean, iceRestart?: boolean, simulcastMaxBitrates?: ISimulcastBitrate) {
// 		if (!pluginHandle || !pluginHandle.webrtcStuff) {
// 			this._logger.warn("Invalid handle");
// 			throw new Error("Invalid handle");
// 		}
// 		const config = pluginHandle.webrtcStuff;
// 		if (!simulcast) {
// 			this._logger.info("Creating offer (iceDone=" + config.iceDone + ")");
// 		} else {
// 			this._logger.info("Creating offer (iceDone=" + config.iceDone + ", simulcast=" + simulcast + ")");
// 		}
// 		// https://code.google.com/p/webrtc/issues/detail?id=3508
// 		const mediaConstraints: RTCOfferOptions = {};
// 		if (this.unifiedPlan) {
// 			// We can use Transceivers
// 			let audioTransceiver = null;
// 			let videoTransceiver = null;
// 			const transceivers = config.pc!.getTransceivers();
// 			if (transceivers && transceivers.length > 0) {
// 				for (const t of transceivers) {
// 					if ((t.sender && t.sender.track && t.sender.track.kind === "audio") ||
// 						(t.receiver && t.receiver.track && t.receiver.track.kind === "audio")) {
// 						if (!audioTransceiver)
// 							audioTransceiver = t;
// 						continue;
// 					}
// 					if ((t.sender && t.sender.track && t.sender.track.kind === "video") ||
// 						(t.receiver && t.receiver.track && t.receiver.track.kind === "video")) {
// 						if (!videoTransceiver)
// 							videoTransceiver = t;
// 						continue;
// 					}
// 				}
// 			}
// 			// Handle audio (and related changes, if any)
// 			const audioSend = this.isAudioSendEnabled(media);
// 			const audioRecv = this.isAudioRecvEnabled(media);
// 			if (!audioSend && !audioRecv) {
// 				// Audio disabled: have we removed it?
// 				if (media.removeAudio && audioTransceiver) {
// 					// @ts-ignore
// 					if (audioTransceiver.setDirection) {
// 						// @ts-ignore
// 						audioTransceiver.setDirection("inactive");
// 					} else {
// 						audioTransceiver.direction = "inactive";
// 					}
// 					this._logger.info("Setting audio transceiver to inactive:", audioTransceiver);
// 				}
// 			} else {
// 				// Take care of audio m-line
// 				if (audioSend && audioRecv) {
// 					if (audioTransceiver) {
// 						// @ts-ignore
// 						if (audioTransceiver.setDirection) {
// 							// @ts-ignore
// 							audioTransceiver.setDirection("sendrecv");
// 						} else {
// 							audioTransceiver.direction = "sendrecv";
// 						}
// 						this._logger.info("Setting audio transceiver to sendrecv:", audioTransceiver);
// 					}
// 				} else if (audioSend && !audioRecv) {
// 					if (audioTransceiver) {
// 						// @ts-ignore
// 						if (audioTransceiver.setDirection) {
// 							// @ts-ignore
// 							audioTransceiver.setDirection("sendonly");
// 						} else {
// 							audioTransceiver.direction = "sendonly";
// 						}
// 						this._logger.info("Setting audio transceiver to sendonly:", audioTransceiver);
// 					}
// 				} else if (!audioSend && audioRecv) {
// 					if (audioTransceiver) {
// 						// @ts-ignore
// 						if (audioTransceiver.setDirection) {
// 							// @ts-ignore
// 							audioTransceiver.setDirection("recvonly");
// 						} else {
// 							audioTransceiver.direction = "recvonly";
// 						}
// 						this._logger.info("Setting audio transceiver to recvonly:", audioTransceiver);
// 					} else {
// 						// In theory, this is the only case where we might not have a transceiver yet
// 						audioTransceiver = config.pc!.addTransceiver("audio", { direction: "recvonly" });
// 						this._logger.info("Adding recvonly audio transceiver:", audioTransceiver);
// 					}
// 				}
// 			}
// 			// Handle video (and related changes, if any)
// 			const videoSend = this.isVideoSendEnabled(media);
// 			const videoRecv = this.isVideoRecvEnabled(media);
// 			if (!videoSend && !videoRecv) {
// 				// Video disabled: have we removed it?
// 				if (media.removeVideo && videoTransceiver) {
// 					// @ts-ignore
// 					if (videoTransceiver.setDirection) {
// 						// @ts-ignore
// 						videoTransceiver.setDirection("inactive");
// 					} else {
// 						videoTransceiver.direction = "inactive";
// 					}
// 					this._logger.info("Setting video transceiver to inactive:", videoTransceiver);
// 				}
// 			} else {
// 				// Take care of video m-line
// 				if (videoSend && videoRecv) {
// 					if (videoTransceiver) {
// 						// @ts-ignore
// 						if (videoTransceiver.setDirection) {
// 							// @ts-ignore
// 							videoTransceiver.setDirection("sendrecv");
// 						} else {
// 							videoTransceiver.direction = "sendrecv";
// 						}
// 						this._logger.info("Setting video transceiver to sendrecv:", videoTransceiver);
// 					}
// 				} else if (videoSend && !videoRecv) {
// 					if (videoTransceiver) {
// 						// @ts-ignore
// 						if (videoTransceiver.setDirection) {
// 							// @ts-ignore
// 							videoTransceiver.setDirection("sendonly");
// 						} else {
// 							videoTransceiver.direction = "sendonly";
// 						}
// 						this._logger.info("Setting video transceiver to sendonly:", videoTransceiver);
// 					}
// 				} else if (!videoSend && videoRecv) {
// 					if (videoTransceiver) {
// 						// @ts-ignore
// 						if (videoTransceiver.setDirection) {
// 							// @ts-ignore
// 							videoTransceiver.setDirection("recvonly");
// 						} else {
// 							videoTransceiver.direction = "recvonly";
// 						}
// 						this._logger.info("Setting video transceiver to recvonly:", videoTransceiver);
// 					} else {
// 						// In theory, this is the only case where we might not have a transceiver yet
// 						videoTransceiver = config.pc!.addTransceiver("video", { direction: "recvonly" });
// 						this._logger.info("Adding recvonly video transceiver:", videoTransceiver);
// 					}
// 				}
// 			}
// 		} else {
// 			mediaConstraints["offerToReceiveAudio"] = this.isAudioRecvEnabled(media);
// 			mediaConstraints["offerToReceiveVideo"] = this.isVideoRecvEnabled(media);
// 		}
// 		if (iceRestart) {
// 			mediaConstraints["iceRestart"] = true;
// 		}
// 		this._logger.debug(mediaConstraints);
// 		// Check if this is Firefox and we've been asked to do simulcasting
// 		const sendVideo = this.isVideoSendEnabled(media);
// 		if (sendVideo && simulcast && adapter.browserDetails.browser === "firefox") {
// 			// FIXME Based on https://gist.github.com/voluntas/088bc3cc62094730647b
// 			this._logger.info("Enabling Simulcasting for Firefox (RID)");
// 			const sender = config.pc!.getSenders().find((s) => { return s.track!.kind === "video"; });
// 			if (sender) {
// 				let parameters = sender.getParameters();
// 				if (!parameters)
// 					// @ts-ignore
// 					parameters = {};


// 				const maxBitrates = this.getMaxBitrates(simulcastMaxBitrates);
// 				parameters.encodings = [
// 					{ rid: "h", active: true, maxBitrate: maxBitrates.high },
// 					{ rid: "m", active: true, maxBitrate: maxBitrates.medium, scaleResolutionDownBy: 2 },
// 					{ rid: "l", active: true, maxBitrate: maxBitrates.low, scaleResolutionDownBy: 4 }
// 				];
// 				sender.setParameters(parameters);
// 			}
// 		}
// 		const offer = await config.pc!.createOffer(mediaConstraints);
// 		this._logger.debug(offer);
// 		// JSON.stringify doesn't work on some WebRTC objects anymore
// 		// See https://code.google.com/p/chromium/issues/detail?id=467366
// 		const jsep = {
// 			"type": offer.type,
// 			"sdp": offer.sdp
// 		};
// 		if (customizeSdp) {
// 			customizeSdp(jsep);
// 		}
// 		offer.sdp = jsep.sdp;
// 		this._logger.info("Setting local description");
// 		if (sendVideo && simulcast) {
// 			// This SDP munging only works with Chrome (Safari STP may support it too)
// 			if (adapter.browserDetails.browser === "chrome" ||
// 				adapter.browserDetails.browser === "safari") {
// 				this._logger.info("Enabling Simulcasting for Chrome (SDP munging)");
// 				offer.sdp = this.mungeSdpForSimulcasting(offer.sdp);
// 			} else if (adapter.browserDetails.browser !== "firefox") {
// 				this._logger.warn("simulcast=true, but this is not Chrome nor Firefox, ignoring");
// 			}
// 		}
// 		config.mySdp = offer;
// 		await config.pc!.setLocalDescription(offer);
// 		config.mediaConstraints = mediaConstraints;
// 		if (!config.iceDone && !config.trickle) {
// 			// Don't do anything until we have all candidates
// 			this._logger.info("Waiting for all candidates...");
// 			return;
// 		}
// 		this._logger.info("Offer ready");
// 		return (offer);

// 	}



// 	// Private method to create a data channel
// 	private createDataChannel(pluginHandle: IPluginHandle, dclabel: string, incoming?: RTCDataChannel, pendingData?: string) {
// 		if (!pluginHandle || !pluginHandle.webrtcStuff) {
// 			this._logger.warn("Invalid handle");
// 			return;
// 		}
// 		const config = pluginHandle.webrtcStuff;
// 		const onDataChannelMessage = (event: MessageEvent) => {
// 			this._logger.info("Received message on data channel:", event);
// 			// @ts-ignore
// 			const label = event.target.label;
// 			pluginHandle.ondata(event.data, label);
// 		};
// 		const onDataChannelStateChange = (event: Event) => {
// 			this._logger.info("Received state change on data channel:", event);
// 			// @ts-ignore
// 			const label = event.target.label;
// 			const dcState = config.dataChannel![label] ? config.dataChannel![label].readyState : "null";
// 			this._logger.info("State change on <" + label + "> data channel: " + dcState);
// 			if (dcState === "open") {
// 				// Any pending messages to send?
// 				if (config.dataChannel![label].pending && config.dataChannel![label].pending!.length > 0) {
// 					this._logger.info("Sending pending messages on <" + label + ">:", config.dataChannel![label].pending!.length);
// 					for (const data of config.dataChannel![label].pending!) {
// 						this._logger.info("Sending data on data channel <" + label + ">");
// 						this._logger.debug(data);
// 						config.dataChannel![label].send(data);
// 					}
// 					config.dataChannel![label].pending = [];
// 				}
// 				// Notify the open data channel
// 				pluginHandle.ondataopen(label);
// 			}
// 		};
// 		const onDataChannelError = (error: RTCErrorEvent) => {
// 			this._logger.error("Got error on data channel:", error);
// 			// TODO
// 		};
// 		if (!incoming) {
// 			// FIXME Add options (ordered, maxRetransmits, etc.)
// 			config.dataChannel![dclabel] = config.pc!.createDataChannel(dclabel, { ordered: true });
// 		} else {
// 			// The channel was created by Janus
// 			config.dataChannel![dclabel] = incoming;
// 		}
// 		config.dataChannel![dclabel].onmessage = onDataChannelMessage;
// 		config.dataChannel![dclabel].onopen = onDataChannelStateChange;
// 		config.dataChannel![dclabel].onclose = onDataChannelStateChange;
// 		config.dataChannel![dclabel].onerror = onDataChannelError;
// 		config.dataChannel![dclabel].pending = [];
// 		if (pendingData)
// 			config.dataChannel![dclabel].pending!.push(pendingData);
// 	}

// 	private sendData(pluginHandle: IPluginHandle, text: string, data: string, label: string) {
// 		if (!pluginHandle || !pluginHandle.webrtcStuff) {
// 			this._logger.warn("Invalid handle");
// 			throw new Error("Invalid handle");
// 		}
// 		const config = pluginHandle.webrtcStuff;
// 		data = text || data;
// 		if (!data) {
// 			this._logger.warn("Invalid data");
// 			throw new Error("Invalid data");
// 		}
// 		label = label || this.dataChanDefaultLabel;
// 		if (!config.dataChannel![label]) {
// 			// Create new data channel and wait for it to open
// 			this.createDataChannel(pluginHandle, label, undefined, data);
// 			return;
// 		}
// 		if (config.dataChannel![label].readyState !== "open") {
// 			config.dataChannel![label].pending!.push(data);
// 			return;
// 		}
// 		this._logger.info("Sending data on data channel <" + label + ">");
// 		this._logger.debug(data);
// 		config.dataChannel![label].send(data);
// 		return;
// 	}

// 	// Private method to send a DTMF tone
// 	private sendDtmf(pluginHandle: IPluginHandle, dtmf: { tones: string, duration: number, gap: number }) {
// 		if (!pluginHandle || !pluginHandle.webrtcStuff) {
// 			this._logger.warn("Invalid handle");
// 			throw new Error("Invalid handle");
// 		}
// 		const config = pluginHandle.webrtcStuff;
// 		if (!config.dtmfSender) {
// 			// Create the DTMF sender the proper way, if possible
// 			if (config.pc) {
// 				const senders = config.pc.getSenders();
// 				const audioSender = senders.find((sender) => {
// 					return sender.track && sender.track.kind === "audio";
// 				});
// 				if (!audioSender) {
// 					this._logger.warn("Invalid DTMF configuration (no audio track)");
// 					throw new Error("Invalid DTMF configuration (no audio track)");
// 				}
// 				config.dtmfSender = audioSender.dtmf;
// 				if (config.dtmfSender) {
// 					this._logger.info("Created DTMF Sender");
// 					config.dtmfSender.ontonechange = (tone) => {
// 						this._logger.debug("Sent DTMF tone: " + tone.tone);
// 					};
// 				}
// 			}
// 			if (!config.dtmfSender) {
// 				this._logger.warn("Invalid DTMF configuration");
// 				throw new Error("Invalid DTMF configuration");
// 			}
// 		}
// 		if (!dtmf) {
// 			this._logger.warn("Invalid DTMF parameters");
// 			throw new Error("Invalid DTMF parameters");
// 		}
// 		const tones = dtmf.tones;
// 		if (!tones) {
// 			this._logger.warn("Invalid DTMF string");
// 			throw new Error("Invalid DTMF string");
// 		}
// 		const duration = (typeof dtmf.duration === "number") ? dtmf.duration : 500; // We choose 500ms as the default duration for a tone
// 		const gap = (typeof dtmf.gap === "number") ? dtmf.gap : 50; // We choose 50ms as the default gap between tones
// 		this._logger.debug("Sending DTMF string " + tones + " (duration " + duration + "ms, gap " + gap + "ms)");
// 		config.dtmfSender.insertDTMF(tones, duration, gap);

// 	}



// 	private async prepareWebrtc(
// 		pluginHandle: IPluginHandle,
// 		jsep: RTCSessionDescriptionInit | null,
// 		media: IWebRTCMedia,
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
// 		media = media || { audio: true, video: true };
// 		// var pluginHandle = pluginHandles[handleId];
// 		if (!pluginHandle || !pluginHandle.webrtcStuff) {
// 			this._logger.warn("Invalid handle");
// 			throw new Error("Invalid handle");
// 		}
// 		const config = pluginHandle.webrtcStuff;
// 		config.trickle = this.isTrickleEnabled(trickle);
// 		// Are we updating a session?
// 		if (!config.pc) {
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
// 				if (stream !== config.myStream) {
// 					this._logger.info("Renegotiation involves a new external stream");
// 				}
// 			} else {
// 				// Check if there are changes on audio
// 				if (media.addAudio) {
// 					media.keepAudio = false;
// 					media.replaceAudio = false;
// 					media.removeAudio = false;
// 					media.audioSend = true;
// 					if (config.myStream && config.myStream.getAudioTracks() && config.myStream.getAudioTracks().length) {
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
// 				if (!config.myStream) {
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
// 					if (!config.myStream.getAudioTracks() || config.myStream.getAudioTracks().length === 0) {
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
// 					if (config.myStream && config.myStream.getVideoTracks() && config.myStream.getVideoTracks().length) {
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
// 				if (!config.myStream) {
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
// 					if (!config.myStream.getVideoTracks() || config.myStream.getVideoTracks().length === 0) {
// 						// No video track: if we were asked to replace, it's actually an "add"
// 						if (media.replaceVideo) {
// 							media.keepVideo = false;
// 							media.replaceVideo = false;
// 							media.addVideo = true;
// 							media.videoSend = true;
// 						}
// 						if (this.isVideoSendEnabled(media)) {
// 							media.keepVideo = false;
// 							media.addVideo = true;
// 						}
// 					} else {
// 						// We have a video track: should we keep it as it is?
// 						if (this.isVideoSendEnabled(media) &&
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
// 			if ((this.isAudioSendEnabled(media) && media.keepAudio) &&
// 				(this.isVideoSendEnabled(media) && media.keepVideo)) {
// 				pluginHandle.consentDialog(false);
// 				this.streamsDone(pluginHandle, jsep, media, config.myStream);
// 				return;
// 			}
// 		}
// 		// If we're updating, check if we need to remove/replace one of the tracks
// 		if (media.update && !config.streamExternal) {
// 			if (media.removeAudio || media.replaceAudio) {
// 				if (config.myStream && config.myStream.getAudioTracks() && config.myStream.getAudioTracks().length) {
// 					const s = config.myStream.getAudioTracks()[0];
// 					this._logger.info("Removing audio track:", s);
// 					config.myStream.removeTrack(s);
// 					try {
// 						s.stop();
// 					} catch (e) {
// 						this._logger.debug("Error Stopping Track", e);
// 					}
// 				}
// 				if (config.pc!.getSenders() && config.pc!.getSenders().length) {
// 					let ra = true;
// 					if (media.replaceAudio && this.unifiedPlan) {
// 						// We can use replaceTrack
// 						ra = false;
// 					}
// 					if (ra) {
// 						for (const s of config.pc!.getSenders()) {
// 							if (s && s.track && s.track.kind === "audio") {
// 								this._logger.info("Removing audio sender:", s);
// 								config.pc!.removeTrack(s);
// 							}
// 						}
// 					}
// 				}
// 			}
// 			if (media.removeVideo || media.replaceVideo) {
// 				if (config.myStream && config.myStream.getVideoTracks() && config.myStream.getVideoTracks().length) {
// 					const s = config.myStream.getVideoTracks()[0];
// 					this._logger.info("Removing video track:", s);
// 					config.myStream.removeTrack(s);
// 					try {
// 						s.stop();
// 					} catch (e) {
// 						this._logger.debug("Error Stopping Track", e);
// 					}
// 				}
// 				if (config.pc!.getSenders() && config.pc!.getSenders().length) {
// 					let rv = true;
// 					if (media.replaceVideo && this.unifiedPlan) {
// 						// We can use replaceTrack
// 						rv = false;
// 					}
// 					if (rv) {
// 						for (const s of config.pc!.getSenders()) {
// 							if (s && s.track && s.track.kind === "video") {
// 								this._logger.info("Removing video sender:", s);
// 								config.pc!.removeTrack(s);
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
// 				if (config.myStream && config.myStream !== stream && !config.streamExternal) {
// 					// We're replacing a stream we captured ourselves with an external one
// 					try {
// 						// Try a MediaStreamTrack.stop() for each track
// 						const tracks = config.myStream.getTracks();
// 						for (const mst of tracks) {
// 							this._logger.info(mst);
// 							if (mst)
// 								mst.stop();
// 						}
// 					} catch (e) {
// 						// Do nothing if this fails
// 					}
// 					config.myStream = undefined;
// 				}
// 			}
// 			// Skip the getUserMedia part
// 			config.streamExternal = true;
// 			pluginHandle.consentDialog(false);
// 			this.streamsDone(pluginHandle, jsep, media, stream);
// 			return;
// 		}
// 		if (this.isAudioSendEnabled(media) || this.isVideoSendEnabled(media)) {
// 			if (!WebRTC.isGetUserMediaAvailable()) {
// 				throw new Error("getUserMedia not available");
// 			}
// 			let constraints: MediaStreamConstraints = {};
// 			pluginHandle.consentDialog(true);
// 			let audioSupport = this.isAudioSendEnabled(media);
// 			if (audioSupport && media && typeof media.audio === "object")
// 				audioSupport = media.audio;
// 			let videoSupport: boolean | MediaTrackConstraints = this.isVideoSendEnabled(media);
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
// 							if (this.isAudioSendEnabled(media) && !media.keepAudio) {
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
// 								audio: this.isAudioSendEnabled(media)
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

// 	private async getScreenMedia(pluginHandle: IPluginHandle, constraints: MediaStreamConstraints, useAudio?: boolean): Promise<MediaStream> {
// 		this._logger.info("Adding media constraint (screen capture)");
// 		this._logger.debug(constraints);
// 		try {
// 			const stream = await navigator.mediaDevices.getUserMedia(constraints);

// 			if (useAudio) {
// 				const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
// 				stream.addTrack(audioStream.getAudioTracks()[0]);
// 				return stream;
// 			} else {
// 				return stream;
// 			}
// 		} catch (error) {
// 			pluginHandle.consentDialog(false);
// 			throw error;
// 		}
// 	}

// 	public getVolume(pluginHandle: IPluginHandle, remote: boolean) {
// 		if (pluginHandle === null || pluginHandle === undefined ||
// 			pluginHandle.webrtcStuff === null || pluginHandle.webrtcStuff === undefined) {
// 			this._logger.warn("Invalid handle");
// 			return 0;
// 		}
// 		const stream = remote ? "remote" : "local";
// 		const config = pluginHandle.webrtcStuff;
// 		if (!config.volume[stream])
// 			config.volume[stream] = { value: 0 };
// 		// Start getting the volume, if getStats is supported
// 		if (config.pc!.getStats && adapter.browserDetails.browser === "chrome") {
// 			if (remote && (config.remoteStream === null || config.remoteStream === undefined)) {
// 				this._logger.warn("Remote stream unavailable");
// 				return 0;
// 			} else if (!remote && (config.myStream === null || config.myStream === undefined)) {
// 				this._logger.warn("Local stream unavailable");
// 				return 0;
// 			}
// 			if (config.volume[stream].timer === null || config.volume[stream].timer === undefined) {
// 				this._logger.info("Starting " + stream + " volume monitor");
// 				config.volume[stream].timer = setInterval(async () => {
// 					const stats = await config.pc!.getStats();
// 					stats.forEach((res) => {
// 						if (res.type === "ssrc") {
// 							if (remote && res.stat("audioOutputLevel"))
// 								config.volume[stream].value = parseInt(res.stat("audioOutputLevel"));
// 							else if (!remote && res.stat("audioInputLevel"))
// 								config.volume[stream].value = parseInt(res.stat("audioInputLevel"));
// 						}

// 					});

// 				}, 200);
// 				return 0;	// We don't have a volume to return yet
// 			}
// 			return config.volume[stream].value;
// 		} else {
// 			// audioInputLevel and audioOutputLevel seem only available in Chrome? audioLevel
// 			// seems to be available on Chrome and Firefox, but they don't seem to work
// 			this._logger.warn("Getting the " + stream + " volume unsupported by browser");
// 			return 0;
// 		}
// 	}


// 	public isMuted(pluginHandle: IPluginHandle, video: boolean) {
// 		if (pluginHandle === null || pluginHandle === undefined ||
// 			pluginHandle.webrtcStuff === null || pluginHandle.webrtcStuff === undefined) {
// 			this._logger.warn("Invalid handle");
// 			return true;
// 		}
// 		const config = pluginHandle.webrtcStuff;
// 		if (config.pc === null || config.pc === undefined) {
// 			this._logger.warn("Invalid PeerConnection");
// 			return true;
// 		}
// 		if (config.myStream === undefined || config.myStream === null) {
// 			this._logger.warn("Invalid local MediaStream");
// 			return true;
// 		}
// 		if (video) {
// 			// Check video track
// 			if (config.myStream.getVideoTracks() === null
// 				|| config.myStream.getVideoTracks() === undefined
// 				|| config.myStream.getVideoTracks().length === 0) {
// 				this._logger.warn("No video track");
// 				return true;
// 			}
// 			return !config.myStream.getVideoTracks()[0].enabled;
// 		} else {
// 			// Check audio track
// 			if (config.myStream.getAudioTracks() === null
// 				|| config.myStream.getAudioTracks() === undefined
// 				|| config.myStream.getAudioTracks().length === 0) {
// 				this._logger.warn("No audio track");
// 				return true;
// 			}
// 			return !config.myStream.getAudioTracks()[0].enabled;
// 		}
// 	}

// 	public mute(pluginHandle: IPluginHandle, video: boolean, mute: boolean) {
// 		if (pluginHandle === null || pluginHandle === undefined ||
// 			pluginHandle.webrtcStuff === null || pluginHandle.webrtcStuff === undefined) {
// 			this._logger.warn("Invalid handle");
// 			return false;
// 		}
// 		const config = pluginHandle.webrtcStuff;
// 		if (config.pc === null || config.pc === undefined) {
// 			this._logger.warn("Invalid PeerConnection");
// 			return false;
// 		}
// 		if (config.myStream === undefined || config.myStream === null) {
// 			this._logger.warn("Invalid local MediaStream");
// 			return false;
// 		}
// 		if (video) {
// 			// Mute/unmute video track
// 			if (config.myStream.getVideoTracks() === null
// 				|| config.myStream.getVideoTracks() === undefined
// 				|| config.myStream.getVideoTracks().length === 0) {
// 				this._logger.warn("No video track");
// 				return false;
// 			}
// 			config.myStream.getVideoTracks()[0].enabled = mute ? false : true;
// 			return true;
// 		} else {
// 			// Mute/unmute audio track
// 			if (config.myStream.getAudioTracks() === null
// 				|| config.myStream.getAudioTracks() === undefined
// 				|| config.myStream.getAudioTracks().length === 0) {
// 				this._logger.warn("No audio track");
// 				return false;
// 			}
// 			config.myStream.getAudioTracks()[0].enabled = mute ? false : true;
// 			return true;
// 		}
// 	}

// 	public getBitrate(pluginHandle: IPluginHandle) {
// 		if (pluginHandle === null || pluginHandle === undefined ||
// 			pluginHandle.webrtcStuff === null || pluginHandle.webrtcStuff === undefined) {
// 			this._logger.warn("Invalid handle");
// 			return "Invalid handle";
// 		}
// 		const config = pluginHandle.webrtcStuff;
// 		if (config.pc === null || config.pc === undefined)
// 			return "Invalid PeerConnection";
// 		// Start getting the bitrate, if getStats is supported
// 		if (config.pc.getStats) {
// 			if (config.bitrate.timer === null || config.bitrate.timer === undefined) {
// 				this._logger.info("Starting bitrate timer (via getStats)");
// 				config.bitrate.timer = setInterval(async () => {
// 					const stats = await config.pc!.getStats();
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
// 							config.bitrate.bsnow = res.bytesReceived;
// 							config.bitrate.tsnow = res.timestamp;
// 							if (config.bitrate.bsbefore === null || config.bitrate.tsbefore === null) {
// 								// Skip this round
// 								config.bitrate.bsbefore = config.bitrate.bsnow;
// 								config.bitrate.tsbefore = config.bitrate.tsnow;
// 							} else {
// 								// Calculate bitrate
// 								let timePassed = (config.bitrate.tsnow || 0) - (config.bitrate.tsbefore || 0);
// 								if (adapter.browserDetails.browser === "safari")
// 									timePassed = timePassed / 1000;	// Apparently the timestamp is in microseconds, in Safari
// 								const bitRate = Math.round(((config.bitrate.bsnow || 0) - (config.bitrate.bsbefore || 0)) * 8 / timePassed);
// 								config.bitrate.value = bitRate + " kbits/sec";
// 								// ~ this._logger.info("Estimated bitrate is " + config.bitrate.value);
// 								config.bitrate.bsbefore = config.bitrate.bsnow;
// 								config.bitrate.tsbefore = config.bitrate.tsnow;
// 							}
// 						}
// 					});
// 				}, 1000);
// 				return "0 kbits/sec";	// We don't have a bitrate value yet
// 			}
// 			return config.bitrate.value;
// 		} else {
// 			this._logger.warn("Getting the video bitrate unsupported by browser");
// 			return "Feature unsupported by browser";
// 		}
// 	}

// 	private cleanupWebrtc(pluginHandle: IPluginHandle, hangupRequest: boolean) {
// 		this._logger.info("Cleaning WebRTC stuff");
// 		if (!pluginHandle) {
// 			// Nothing to clean
// 			return;
// 		}
// 		const config = pluginHandle.webrtcStuff;
// 		if (config) {
// 			if (hangupRequest === true) {
// 				// Send a hangup request (we don't really care about the response)
// 				this.janusClient.hangup(this.janusVideoRoom.handle);
// 			}
// 			// Cleanup stack
// 			config.remoteStream = undefined;
// 			if (config.volume) {
// 				if (config.volume["local"] && config.volume["local"].timer)
// 					clearInterval(config.volume["local"].timer as any);
// 				if (config.volume["remote"] && config.volume["remote"].timer)
// 					clearInterval(config.volume["remote"].timer as any);
// 			}
// 			config.volume = {};
// 			if (config.bitrate.timer)
// 				clearInterval(config.bitrate.timer as any);
// 			config.bitrate.timer = undefined;
// 			config.bitrate.bsnow = undefined;
// 			config.bitrate.bsbefore = undefined;
// 			config.bitrate.tsnow = undefined;
// 			config.bitrate.tsbefore = undefined;
// 			config.bitrate.value = undefined;
// 			try {
// 				// Try a MediaStreamTrack.stop() for each track
// 				if (!config.streamExternal && config.myStream) {
// 					this._logger.info("Stopping local stream tracks");
// 					const tracks = config.myStream.getTracks();
// 					for (const mst of tracks) {
// 						this._logger.info(mst);
// 						if (mst)
// 							mst.stop();
// 					}
// 				}
// 			} catch (e) {
// 				// Do nothing if this fails
// 			}
// 			config.streamExternal = false;
// 			config.myStream = undefined;
// 			// Close PeerConnection
// 			try {
// 				if (config.pc) {
// 					config.pc.close();
// 				}
// 			} catch (e) {
// 				// Do nothing
// 				this._logger.info("Unable to close PeerConnection", e);
// 			}
// 			config.pc = undefined;
// 			config.candidates = undefined;
// 			config.mySdp = undefined;
// 			config.remoteSdp = undefined;
// 			config.iceDone = false;
// 			config.dataChannel = undefined;
// 			config.dtmfSender = undefined;
// 		}
// 		pluginHandle.oncleanup();
// 	}

// 	// Helper method to munge an SDP to enable simulcasting (Chrome only)
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

// 	private isScreenSendEnabled(media: IWebRTCMedia) {
// 		this._logger.debug("isScreenSendEnabled:", media);
// 		return false;
// 		// if (!media)
// 		// 	return false;
// 		// if (typeof media.video !== "object" || typeof media.video.mandatory !== "object")
// 		// 	return false;
// 		// const constraints = media.video.mandatory;
// 		// if (constraints.chromeMediaSource)
// 		// 	return constraints.chromeMediaSource === "desktop" || constraints.chromeMediaSource === "screen";
// 		// else if (constraints.mozMediaSource)
// 		// 	return constraints.mozMediaSource === "window" || constraints.mozMediaSource === "screen";
// 		// else if (constraints.mediaSource)
// 		// 	return constraints.mediaSource === "window" || constraints.mediaSource === "screen";
// 		// return false;
// 	}

// 	public isAudioRecvEnabled(media: IWebRTCMedia) {
// 		this._logger.debug("isAudioRecvEnabled:", media);
// 		if (!media)
// 			return true;	// Default
// 		if (media.audio === false)
// 			return false;	// Generic audio has precedence
// 		if (media.audioRecv === undefined || media.audioRecv === null)
// 			return true;	// Default
// 		return (media.audioRecv === true);
// 	}

// 	public isVideoRecvEnabled(media: IWebRTCMedia) {
// 		this._logger.debug("isVideoRecvEnabled:", media);
// 		if (!media)
// 			return true;	// Default
// 		if (media.video === false)
// 			return false;	// Generic video has precedence
// 		if (media.videoRecv === undefined || media.videoRecv === null)
// 			return true;	// Default
// 		return (media.videoRecv === true);
// 	}

// 	public getMaxBitrates(simulcastMaxBitrates?: ISimulcastBitrate) {
// 		const maxBitrates = {
// 			high: 900000,
// 			medium: 300000,
// 			low: 100000,
// 		};

// 		if (simulcastMaxBitrates !== undefined && simulcastMaxBitrates !== null) {
// 			if (simulcastMaxBitrates.high)
// 				maxBitrates.high = simulcastMaxBitrates.high;
// 			if (simulcastMaxBitrates.medium)
// 				maxBitrates.medium = simulcastMaxBitrates.medium;
// 			if (simulcastMaxBitrates.low)
// 				maxBitrates.low = simulcastMaxBitrates.low;
// 		}

// 		return maxBitrates;
// 	}

// 	private async prepareWebrtcPeer(pluginHandle: IPluginHandle, jsep: RTCSessionDescriptionInit) {
// 		if (!pluginHandle || !pluginHandle.webrtcStuff) {
// 			this._logger.warn("Invalid handle");
// 			throw new Error("Invalid handle");
// 		}
// 		const config = pluginHandle.webrtcStuff;
// 		if (jsep) {
// 			if (!config.pc) {
// 				this._logger.warn("Wait, no PeerConnection?? if this is an answer, use createAnswer and not handleRemoteJsep");
// 				throw new Error("No PeerConnection: if this is an answer, use createAnswer and not handleRemoteJsep");
// 			}
// 			try {
// 				await config.pc.setRemoteDescription(jsep);
// 				this._logger.info("Remote description accepted!");
// 				config.remoteSdp = jsep.sdp;
// 				// Any trickle candidate we cached?
// 				if (config.candidates && config.candidates.length > 0) {
// 					for (const candidate of config.candidates) {
// 						this._logger.debug("Adding remote candidate:", candidate);
// 						// New candidate
// 						config.pc.addIceCandidate(candidate);
// 					}
// 					config.candidates = [];
// 				}
// 				// Done
// 				return;
// 			} catch (error) {
// 				throw error;
// 			}
// 		} else {
// 			throw new Error("Invalid JSEP");
// 		}
// 	}
// }