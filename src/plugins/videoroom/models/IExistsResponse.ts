import { ISuccessResponse } from "./ISuccessResponse";

export interface IExistsResponse extends ISuccessResponse {
	"videoroom": "success",
	/**
	 * unique numeric ID
	 */
	"room": number;
	/**
	 * true|false exists
	 */
	"exists": boolean;
}