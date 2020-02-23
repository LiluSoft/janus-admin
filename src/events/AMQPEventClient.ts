import mqtt from "mqtt";
import { IEventClient } from "./IEventClient";
import { client } from "websocket";
import { promises } from "fs";
import bunyan from "bunyan";
import { EventEmitter } from "events";
import amqplib from "amqplib";
import { timingSafeEqual } from "crypto";

/**
 * AMQP / RabbitMQ Client
 *
 * @export
 * @class AMQPEventClient
 * @implements {IEventClient}
 */
export class AMQPEventClient implements IEventClient {
	private _logger = bunyan.createLogger({ name: "AMQPEventClient", level: "info" });
	private _eventEmitter = new EventEmitter();

	private _readyPromise: Promise<boolean>;
	private _subscribeChannel: amqplib.Channel;
	private _publishChannel: amqplib.Channel;

	private _client: amqplib.Connection;

	/**
	 * Creates an instance of AMQPEventClient.
	 * @param {(string | amqplib.Options.Connect)} url AMQP Connection URL
	 * @param {*} socketOptions Socket Options, i.e. noDelay
	 * @memberof AMQPEventClient
	 */
	constructor(url: string | amqplib.Options.Connect, socketOptions?: any) {
		this._logger.debug("Starting", url);

		this._readyPromise = new Promise<boolean>((resolve, reject) => {
			amqplib.connect(url, socketOptions).then(conn => {
				this._logger.debug("Connected");
				this._client = conn;
				resolve(true);
			});
		});
	}



	/**
	 * Subscribe to Queue
	 *
	 * @template T
	 * @param {string} queue Queue Name
	 * @param {(message: T) => void} callback Incoming Message Callback
	 * @returns
	 * @memberof AMQPEventClient
	 */
	public async subscribe<T>(queue: string, callback: (message: T) => void, createQueueIfNotFound?: boolean) {
		this._logger.debug("Subscribing to", queue);
		return new Promise<void>(async (resolve, reject) => {
			if (createQueueIfNotFound) {
				const assertResult = await this._subscribeChannel.assertQueue(queue);
				this._logger.debug("queue", assertResult);
			}
			//
			const consumeResult = await this._subscribeChannel.consume(queue, (msg) => {
				if (msg !== null) {
					this._processMessage(queue, msg.content.toString());
					this._subscribeChannel.ack(msg);
				}
			});
			this._logger.debug("Subscribed successfully to", queue, consumeResult.consumerTag);
			this._eventEmitter.on("message", callback);
			resolve();
		});
	}

	/**
	 * Publish a Message to Queue
	 *
	 * @template T
	 * @param {string} queue Queue Name
	 * @param {T} message Message to publish
	 * @returns
	 * @memberof AMQPEventClient
	 */
	public async publish<T>(queue: string, message: T) {
		return new Promise<void>(async (resolve, reject) => {
			try {
				// let assertResult = await this._publishChannel.assertQueue(topic);
				const publishResult = await this._publishChannel.sendToQueue(queue, Buffer.from(JSON.stringify(message)));
				this._logger.debug("Message", message, "was sent to", queue, publishResult);
				resolve();
			} catch (e) {
				reject(e);
			}
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

	private async _registerChannels() {
		this._logger.debug("Registering Channels");
		this._subscribeChannel = await this._client.createChannel();
		this._publishChannel = await this._client.createChannel();


		this._client.on("message", (topic, message) => {
			this._logger.debug("Message", topic, message);
			this._processMessage(topic, message.toString());
		});
		this._client.on("error", (err) => {
			this._eventEmitter.emit("error", err);
		});
	}

	/**
	 * Add Error Handler
	 *
	 * @param {(err: Error) => void} errorHandler
	 * @memberof AMQPEventClient
	 */
	public async onError(errorHandler: (err: Error) => void) {
		this._eventEmitter.on("error", errorHandler);
	}

	/**
	 * Wait for ready state
	 *
	 * @returns {Promise<boolean>}
	 * @memberof AMQPEventClient
	 */
	public async waitForReady(): Promise<boolean> {
		const result = await this._readyPromise;
		await this._registerChannels();
		return result;
	}

	/**
	 * Cleanup AMQP Client
	 *
	 * @returns {Promise<void>}
	 * @memberof AMQPEventClient
	 */
	public async dispose(): Promise<void> {
		this._logger.debug("disposing");
		await this._client.close();
		return Promise.resolve();
	}
}