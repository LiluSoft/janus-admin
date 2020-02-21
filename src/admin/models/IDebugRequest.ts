import { IRequest } from "../../transports/IRequest";

export interface IDebugRequest extends IRequest {
	admin_secret?: string;
	debug : boolean;
}