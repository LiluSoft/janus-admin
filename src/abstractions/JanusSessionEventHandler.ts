import { ITransport } from "../transports/ITransport";
import { IEvent } from "../transports/IEvent";
import { JanusSession } from "./JanusSession";
import { ILogger } from "../logger/ILogger";
import { ILoggerFactory } from "../logger/ILoggerFactory";
import { EventEmitter } from "events";
import { IEventTrickle } from "../transports/IEventTrickle";
import { IEventWebRTCUp } from "../transports/IEventWebRTCUp";
import { IEventMedia } from "../transports/IEventMedia";
import { IEventSlowlink } from "../transports/IEventSlowlink";
import { IEventHangup } from "../transports/IEventHangup";
import { IDetachedEvent } from "../transports/IDetachedEvent";
import { IPluginDataResponse } from "./IPluginDataResponse";

/**
 * JanusSession Event Handling
 */
export class JanusSessionEventHandler {
	private _logger: ILogger;
	private _eventEmitter = new EventEmitter();
	private _unregister_callback: (() => void) | undefined;

	public constructor(private readonly loggerFactory: ILoggerFactory, private readonly transport: ITransport, public readonly session: JanusSession) {
		this._logger = loggerFactory.create("JanusSessionEventHandler");
		this._register(this.transport, this.session);
	}

	private _register(transport: Readonly<ITransport>, session: Readonly<JanusSession>) {
		this._logger.debug("Registering", session);
		if (this._unregister_callback) {
			this._unregister_callback();
			this._unregister_callback = undefined;
		}
		this._unregister_callback = transport.subscribe_plugin_events((event: IEvent) => {
			this.handle_events(event);
		}, session);
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

	private handle_events(event: IEvent) {
		if (event.janus === "keepalive") {
			this._logger.trace("KeepAlive", event);
			this.emitEvent("keepalive", event);
			return;
		}

		if (event.session_id !== this.session.session_id) {
			this._logger.trace("event session", event.session_id, "is not for session", this.session.session_id, event);
			return;
		}
		this._logger.debug("Event", event);
		switch (event.janus) {
			case "trickle":
				this.emitEvent("trickle", event);
				break;
			case "webrtcup":
				this.emitEvent("webrtcup", event);
				break;
			case "media":
				this.emitEvent("media", event);
				break;
			case "slowlink":
				this.emitEvent("slowlink", event);
				break;
			case "hangup":
				this.emitEvent("hangup", event);
				break;
			case "detached":
				this.emitEvent("detached", event);
				break;
			case "timeout":
				this.emitEvent("timeout", event);
				break;
			default:
				if ("plugindata" in event) {
					this._logger.trace("Unknown event, probably belongs to a plugin", event);
				} else {
					this._logger.warn("Unknown Event", event);
				}
		}
	}

	public destroy() {
		this._logger.trace("Destroying");
		if (this._unregister_callback) {
			this._unregister_callback();
			this._unregister_callback = undefined;
			this._logger.debug("Destroyed");
		}
	}

	/**
	 * trickle candidates
	 * @param handler
	 */
	public on_trickle(handler: (event: IEventTrickle) => void) {
		this._logger.trace("registering on_trickle", handler);
		this._eventEmitter.on("trickle", handler);
	}

	/**
	 *  ICE and DTLS succeeded, and so Janus correctly established a PeerConnection with the user/application
	 * @param handler
	 */
	public on_webrtcup(handler: (event: IEventWebRTCUp) => void) {
		this._logger.trace("registering on_webrtcup", handler);
		this._eventEmitter.on("webrtcup", handler);
	}

	/**
	 * whether Janus is receiving (receiving: true/false) audio/video (type: "audio/video") on this PeerConnection
	 *
	 * It is important to point out that the media event notifications only apply if your PeerConnection is going
	 * to actually send media to Janus. A recvonly PeerConnection, for instance (e.g., as the Streaming plugin would create)
	 *  would never trigger any media event, as Janus would never be receiving media, but only send it.
	 * @param handler
	 */
	public on_media(handler: (event: IEventMedia) => void) {
		this._logger.trace("registering on_media", handler);
		this._eventEmitter.on("media", handler);
	}

	/**
	 * whether Janus is reporting trouble sending/receiving (uplink: true/false) media on this PeerConnection
	 *
	 * Janus reporting problems sending media to a user (user sent many NACKs in the last second; uplink=true is from Janus' perspective)
	 * @param handler
	 */
	public on_slowlink(handler: (event: IEventSlowlink) => void) {
		this._logger.trace("registering on_slowlink", handler);
		this._eventEmitter.on("slowlink", handler);
	}

	/**
	 * the PeerConnection was closed, either by Janus or by the user/application, and as such cannot be used anymore.
	 *
	 * example: PeerConnection closed for a DTLS alert (normal shutdown)
	 * @param handler
	 */
	public on_hangup(handler: (event: IEventHangup) => void) {
		this._logger.trace("registering on_hangup", handler);
		this._eventEmitter.on("hangup", handler);
	}

	/**
	 * the plugin handle has been detached by the plugin itself, and so should not be used anymore
	 *
	 * @param handler
	 */
	public on_detached(handler: (event: IDetachedEvent) => void) {
		this._logger.trace("registering on_detached", handler);
		this._eventEmitter.on("detached", handler);
	}

	/**
	 * Timeout on session
	 * @param handler
	 */
	public on_timeout(handler: () => void) {
		this._logger.trace("registering on_timeout", handler);
		this._eventEmitter.on("timeout", handler);
	}

	/**
	 * event is raised when janus server checks connectivity, it should be responded by keepalive
	 */
	public on_keepalive(handler: () => void) {
		this._logger.trace("registering on_keepalive", handler);
		this._eventEmitter.on("keepalive", handler);
	}
}