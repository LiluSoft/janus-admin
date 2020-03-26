import { ILogger } from "../../logger/ILogger";
import { ILoggerFactory } from "../../logger/ILoggerFactory";
import adapter from "webrtc-adapter";
import { EventEmitter } from "events";
import { WebRTCDataChannel } from "./WebRTCDataChannel";
import { WebRTCMediaStream } from "./WebRTCMediaStream";
import { WebRTCDTMFSender } from "./WebRTCDTMFSender";

export enum WebRTCPeerOptions {
	None = 0,
	iceRestart = 1 << 0,
	Simulcast = 1 << 1,
	AudioSend = 1 << 2,
	AudioReceive = 1 << 3,
	VideoSend = 1 << 4,
	VideoReceive = 1 << 5
}

/**
 * WebRTC Peer Connection
 */
export class WebRTCPeerConnection {
	private _logger: ILogger;

	private iceDone: boolean;
	private iceDonePromise: Promise<RTCSessionDescriptionInit>;
	public trickle: boolean;
	private mediaConstraints: RTCOfferOptions;
	private mySdp: RTCSessionDescriptionInit;

	public readonly peerConnection: RTCPeerConnection;

	private _dataChannel: WebRTCDataChannel;

	private _eventEmitter = new EventEmitter();
	private candidates: ((RTCIceCandidateInit | RTCIceCandidate) & { completed: boolean })[];
	private remoteSdp: RTCSessionDescriptionInit;

	private dtmfSender : WebRTCDTMFSender;

	private bitrate: Partial<{
		value: string;
		bsnow: number;
		bsbefore: number;
		tsnow: number;
		tsbefore: number;
		timer: NodeJS.Timer | number;
	}> = {};

	constructor(
		public readonly loggerFactory: ILoggerFactory,
		private readonly peerConfiguration?: RTCConfiguration
	) {
		this._logger = loggerFactory.create("WebRTCPeerConnection");

		this._logger.debug("Initializing", peerConfiguration);

		if (!this.peerConfiguration) {
			this.peerConfiguration = {};
		}

		if (!this.peerConfiguration.iceServers) {
			this.peerConfiguration.iceServers = [{ urls: "stun:stun.l.google.com:19302" }];
		}



		this.peerConnection = new RTCPeerConnection(this.peerConfiguration);


		let iceDoneResolve: (value: RTCSessionDescriptionInit) => void;
		let iceDoneReject: (error: Error) => void;

		this.iceDonePromise = new Promise<RTCSessionDescriptionInit>((resolve, reject) => {
			iceDoneResolve = resolve;
			iceDoneReject = reject;
		});


		this.peerConnection.addEventListener("icecandidate", (ev) => {
			this._logger.trace("icecandidate", ev.candidate);
			this.emitEvent("icecandidate", ev.candidate);
		});

		this.peerConnection.addEventListener("icecandidateerror", (e)=>{
			this._logger.trace("icecandidateerror", e.errorText, e.errorCode);
		});

		this.peerConnection.addEventListener("iceconnectionstatechange", (e)=>{
			this._logger.trace("iceconnectionstatechange", e);
		});

		this.peerConnection.addEventListener("negotiationneeded", (e)=>{
			this._logger.trace("negotiationneeded",e);
		});

		this.peerConnection.addEventListener("signalingstatechange",(e)=>{
			this._logger.trace("signalingstatechange", this.peerConnection.signalingState,e);
		});

		this.peerConnection.addEventListener("icegatheringstatechange", (e) => {
			this._logger.debug("icegatheringstatechange", this.peerConnection.iceGatheringState, e);
			if (!this.trickle) {
				if (this.peerConnection.iceGatheringState === "complete") {
					this.iceDone = true;
					iceDoneResolve(this.peerConnection.localDescription as RTCSessionDescriptionInit);
				}
			}
		});

		this.peerConnection.addEventListener("connectionstatechange", (event) => {
			this._logger.debug("connectionstatechange", this.peerConnection.connectionState, event);
			this.emitEvent("connectionstatechange", this.peerConnection.connectionState);
		});

		this.peerConnection.addEventListener("track", (event) => {
			this._logger.info("Handling Remote Track", event);
			if (!event.streams) {
				this._logger.info("No Streams");
				return;
			}

			this.emitEvent("remotestreams", event.streams.map(stream => new WebRTCMediaStream(this.loggerFactory, stream)));


			if (event.track && !event.track.onended) {
				this._logger.info("Adding onended callback to track:", event.track);
				event.track.addEventListener("ended", (ev) => {
					this._logger.info("Remote track removed", ev);
					this.emitEvent("remotestreams", event.streams.map(stream => new WebRTCMediaStream(this.loggerFactory, stream)));
				});
				// event.track.onended = function(ev) {
				// 	Janus.log("Remote track removed:", ev);
				// 	if(this.remoteStream) {
				// 		this.remoteStream.removeTrack(ev.target);
				// 		pluginHandle.onremotestream(this.remoteStream);
				// 	}
				// }
			}
		});

	}

