import { IEvent } from "./IEvent";
import { IEventJSEP } from "./IEventJSEP";

export interface IEventData<T> extends IEvent, IEventJSEP{
	"session_id": number;
	"transaction": string;

	"plugindata": {
		"plugin": string;
		"data": T;
	};
}