import { IServerInfoTransport } from "./IServerInfoTransport";
import { IServerInfoPlugin } from "./IServerInfoPlugin";
export interface IServerInfoResponse {
	"name": string;
	"version": number;
	"version_string": string;
	"author": string;
	"data_channels": string;
	"transports": {
		[transport_id: string]: IServerInfoTransport;
	};
	"plugins": {
		[plugin_id: string]: IServerInfoPlugin;
	};
	"events":{
		[event_id:string]: {
			name:string;
			author:string;
			description:string;
			version_string:string;
		}
	};
	"commit-hash": string;
	"compile-time": string;
	"log-to-stdout": boolean;
	"log-to-file": boolean;
	"accepting-new-sessions": boolean;
	"session-timeout": number;
	"reclaim-session-timeout": number;
	"candidates-timeout": number;
	"server-name": string;
	"local-ip": string;
	"ipv6": boolean;
	"ice-lite": boolean;
	"ice-tcp": boolean;
	"full-trickle": false;
	"min-nack-queue": number;
	"twcc-period": number;
	"static-event-loops": number;
	"api_secret": boolean;
	"auth_token": boolean;
	"event_handlers": boolean;
	"opaqueid_in_api": boolean;
	"dependencies": {
		[dependency: string]: string;
	};
}
