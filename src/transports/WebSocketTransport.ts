import { ITransport } from "./ITransport";
import { IRequest } from "./IRequest";

import { client as wsclient, connection as wsconnection } from 'websocket';
import { EventEmitter } from "events";
import { DeferredPromise } from "./DeferredPromise";
import { JanusError } from "./JanusError";
import { IResponse } from "./IResponse";
import { ISessionResponse } from "../abstractions/ISessionResponse";
import { PluginHandle } from "../abstractions/Handle";
import { IPluginHandleResponse } from "../abstractions/IHandleResponse";
import { Transaction } from "../abstractions/transaction";
import { JanusSession } from "../abstractions/JanusSession";

import bunyan from "bunyan";

export class WebSocketTransport extends ITransport {
	private _logger = bunyan.createLogger({ name: "WebSocketTransport" });

	private _janus_websocket_url: string;
	private _janus_protocol: string;
	private _websocket: wsclient;
	private _connection: wsconnection;

	private _ready = false;
	private _ready_promises: DeferredPromise<boolean>[] = [];
	private _dispose_promises: DeferredPromise<void>[] = [];

	private _transactions: { [transaction_id: string]: DeferredPromise<any> } = {};

	private globalEmitter = new EventEmitter();

	public isAdminEndpoint(): boolean {
		return (this._janus_protocol === 'janus-admin-protocol');
	}

	constructor(janus_websocket_url?: string, janus_protocol?: string) {
		super();

		this._janus_websocket_url = janus_websocket_url || 'ws://localhost:8188';
		this._janus_protocol = janus_protocol || 'janus-protocol';

		this._websocket = new wsclient();
		// this._websocket = new wsclient(this._janus_websocket_url, this._janus_protocol);


		this._websocket.on('connectFailed', (error) => {
			this._logger.error('Connect Error: ' + error.toString());
		});

		this._websocket.on('connect', (connection) => {
			this._logger.debug('WebSocket Client Connected');
			this._connection = connection;
			this._ready = true;
			this.globalEmitter.emit("ready");
			for (const promise of this._ready_promises) {
				promise.resolve(true);
			}
			this._ready_promises = [];
			// for each promise, resolve and delete

			connection.on('error', (error) => {
				this._logger.error("Connection Error: " + error.toString());
				this.globalEmitter.emit("error", error);

				// reject all ready promises
				for (const promise of this._ready_promises) {
					promise.resolve(false);
				}
				this._ready_promises = [];

				// TODO: for each promise, reject and delte
			});
			connection.on('close', () => {
				this._logger.debug('Connection Closed');
				this._ready = false;
				this.globalEmitter.emit("closed");

				// reject all ready promises
				for (const promise of this._ready_promises) {
					promise.resolve(false);
				}
				this._ready_promises = [];

				for (const promise of this._dispose_promises) {
					promise.resolve(null);
				}
				this._dispose_promises = [];


				// TODO: reject all active promises
			});
			connection.on('message', (message) => {
				if (message.type === 'utf8') {
					this._logger.debug("Received: '" + message.utf8Data + "'");
				}

				const data = JSON.parse(message.utf8Data);

				this._logger.debug("data", data);

				if (!data.transaction) {
					// unknown transaction, treat as global
					this._logger.debug("no transaction data", data);
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
				} else if (data.janus === "timeout") {
					// TODO: notify session timeout
					this._logger.error("timeout", data);
				} else {
					// if no error, treat as success
					this._logger.debug("resolving", data);
					deferredPromise.resolve(data)
				}

				// cleanup used transaction
				delete this._transactions[data.transaction];

				// TODO: add timeout to transactions, reject with timeout error
			});

			// function sendNumber() {
			//     if (connection.connected) {
			//         var number = Math.round(Math.random() * 0xFFFFFF);
			//         connection.sendUTF(number.toString());
			//         setTimeout(sendNumber, 1000);
			//     }
			// }
			// sendNumber();
		});

		this._websocket.connect(this._janus_websocket_url, this._janus_protocol);



		// this._websocket.onclose = () => {
		//     this._logger.debug("closed");
		//     this._ready = false;
		//     this.globalEmitter.emit("closed");

		//     //reject all ready promises
		//     for (var promise of this._ready_promises) {
		//         promise.resolve(false);
		//     }
		//     this._ready_promises = [];


		//     //TODO: reject all active promises
		// }

		// this._websocket.

		// this._websocket.onerror = (err) => {
		//      this._logger.error("janus error", err);
		//     this.globalEmitter.emit("error", err.message);

		//     //reject all ready promises
		//     for (var promise of this._ready_promises) {
		//         promise.resolve(false);
		//     }
		//     this._ready_promises = [];

		//     //TODO: for each promise, reject and delte
		// };

		// this._websocket.onopen = () => {
		//      this._logger.debug("opened");
		//     this._ready = true;
		//     this.globalEmitter.emit("ready");
		//     for (var promise of this._ready_promises) {
		//         promise.resolve(true);
		//     }
		//     this._ready_promises = [];
		//     //for each promise, resolve and delete
		// }
		// this._websocket.onmessage = (message: any) => {
		//     var data = JSON.parse(message.data);

		//     // this._logger.debug("data", data);

		//     if (!data.transaction) {
		//         //unknown transaction, treat as global
		//          this._logger.warn("no transaction data", data);
		//         return;
		//     }

		//     var deferredPromise = this._transactions[data.transaction];

		//     if (!deferredPromise) {
		//         //unknown transaction, dispose
		//          this._logger.error("unknown transaction", data.transaction);
		//         return;
		//     }

		//     if (data.janus == "error") {
		//         //if error, then reject
		//         // this._logger.error("error", data);
		//         deferredPromise.reject(new JanusError(data.error.code, data.error.reason));
		//         return;
		//     }else if (data.janus == "timeout"){
		//         //TODO: notify session timeout
		//          this._logger.warn("timeout", data);
		//     }else {
		//         //if no error, treat as success
		//         // this._logger.debug("resolving", data);
		//         deferredPromise.resolve(data)
		//     }

		//     //cleanup used transaction
		//     delete this._transactions[data.transaction];

		//     //TODO: add timeout to transactions, reject with timeout error
		// };
	}

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

	public async dispose() {
		const deferredPromise = await DeferredPromise.create<void>();
		this._dispose_promises.push(deferredPromise);

		this._connection.close();
		this._websocket.abort();

		// this._websocket.close();
		// this._websocket.onclose = null;
		// this._websocket.onerror = null;
		// this._websocket.onopen = null;
		// this._websocket.onmessage = null;
		this._connection = null;
		this._websocket = null;

		return deferredPromise.promise;
	}


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

		this._transactions[transaction.getTransactionId()] = deferredPromise;

		this._logger.debug("sending", req);
		// this._websocket.send(JSON.stringify(req));
		this._connection.send(JSON.stringify(req));

		return deferredPromise.promise;
	}



}