	private emitEvent(event: string | symbol, ...args: any[]) {
		// should be emitted in the next cycle to allow subscribers to complete
		setTimeout(() => {
			if (this._eventEmitter.listenerCount(event) > 0) {
				this._logger.trace("raising event", event, ...args);
				this._eventEmitter.emit(event, ...args);
			} else {
				this._logger.trace("no listeners to", event, ...args);
			}
		}, 0);
	}

	private async setRemoteDescription(description: RTCSessionDescriptionInit) {
		this._logger.debug("Setting Remote Description", description);
		await this.peerConnection.setRemoteDescription(description);
		if ("canTrickleIceCandidates" in this.peerConnection) {
			this.trickle = this.peerConnection.canTrickleIceCandidates as boolean;
		}
		if (!this.trickle) {
			this.iceDone = false;
			this.trickle = false;
		}

		this._logger.debug("Browser trickle ice candidates", this.trickle);
	}

	private async setLocalDescription(description: RTCSessionDescriptionInit){
		this._logger.debug("Setting Local Description", description);
		await this.peerConnection.setLocalDescription(description);

		if ("canTrickleIceCandidates" in this.peerConnection) {
			this.trickle = this.peerConnection.canTrickleIceCandidates as boolean;
		}
		if (!this.trickle) {
			this.iceDone = false;
			this.trickle = false;
		}

		this._logger.debug("Browser trickle ice candidates", this.trickle);
	}

	/**
	 * Adds all streams from WebRTCMediaStream to PeerConnection
	 * create offer should be run after it
	 * @param stream
	 */
	public addTracks(stream: WebRTCMediaStream) {
		if (stream !== null && stream !== undefined) {
			this._logger.info("Adding local stream");
			stream.getTracks().forEach((track) => {
				this._logger.info("Adding local track:", track);
				this.peerConnection.addTrack(track, stream.mediaStream);
			});
		}
	}

	public get iceConnectionState() {
		return this.peerConnection.iceConnectionState;
	}

	public getBitrate() {
		if (!this.peerConnection) {
			return "Invalid PeerConnection";
		}
		// Start getting the bitrate, if getStats is supported
		if (this.peerConnection.getStats) {
			if (!this.bitrate.timer) {
				this._logger.info("Starting bitrate timer (via getStats)");
				this.bitrate.timer = setInterval(async () => {
					const stats = await this.peerConnection.getStats();
					stats.forEach((res) => {
						if (!res)
							return;
						let inStats = false;
						// Check if these are statistics on incoming media
						if ((res.mediaType === "video" || res.id.toLowerCase().indexOf("video") > -1) &&
							res.type === "inbound-rtp" && res.id.indexOf("rtcp") < 0) {
							// New stats
							inStats = true;
						} else if (res.type === "ssrc" && res.bytesReceived &&
							(res.googCodecName === "VP8" || res.googCodecName === "")) {
							// Older Chrome versions
							inStats = true;
						}
						// Parse stats now
						if (inStats) {
							this.bitrate.bsnow = res.bytesReceived;
							this.bitrate.tsnow = res.timestamp;
							if (this.bitrate.bsbefore === null || this.bitrate.tsbefore === null) {
								// Skip this round
								this.bitrate.bsbefore = this.bitrate.bsnow;
								this.bitrate.tsbefore = this.bitrate.tsnow;
							} else {
								// Calculate bitrate
								let timePassed = (this.bitrate.tsnow || 0) - (this.bitrate.tsbefore || 0);
								if (adapter.browserDetails.browser === "safari")
									timePassed = timePassed / 1000;	// Apparently the timestamp is in microseconds, in Safari
								const bitRate = Math.round(((this.bitrate.bsnow || 0) - (this.bitrate.bsbefore || 0)) * 8 / timePassed);
								this.bitrate.value = bitRate + " kbits/sec";
								// ~ Janus.log("Estimated bitrate is " + this.bitrate.value);
								this.bitrate.bsbefore = this.bitrate.bsnow;
								this.bitrate.tsbefore = this.bitrate.tsnow;
							}
						}
					});
				}, 1000);
				return "0 kbits/sec";	// We don't have a bitrate value yet
			}
			return this.bitrate.value;
		} else {
			this._logger.warn("Getting the video bitrate unsupported by browser");
			throw new Error("Feature unsupported by browser");
		}
	}

