import { ILoggerFactory } from "../../logger/ILoggerFactory";
import { ILogger } from "../../logger/ILogger";
import { WebRTCPeerOptions, WebRTCPeerConnection } from "./WebRTCPeerConnection";
import { WebRTCMediaSource } from "./WebRTCMediaSource";



export class WebRTC {
	private _logger: ILogger;

	private _mediaSource : WebRTCMediaSource;

	constructor(
		public readonly loggerFactory: ILoggerFactory) {
		this._logger = loggerFactory.create("WebRTC");
	}

	public get sources(): WebRTCMediaSource{
		if (!this._mediaSource){
			this._mediaSource = new WebRTCMediaSource(this.loggerFactory);
		}
		return this._mediaSource;
	}

	public newPeerConnection(): WebRTCPeerConnection{
		return new WebRTCPeerConnection(this.loggerFactory);
	}



	/**
	 * check whether WebRTC is supported by this browser
	 */
	public isWebrtcSupported() {
		return RTCPeerConnection !== undefined && RTCPeerConnection !== null &&
			navigator.getUserMedia !== undefined && navigator.getUserMedia !== null;
	}

	public on_consentDialog(handler: (on:boolean)=>void){
		throw new Error("not implemented");
	}

	public on_webrtcState(handler: (state: boolean, reason: string) => void) {
		// this.clientSession.
		throw new Error("not implemented");
	}

	public on_mediaState(handler: (type: string, receiving: boolean)=>void){
		// this.clientSession;
		throw new Error("not implemented");
	}




}