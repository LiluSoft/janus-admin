import { ITransport } from "./ITransport";
import { IRequest } from "./IRequest";
import superagent from "superagent";
import { EventEmitter } from "events";
import { IEventData } from "./IEventData";
import { ILogger } from "../logger/ILogger";
import { ILoggerFactory } from "../logger/ILoggerFactory";
import { IEvent } from "./IEvent";
import { JanusSession, PluginHandle, Transaction } from "../abstractions";
import { JanusError } from "./JanusError";
import { DeferredPromise } from "./DeferredPromise";

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
	private _logger: ILogger;

	private _eventEmitter = new EventEmitter();

	// for each session, keep a long poll, for each event, pass on to "event"
	private _sessionTimers: { [session_id: number]: NodeJS.Timeout } = {};

	private _sessionTrackingStatistics: {[session_id:number]: {number_of_errors: number}} = {};

	private _transactions: { [transaction_id: string]: DeferredPromise<unknown> } = {};

	public subscribe_plugin_events<T>(callback: (event: IEvent) => void, session?: JanusSession): () => void {
		if (session) {
			if (!this._sessionTimers[session.session_id]) {
				this._trackSession(session);
			}
		}

		this._eventEmitter.on("event", callback);

		return () => {
			this._eventEmitter.removeListener("event", callback);
		};
	}


	private _trackSession(session: JanusSession) {
		this._logger.debug("Tracking Session", session);
		const trackTimer = async () => {
			try {
				const result = await superagent.get(this.url + `/${session.session_id}?maxev=5`).send();
				const events = result.body as IEventData<void>[];
				for (const event of events) {
					this._longPollHandler(event);
				}
			} catch (error) {
				this._logger.error("Unable to Track Session", session, error);

				if (!this._sessionTrackingStatistics[session.session_id]){
					this._sessionTrackingStatistics[session.session_id] = {number_of_errors: 0};
				}

				this._sessionTrackingStatistics[session.session_id].number_of_errors++;

				if (this._sessionTrackingStatistics[session.session_id].number_of_errors > 3){
					this._logger.fatal("Unable to Track Session too many times, stopping to track",session);
					return;
				}
				// todo: add event for handling errors
			}

			this._sessionTimers[session.session_id] = setTimeout(trackTimer, 0);
		};
		this._sessionTimers[session.session_id] = setTimeout(trackTimer, 0);
	}

	private _longPollHandler<T>(data: IEventData<T>) {
		this._logger.trace("long poll data", data);

		// handle deferred transactions
		if (data.transaction) {
			const deferredPromise = this._transactions[data.transaction];
			if (!deferredPromise) {
				// unknown transaction, dispose
				this._logger.warn("unknown transaction", data.transaction);
			} else {
				this._logger.trace("resolving transaction", data.transaction);
				deferredPromise.resolve(data);
			}
		}

		this._logger.debug("Dispatching Event", data);
		this._eventEmitter.emit("event", data);
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
		this._logger = loggerFactory.create("HTTPTransport");
		this._logger.trace("Initializing", arguments);
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

		try {
			const body = await (await superagent.post(this.url).send(req)).body;
			if (body.janus === "ack") {
				const deferredPromise = await DeferredPromise.create<ResponseT>(transaction);
				deferredPromise.transaction = transaction;

				this._transactions[transaction.getTransactionId()] = deferredPromise;

				return deferredPromise.promise;
			}
			if (body.janus === "error" && body.error) {
				throw new JanusError(body.error.code, body.error.reason);
			}

			return body;
		}
		catch (error) {
			this._logger.error("Unable to request", req, session, pluginHandle, error);
			throw error;
		}
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