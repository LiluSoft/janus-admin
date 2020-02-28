import { IBaseRequest } from "./IBaseRequest";

export interface IRequest extends IBaseRequest {
	transaction?: string;
	correlation_id?: string;
	session_id?: number;
	handle_id?: number;
	admin_secret?: string;

	plugin?: string;
}