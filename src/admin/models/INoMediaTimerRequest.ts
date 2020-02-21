import { IRequest } from "../../transports/IRequest";

export interface INoMediaTimerRequest extends IRequest {
	janus: "set_no_media_timer";
	no_media_timer: number;
}