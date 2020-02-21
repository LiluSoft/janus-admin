import { IRequest } from "../../transports/IRequest";

export interface IHandleInfoRequest extends IRequest {
	janus: "handle_info";
	admin_secret: string;
	plugin_only: boolean;
}