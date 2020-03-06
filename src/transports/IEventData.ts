import { IEvent } from "./IEvent";

export interface IEventData<T> extends IEvent{
	"session_id": number;
	"transaction": string;

	"plugindata": {
		"plugin": string;
		"data": T;
	};
}