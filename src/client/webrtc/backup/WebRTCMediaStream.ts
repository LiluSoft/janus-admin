// import { ILoggerFactory } from "../../logger/ILoggerFactory";
// import { ILogger } from "../../logger/ILogger";
// import adapter from "webrtc-adapter";

// export class WebRTCMediaStream {
// 	private _logger: ILogger;
// 	private myStream: MediaStream;

// 	constructor(public readonly loggerFactory: ILoggerFactory) {
// 		this._logger = loggerFactory.create("WebRTCMediaStream");
// 	}


// 	private reconfigure(stream: MediaStream, replaceAudio: boolean, replaceVideo: boolean) {
// 		this._logger.debug("streamsDone:", stream);
// 		if (stream) {
// 			this._logger.debug("  -- Audio tracks:", stream.getAudioTracks());
// 			this._logger.debug("  -- Video tracks:", stream.getVideoTracks());
// 		}
// 		// We're now capturing the new stream: check if we're updating or if it's a new thing
// 		let addTracks = false;
// 		if (!this.myStream || !media.update || config.streamExternal) {
// 			this.myStream = stream;
// 			addTracks = true;
// 		} else {
// 			// We only need to update the existing stream
// 			if (((!media.update && isAudioSendEnabled(media)) || (media.update && (media.addAudio || media.replaceAudio))) &&
// 				stream.getAudioTracks() && stream.getAudioTracks().length) {
// 				this.myStream.addTrack(stream.getAudioTracks()[0]);
// 				if (media.replaceAudio && adapter.browserDetails.browser === "firefox") {
// 					Janus.log("Replacing audio track:", stream.getAudioTracks()[0]);
// 					for (const index in config.pc.getSenders()) {
// 						const s = config.pc.getSenders()[index];
// 						if (s && s.track && s.track.kind === "audio") {
// 							s.replaceTrack(stream.getAudioTracks()[0]);
// 						}
// 					}
// 				} else {
// 					if (adapter.browserDetails.browser === "firefox" && adapter.browserDetails.version >= 59) {
// 						// Firefox >= 59 uses Transceivers
// 						Janus.log((media.replaceVideo ? "Replacing" : "Adding") + " video track:", stream.getVideoTracks()[0]);
// 						let audioTransceiver = null;
// 						const transceivers = config.pc.getTransceivers();
// 						if (transceivers && transceivers.length > 0) {
// 							for (const i in transceivers) {
// 								const t = transceivers[i];
// 								if ((t.sender && t.sender.track && t.sender.track.kind === "audio") ||
// 									(t.receiver && t.receiver.track && t.receiver.track.kind === "audio")) {
// 									audioTransceiver = t;
// 									break;
// 								}
// 							}
// 						}
// 						if (audioTransceiver && audioTransceiver.sender) {
// 							audioTransceiver.sender.replaceTrack(stream.getVideoTracks()[0]);
// 						} else {
// 							config.pc.addTrack(stream.getVideoTracks()[0], stream);
// 						}
// 					} else {
// 						Janus.log((media.replaceAudio ? "Replacing" : "Adding") + " audio track:", stream.getAudioTracks()[0]);
// 						config.pc.addTrack(stream.getAudioTracks()[0], stream);
// 					}
// 				}
// 			}
// 			if (((!media.update && isVideoSendEnabled(media)) || (media.update && (media.addVideo || media.replaceVideo))) &&
// 				stream.getVideoTracks() && stream.getVideoTracks().length) {
// 				this.myStream.addTrack(stream.getVideoTracks()[0]);
// 				if (media.replaceVideo && adapter.browserDetails.browser === "firefox") {
// 					Janus.log("Replacing video track:", stream.getVideoTracks()[0]);
// 					for (const index in config.pc.getSenders()) {
// 						const s = config.pc.getSenders()[index];
// 						if (s && s.track && s.track.kind === "video") {
// 							s.replaceTrack(stream.getVideoTracks()[0]);
// 						}
// 					}
// 				} else {
// 					if (adapter.browserDetails.browser === "firefox" && adapter.browserDetails.version >= 59) {
// 						// Firefox >= 59 uses Transceivers
// 						Janus.log((media.replaceVideo ? "Replacing" : "Adding") + " video track:", stream.getVideoTracks()[0]);
// 						let videoTransceiver = null;
// 						const transceivers = config.pc.getTransceivers();
// 						if (transceivers && transceivers.length > 0) {
// 							for (const i in transceivers) {
// 								const t = transceivers[i];
// 								if ((t.sender && t.sender.track && t.sender.track.kind === "video") ||
// 									(t.receiver && t.receiver.track && t.receiver.track.kind === "video")) {
// 									videoTransceiver = t;
// 									break;
// 								}
// 							}
// 						}
// 						if (videoTransceiver && videoTransceiver.sender) {
// 							videoTransceiver.sender.replaceTrack(stream.getVideoTracks()[0]);
// 						} else {
// 							config.pc.addTrack(stream.getVideoTracks()[0], stream);
// 						}
// 					} else {
// 						Janus.log((media.replaceVideo ? "Replacing" : "Adding") + " video track:", stream.getVideoTracks()[0]);
// 						config.pc.addTrack(stream.getVideoTracks()[0], stream);
// 					}
// 				}
// 			}
// 		}
// 		// If we still need to create a PeerConnection, let's do that
// 		if (!config.pc) {
// 			const pc_config = { "iceServers": iceServers, "iceTransportPolicy": iceTransportPolicy, "bundlePolicy": bundlePolicy };
// 			// ~ var pc_constraints = {'mandatory': {'MozDontOfferDataChannel':true}};
// 			const pc_constraints = {
// 				"optional": [{ "DtlsSrtpKeyAgreement": true }]
// 			};
// 			if (ipv6Support === true) {
// 				pc_constraints.optional.push({ "googIPv6": true });
// 			}
// 			// Any custom constraint to add?
// 			if (callbacks.rtcConstraints && typeof callbacks.rtcConstraints === "object") {
// 				Janus.debug("Adding custom PeerConnection constraints:", callbacks.rtcConstraints);
// 				for (const i in callbacks.rtcConstraints) {
// 					pc_constraints.optional.push(callbacks.rtcConstraints[i]);
// 				}
// 			}
// 			if (adapter.browserDetails.browser === "edge") {
// 				// This is Edge, enable BUNDLE explicitly
// 				pc_config.bundlePolicy = "max-bundle";
// 			}
// 			Janus.log("Creating PeerConnection");
// 			Janus.debug(pc_constraints);
// 			config.pc = new RTCPeerConnection(pc_config, pc_constraints);
// 			Janus.debug(config.pc);
// 			if (config.pc.getStats) {	// FIXME
// 				config.volume = {};
// 				config.bitrate.value = "0 kbits/sec";
// 			}
// 			Janus.log("Preparing local SDP and gathering candidates (trickle=" + config.trickle + ")");
// 			config.pc.oniceconnectionstatechange = function (e) {
// 				if (config.pc)
// 					pluginHandle.iceState(config.pc.iceConnectionState);
// 			};
// 			config.pc.onicecandidate = function (event) {
// 				if (event.candidate == null ||
// 					(adapter.browserDetails.browser === "edge" && event.candidate.candidate.indexOf("endOfCandidates") > 0)) {
// 					Janus.log("End of candidates.");
// 					config.iceDone = true;
// 					if (config.trickle === true) {
// 						// Notify end of candidates
// 						sendTrickleCandidate(handleId, { "completed": true });
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
// 					if (config.trickle === true) {
// 						// Send candidate
// 						sendTrickleCandidate(handleId, candidate);
// 					}
// 				}
// 			};
// 			config.pc.ontrack = function (event) {
// 				Janus.log("Handling Remote Track");
// 				Janus.debug(event);
// 				if (!event.streams)
// 					return;
// 				config.remoteStream = event.streams[0];
// 				pluginHandle.onremotestream(config.remoteStream);
// 				if (event.track && !event.track.onended) {
// 					Janus.log("Adding onended callback to track:", event.track);
// 					event.track.onended = function (ev) {
// 						Janus.log("Remote track removed:", ev);
// 						if (config.remoteStream) {
// 							config.remoteStream.removeTrack(ev.target);
// 							pluginHandle.onremotestream(config.remoteStream);
// 						}
// 					};
// 				}
// 			};
// 		}
// 		if (addTracks && stream !== null && stream !== undefined) {
// 			Janus.log("Adding local stream");
// 			stream.getTracks().forEach(function (track) {
// 				Janus.log("Adding local track:", track);
// 				config.pc.addTrack(track, stream);
// 			});
// 		}

