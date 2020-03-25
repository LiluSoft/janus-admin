import { ILogger } from "../../logger/ILogger";
import { ILoggerFactory } from "../../logger/ILoggerFactory";
import { EventEmitter } from "events";

export class WebRTCDataChannel {
	private _logger: ILogger;
	private _eventEmitter = new EventEmitter();

	private dataChannel?: RTCDataChannel;

	constructor(public readonly loggerFactory: ILoggerFactory, private peerConnection: RTCPeerConnection) {
		this._logger = loggerFactory.create("WebRTCDataChannel");

		this._logger.info("Creating data channel");
		// Until we implement the proxying of open requests within the Janus core, we open a channel ourselves whatever the case
		this.dataChannel = this.peerConnection.createDataChannel("JanusDataChannel", { ordered: false });	// FIXME Add options (ordered, maxRetransmits, etc.)
		this.dataChannel.onmessage = (event) => {
			this._logger.info("Received message on data channel: " + event.data);
			this.emitEvent("data", event.data);
		};
		this.dataChannel.onopen = (event) => {
			const dcState = (this.dataChannel) ? this.dataChannel.readyState : "null";
			this._logger.info("State change on data channel: " + dcState);
			if (dcState === "open") {
				this.emitEvent("dataopen");
			}
		};
		this.dataChannel.onclose = (event) => {
			const dcState = (this.dataChannel) ? this.dataChannel.readyState : "null";
			this._logger.info("State change on data channel: " + dcState);
			if (dcState !== "open") {
				this.emitEvent("dataclose");
			}
		};
		this.dataChannel.onerror = (error) => {
			this._logger.error("Got error on data channel:", error);
		};


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

	public destroy() {
		if (this.dataChannel) {
			this.dataChannel.close();
			this.dataChannel = undefined;
		}
	}

	public send(text: string) {
		if (text === null || text === undefined) {
			this._logger.warn("Invalid text");
			throw new Error("Invalid text");
		}

		if (!this.dataChannel) {
			throw new Error("Data Channel is not active");
		}

		this._logger.info("Sending string on data channel: " + text);
		this.dataChannel.send(text);
	}

	public on_data(handler: (data: string) => void) {
		this._eventEmitter.on("data", handler);
	}

	public on_dataopen(handler: () => void) {
		this._eventEmitter.on("dataopen", handler);
	}

	public on_dataclose(handler: () => void) {
		this._eventEmitter.on("dataclose", handler);
	}
}