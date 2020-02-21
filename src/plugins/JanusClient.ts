import { ITransport } from "../transports/ITransport";
import { IRequest } from "../transports/IRequest";
import { IResponse } from "../transports/IResponse";
import { ISessionResponse } from "../abstractions/ISessionResponse";
import { PluginHandle, JanusSession } from "..";
import { IPluginHandleResponse } from "../abstractions/IHandleResponse";
import { IRequestWithToken } from "../transports/IRequestWithToken";

export class JanusClient {
	transport: ITransport;
	_token: string;
	constructor(transport: ITransport) {
		this.transport = transport;
		if (this.transport.isAdminEndpoint()) {
			throw new Error("Transport must be connected to Client endpoint");
		}
	}

	public setToken(token: string) {
		this._token = token;
	}

	public async CreateSession(): Promise<JanusSession> {
		const req: IRequestWithToken = {
			janus: "create"
		};

		if (this._token) {
			req.token = this._token;
		}

		const response = await this.transport.request<IResponse<ISessionResponse>>(req);

		return new JanusSession(response.data.id);
	}

	public async DestroySession(session: JanusSession): Promise<string> {
		const req: IRequestWithToken = {
			janus: "destroy",
			session_id: session.session_id
		};

		if (this._token) {
			req.token = this._token;
		}

		const response = await this.transport.request<IResponse<void>>(req);
		return response.janus;
	}

	public async CreateHandle(session: JanusSession, plugin_id: string): Promise<PluginHandle> {
		const req: IRequestWithToken = {
			janus: "attach",
			plugin: "janus.plugin.videoroom"
		};
		if (this._token) {
			req.token = this._token;
		}


		const response = await this.transport.request<IResponse<IPluginHandleResponse>>(req, session);

		return new PluginHandle(response.data.id, session, plugin_id);
	}

	public async DetachHandle(handle: PluginHandle): Promise<string> {
		const req: IRequestWithToken = {
			janus: "detach",
			session_id: handle.session.session_id,
			handle_id: handle.handle_id
		};
		if (this._token) {
			req.token = this._token;
		}


		const response = await this.transport.request<IResponse<void>>(req, handle.session);

		return response.janus;
	}
}