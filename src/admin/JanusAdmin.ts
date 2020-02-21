import { IRequest } from "../transports/IRequest";
import { ITransport } from "../transports/ITransport";
import { IResponse } from "../transports/IResponse";

import { IRequestWithToken } from "../transports/IRequestWithToken";

import { PluginHandle } from "../abstractions/PluginHandle";
import { JanusSession } from "../abstractions/JanusSession";
import * as models from "./models";

/**
 * Janus Admin API
 *
 * @export
 * @class JanusAdmin
 */
export class JanusAdmin {
	private transport: ITransport;
	private _admin_secret: string;

	/**
	 * Creates an instance of JanusAdmin.
	 * @param {ITransport} transport which transport to use. i.e. WebSocket, HTTP or EventClientTranport
	 * @param {string} admin_secret admin secret needed for some or all the APIs
	 * @memberof JanusAdmin
	 */
	constructor(transport: ITransport, admin_secret: string) {
		this.transport = transport;
		this._admin_secret = admin_secret;
		if (!this.transport.isAdminEndpoint()) {
			throw new Error("Transport must be connected to Admin endpoint");
		}
	}

	/**
	 * Retrieve the admin secret used to initialize this instance
	 *
	 * @readonly
	 * @memberof JanusAdmin
	 */
	public get admin_secret() {
		return this._admin_secret;
	}

	/**
	 *  get the generic on the Janus instance; this returns exactly the same information that a Janus API info request would return, and doesn't require any secret;
	 */
	public async info() {
		const req: IRequest = {
			janus: "info"
		};

		const response = await this.transport.request(req);
		return response as models.IServerInfoResponse;
	}

	/**
	 * a simple ping/pong mechanism for the Admin API, that returns a pong back that the client can use as a
	 * healthcheck or to measure the protocol round-trip time
	 */
	public async ping() {
		const req: IRequest = {
			janus: "ping"
		};

		const response = await this.transport.request<IResponse<void>>(req);
		return response.janus;
	}

	/**
	 *  returns the current value for the settings that can be modified at runtime via the Admin API (see below)
	 */
	public async get_status() {
		const req: IRequest = {
			janus: "get_status",
			admin_secret: this._admin_secret,
		};

		const response = await this.transport.request(req);
		return (response as any).status as models.IServerStatusResponse;
	}




	/**
	 * change the session timeout value in Janus on the fly
	 *
	 * @param {number} timeout session timeout in seconds
	 * @returns
	 * @memberof JanusAdmin
	 */
	public async set_session_timeout(timeout: number) {
		const req: models.ISessionTimeoutRequest = {
			janus: "set_session_timeout",
			admin_secret: this._admin_secret,
			timeout
		};

		const response = await this.transport.request<models.ISessionTimeoutResponse>(req);
		return response.timeout;
	}

	/**
	 * change the log level in Janus on the fly
	 *
	 * @param {number} level 0-7 where 0 is no log and 7 is debug log
	 * @returns
	 * @memberof JanusAdmin
	 */
	public async set_log_level(level: number) {
		const req: models.ISetLogLevelRequest = {
			janus: "set_log_level",
			admin_secret: this._admin_secret,
			level
		};

		const response = await this.transport.request<models.ISetLogLevelResponse>(req);
		return response.level;
	}

	/**
	 * selectively enable/disable a live debugging of the locks in Janus on the fly
	 * (useful if you're experiencing deadlocks and want to investigate them)
	 */
	public async set_locking_debug(debug: boolean) {
		const req: models.IDebugRequest = {
			janus: "set_locking_debug",
			admin_secret: this._admin_secret,
			debug
		}
		const response = await this.transport.request<models.ILockingDebugResponse>(req);
		return response.locking_debug;
	}

	/**
	 * selectively enable/disable a live debugging of the reference counters in Janus
	 * on the fly (useful if you're experiencing memory leaks in the Janus structures and want to investigate them)
	 * @param debug
	 */
	public async set_refcount_debug(debug: boolean) {
		const req: models.IDebugRequest = {
			janus: "set_refcount_debug",
			admin_secret: this._admin_secret,
			debug
		}
		const response = await this.transport.request<models.IRefCountDebugResponse>(req);
		return response.refcount_debug;
	}

