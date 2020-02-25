import { IRequest } from "./IRequest";
import { JanusSession } from "../abstractions/JanusSession";
import { PluginHandle } from "../abstractions/PluginHandle";
import { IEventData } from "./IEventData";

/**
 * Transport Interface for Janus API
 *
 * @export
 * @abstract
 * @class ITransport
 */
export abstract class ITransport {
	/**
	 * True if this transport is pointing to Admin API
	 *
	 * @returns {boolean}
	 * @memberof HTTPTransport
	 */
	public abstract isAdminEndpoint(): boolean;
	/**
	 * Executes a request against Janus API
	 *
	 * @template ResponseT response type
	 * @param {IRequest} req request data
	 * @param {JanusSession} session Janus Session to use
	 * @param {PluginHandle} pluginHandle Janus Plugin Handle to use
	 * @returns {Promise<ResponseT>}
	 * @memberof HTTPTransport
	 */
	public abstract request<ResponseT>(req: IRequest, session?: JanusSession, pluginHandle?: PluginHandle): Promise<ResponseT>;
	/**
	 * Cleanup, important in order to prevent connection and memory leaks
	 *
	 * @returns {Promise<void>}
	 * @memberof HTTPTransport
	 */
	public abstract dispose(): Promise<void>;

	/**
	 * Waits for the Transport to be ready
	 *
	 * @returns {Promise<boolean>}
	 * @memberof HTTPTransport
	 */
	public abstract waitForReady(): Promise<boolean>;

	public abstract subscribe_plugin_events<T>(session: JanusSession, callback: (event: IEventData<T>) => void): void;
}