	// TODO: multiple data channels can be used
	public getDataChannel() {
		if (!this._dataChannel) {
			this._dataChannel = new WebRTCDataChannel(this.loggerFactory, this.peerConnection);
		}
		return this._dataChannel;
	}

	private isAudioSendEnabled(answerRequirements: WebRTCPeerOptions): boolean {
		return (answerRequirements & WebRTCPeerOptions.AudioSend) === WebRTCPeerOptions.AudioSend;
	}

	private isAudioRecvEnabled(answerRequirements: WebRTCPeerOptions): boolean {
		return (answerRequirements & WebRTCPeerOptions.AudioReceive) === WebRTCPeerOptions.AudioReceive;
	}

	public getSenders() : RTCRtpSender[]{
		return  this.peerConnection.getSenders();
	}

	public getDTMFSender(){
		if (!this.dtmfSender){
			this.dtmfSender = new WebRTCDTMFSender(this.loggerFactory,this);
		}
		return this.dtmfSender;
	}

	public async createAnswer(answerRequirements: WebRTCPeerOptions) {
		const simulcast = (answerRequirements & WebRTCPeerOptions.Simulcast) === WebRTCPeerOptions.Simulcast;

		if (!simulcast) {
			this._logger.info("Creating answer (iceDone=" + this.iceDone + ")");
		} else {
			this._logger.info("Creating answer (iceDone=" + this.iceDone + ", simulcast=" + simulcast + ")");
		}
		let mediaConstraints: RTCOfferOptions;
		// if (adapter.browserDetails.browser === "firefox" && adapter.browserDetails.version! >= 59) {
		// 	// Firefox >= 59 uses Transceivers
		// 	mediaConstraints = {};
		// 	let audioTransceiver = null;
		// 	let videoTransceiver = null;
		// 	const transceivers = this.peerConnection.getTransceivers();
		// 	if (transceivers && transceivers.length > 0) {
		// 		for (const t of transceivers) {
		// 			if ((t.sender && t.sender.track && t.sender.track.kind === "audio") ||
		// 				(t.receiver && t.receiver.track && t.receiver.track.kind === "audio")) {
		// 				if (!audioTransceiver)
		// 					audioTransceiver = t;
		// 				continue;
		// 			}
		// 			if ((t.sender && t.sender.track && t.sender.track.kind === "video") ||
		// 				(t.receiver && t.receiver.track && t.receiver.track.kind === "video")) {
		// 				if (!videoTransceiver)
		// 					videoTransceiver = t;
		// 				continue;
		// 			}
		// 		}
		// 	}
		// 	// Handle audio (and related changes, if any)
		// 	const audioSend = this.isAudioSendEnabled(answerRequirements);
		// 	const audioRecv = this.isAudioRecvEnabled(answerRequirements);
		// 	if (!audioSend && !audioRecv) {
		// 		// Audio disabled: have we removed it?
		// 		if (audioTransceiver) {
		// 			audioTransceiver.direction = "inactive";
		// 			this._logger.info("Setting audio transceiver to inactive:", audioTransceiver);
		// 		}
		// 	} else {
		// 		// Take care of audio m-line
		// 		if (audioSend && audioRecv) {
		// 			if (audioTransceiver) {
		// 				audioTransceiver.direction = "sendrecv";
		// 				this._logger.info("Setting audio transceiver to sendrecv:", audioTransceiver);
		// 			}
		// 		} else if (audioSend && !audioRecv) {
		// 			if (audioTransceiver) {
		// 				audioTransceiver.direction = "sendonly";
		// 				this._logger.info("Setting audio transceiver to sendonly:", audioTransceiver);
		// 			}
		// 		} else if (!audioSend && audioRecv) {
		// 			if (audioTransceiver) {
		// 				audioTransceiver.direction = "recvonly";
		// 				this._logger.info("Setting audio transceiver to recvonly:", audioTransceiver);
		// 			} else {
		// 				// In theory, this is the only case where we might not have a transceiver yet
		// 				audioTransceiver = this.peerConnection.addTransceiver("audio", { direction: "recvonly" });
		// 				this._logger.info("Adding recvonly audio transceiver:", audioTransceiver);
		// 			}
		// 		}
		// 	}
		// 	// Handle video (and related changes, if any)
		// 	const videoSend = this.isVideoSendEnabled(answerRequirements);
		// 	const videoRecv = this.isVideoRecvEnabled(answerRequirements);
		// 	if (!videoSend && !videoRecv) {
		// 		// Video disabled: have we removed it?
		// 		if (videoTransceiver) {
		// 			videoTransceiver.direction = "inactive";
		// 			this._logger.info("Setting video transceiver to inactive:", videoTransceiver);
		// 		}
		// 	} else {
		// 		// Take care of video m-line
		// 		if (videoSend && videoRecv) {
		// 			if (videoTransceiver) {
		// 				videoTransceiver.direction = "sendrecv";
		// 				this._logger.info("Setting video transceiver to sendrecv:", videoTransceiver);
		// 			}
		// 		} else if (videoSend && !videoRecv) {
		// 			if (videoTransceiver) {
		// 				videoTransceiver.direction = "sendonly";
		// 				this._logger.info("Setting video transceiver to sendonly:", videoTransceiver);
		// 			}
		// 		} else if (!videoSend && videoRecv) {
		// 			if (videoTransceiver) {
		// 				videoTransceiver.direction = "recvonly";
		// 				this._logger.info("Setting video transceiver to recvonly:", videoTransceiver);
		// 			} else {
		// 				// In theory, this is the only case where we might not have a transceiver yet
		// 				videoTransceiver = this.peerConnection.addTransceiver("video", { direction: "recvonly" });
		// 				this._logger.info("Adding recvonly video transceiver:", videoTransceiver);
		// 			}
		// 		}
		// 	}
		// } else {
		// 	if (adapter.browserDetails.browser === "firefox" || adapter.browserDetails.browser === "edge") {
		// 		mediaConstraints = {
		// 			offerToReceiveAudio: this.isAudioRecvEnabled(answerRequirements),
		// 			offerToReceiveVideo: this.isVideoRecvEnabled(answerRequirements)
		// 		};
		// 	} else {
		// 		mediaConstraints = {
		// 			// @ts-ignore
		// 			mandatory: {
		// 				OfferToReceiveAudio: this.isAudioRecvEnabled(answerRequirements),
		// 				OfferToReceiveVideo: this.isVideoRecvEnabled(answerRequirements)
		// 			}
		// 		};
		// 	}
		// }

		mediaConstraints = {
			offerToReceiveAudio: this.isAudioRecvEnabled(answerRequirements),
			offerToReceiveVideo: this.isVideoRecvEnabled(answerRequirements)
		};

		const iceRestart = (answerRequirements & WebRTCPeerOptions.iceRestart) === WebRTCPeerOptions.iceRestart;
		if (iceRestart) {
			mediaConstraints["iceRestart"] = true;
		}

		this._logger.debug("MediaConstraints", mediaConstraints);
		// Check if this is Firefox and we've been asked to do simulcasting
		const sendVideo = this.isVideoSendEnabled(answerRequirements);
		if (sendVideo && simulcast && adapter.browserDetails.browser === "firefox") {
			// FIXME Based on https://gist.github.com/voluntas/088bc3cc62094730647b
			this._logger.info("Enabling Simulcasting for Firefox (RID)");
			const sender = this.peerConnection.getSenders()[1];
			this._logger.info(sender);
			const parameters = sender.getParameters();
			this._logger.info(parameters);
			parameters.encodings = [
				{ rid: "high", active: true, priority: "high", maxBitrate: 1000000 },
				{ rid: "medium", active: true, priority: "medium", maxBitrate: 300000 },
				{ rid: "low", active: true, priority: "low", maxBitrate: 100000 }
			];
			sender.setParameters(parameters);
		}
		const answer = await this.peerConnection.createAnswer(mediaConstraints);
		this._logger.debug("created answer", answer);
		if (sendVideo && simulcast) {
			// This SDP munging only works with Chrome
			if (adapter.browserDetails.browser === "chrome") {
				// FIXME Apparently trying to simulcast when answering breaks video in Chrome...
				// ~ this._logger.info("Enabling Simulcasting for Chrome (SDP munging)");
				// ~ answer.sdp = mungeSdpForSimulcasting(answer.sdp);
				this._logger.warn("simulcast=true, but this is an answer, and video breaks in Chrome if we enable it");
			} else if (adapter.browserDetails.browser !== "firefox") {
				this._logger.warn("simulcast=true, but this is not Chrome nor Firefox, ignoring");
			}
		}
		this.mySdp = answer;
		await this.setLocalDescription(answer);
		this.mediaConstraints = mediaConstraints;
		if (!this.iceDone && !this.trickle) {
			// Don't do anything until we have all candidates
			this._logger.info("Waiting for all candidates...");
			const localDescription = await this.iceDonePromise;
			// await this.setLocalDescription(localDescription);
			return {
				type: this.peerConnection.localDescription!.type,
				sdp: this.peerConnection.localDescription!.sdp
			};
		}
		// JSON.stringify doesn't work on some WebRTC objects anymore
		// See https://code.google.com/p/chromium/issues/detail?id=467366
		const jsep = {
			"type": answer.type,
			"sdp": answer.sdp
		};
		return (jsep);
	}