	/**
	 * selectively enable/disable libnice debugging
	 */
	public async set_libnice_debug(debug: boolean) {
		const req: models.IDebugRequest = {
			janus: "set_libnice_debug",
			admin_secret: this._admin_secret,
			debug
		}
		const response = await this.transport.request<models.ILibNiceDebugResponse>(req);
		return response.libnice_debug;
	}

	/**
	 * selectively enable/disable adding a timestamp to all log lines Janus writes on the console and/or to file
	 */
	public async set_log_timestamps(timestamps: boolean) {
		const req: models.ILogTimestampsRequest = {
			janus: "set_log_timestamps",
			admin_secret: this._admin_secret,
			timestamps
		}
		const response = await this.transport.request<models.ILogTimestampsResponse>(req);
		return response.log_timestamps;
	}

	/**
	 * selectively enable/disable using colors in all log lines Janus writes on the console and/or to file
	 */
	public async set_log_colors(colors: boolean) {
		const req: models.ILogColorsRequest = {
			janus: "set_log_colors",
			admin_secret: this._admin_secret,
			colors
		}
		const response = await this.transport.request<models.ILogColorsResponse>(req);
		return response.log_colors;
	}

	/**
	 * change the value of the min NACK queue window
	 *
	 * @param {number} min_nack_queue minimum NACK queue in ms
	 * @returns
	 * @memberof JanusAdmin
	 */
	public async set_min_nack_queue(min_nack_queue: number) {
		const req: models.IMinNackQueueRequest = {
			janus: "set_min_nack_queue",
			admin_secret: this._admin_secret,
			min_nack_queue
		}
		const response = await this.transport.request<models.IMinNackQueueResponse>(req);
		return response.min_nack_queue;
	}

	/**
	 * change the value of the no-media timer value on the fly
	 *
	 * @param {number} no_media_timer no-media timer in seconds
	 * @returns
	 * @memberof JanusAdmin
	 */
	public async set_no_media_timer(no_media_timer: number) {
		const req: models.INoMediaTimerRequest = {
			janus: "set_no_media_timer",
			admin_secret: this._admin_secret,
			no_media_timer
		}
		const response = await this.transport.request<models.INoMediaTimerResponse>(req);
		return response.no_media_timer;
	}

	/**
	 * change the value of the slowlink-threshold property which is the number of lost packets that trigger slow link
	 *
	 * @param {number} slowlink_threshold number of packets to trigger slowlink
	 */
	public async set_slowlink_threshold(slowlink_threshold: number) {
		const req: models.ISlowLinkThresholdRequest = {
			janus: "set_slowlink_threshold",
			admin_secret: this._admin_secret,
			slowlink_threshold
		}
		const response = await this.transport.request<models.ISlowLinkThresholdResponse>(req);
		return response.slowlink_threshold;
	}

	/**
	 * add a valid token (only available if you enabled the Stored token based authentication mechanism)
	 *
	 * @param {string} token token to add
	 * @param {string[]} plugins which plugins to enable for that token
	 * @returns
	 * @memberof JanusAdmin
	 */
	public async add_token(token: string, plugins?: string[]) {
		const req: IRequestWithToken = {
			janus: "add_token",
			admin_secret: this._admin_secret,
			token
		};

		if (plugins) {
			req.plugins = plugins;
		}

		const response = await this.transport.request<models.ITokenResponse<models.ITokenPlugins>>(req);
		return response.data.plugins;
	}

	/**
	 * give a token access to a plugin (only available if you enabled the Stored token based authentication mechanism)
	 */
	public async allow_token(token: string, plugins: string[]) {
		const req: IRequestWithToken = {
			janus: "allow_token",
			admin_secret: this._admin_secret,
			token
		};

		if (plugins) {
			req.plugins = plugins;
		}

		const response = await this.transport.request<models.ITokenResponse<models.ITokenPlugins>>(req);
		return response.data.plugins;
	}

	/**
	 * remove a token access from a plugin (only available if you enabled the Stored token based authentication mechanism)
	 */
	public async disallow_token(token: string, plugins: string[]) {
		const req: IRequestWithToken = {
			janus: "disallow_token",
			admin_secret: this._admin_secret,
			token
		};

		if (plugins) {
			req.plugins = plugins;
		}

		const response = await this.transport.request<models.ITokenResponse<models.ITokenPlugins>>(req);
		return response.data.plugins;
	}

