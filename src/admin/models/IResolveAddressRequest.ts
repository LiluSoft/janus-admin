import { IRequest } from "../../transports/IRequest";

export interface IResolveAddressRequest extends IRequest {
	janus: "resolve_address";
	address: string;
}