import { WebRTCMediaStream } from "./WebRTCMediaStream";
import { ILoggerFactory } from "../../logger/ILoggerFactory";
import { ILogger } from "../../logger/ILogger";

export class WebRTCMediaSource {
	private _logger: ILogger;
	constructor(public readonly loggerFactory: ILoggerFactory) {
		this._logger = loggerFactory.create("WebRTCMediaSource");
		this._logger.trace("Initializing");
	}
	// get list of devices

	/**
	 * List video/audio capture devices
	 * does not display name until getUserMedia is called
	 */
	public async enumerateDevices() {
		const devices = await navigator.mediaDevices.enumerateDevices();
		this._logger.debug("enumerated devices", devices);
		return devices;
	}

	private getSupportedConstraints() {
		const supportedConstraints = navigator.mediaDevices.getSupportedConstraints();
		this._logger.debug("supported constraints", supportedConstraints);
		return supportedConstraints;
	}

	public async startCapture(constraints?: MediaStreamConstraints): Promise<WebRTCMediaStream> {
		this._logger.debug("starting capture", constraints);
		let stream: MediaStream;
		stream = await navigator.mediaDevices.getUserMedia(constraints || {audio:true, video:true});

		return new WebRTCMediaStream(this.loggerFactory, stream);
	}

	public async startScreenCapture(): Promise<WebRTCMediaStream> {
		// @ts-ignore
		if (navigator.getDisplayMedia) {
			// @ts-ignore
			return new WebRTCMediaStream(await navigator.getDisplayMedia({ video: true }));
			// @ts-ignore
		} else if (navigator.mediaDevices.getDisplayMedia) {
			// @ts-ignore
			return new WebRTCMediaStream(await navigator.mediaDevices.getDisplayMedia({ video: true }));
		} else {
			// @ts-ignore
			return new WebRTCMediaStream(await navigator.mediaDevices.getUserMedia({ video: { mediaSource: "screen" } }));
		}
	}

	// get a media source
	// get a screen sharing

	// returns MediaStream


}