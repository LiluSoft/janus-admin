import { ITransport } from "./ITransport";
import { IRequest } from "./IRequest";
import { JanusSession, PluginHandle, Transaction } from "..";
import superagent from "superagent";

export class HTTPTransport extends ITransport {
	public constructor(private url: string, private admin_secret: string, private isAdmin: boolean) {
		super();
	}
	public isAdminEndpoint(): boolean {
		return this.isAdmin;
	}
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

		return await (await superagent.post(this.url).send(req)).body
	}
	public async dispose(): Promise<void> {
		// nop
	}
	public async waitForReady(): Promise<boolean> {
		return true;
	}
}