	/**
	 * list the existing tokens (only available if you enabled the Stored token based authentication mechanism)
	 */
	public async list_tokens() {
		const req: IRequestWithToken = {
			janus: "list_tokens",
			admin_secret: this._admin_secret,
		};

		const response = await this.transport.request<models.ITokenResponse<models.ITokenTokens>>(req);
		return response.data.tokens;
	}

	/**
	 * remove a token (only available if you enabled the Stored token based authentication mechanism)
	 */
	public async remove_token(token: string) {
		const req: IRequestWithToken = {
			janus: "remove_token",
			admin_secret: this._admin_secret,
			token
		};



		const response = await this.transport.request<models.ITokenResponse<models.ITokenPlugins>>(req);
		return response.data;
	}

	/**
	 * configure whether Janus should accept new incoming sessions or not; this can be particularly useful whenever,
	 * e.g., you want to stop accepting new sessions because you're draining this instance
	 */
	public async accept_new_sessions(accept: boolean) {
		const req: models.IAcceptNewSessionsRequest = {
			janus: "accept_new_sessions",
			admin_secret: this._admin_secret,
			accept
		}
		const response = await this.transport.request<models.IAcceptNewSessionsResponse>(req);
		return response.accept;
	}

	/**
	 * list all the sessions currently active in Janus (returns an array of session identifiers)
	 */
	public async list_sessions() {
		const req: IRequest = {
			janus: "list_sessions",
			admin_secret: this._admin_secret,
		};

		const response = await this.transport.request<models.ISessionsResponse>(req);
		return response.sessions;

	}

	/**
	 * destroy a specific session; this behaves exactly as the destroy request does in the Janus API
	 * @param session
	 */
	public async destroy_session(session: number) {
		const req: IRequest = {
			janus: "destroy_session",
			admin_secret: this._admin_secret,
			session_id: session
		};

		const response = await this.transport.request<IResponse<void>>(req);
		return response.janus;
	}


	/**
	 * list all the ICE handles currently active in a Janus session (returns an array of handle identifiers)
	 */
	public async list_handles(session: JanusSession) {
		const req: IRequest = {
			janus: "list_handles",
			admin_secret: this._admin_secret,
			session_id: session.session_id
		};

		const response = await this.transport.request<models.IListHandlesResponse>(req);
		return response.handles;
	}

	/**
	 * list all the available info on a specific ICE handle
	 */
	public async handle_info(session: JanusSession, handle: PluginHandle, plugin_only: boolean) {
		const req: models.IHandleInfoRequest = {
			janus: "handle_info",
			admin_secret: this._admin_secret,
			plugin_only,
			session_id: session.session_id,
			handle_id: handle.handle_id
		};

		const response = await this.transport.request<models.IHandleInfoResponse>(req);
		return response.info;
	}

	/**
	 * start dumping incoming and outgoing RTP/RTCP packets of a handle to a pcap file (e.g., for ex-post analysis via Wireshark)
	 */
	public async start_pcap(handle: PluginHandle, folder: string, filename: string, truncate: number) {
		const req: models.IPcapRequest = {
			janus: "start_pcap",
			admin_secret: this._admin_secret,
			handle_id: handle.handle_id,
			session_id: handle.session.session_id,
			folder,
			filename,
			truncate
		};

		const response = await this.transport.request<IResponse<void>>(req);
		return response.janus === "success";
	}

	/**
	 * stop the pcap dump
	 */
	public async stop_pcap(handle: PluginHandle) {
		const req: IRequest = {
			janus: "stop_pcap",
			admin_secret: this._admin_secret,
			handle_id: handle.handle_id,
			session_id: handle.session.session_id,
		};

		const response = await this.transport.request<IResponse<void>>(req);
		return response.janus === "success";
	}
	/**
	 * start dumping incoming and outgoing RTP/RTCP packets of a handle to a text2pcap file (e.g., for ex-post analysis via Wireshark)
	 */
	public async start_text2pcap(handle: PluginHandle, folder: string, filename: string, truncate: number) {
		const req: models.IPcapRequest = {
			janus: "start_text2pcap",
			admin_secret: this._admin_secret,
			handle_id: handle.handle_id,
			session_id: handle.session.session_id,
			folder,
			filename,
			truncate
		};

		const response = await this.transport.request<IResponse<void>>(req);
		return response.janus === "success";
	}

