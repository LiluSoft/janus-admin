import { ILogger } from "../../logger/ILogger";
import { ILoggerFactory } from "../../logger/ILoggerFactory";
import { EventEmitter } from "events";

/**
 * represents a network channel which can be used for bidirectional peer-to-peer transfers of arbitrary data.
 * Every data channel is associated with an WebRTCPeerConnection, and each peer connection
 * can have up to a theoretical maximum of 65,534 data channels (the actual limit may vary from browser to browser).
 */
export class WebRTCDataChannel {
	private _logger: ILogger;
	private _eventEmitter = new EventEmitter();

	private dataChannel?: RTCDataChannel;

	constructor(public readonly loggerFactory: ILoggerFactory, private peerConnection: RTCPeerConnection, private dataChannelDict?: RTCDataChannelInit) {
		this._logger = loggerFactory.create("WebRTCDataChannel");

		this._logger.debug("Creating data channel", this.peerConnection, this.dataChannelDict);
		this.dataChannel = this.peerConnection.createDataChannel("JanusDataChannel", dataChannelDict);	// FIXME Add options (ordered, maxRetransmits, etc.)
		this.dataChannel.onmessage = (event) => {
			this._logger.debug("Received message on data channel", event.data);
			this.emitEvent("data", event.data);
		};
		this.dataChannel.onopen = (event) => {
			const dcState = (this.dataChannel) ? this.dataChannel.readyState : "null";
			this._logger.debug("State change on data channel", dcState);
			if (dcState === "open") {
				this.emitEvent("dataopen");
			}
		};
		this.dataChannel.onclose = (event) => {
			const dcState = (this.dataChannel) ? this.dataChannel.readyState : "null";
			this._logger.debug("State change on data channel,", dcState);
			if (dcState !== "open") {
				this.emitEvent("dataclose");
			}
		};
		this.dataChannel.onerror = (error) => {
			this._logger.error("Got error on data channel", error);
		};


	}

	/**
	 * sends data across the data channel to the remote peer.
	 * @param data
	 */
	public send(data: string | Blob | ArrayBuffer | ArrayBufferView) {
		if (!data) {
			this._logger.warn("Invalid data");
			throw new Error("Invalid text");
		}

		if (!this.dataChannel) {
			throw new Error("Data Channel is not active");
		}

		this._logger.debug("Sending to data channel", data);
		this.dataChannel.send(data as string);
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

	/**
	 * closes the WebRTCDataChannel. Either peer is permitted to call this method to initiate closure of the channel.
	 */
	public destroy() {
		if (this.dataChannel) {
			this.dataChannel.close();
			this.dataChannel = undefined;
		}
	}

	/**
	 * to be called when the message event is fired on the channel. This event is represented by the MessageEvent interface.
	 * This event is sent to the channel when a message is received from the other peer.
	 * @param handler
	 */
	public on_data(handler: (data: string) => void) {
		this._eventEmitter.on("data", handler);
	}

	/**
	 * add handler to be called when the open event is fired; this is a simple Event which is sent when the
	 * data channel's underlying data transport—the link over which the RTCDataChannel's messages
	 * flow—is established or re-established.
	 * @param handler
	 */
	public on_dataopen(handler: () => void) {
		this._eventEmitter.on("dataopen", handler);
	}

	/**
	 * add handler to be called by the browser when the close event is received by the WebRTCDataChannel.
	 * This is a simple Event which indicates that the data channel has closed down.
	 *
	 * @param handler
	 */
	public on_dataclose(handler: () => void) {
		this._eventEmitter.on("dataclose", handler);
	}
}