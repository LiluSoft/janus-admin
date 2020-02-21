export interface IPluginDataResponse<T> {
	janus: 'success',
	session_id: number;
	transaction: string;
	sender: number;
	plugindata: T
}