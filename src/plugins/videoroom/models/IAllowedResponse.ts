import { ISuccessResponse } from "./ISuccessResponse";

export interface IAllowedResponse extends ISuccessResponse {
	"videoroom": "success";
	/**
	 * unique numeric ID
	 */
	"room": number;
	/**
	 * Updated, complete, list of allowed tokens (only for enable|add|remove)
	 */
	"allowed": string[];
}