	private async acceptJSEP(jsep: RTCSessionDescriptionInit) {
		if (jsep !== undefined && jsep !== null) {
			if (!this.peerConnection) {
				this._logger.warn("Wait, no PeerConnection?? if this is an answer, use createAnswer and not handleRemoteJsep");
				throw new Error("No PeerConnection: if this is an answer, use createAnswer and not handleRemoteJsep");
			}
			await this.setRemoteDescription(new RTCSessionDescription(jsep));
			this._logger.info("Remote description accepted!");
			this.remoteSdp = jsep;
			// Any trickle candidate we cached?
			if (this.candidates && this.candidates.length > 0) {
				for (const candidate of this.candidates) {
					this._logger.debug("Adding remote candidate:", candidate);
					if (!candidate || candidate.completed === true) {
						// end-of-candidates
						await this.addIceCandidate();
					} else {
						// New candidate
						await this.addIceCandidate(new RTCIceCandidate(candidate as RTCIceCandidateInit));
					}
				}
				this.candidates = [];
			}
			// Done
		}
	}

	public async acceptAnswer(jsep: RTCSessionDescriptionInit) {
		await this.acceptJSEP(jsep);
	}


	public async createOffer(answerRequirements: WebRTCPeerOptions) {
		const simulcast = (answerRequirements & WebRTCPeerOptions.Simulcast) === WebRTCPeerOptions.Simulcast;
		if (!simulcast) {
			this._logger.info("Creating offer (iceDone=" + this.iceDone + ")");
		} else {
			this._logger.info("Creating offer (iceDone=" + this.iceDone + ", simulcast=" + simulcast + ")");
		}
		// https://code.google.com/p/webrtc/issues/detail?id=3508
		const mediaConstraints: RTCOfferOptions = {};
		if (adapter.browserDetails.browser === "firefox" && adapter.browserDetails.version! >= 59) {
			// Firefox >= 59 uses Transceivers
			let audioTransceiver = null;
			let videoTransceiver = null;
			const transceivers = this.peerConnection.getTransceivers();
			if (transceivers && transceivers.length > 0) {
				for (const t of transceivers) {
					if ((t.sender && t.sender.track && t.sender.track.kind === "audio") ||
						(t.receiver && t.receiver.track && t.receiver.track.kind === "audio")) {
						if (!audioTransceiver)
							audioTransceiver = t;
						continue;
					}
					if ((t.sender && t.sender.track && t.sender.track.kind === "video") ||
						(t.receiver && t.receiver.track && t.receiver.track.kind === "video")) {
						if (!videoTransceiver)
							videoTransceiver = t;
						continue;
					}
				}
			}
			// Handle audio (and related changes, if any)
			const audioSend = this.isAudioSendEnabled(answerRequirements);
			const audioRecv = this.isAudioRecvEnabled(answerRequirements);
			if (!audioSend && !audioRecv) {
				// Audio disabled: have we removed it?
				if (audioTransceiver) {
					audioTransceiver.direction = "inactive";
					this._logger.info("Setting audio transceiver to inactive:", audioTransceiver);
				}
			} else {
				// Take care of audio m-line
				if (audioSend && audioRecv) {
					if (audioTransceiver) {
						audioTransceiver.direction = "sendrecv";
						this._logger.info("Setting audio transceiver to sendrecv:", audioTransceiver);
					}
				} else if (audioSend && !audioRecv) {
					if (audioTransceiver) {
						audioTransceiver.direction = "sendonly";
						this._logger.info("Setting audio transceiver to sendonly:", audioTransceiver);
					}
				} else if (!audioSend && audioRecv) {
					if (audioTransceiver) {
						audioTransceiver.direction = "recvonly";
						this._logger.info("Setting audio transceiver to recvonly:", audioTransceiver);
					} else {
						// In theory, this is the only case where we might not have a transceiver yet
						audioTransceiver = this.peerConnection.addTransceiver("audio", { direction: "recvonly" });
						this._logger.info("Adding recvonly audio transceiver:", audioTransceiver);
					}
				}
			}
			// Handle video (and related changes, if any)
			const videoSend = this.isVideoSendEnabled(answerRequirements);
			const videoRecv = this.isVideoRecvEnabled(answerRequirements);
			if (!videoSend && !videoRecv) {
				// Video disabled: have we removed it?
				if (videoTransceiver) {
					videoTransceiver.direction = "inactive";
					this._logger.info("Setting video transceiver to inactive:", videoTransceiver);
				}
			} else {
				// Take care of video m-line
				if (videoSend && videoRecv) {
					if (videoTransceiver) {
						videoTransceiver.direction = "sendrecv";
						this._logger.info("Setting video transceiver to sendrecv:", videoTransceiver);
					}
				} else if (videoSend && !videoRecv) {
					if (videoTransceiver) {
						videoTransceiver.direction = "sendonly";
						this._logger.info("Setting video transceiver to sendonly:", videoTransceiver);
					}
				} else if (!videoSend && videoRecv) {
					if (videoTransceiver) {
						videoTransceiver.direction = "recvonly";
						this._logger.info("Setting video transceiver to recvonly:", videoTransceiver);
					} else {
						// In theory, this is the only case where we might not have a transceiver yet
						videoTransceiver = this.peerConnection.addTransceiver("video", { direction: "recvonly" });
						this._logger.info("Adding recvonly video transceiver:", videoTransceiver);
					}
				}
			}
		} else {
			mediaConstraints["offerToReceiveAudio"] = this.isAudioRecvEnabled(answerRequirements);
			mediaConstraints["offerToReceiveVideo"] = this.isVideoRecvEnabled(answerRequirements);
		}
		const iceRestart = (answerRequirements & WebRTCPeerOptions.iceRestart) === WebRTCPeerOptions.iceRestart;
		if (iceRestart) {
			mediaConstraints["iceRestart"] = true;
		}
		this._logger.debug("MediaConstraints", mediaConstraints);
		// Check if this is Firefox and we've been asked to do simulcasting
		const sendVideo = this.isVideoSendEnabled(answerRequirements);
		if (sendVideo && simulcast && adapter.browserDetails.browser === "firefox") {
			// FIXME Based on https://gist.github.com/voluntas/088bc3cc62094730647b
			this._logger.info("Enabling Simulcasting for Firefox (RID)");
			const sender = this.peerConnection.getSenders()[1];
			this._logger.info(sender);
			const parameters = sender.getParameters();
			this._logger.info(parameters);
			parameters.encodings = [
				{ rid: "high", active: true, priority: "high", maxBitrate: 1000000 },
				{ rid: "medium", active: true, priority: "medium", maxBitrate: 300000 },
				{ rid: "low", active: true, priority: "low", maxBitrate: 100000 }
			];
			sender.setParameters(parameters);
		}
		const offer = await this.peerConnection.createOffer(mediaConstraints);

		this._logger.debug("Created Offer", offer);
		if (sendVideo && simulcast) {
			// This SDP munging only works with Chrome
			if (adapter.browserDetails.browser === "chrome") {
				this._logger.info("Enabling Simulcasting for Chrome (SDP munging)");
				offer.sdp = this.mungeSdpForSimulcasting(offer.sdp);
			} else if (adapter.browserDetails.browser !== "firefox") {
				this._logger.warn("simulcast=true, but this is not Chrome nor Firefox, ignoring");
			}
		}
		this.mySdp = offer;
		await this.setLocalDescription(offer);
		this.mediaConstraints = mediaConstraints;
		// if (!this.iceDone && !this.trickle) {
		// 	// Don't do anything until we have all candidates
		// 	this._logger.info("Waiting for all candidates...");
		// 	const localDescription = await this.iceDonePromise;
		// 	await this.setLocalDescription(localDescription);
		// 	return {
		// 		type: this.peerConnection.localDescription!.type,
		// 		sdp: this.peerConnection.localDescription!.sdp
		// 	};
		// }
		// JSON.stringify doesn't work on some WebRTC objects anymore
		// See https://code.google.com/p/chromium/issues/detail?id=467366
		const jsep = {
			"type": offer.type,
			"sdp": offer.sdp
		};
		return (jsep);

	}

