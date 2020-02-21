/**
 * Event Client Interface
 *
 * Used for communicating with Queueing systems, such as AMQP and MQTT
 *
 * @export
 * @interface IEventClient
 */
export interface IEventClient {
	/**
	 * Cleanup, important in order to prevent connection and memory leaks
	 */
	dispose(): Promise<void>;
	/**
	 * Waits for the Transport to be ready
	 *
	 * @returns {Promise<boolean>}
	 * @memberof HTTPTransport
	 */
	waitForReady(): Promise<boolean>;

	/**
	 * Subscribes to a topic/queue with callback for incoming messages
	 *
	 * @template T
	 * @param {string} topic topic or queue to subscribe to
	 * @param {(message: T) => void} callback callback that will be called for each incoming message
	 * @returns {Promise<void>}
	 * @memberof IEventClient
	 */
	subscribe<T>(topic: string, callback: (message: T) => void): Promise<void>;

	/**
	 * Publishes a message to a topic/queue
	 *
	 * @template T
	 * @param {string} topic topic or queue to send the message to
	 * @param {T} message the message could be either object or otherwise
	 * @returns {Promise<void>}
	 * @memberof IEventClient
	 */
	publish<T>(topic: string, message: T): Promise<void>;

	/**
	 * Subscribes to Errors
	 *
	 * @param {(err: Error) => void} errorHandler
	 * @returns {Promise<void>}
	 * @memberof IEventClient
	 */
	onError(errorHandler: (err: Error) => void): Promise<void>
}