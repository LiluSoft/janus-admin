export interface IPluginDataResponse<T> {
	janus: "success" | "event";
	session_id: number;
	transaction: string;
	sender: number;
	plugindata: T;
}