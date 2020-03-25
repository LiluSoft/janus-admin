import { ITransport } from "../transports/ITransport";
import { IRequest } from "../transports/IRequest";
import { IResponse } from "../transports/IResponse";
import { ISessionResponse } from "../abstractions/ISessionResponse";
import { IPluginHandleResponse } from "../abstractions/IHandleResponse";
import { IRequestWithToken } from "../transports/IRequestWithToken";
import { IPluginDataResponse } from "../abstractions/IPluginDataResponse";
import { IRequestWithJSEP } from "../transports/IRequestWithJSEP";
import { ITrickleRequest } from "./models/ITrickleRequest";
import { IBaseRequest } from "../transports/IBaseRequest";
import { IMessageResponse } from "./models/IMessageResponse";
import { IMessageRequest } from "./models";
import { ILogger } from "../logger/ILogger";
import { ILoggerFactory } from "../logger/index_server";
import { IEventData } from "../transports/IEventData";
import { JanusSession, PluginHandle } from "../abstractions";
import { JanusError } from "../transports/JanusError";
import { IRequestWithBody } from "../transports/IRequestWithBody";

/**
 * Janus Client
 *
 * @export
 * @class JanusClient
 */
export class JanusClient {
	private _logger : ILogger;

	/**
	 * Creates an instance of JanusClient.
	 * @param {ITransport} transport Transport for communicating with Janus gateway
	 * @memberof JanusClient
	 */
	constructor(public readonly loggerFactory : ILoggerFactory, public readonly transport: ITransport, public readonly token?: string) {
		this._logger = loggerFactory.create("JanusClient");
		this._logger.trace("Initializing",arguments);

		if (this.transport.isAdminEndpoint()) {
			this._logger.error("Transport must be connected to Client endpoint");
			throw new Error("Transport must be connected to Client endpoint");
		}

	}

	/**
	 * create a new session
	 */
	public async CreateSession(): Promise<JanusSession> {
		this._logger.trace("creating new session");
		const req: IRequestWithToken = {
			janus: "create"
		};

		if (this.token) {
			req.token = this.token;
		}

		const response = await this.transport.request<IResponse<ISessionResponse>>(req);
		this._logger.debug("created new session", response.data);

		if (response.data) {
			const session = new JanusSession(response.data.id);
			return session;
		} else {
			throw new JanusError(-1, "Unable to create a new session");
		}

	}

	/**
	 * Destroys a Session
	 *
	 * @param {JanusSession} session
	 * @returns {Promise<boolean>}
	 * @memberof JanusClient
	 */
	public async DestroySession(session: JanusSession): Promise<boolean> {
		this._logger.trace("destroying session", session);
		const req: IRequestWithToken = {
			janus: "destroy",
		};

		if (this.token) {
			req.token = this.token;
		}

		const response = await this.transport.request<IResponse<void>>(req, session);

		this._logger.debug("destroyed session", session, response);

		return response.janus === "success";
	}

	/**
	 * attach to a plugin within the context of a specific session
	 *
	 * a {{JanusSessionEventHandler}} Can be attached to the session to receive session events
	 *
	 * @param {JanusSession} session Janus Session
	 * @param {string} plugin_id Plugin id, i.e. "janus.plugin.videoroom", "janus.plugin.streaming" etc'
	 * @returns {Promise<PluginHandle>}
	 * @memberof JanusClient
	 */
	public async CreateHandle(session: JanusSession, plugin_id: string): Promise<PluginHandle> {
		this._logger.trace("attach", session, plugin_id);

		const req: IRequestWithToken = {
			janus: "attach",
			plugin: plugin_id
		};
		if (this.token) {
			req.token = this.token;
		}


		const response = await this.transport.request<IResponse<IPluginHandleResponse>>(req, session);

		this._logger.debug("attached", session,plugin_id, response);

		if (response.data) {
			return new PluginHandle(response.data.id, session, plugin_id);
		}

		throw new JanusError(-1, "Unable to create a new PluginHandle");
	}

	/**
	 * destroys the plugin handle
	 *
	 * @param {PluginHandle} handle plugin handle
	 * @returns {Promise<boolean>}
	 * @memberof JanusClient
	 */
	public async DetachHandle(handle: PluginHandle): Promise<boolean> {
		this._logger.trace("detach", handle);
		const req: IRequestWithToken = {
			janus: "detach",
		};
		if (this.token) {
			req.token = this.token;
		}


		const response = await this.transport.request<IResponse<void>>(req, handle.session, handle);

		this._logger.debug("detached", handle, response);

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
		this._logger.trace("keepalive");
		const req: IRequestWithToken = {
			janus: "keepalive",
		};
		if (this.token) {
			req.token = this.token;
		}


		const response = await this.transport.request<IResponse<void>>(req, session);
		this._logger.debug("keepalive", response);

		return response.janus;
	}

	/**
	 *  keeping the handle alive but want to hang up the associated PeerConnection
	 */
	public async hangup(handle: PluginHandle) {
		this._logger.trace("hangup", handle);
		const req: IRequestWithToken = {
			janus: "hangup",
		};
		if (this.token) {
			req.token = this.token;
		}


		const response = await this.transport.request<IResponse<void>>(req, handle.session, handle);

		this._logger.debug("hangup", handle, response);

		return response.janus === "success";
	}

	/**
	 * Claims a session
	 *
	 * a {{JanusSessionEventHandler}} Can be attached to the session to receive session events
	 *
	 * @param {JanusSession} session
	 * @returns
	 * @memberof JanusClient
	 */
	public async claim(session: JanusSession) {
		this._logger.trace("claim", session);
		const req: IRequestWithToken = {
			janus: "claim",
		};
		if (this.token) {
			req.token = this.token;
		}

		const response = await this.transport.request<IResponse<void>>(req, session);

		this._logger.debug("claim", session, response);

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
	public async message<TResult>(handle: PluginHandle, body: IMessageRequest, jsep?: any) {
		this._logger.trace("message", handle, body);

		const message_request: IRequestWithBody<IMessageRequest> & IRequestWithToken & IRequestWithJSEP = {
			janus: "message",
			session_id: handle.session.session_id,
			handle_id: handle.handle_id,
			body
		};

		if (jsep) {
			message_request.jsep = jsep;
		}

		if (this.token) {
			message_request.token = this.token;
		}

		const message_sent_result = await this.transport.request<IMessageResponse<TResult>>(message_request, handle.session, handle);

		this._logger.debug("message", handle, body, message_sent_result);

		if (message_sent_result.plugindata && message_sent_result.plugindata.data.error && message_sent_result.plugindata.data.error_code) {
			throw new JanusError(message_sent_result.plugindata.data.error_code, message_sent_result.plugindata.data.error);
		}
		return message_sent_result;
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
		this._logger.trace("trickle", req, handle);

		const req_augmented: ITrickleRequest & IRequestWithToken = req;

		if (this.token) {
			req_augmented.token = this.token;
		}


		const response = await this.transport.request<IResponse<void>>(req_augmented, handle.session, handle);

		this._logger.debug("trickle", req, handle, response);

		return response.janus;
	}
}