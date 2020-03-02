import { IPluginDataResponse } from "../../abstractions/IPluginDataResponse";
import { IClientErrorResponse } from ".";

export interface IMessageResponse<T> extends IPluginDataResponse<T> {
	plugindata: T & IClientErrorResponse;
}