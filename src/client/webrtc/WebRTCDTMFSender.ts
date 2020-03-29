import { ILoggerFactory } from "../../logger/ILoggerFactory";
import { ILogger } from "../../logger/ILogger";
import { WebRTCPeerConnection } from "./WebRTCPeerConnection";

/**
 * sending DTMF tones to the remote peer
 */
export class WebRTCDTMFSender {
	private _logger: ILogger;
	private dtmfSender: RTCDTMFSender | null;

	constructor(public readonly loggerFactory: ILoggerFactory, private peerConnection: WebRTCPeerConnection) {
		this._logger = loggerFactory.create("WebRTCDTMFSender");
	}

	/**
	 * starts sending DTMF tones to the remote peer asynchronously
	 *
	 * @param tones A string containing the DTMF codes to be transmitted to the recipient. Specifying an empty string as the tones parameter clears the tone buffer, aborting any currently queued tones. A "," character inserts a two second delay.
	 * @param duration The amount of time, in milliseconds, that each DTMF tone should last. This value must be between 40 ms and 6000 ms (6 seconds), inclusive. The default is 100 ms.
	 * @param interToneGap The length of time, in milliseconds, to wait between tones. The browser will enforce a minimum value of 30 ms (that is, if you specify a lower value, 30 ms will be used instead); the default is 70 ms.
	 */
	public sendDtmf(tones: string, duration?: number, interToneGap?: number) {
		if (!this.dtmfSender) {
			// Create the DTMF sender the proper way, if possible
			if (this.peerConnection !== undefined && this.peerConnection !== null) {
				const senders = this.peerConnection.getSenders();
				const audioSender = senders.find((sender) => {
					return (sender.track && sender.track.kind === "audio") ? true : false;
				});
				if (!audioSender) {
					this._logger.warn("Invalid DTMF configuration (no audio track)");
					throw new Error("Invalid DTMF configuration (no audio track)");
				}
				this.dtmfSender = audioSender.dtmf;
				if (this.dtmfSender) {
					this._logger.info("Created DTMF Sender");
					this.dtmfSender.ontonechange = (tone) => {
						this._logger.debug("Sent DTMF tone: " + tone.tone);
					};
				}
			}
			if (this.dtmfSender === null || this.dtmfSender === undefined) {
				this._logger.warn("Invalid DTMF configuration");
				throw new Error("Invalid DTMF configuration");
			}
		}
		if (tones === null || tones === undefined) {
			this._logger.warn("Invalid DTMF string");
			throw new Error("Invalid DTMF string");
		}
		if (duration === null || duration === undefined)
			duration = 500;	// We choose 500ms as the default duration for a tone
		if (!interToneGap) {
			interToneGap = 50;	// We choose 50ms as the default gap between tones
		}
		this._logger.debug("Sending DTMF string " + tones + " (duration " + duration + "ms, gap " + interToneGap + "ms)");
		this.dtmfSender.insertDTMF(tones, duration, interToneGap);
	}
}