import { ITransport } from "./ITransport";
import { IRequest } from "./IRequest";
import { JanusSession, PluginHandle, Transaction } from "../index_browser";
import superagent from "superagent";
import { EventEmitter } from "events";
import { IEventData } from "./IEventData";
import { ILogger } from "../logger/ILogger";
import { ILoggerFactory } from "../logger/ILoggerFactory";

/**
 * RESTful interface to Janus API
 *
 * Basic usage example:
 *
 * ```ts
 * import {HTTPTransport} from '@lilusoft/janus-admin';
 * const transport = new HTTPTransport("http://server:7088/admin", "janusoverlord", true);
 * ```
 *
 * @export
 * @class HTTPTransport
 * @extends {ITransport}
 */
export class HTTPTransport extends ITransport {
	private _logger : ILogger;

	private _eventEmitter = new EventEmitter();

	// for each session, keep a long poll, for each event, pass on to "event"
	private _sessionTimers: { [session_id: number]: NodeJS.Timeout } = {};

	public subscribe_plugin_events<T>(session: JanusSession, callback: (event: IEventData<T>) => void): void {
		if (!this._sessionTimers[session.session_id]) {
			this._trackSession(session);
		}
		this._eventEmitter.on("event", callback);
	}

	private _trackSession(session: JanusSession) {
		const trackTimer = async () => {
			const result = await superagent.get(this.url + `/${session.session_id}?maxev=5`).send();
			const events = result.body as IEventData<void>[];
			for (const event of events) {
				this._longPollHandler(event);
			}

			this._sessionTimers[session.session_id] = setTimeout(trackTimer, 0);
		};
		this._sessionTimers[session.session_id] = setTimeout(trackTimer, 0);
	}

	private _longPollHandler<T>(data: IEventData<T>) {
		if (data.janus === "event") {
			this._logger.debug("janus event", data);
			this._eventEmitter.emit("event", data);
			return;
		}
	}

	/**
	 * Creates an instance of HTTPTransport
	 *
	 * @param {string} url Janus Admin API Url, i.e http://server:7088/admin, true
	 * @param {string} admin_secret Admin secret as configured in janus config file, i.e. janusoverlord
	 * @param {boolean} isAdmin should always be true for Admin API
	 * @memberof HTTPTransport
	 */
	public constructor(loggerFactory: ILoggerFactory, private url: string, private admin_secret: string, private isAdmin: boolean) {
		super();
		this._logger = loggerFactory.create("JanusClient");
	}
	/**
	 * True if this transport is pointing to Admin API
	 *
	 * @returns {boolean}
	 * @memberof HTTPTransport
	 */
	public isAdminEndpoint(): boolean {
		return this.isAdmin;
	}
	/**
	 * Executes a request against Janus API
	 *
	 * @template ResponseT
	 * @param {IRequest} req
	 * @param {JanusSession} session Janus Session to use
	 * @param {PluginHandle} pluginHandle Janus Plugin Handle to use
	 * @returns {Promise<ResponseT>}
	 * @memberof HTTPTransport
	 */
	public async request<ResponseT>(req: IRequest, session?: JanusSession, pluginHandle?: PluginHandle): Promise<ResponseT> {
		req.admin_secret = this.admin_secret;

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

		return await (await superagent.post(this.url).send(req)).body;
	}
	/**
	 * Cleanup
	 *
	 * *Unused in HTTP*
	 *
	 * @returns {Promise<void>}
	 * @memberof HTTPTransport
	 */
	public async dispose(): Promise<void> {
		for (const session_id of Object.keys(this._sessionTimers) as any as number[]) {
			this._logger.debug("clearing long poll for session", session_id);
			clearTimeout(this._sessionTimers[session_id]);
		}
		this._sessionTimers = {};
	}
	/**
	 * Waits for the Transport to be ready
	 *
	 * *Unused in HTTP*
	 *
	 * @returns {Promise<boolean>}
	 * @memberof HTTPTransport
	 */
	public async waitForReady(): Promise<boolean> {
		return true;
	}
}