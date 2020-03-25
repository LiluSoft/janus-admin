import { ILoggerFactory } from "../../logger/ILoggerFactory";
import { ILogger } from "../../logger/ILogger";

export class WebRTCMediaStream {
	private _logger: ILogger;
	constructor(public readonly loggerFactory: ILoggerFactory, public mediaStream: MediaStream) {
		this._logger = loggerFactory.create("WebRTCMediaStream");
		this._logger.trace("Initializing");
	}

	public getVideoTracks(): MediaStreamTrack[] {
		return this.mediaStream.getVideoTracks();
	}

	public getAudioTracks(): MediaStreamTrack[] {
		return this.mediaStream.getAudioTracks();
	}

	public getTracks(){
		return this.mediaStream.getTracks();
	}

	public stop() {
		if (this.mediaStream) {
			this.mediaStream.getTracks().forEach(track => track.stop());
			delete this.mediaStream;
		}
	}

	public muteAudio() {
		this.getAudioTracks().forEach(track => track.enabled = false);
	}

	public muteVideo() {
		this.getVideoTracks().forEach(track => track.enabled = false);
	}

	public unmuteAudio() {
		this.getAudioTracks().forEach(track => track.enabled = true);
	}

	public unmuteVideo() {
		this.getVideoTracks().forEach(track => track.enabled = true);
	}

	public isAudioMuted() {
		if (this.mediaStream === undefined || this.mediaStream === null) {
			this._logger.warn("Invalid local MediaStream");
			return true;
		}
		// Check audio track
		if (!this.getAudioTracks() || this.getAudioTracks().length === 0) {
			this._logger.warn("No audio track");
			return true;
		}
		return !this.getAudioTracks()[0].enabled;
	}

	public isVideoMuted() {
		if (this.mediaStream === undefined || this.mediaStream === null) {
			this._logger.warn("Invalid local MediaStream");
			return true;
		}

		if (this.getVideoTracks() === null || this.getVideoTracks().length === 0) {
			this._logger.warn("No video track");
			return true;
		}
		return !this.mediaStream.getVideoTracks()[0].enabled;
	}


	// public applyConstraints(){
	// 	this.mediaStream.getTracks()[0].applyConstraints({})
	// }
}