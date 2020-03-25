import { ILogger } from "../logger/ILogger";
import { ILoggerFactory } from "../logger/ILoggerFactory";
import { ITransport } from "../transports/ITransport";

export class JanusBrowserClient {
	private _logger: ILogger;
	constructor(
		private loggerFactory: ILoggerFactory,
		public readonly transport: ITransport,
		public readonly token?: string) {
		this._logger = loggerFactory.create("JanusBrowserClient");
	}


	public async initialize(){

	}

	public on_webrtcState(handler: (state: boolean, reason: string) => void) {
		// this.clientSession.
		throw new Error("not implemented");
	}
}