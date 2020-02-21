import { IRequest } from "../../transports/IRequest";

export interface ILogColorsRequest extends IRequest {
	janus: "set_log_colors";
	admin_secret: string;
	colors: boolean;
}