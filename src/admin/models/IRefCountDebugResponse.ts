export interface IRefCountDebugResponse {
	janus: "success";
	transaction?: string;
	refcount_debug?: boolean;
}