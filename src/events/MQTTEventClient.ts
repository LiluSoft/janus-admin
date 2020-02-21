import mqtt from "mqtt";
import { IEventClient } from "./IEventClient";
import { client } from "websocket";
import { promises } from "fs";
import bunyan from "bunyan";
import { EventEmitter } from "events";

export class MQTTEventClient implements IEventClient {
	private _logger = bunyan.createLogger({ name: "MQTTEventClient", level: "info" });
	private _eventEmitter = new EventEmitter();

	private _readyPromise: Promise<boolean>;
	public async dispose(): Promise<void> {
		this._logger.debug("disposing");
		this._client.end();
		return Promise.resolve();
	}

	public async subscribe<T>(topic: string, callback: (message: T) => void) {
		this._logger.debug("Subscribing to", topic);
		return new Promise<void>((resolve, reject) => {
			this._client.subscribe(topic, (err: Error, granted: mqtt.ISubscriptionGrant[]) => {
				if (err) {
					this._logger.error("Unable to subscribe to", topic, err);
					return reject(err);
				}
				this._logger.debug("Subscribed successfully to", topic, granted);
				this._eventEmitter.on("message", callback);
				resolve();
			});
		});
	}

	public async publish<T>(topic: string, message: T) {
		return new Promise<void>((resolve, reject) => {
			this._client.publish(topic, JSON.stringify(message), (err, packet) => {
				if (err) {
					return reject(err);
				}
				resolve();
			});
		});
	}

	private _processMessage(topic: string, message: string) {
		try {
			const obj = JSON.parse(message);
			this._logger.debug("received object", obj);
			this._eventEmitter.emit("message", obj);
		} catch (e) {
			this._logger.debug("received message", message);
			this._eventEmitter.emit("message", message);
		}
	}

	private _registerMessageHandler() {
		this._logger.debug("Registering Message Handler");
		this._client.on('message', (topic, message) => {
			this._logger.debug("Message", topic, message);
			this._processMessage(topic, message.toString());
		});
		this._client.on('error', (err) => {
			this._eventEmitter.emit("error", err);
		});
	}

	public async onError(errorHandler: (err: Error) => void) {
		this._eventEmitter.on("error", errorHandler);
	}

	public async waitForReady(): Promise<boolean> {
		this._registerMessageHandler();
		const result = await this._readyPromise;
		return result;
	}
	private _client: mqtt.Client;
	constructor(brokerUrl: string, opts?: mqtt.IClientOptions) {
		this._logger.debug("Starting", brokerUrl);
		this._client = mqtt.connect(brokerUrl, opts);
		this._readyPromise = new Promise<boolean>((resolve, reject) => {
			this._client.on('connect', () => {
				this._logger.debug("Connected");
				resolve(true);
			});
		});
	}




	// client.on('connect', function () {
	//   client.subscribe('presence', function (err) {
	//     if (!err) {
	//       client.publish('presence', 'Hello mqtt')
	//     }
	//   })
	// })

	// client.on('message', function (topic, message) {
	//   // message is Buffer
	//   console.log(message.toString())
	//   client.end()
	// })
}