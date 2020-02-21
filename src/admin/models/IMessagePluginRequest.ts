import { IRequest } from "../../transports/IRequest";

export interface IMessagePluginRequest extends IRequest {
	janus: "message_plugin";
	plugin: string;
	request: any;
}