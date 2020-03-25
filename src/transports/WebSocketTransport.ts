import { ITransport } from "./ITransport";
import { IRequest } from "./IRequest";

import websocket from "websocket";


import { EventEmitter } from "events";
import { DeferredPromise } from "./DeferredPromise";
import { JanusError } from "./JanusError";
import { PluginHandle } from "../abstractions/PluginHandle";
import { Transaction } from "../abstractions/Transaction";
import { JanusSession } from "../abstractions/JanusSession";

import { ILogger } from "../logger/ILogger";
import { ILoggerFactory } from "../logger/ILoggerFactory";
import { IEvent } from "./IEvent";

/**
 * WebSocket Transport for Janus API
 *
 * @export
 * @class WebSocketTransport
 * @extends {ITransport}
 */
export class WebSocketTransport extends ITransport {
	private _logger :ILogger;

	private _janus_websocket_url: string;
	private _janus_protocol: string;
	private _websocket: websocket.client;
	private _connection: websocket.connection;

	private _ready = false;
	private _ready_promises: DeferredPromise<boolean>[] = [];
	private _dispose_promises: DeferredPromise<void>[] = [];

	private _transactions: { [transaction_id: string]: DeferredPromise<unknown> } = {};

	private globalEmitter = new EventEmitter();

	/**
	 * True if this transport is pointing to Admin API
	 *
	 * @returns {boolean}
	 */
	public isAdminEndpoint(): boolean {
		return (this._janus_protocol === "janus-admin-protocol");
	}

	/**
	 * Creates an instance of WebSocketTransport.
	 * @param {string} janus_websocket_url Janus API WebSocket URL
	 * @param {string} janus_protocol Janus Protocol to use, could be 'janus-admin-protocol' or 'janus-protocol'
	 * @memberof WebSocketTransport
	 */
	constructor(loggerFactory:ILoggerFactory,janus_websocket_url?: string, janus_protocol?: string) {
		super();
		this._logger = loggerFactory.create("WebSocketTransport");
		this._logger.info("Initializing", arguments);

		this._janus_websocket_url = janus_websocket_url || "ws://localhost:8188";
		this._janus_protocol = janus_protocol || "janus-protocol";

		this._websocket = new websocket.client();
		// this._websocket = new wsclient(this._janus_websocket_url, this._janus_protocol);


		this._websocket.on("connectFailed", (error: Error) => {
			this._logger.error("Connect Error: " + error.toString());
		});

		this._websocket.on("connect", (connection) => {
			this._logger.debug("WebSocket Client Connected");
			this._connection = connection;
			this._ready = true;
			this.globalEmitter.emit("ready");
			for (const promise of this._ready_promises) {
				promise.resolve(true);
			}
			this._ready_promises = [];
			// for each promise, resolve and delete

			connection.on("error", (error : Error) => {
				this._logger.error("Connection Error: " + error.toString());
				this.globalEmitter.emit("error", error);

				// reject all ready promises
				for (const promise of this._ready_promises) {
					promise.resolve(false);
				}
				this._ready_promises = [];

				// TODO: for each promise, reject and delete
			});
			connection.on("close", () => {
				this._logger.debug("Connection Closed");
				this._ready = false;
				this.globalEmitter.emit("closed");

				// reject all ready promises
				for (const promise of this._ready_promises) {
					promise.resolve(false);
				}
				this._ready_promises = [];

				for (const promise of this._dispose_promises) {
					promise.resolve(undefined);
				}
				this._dispose_promises = [];


				// TODO: reject all active promises
			});
			connection.on("message", (message) => {
				if (message.type === "utf8") {
					this._logger.debug("Received: '" + message.utf8Data + "'");
				}

				const data = JSON.parse(message.utf8Data || "");

				this._logger.debug("data", data);

				// const x = {
				// 	"janus": "event",
				// 	"session_id": 8038049194841240,
				// 	"transaction": "KfduCkUf8P",
				// 	"sender": 3312670424758283,
				// 	"plugindata": {
				// 		"plugin": "janus.plugin.videoroom",
				// 		"data": {
				// 			"videoroom": "joined",
				// 			"room": 3353824061,
				// 			"description": "Room 3353824061",
				// 			"id": 7481918513808437,
				// 			"private_id": 1828609574,
				// 			"publishers": []
				// 		}
				// 	}
				// };

				// const xx = {
				// 	janus: "event",
				// 	session_id: 8038049194841240,
				// 	sender: 3312670424758283,
				// 	plugindata: {
				// 		plugin: "janus.plugin.videoroom",
				// 		data: {
				// 			videoroom: "event",
				// 			room: 3353824061,
				// 			leaving: "ok",
				// 			reason: "kicked"
				// 		}
				// 	}
				// };


				if (!data.transaction) {
					if (data.janus === "event") {
						this._logger.debug("Dispatching Event", data);
						this.globalEmitter.emit("event", data);
						return;
					} else if (data.janus === "detached") {
						this._logger.debug("janus detached", data);
						this.globalEmitter.emit("detached", data);
						return;
					}
					// unknown transaction, treat as global
					this._logger.warn("no transaction data", data);
					return;
				}

				const deferredPromise = this._transactions[data.transaction];

				if (!deferredPromise) {
					// unknown transaction, dispose
					this._logger.warn("unknown transaction", data.transaction);
					return;
				}

				if (data.janus === "error") {
					// if error, then reject
					this._logger.error("error", data);
					deferredPromise.reject(new JanusError(data.error.code, data.error.reason, deferredPromise.stack));
					return;
				} else if (data.janus === "ack") {
					if (deferredPromise && deferredPromise.ignore_ack) {
						this._logger.debug("ack received, waiting for async response", data);
						return;
					} else {
						this._logger.debug("ack relayed", data);
						deferredPromise.resolve(data);
					}
				} else if (data.janus === "timeout") {
					// TODO: notify session timeout
					this._logger.error("timeout", data);
				} else {
					// if no error, treat as success
					this._logger.debug("resolving", data);
					deferredPromise.resolve(data);
				}

				// cleanup used transaction
				delete this._transactions[data.transaction];

				// TODO: add timeout to transactions, reject with timeout error
			});
		});

		this._websocket.connect(this._janus_websocket_url, this._janus_protocol);

	}

