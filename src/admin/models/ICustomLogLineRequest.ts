import { IRequest } from "../../transports/IRequest";

export interface ICustomLogLineRequest extends IRequest {
	janus: "custom_logline";
	line: string;
	level: number;
}