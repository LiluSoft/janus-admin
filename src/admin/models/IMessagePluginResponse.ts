export interface IMessagePluginResponse<T> {
	janus: "success";
	transaction?: string;
	response: T;
}