// 		// If there's a new local stream, let's notify the application
// 		if (this.myStream)
// 			pluginHandle.onlocalstream(this.myStream);
// 		// Create offer/answer now
// 		if (jsep === null || jsep === undefined) {
// 			createOffer(handleId, media, callbacks);
// 		} else {
// 			config.pc.setRemoteDescription(
// 				new RTCSessionDescription(jsep),
// 				function () {
// 					Janus.log("Remote description accepted!");
// 					config.remoteSdp = jsep.sdp;
// 					// Any trickle candidate we cached?
// 					if (config.candidates && config.candidates.length > 0) {
// 						for (const i in config.candidates) {
// 							const candidate = config.candidates[i];
// 							Janus.debug("Adding remote candidate:", candidate);
// 							if (!candidate || candidate.completed === true) {
// 								// end-of-candidates
// 								config.pc.addIceCandidate();
// 							} else {
// 								// New candidate
// 								config.pc.addIceCandidate(new RTCIceCandidate(candidate));
// 							}
// 						}
// 						config.candidates = [];
// 					}
// 					// Create the answer now
// 					createAnswer(handleId, media, callbacks);
// 				}, callbacks.error);
// 		}
// 	}

// 	public isAudioMuted() {
// 		if (this.myStream === undefined || this.myStream === null) {
// 			this._logger.warn("Invalid local MediaStream");
// 			return true;
// 		}
// 		// Check audio track
// 		if (this.myStream.getAudioTracks() === null
// 			|| this.myStream.getAudioTracks() === undefined
// 			|| this.myStream.getAudioTracks().length === 0) {
// 			this._logger.warn("No audio track");
// 			return true;
// 		}
// 		return !this.myStream.getAudioTracks()[0].enabled;
// 	}