	public async acceptOffer(jsep: RTCSessionDescriptionInit) {
		await this.acceptJSEP(jsep);
	}

	public async addIceCandidate(candidate?: RTCIceCandidateInit | RTCIceCandidate) {
		this._logger.debug("adding ice candidate", candidate);
		await this.peerConnection.addIceCandidate(candidate as RTCIceCandidateInit | RTCIceCandidate);
	}

	private isVideoSendEnabled(answerRequirements: WebRTCPeerOptions): boolean {
		return (answerRequirements & WebRTCPeerOptions.VideoSend) === WebRTCPeerOptions.VideoSend;
	}
	private isVideoRecvEnabled(answerRequirements: WebRTCPeerOptions): boolean {
		return (answerRequirements & WebRTCPeerOptions.VideoReceive) === WebRTCPeerOptions.VideoReceive;
	}

	// Helper method to munge an SDP to enable simulcasting (Chrome only)
	private mungeSdpForSimulcasting(sdp?: string) {
		// Let's munge the SDP to add the attributes for enabling simulcasting
		// (based on https://gist.github.com/ggarber/a19b4c33510028b9c657)
		const lines = (sdp || "").split("\r\n");
		let video = false;
		const ssrc: (string | number)[] = [-1];
		const ssrc_fid: (string | number)[] = [-1];
		let cname = null;
		let msid = null;
		let mslabel = null;
		let label = null;
		let insertAt = -1;
		for (let i = 0; i < lines.length; i++) {
			const mline = lines[i].match(/m=(\w+) */);
			if (mline) {
				const medium = mline[1];
				if (medium === "video") {
					// New video m-line: make sure it's the first one
					if (ssrc[0] < 0) {
						video = true;
					} else {
						// We're done, let's add the new attributes here
						insertAt = i;
						break;
					}
				} else {
					// New non-video m-line: do we have what we were looking for?
					if (ssrc[0] > -1) {
						// We're done, let's add the new attributes here
						insertAt = i;
						break;
					}
				}
				continue;
			}
			if (!video)
				continue;
			const fid = lines[i].match(/a=ssrc-group:FID (\d+) (\d+)/);
			if (fid) {
				ssrc[0] = fid[1];
				ssrc_fid[0] = fid[2];
				lines.splice(i, 1); i--;
				continue;
			}
			if (ssrc[0]) {
				let match = lines[i].match("a=ssrc:" + ssrc[0] + " cname:(.+)");
				if (match) {
					cname = match[1];
				}
				match = lines[i].match("a=ssrc:" + ssrc[0] + " msid:(.+)");
				if (match) {
					msid = match[1];
				}
				match = lines[i].match("a=ssrc:" + ssrc[0] + " mslabel:(.+)");
				if (match) {
					mslabel = match[1];
				}
				match = lines[i].match("a=ssrc:" + ssrc[0] + " label:(.+)");
				if (match) {
					label = match[1];
				}
				if (lines[i].indexOf("a=ssrc:" + ssrc_fid[0]) === 0) {
					lines.splice(i, 1); i--;
					continue;
				}
				if (lines[i].indexOf("a=ssrc:" + ssrc[0]) === 0) {
					lines.splice(i, 1); i--;
					continue;
				}
			}
			if (lines[i].length === 0) {
				lines.splice(i, 1); i--;
				continue;
			}
		}
		if (ssrc[0] < 0) {
			// Couldn't find a FID attribute, let's just take the first video SSRC we find
			insertAt = -1;
			video = false;
			for (let i = 0; i < lines.length; i++) {
				const mline = lines[i].match(/m=(\w+) */);
				if (mline) {
					const medium = mline[1];
					if (medium === "video") {
						// New video m-line: make sure it's the first one
						if (ssrc[0] < 0) {
							video = true;
						} else {
							// We're done, let's add the new attributes here
							insertAt = i;
							break;
						}
					} else {
						// New non-video m-line: do we have what we were looking for?
						if (ssrc[0] > -1) {
							// We're done, let's add the new attributes here
							insertAt = i;
							break;
						}
					}
					continue;
				}
				if (!video)
					continue;
				if (ssrc[0] < 0) {
					const value = lines[i].match(/a=ssrc:(\d+)/);
					if (value) {
						ssrc[0] = value[1];
						lines.splice(i, 1); i--;
						continue;
					}
				} else {
					let match = lines[i].match("a=ssrc:" + ssrc[0] + " cname:(.+)");
					if (match) {
						cname = match[1];
					}
					match = lines[i].match("a=ssrc:" + ssrc[0] + " msid:(.+)");
					if (match) {
						msid = match[1];
					}
					match = lines[i].match("a=ssrc:" + ssrc[0] + " mslabel:(.+)");
					if (match) {
						mslabel = match[1];
					}
					match = lines[i].match("a=ssrc:" + ssrc[0] + " label:(.+)");
					if (match) {
						label = match[1];
					}
					if (lines[i].indexOf("a=ssrc:" + ssrc_fid[0]) === 0) {
						lines.splice(i, 1); i--;
						continue;
					}
					if (lines[i].indexOf("a=ssrc:" + ssrc[0]) === 0) {
						lines.splice(i, 1); i--;
						continue;
					}
				}
				if (lines[i].length === 0) {
					lines.splice(i, 1); i--;
					continue;
				}
			}
		}
		if (ssrc[0] < 0) {
			// Still nothing, let's just return the SDP we were asked to munge
			this._logger.warn("Couldn't find the video SSRC, simulcasting NOT enabled");
			return sdp;
		}
		if (insertAt < 0) {
			// Append at the end
			insertAt = lines.length;
		}
		// Generate a couple of SSRCs (for retransmissions too)
		// Note: should we check if there are conflicts, here?
		ssrc[1] = Math.floor(Math.random() * 0xFFFFFFFF);
		ssrc[2] = Math.floor(Math.random() * 0xFFFFFFFF);
		ssrc_fid[1] = Math.floor(Math.random() * 0xFFFFFFFF);
		ssrc_fid[2] = Math.floor(Math.random() * 0xFFFFFFFF);
		// Add attributes to the SDP
		for (let i = 0; i < ssrc.length; i++) {
			if (cname) {
				lines.splice(insertAt, 0, "a=ssrc:" + ssrc[i] + " cname:" + cname);
				insertAt++;
			}
			if (msid) {
				lines.splice(insertAt, 0, "a=ssrc:" + ssrc[i] + " msid:" + msid);
				insertAt++;
			}
			if (mslabel) {
				lines.splice(insertAt, 0, "a=ssrc:" + ssrc[i] + " mslabel:" + mslabel);
				insertAt++;
			}
			if (label) {
				lines.splice(insertAt, 0, "a=ssrc:" + ssrc[i] + " label:" + label);
				insertAt++;
			}
			// Add the same info for the retransmission SSRC
			if (cname) {
				lines.splice(insertAt, 0, "a=ssrc:" + ssrc_fid[i] + " cname:" + cname);
				insertAt++;
			}
			if (msid) {
				lines.splice(insertAt, 0, "a=ssrc:" + ssrc_fid[i] + " msid:" + msid);
				insertAt++;
			}
			if (mslabel) {
				lines.splice(insertAt, 0, "a=ssrc:" + ssrc_fid[i] + " mslabel:" + mslabel);
				insertAt++;
			}
			if (label) {
				lines.splice(insertAt, 0, "a=ssrc:" + ssrc_fid[i] + " label:" + label);
				insertAt++;
			}
		}
		lines.splice(insertAt, 0, "a=ssrc-group:FID " + ssrc[2] + " " + ssrc_fid[2]);
		lines.splice(insertAt, 0, "a=ssrc-group:FID " + ssrc[1] + " " + ssrc_fid[1]);
		lines.splice(insertAt, 0, "a=ssrc-group:FID " + ssrc[0] + " " + ssrc_fid[0]);
		lines.splice(insertAt, 0, "a=ssrc-group:SIM " + ssrc[0] + " " + ssrc[1] + " " + ssrc[2]);
		sdp = lines.join("\r\n");
		if (!sdp.endsWith("\r\n"))
			sdp += "\r\n";
		return sdp;
	}

	public on_icecandidate(handler: (event: RTCIceCandidate | null) => void) {
		this._logger.debug("registering icecandidate");
		this._eventEmitter.on("icecandidate", handler);
	}

	public on_connectionstatechange(handler: (state: RTCPeerConnectionState) => void) {
		this._eventEmitter.on("connectionstatechange", handler);
	}

	public on_remotestreams(handler: (streams: WebRTCMediaStream[]) => void) {
		this._eventEmitter.on("remotestreams", handler);
	}
}