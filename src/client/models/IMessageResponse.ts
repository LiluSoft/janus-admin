import { IPluginDataResponse } from "../../abstractions/IPluginDataResponse";
import { IErrorResponse } from ".";

export interface IMessageResponse<T> extends IPluginDataResponse<T> {
	plugindata: T & IErrorResponse;
}