	/**
	 *  stop the text2pcap dump
	 */
	public async stop_text2pcap(handle: PluginHandle) {
		const req: IRequest = {
			janus: "stop_text2pcap",
			admin_secret: this._admin_secret,
			handle_id: handle.handle_id,
			session_id: handle.session.session_id,
		};

		const response = await this.transport.request<IResponse<void>>(req);
		return response.janus === "success";
	}

	/**
	 * send a synchronous request to a plugin and return a response; implemented by most plugins to
	 * facilitate and streamline the management of plugin resources (e.g., creating rooms in a conference plugin)
	 */
	public async message_plugin<TResponse>(plugin: string, request: any) {
		const req: models.IMessagePluginRequest = {
			janus: "message_plugin",
			admin_secret: this._admin_secret,
			plugin,
			request
		};

		const response = await this.transport.request<models.IMessagePluginResponse<TResponse>>(req);
		return response.response;
	}

	/**
	 * hangups the PeerConnection associated with a specific handle; this behaves exactly as the hangup request does in the Janus API
	 */
	public async hangup_webrtc(handle: PluginHandle) {
		const req: IRequest = {
			janus: "hangup_webrtc",
			admin_secret: this._admin_secret,
			handle_id: handle.handle_id,
			session_id: handle.session.session_id,
		};

		const response = await this.transport.request<IResponse<void>>(req);
		return response.janus === "success";
	}

	/**
	 * detached a specific handle; this behaves exactly as the detach request does in the Janus API
	 */
	public async detach_handle(handle: PluginHandle) {
		const req: IRequest = {
			janus: "detach_handle",
			admin_secret: this._admin_secret,
			handle_id: handle.handle_id,
			session_id: handle.session.session_id,
		};

		const response = await this.transport.request<IResponse<void>>(req);
		return response.janus === "success";
	}


	/**
	 * send a synchronous request to an event handler and return a response; implemented by most event handlers to dynamically configure some of their properties
	 */
	public async query_eventhandler<TRequest, TResponse>(handler: string, request: TRequest) {
		const req: models.IQueryEventHandlerRequest<TRequest> = {
			janus: "query_eventhandler",
			admin_secret: this._admin_secret,
			handler,
			request
		};

		const response = await this.transport.request<models.IQueryEventHandlerResponse<TResponse>>(req);
		return response.response;
	}

	/**
	 * push a custom "external" event to notify via event handlers; this can be useful whenever info from a
	 * third-party application needs to be easily correlated to events originated by Janus, or to push
	 * information Janus doesn't have available (e.g., a script polling CPU usage regularly)
	 */
	public async custom_event<T>(schema: string, data: T) {
		const req: models.ICustomEventRequest<T> = {
			janus: "custom_event",
			admin_secret: this._admin_secret,
			schema,
			data
		};

		const response = await this.transport.request<IResponse<void>>(req);
		return response.janus === "success";
	}

	/**
	 * push a custom "external" string to print on the logs; this can be useful whenever info from a third-party
	 * application needs to be injected in the Janus logs for whatever reason. The log level can be chosen.
	 */
	public async custom_logline(line: string, level: number) {
		const req: models.ICustomLogLineRequest = {
			janus: "custom_logline",
			admin_secret: this._admin_secret,
			line,
			level
		};

		const response = await this.transport.request<IResponse<void>>(req);
		return response.janus === "success";
	}

	/**
	 * helper request to evaluate whether this Janus instance can resolve an address via DNS, and how long it takes
	 */
	public async resolve_address(address: string) {
		const req: models.IResolveAddressRequest = {
			janus: "resolve_address",
			admin_secret: this._admin_secret,
			address
		};

		const response = await this.transport.request<models.IResolveAddressResponse>(req);
		return {
			ip: response.ip,
			elapsed: response.elapsed
		};
	}

	/**
	 *  helper request to evaluate whether this Janus instance can contact a STUN server, what is returned, and how long it takes.
	 */
	public async test_stun(address: string, port: number, localport?: number) {
		const req: models.ITestStunRequest = {
			janus: "test_stun",
			admin_secret: this._admin_secret,
			address,
			port,
			localport
		};

		const response = await this.transport.request<models.ITestStunResponse>(req);
		return {
			public_ip: response.public_ip,
			public_port: response.public_port,
			elapsed: response.elapsed
		};
	}

}