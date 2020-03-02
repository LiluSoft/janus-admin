import { ITransport } from "./ITransport";
import { IRequest } from "./IRequest";
import { JanusSession, PluginHandle } from "../abstractions";
import { IEventData } from "./IEventData";
import axios from "axios";
import { ILoggerFactory } from "../logger/ILoggerFactory";




export class HTTPBrowserTransport extends ITransport {
	public constructor(loggerFactory: ILoggerFactory, private url: string, private admin_secret: string, private isAdmin: boolean) {
		super();
		// this._logger = loggerFactory.create("JanusClient");
	}

	public isAdminEndpoint(): boolean {
		throw new Error("Method not implemented.");
	} public request<ResponseT>(req: IRequest, session?: JanusSession | undefined, pluginHandle?: PluginHandle | undefined): Promise<ResponseT> {
		throw new Error("Method not implemented.");
	}
	public dispose(): Promise<void> {
		throw new Error("Method not implemented.");
	}
	public waitForReady(): Promise<boolean> {
		throw new Error("Method not implemented.");
	}
	public subscribe_plugin_events<T>(session: JanusSession, callback: (event: IEventData<T>) => void): void {
		throw new Error("Method not implemented.");
	}

}