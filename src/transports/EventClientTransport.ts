import { ITransport } from "./ITransport";
import { IRequest } from "./IRequest";
import { JanusSession } from "../abstractions/JanusSession";
import { PluginHandle } from "../abstractions/PluginHandle";

import mqtt from "mqtt";
import { promises } from "fs";
import { EventEmitter } from "events";
import { MQTTEventClient } from "../events/MQTTEventClient";
import { DeferredPromise } from "./DeferredPromise";
import { IEventClient } from "../events/IEventClient";
import { ILogger } from "../logger/ILogger";
import { ILoggerFactory } from "../logger/ILoggerFactory";
import { IEvent } from "./IEvent";
import { JanusError } from "./JanusError";
import { Transaction } from "../abstractions";


export class EventClientTransport extends ITransport {
	private _logger: ILogger;

	public subscribe_plugin_events<T>(callback: (event: IEvent) => void, session?: JanusSession): ()=>void{
		this.globalEmitter.on("event", callback);
		return ()=>{
			this.globalEmitter.removeListener("event", callback);
		};
	}




	private _ready = false;
	private _ready_promises: DeferredPromise<boolean>[] = [];
	private _dispose_promises: DeferredPromise<void>[] = [];

	private _transactions: { [transaction_id: string]: DeferredPromise<unknown> } = {};

	private globalEmitter = new EventEmitter();

	private _client: IEventClient;

	public async dispose(): Promise<void> {
		// reject all ready promises
		for (const promise of this._ready_promises) {
			promise.resolve(false);
		}
		this._ready_promises = [];

		for (const promise of this._dispose_promises) {
			promise.resolve(undefined);
		}
		this._dispose_promises = [];


		return await this._client.dispose();
	}


	constructor(loggerFactory: ILoggerFactory, client: IEventClient, private subscribe_topic: string, private publish_topic: string, private isAdmin: boolean) {
		super();
		this._logger = loggerFactory.create("EventClientTransport");

		this._client = client;

	}

	private _processMessage(data: any) {
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
		} else if (data.janus === "ack") {
			if (deferredPromise && deferredPromise.ignore_ack) {
				this._logger.debug("ack received, waiting for async response", data);
				return;
			} else {
				this._logger.debug("ack relayed", data);
				deferredPromise.resolve(data);
			}
		} else if (data.janus === "timeout") {
			this._logger.error("timeout", data);
		} else {
			// if no error, treat as success
			this._logger.debug("resolving", data);
			deferredPromise.resolve(data);
		}

		// cleanup used transaction
		delete this._transactions[data.transaction];
	}

	public isAdminEndpoint(): boolean {
		return this.isAdmin;
	}
	public async request<ResponseT>(req: IRequest, session?: JanusSession, pluginHandle?: PluginHandle): Promise<ResponseT> {
		// always add a transaction the request is trackable
		const transaction = new Transaction();
		req.transaction = transaction.getTransactionId();
		req.correlation_id = req.transaction;

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
		// this._websocket.send(JSON.stringify(req));
		this._client.publish(this.publish_topic, req);
		// this._connection.send(JSON.stringify(req));

		return deferredPromise.promise;
	}
	public async waitForReady(): Promise<boolean> {
		const success = await this._client.waitForReady();
		this._client.subscribe(this.subscribe_topic, (message) => {
			// console.log(message);
			this._processMessage(message);
		});
		this._client.onError((error) => {
			this._logger.error("Connection Error: " + error.toString());
			this.globalEmitter.emit("error", error);

			// reject all ready promises
			for (const promise of this._ready_promises) {
				promise.resolve(false);
			}
			this._ready_promises = [];

			// TODO: for each promise, reject and delete
		});
		return success;
	}


}