// 	public isMuted(video: boolean) {
// 		if (this.myStream === undefined || this.myStream === null) {
// 			this._logger.warn("Invalid local MediaStream");
// 			return true;
// 		}
// 		if (video) {
// 			// Check video track
// 			if (this.myStream.getVideoTracks() === null
// 				|| this.myStream.getVideoTracks() === undefined
// 				|| this.myStream.getVideoTracks().length === 0) {
// 				this._logger.warn("No video track");
// 				return true;
// 			}
// 			return !this.myStream.getVideoTracks()[0].enabled;
// 		} else {
// 			// Check audio track
// 			if (this.myStream.getAudioTracks() === null
// 				|| this.myStream.getAudioTracks() === undefined
// 				|| this.myStream.getAudioTracks().length === 0) {
// 				this._logger.warn("No audio track");
// 				return true;
// 			}
// 			return !this.myStream.getAudioTracks()[0].enabled;
// 		}
// 	}

// 	public unmuteAudio() {
// 		if (this.myStream === undefined || this.myStream === null) {
// 			this._logger.warn("Invalid local MediaStream");
// 			return false;
// 		}

// 		// Mute/unmute audio track
// 		if (this.myStream.getAudioTracks() === null
// 			|| this.myStream.getAudioTracks() === undefined
// 			|| this.myStream.getAudioTracks().length === 0) {
// 			this._logger.warn("No audio track");
// 			return false;
// 		}
// 		this.myStream.getAudioTracks()[0].enabled = true;
// 		return true;
// 	}

// 	public muteAudio() {
// 		if (this.myStream === undefined || this.myStream === null) {
// 			this._logger.warn("Invalid local MediaStream");
// 			return false;
// 		}

// 		// Mute/unmute audio track
// 		if (this.myStream.getAudioTracks() === null
// 			|| this.myStream.getAudioTracks() === undefined
// 			|| this.myStream.getAudioTracks().length === 0) {
// 			this._logger.warn("No audio track");
// 			return false;
// 		}
// 		this.myStream.getAudioTracks()[0].enabled = false;
// 		return true;
// 	}

// 	public mute(video: boolean, mute: boolean) {
// 		if (this.myStream === undefined || this.myStream === null) {
// 			this._logger.warn("Invalid local MediaStream");
// 			return false;
// 		}
// 		if (video) {
// 			// Mute/unmute video track
// 			if (this.myStream.getVideoTracks() === null
// 				|| this.myStream.getVideoTracks() === undefined
// 				|| this.myStream.getVideoTracks().length === 0) {
// 				this._logger.warn("No video track");
// 				return false;
// 			}
// 			this.myStream.getVideoTracks()[0].enabled = mute ? false : true;
// 			return true;
// 		} else {
// 			// Mute/unmute audio track
// 			if (this.myStream.getAudioTracks() === null
// 				|| this.myStream.getAudioTracks() === undefined
// 				|| this.myStream.getAudioTracks().length === 0) {
// 				this._logger.warn("No audio track");
// 				return false;
// 			}
// 			this.myStream.getAudioTracks()[0].enabled = mute ? false : true;
// 			return true;
// 		}
// 	}

// 	public cleanup() {
// 		try {
// 			// Try a MediaStreamTrack.stop() for each track
// 			this._logger.info("Stopping local stream tracks");
// 			const tracks = this.myStream.getTracks();
// 			for (const mst of tracks) {
// 				this._logger.info(mst);
// 				if (mst !== null && mst !== undefined)
// 					mst.stop();
// 			}
// 		} catch (e) {
// 			// Do nothing if this fails
// 			this._logger.warn("Unable to stop stream", e);
// 		}
// 	}

// }