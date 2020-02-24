import { ISuccessResponse } from "./ISuccessResponse";
import { IRoom } from "./IRoom";

// A successful request will produce a list of rooms in a success response:

export interface IListResponse extends ISuccessResponse {
	"videoroom": "success";
	/**
	 * Array of room objects
	 */
	"list": IRoom[];
}