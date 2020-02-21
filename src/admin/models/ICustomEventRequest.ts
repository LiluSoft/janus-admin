import { IRequest } from "../../transports/IRequest";

export interface ICustomEventRequest<T> extends IRequest {
	janus: "custom_event";
	schema: string;
	data: T;
}