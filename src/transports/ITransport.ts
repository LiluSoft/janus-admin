import { IRequest } from "./IRequest";
import { JanusSession } from "../abstractions/JanusSession";
import { PluginHandle } from "../abstractions/Handle";

export abstract class ITransport {
	public abstract isAdminEndpoint(): boolean;
	public abstract request<ResponseT>(req: IRequest, session?: JanusSession, pluginHandle?: PluginHandle): Promise<ResponseT>;
	public abstract dispose(): Promise<void>;
	public abstract waitForReady(): Promise<boolean>;
}