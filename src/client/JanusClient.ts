import { ITransport } from "../transports/ITransport";
import { IRequest } from "../transports/IRequest";
import { IResponse } from "../transports/IResponse";
import { ISessionResponse } from "../abstractions/ISessionResponse";
import { PluginHandle, JanusSession, IRequestWithBody, IVideoRoomResponse } from "..";
import { IPluginHandleResponse } from "../abstractions/IHandleResponse";
import { IRequestWithToken } from "../transports/IRequestWithToken";
import bunyan from "bunyan";
import { IPluginDataResponse } from "../abstractions/IPluginDataResponse";
import { IRequestWithJSEP } from "../transports/IRequestWithJSEP";
import { ITrickleRequest } from "./models/ITrickleRequest";

/**
 * Janus Client
 *
 * @export
 * @class JanusClient
 */
export class JanusClient {
	private _logger = bunyan.createLogger({ name: "JanusClient", level: "info" });


	/**
	 * Creates an instance of JanusClient.
	 * @param {ITransport} transport Transport for communicating with Janus gateway
	 * @memberof JanusClient
	 */
	constructor(public readonly transport: ITransport, public readonly token?:string) {
		if (this.transport.isAdminEndpoint()) {
			this._logger.error("Transport must be connected to Client endpoint");
			throw new Error("Transport must be connected to Client endpoint");
		}
	}

	/**
	 * create a new session
	 */
	public async CreateSession(): Promise<JanusSession> {
		this._logger.debug("creating new session");
		const req: IRequestWithToken = {
			janus: "create"
		};

		if (this.token) {
			req.token = this.token;
		}

		const response = await this.transport.request<IResponse<ISessionResponse>>(req);
		this._logger.debug("created new session", response.data.id);

		return new JanusSession(response.data.id);
	}

	/**
	 * Destroys a Session
	 *
	 * @param {JanusSession} session
	 * @returns {Promise<boolean>}
	 * @memberof JanusClient
	 */
	public async DestroySession(session: JanusSession): Promise<boolean> {
		this._logger.debug("destroying session", session);
		const req: IRequestWithToken = {
			janus: "destroy",
		};

		if (this.token) {
			req.token = this.token;
		}

		const response = await this.transport.request<IResponse<void>>(req, session);
		return response.janus === "success";
	}

	/**
	 * attach to a plugin within the context of a specific session
	 *
	 * @param {JanusSession} session Janus Session
	 * @param {string} plugin_id Plugin id, i.e. "janus.plugin.videoroom", "janus.plugin.streaming" etc'
	 * @returns {Promise<PluginHandle>}
	 * @memberof JanusClient
	 */
	public async CreateHandle(session: JanusSession, plugin_id: string): Promise<PluginHandle> {
		this._logger.debug("attach", session, plugin_id);

		const req: IRequestWithToken = {
			janus: "attach",
			plugin: plugin_id
		};
		if (this.token) {
			req.token = this.token;
		}


		const response = await this.transport.request<IResponse<IPluginHandleResponse>>(req, session);

		return new PluginHandle(response.data.id, session, plugin_id);
	}

	/**
	 * destroys the plugin handle
	 *
	 * @param {PluginHandle} handle plugin handle
	 * @returns {Promise<boolean>}
	 * @memberof JanusClient
	 */
	public async DetachHandle(handle: PluginHandle): Promise<boolean> {
		this._logger.debug("detach", handle);
		const req: IRequestWithToken = {
			janus: "detach",
		};
		if (this.token) {
			req.token = this.token;
		}


		const response = await this.transport.request<IResponse<void>>(req, handle.session, handle);

		return response.janus === "success";
	}

	/**
	 * A Janus session is kept alive as long as there's no inactivity for 60 seconds:
	 * if no messages have been received in that time frame, the session is torn down
	 * by the server. A normal activity on a session is usually enough to prevent that
	 *
	 * @param {JanusSession} session Janus Session
	 * @returns
	 * @memberof JanusClient
	 */
	public async keepalive(session: JanusSession) {
		this._logger.debug("keepalive");
		const req: IRequestWithToken = {
			janus: "keepalive",
		};
		if (this.token) {
			req.token = this.token;
		}


		const response = await this.transport.request<IResponse<void>>(req, session);

		return response.janus;
	}

	/**
	 *  keeping the handle alive but want to hang up the associated PeerConnection
	 */
	public async hangup(handle: PluginHandle) {
		this._logger.debug("hangup");
		const req: IRequestWithToken = {
			janus: "hangup",
		};
		if (this.token) {
			req.token = this.token;
		}


		const response = await this.transport.request<IResponse<void>>(req, handle.session, handle);

		return response.janus === "success";
	}

	/**
	 * Claims a session
	 *
	 * @param {JanusSession} session
	 * @returns
	 * @memberof JanusClient
	 */
	public async claim(session: JanusSession) {
		this._logger.debug("claim");
		const req: IRequestWithToken = {
			janus: "claim",
		};
		if (this.token) {
			req.token = this.token;
		}

		const response = await this.transport.request<IResponse<void>>(req, session);

		return response.janus === "success";
	}

	/**
	 * send a plugin a message/request
	 *
	 * The body field will have to contain a plugin-specific JSON payload. In case the message also
	 * needs to convey WebRTC-related negotiation information, a jsep field containing the JSON-ified
	 * version of the JSEP object can be attached as well.
	 *
	 * @template T
	 * @param {PluginHandle} handle Plugin Handle
	 * @param {T} body Message Body
	 * @param {*} [jsep] WebRTC related JSEP
	 * @returns
	 * @memberof JanusClient
	 */
	public async message<T>(handle: PluginHandle, body: T, jsep?: any) {
		this._logger.debug("message", handle, body);

		const create_request: IRequestWithBody<T> & IRequestWithToken & IRequestWithJSEP = {
			janus: "message",
			session_id: handle.session.session_id,
			handle_id: handle.handle_id,
			body
		};

		if (jsep) {
			create_request.jsep = jsep;
		}

		if (this.token) {
			create_request.token = this.token;
		}

		const created_result = await this.transport.request<void>(create_request, handle.session, handle);

		return created_result;
	}

	/**
	 * trickle candidates
	 *
	 * a message is related to a specific PeerConnection, it will need to be addressed to the right Handle
	 *
	 * @param {ITrickleRequest} req
	 * @param {JanusSession} session
	 * @returns
	 * @memberof JanusClient
	 */
	public async trickle(req: ITrickleRequest, handle: PluginHandle) {
		this._logger.debug("trickle");

		const req_augmented: ITrickleRequest & IRequestWithToken = req;

		if (this.token) {
			req_augmented.token = this.token;
		}


		const response = await this.transport.request<IResponse<void>>(req_augmented, handle.session, handle);

		return response.janus;
	}
}