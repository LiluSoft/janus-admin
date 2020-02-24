import { ITransport } from "./ITransport";
import { IRequest } from "./IRequest";
import { JanusSession, PluginHandle, Transaction } from "..";
import superagent from "superagent";


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
	/**
	 * Creates an instance of HTTPTransport
	 *
	 * @param {string} url Janus Admin API Url, i.e http://server:7088/admin, true
	 * @param {string} admin_secret Admin secret as configured in janus config file, i.e. janusoverlord
	 * @param {boolean} isAdmin should always be true for Admin API
	 * @memberof HTTPTransport
	 */
	public constructor(private url: string, private admin_secret: string, private isAdmin: boolean) {
		super();
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
		// nop
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