import { WebRTCMediaStream } from "./WebRTCMediaStream";
import { ILoggerFactory } from "../../logger/ILoggerFactory";
import { ILogger } from "../../logger/ILogger";

/**
 * Attaches a MediaStream to HTML Video Element
 */
export class WebRTCMediaTarget {
	private _logger: ILogger;

	constructor(public readonly loggerFactory: ILoggerFactory, private stream?: WebRTCMediaStream) {
		this._logger = loggerFactory.create("WebRTCMediaTarget");

		if (this.stream) {
			this._logger.debug("from Stream", this.stream);
		} else {
			this.stream = new WebRTCMediaStream(this.loggerFactory, new MediaStream());
		}
	}

	/**
	 * Attach Stream to HTMLVideoElement
	 * @param videoElement
	 */
	public attachToHTMLVideoElement(videoElement: HTMLVideoElement) {
		this._logger.debug("Attaching", this.stream,"to", videoElement);
		setTimeout(() => {
			videoElement.srcObject = this.stream!.mediaStream;

		}, 0);
		return videoElement;
	}
}