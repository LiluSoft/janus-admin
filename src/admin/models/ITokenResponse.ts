
export interface ITokenTokens {
	tokens: ITokenItem[];
}

export interface ITokenItem {
	allowed_plugins: string[];
	token: string;
}

export interface ITokenPlugins {
	plugins: string[];
}

export interface ITokenResponse<T> {
	janus: "success";
	data: T;
}