	public subscribe_plugin_events<T>(callback: (event: IEvent) => void, session?: JanusSession): ()=>void{
		this.globalEmitter.on("event", callback);
		return ()=>{
			this.globalEmitter.removeListener("event", callback);
		};
	}




	/**
	 * Waits for the Transport to be ready
	 */
	public async waitForReady(): Promise<boolean> {
		if (this._ready) {
			return true;
		}

		const deferredPromise = await DeferredPromise.create<boolean>();
		this._ready_promises.push(deferredPromise);
		return deferredPromise.promise;

		// else, push promise into wait queue and return
		// add timeout mechanism
	}

	/**
	 * Cleanup, important in order to prevent connection and memory leaks
	 */
	public async dispose() {
		if (this._connection == null) {
			this._logger.warn("Already Disposed");
			return;
		}
		const deferredPromise = await DeferredPromise.create<void>();
		this._dispose_promises.push(deferredPromise);

		if (this._connection) {
			this._connection.close();
		}
		if (this._websocket) {
			this._websocket.abort();
		}

		delete this._connection;
		delete this._websocket;
		this.globalEmitter.removeAllListeners();

		return deferredPromise.promise;
	}

	/**
	 * Executes a request against Janus API
	 *
	 * @template ResponseT response type
	 * @param {IRequest} req request data
	 * @param {JanusSession} session Janus Session to use
	 * @param {PluginHandle} pluginHandle Janus Plugin Handle to use
	 * @returns {Promise<ResponseT>}
	 */
	public async request<ResponseT>(req: IRequest, session?: JanusSession, pluginHandle?: PluginHandle): Promise<ResponseT> {
		// always add a transaction the request is trackable
		const transaction = new Transaction();
		req.transaction = transaction.getTransactionId();

		// add a session if exists
		if (session) {
			req.session_id = session.session_id;
		}

		// add plugin handle if exists
		if (pluginHandle) {
			req.handle_id = pluginHandle.handle_id;
		}

		const deferredPromise = await DeferredPromise.create<ResponseT>(transaction);
		deferredPromise.transaction = transaction;

		switch (req.janus) {
			case "keepalive":
				deferredPromise.ignore_ack = false;
				break;
		}

		this._transactions[transaction.getTransactionId()] = deferredPromise;

		this._logger.debug("sending", req);
		this._connection.send(JSON.stringify(req));

		return deferredPromise.promise;
	}



}