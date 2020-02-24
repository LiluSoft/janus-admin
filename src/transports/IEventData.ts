export interface IEventData<T> {
	"janus": "event";
	"session_id": number;
	"transaction": string;
	"sender": number;
	"plugindata": {
		"plugin": string;
		"data": T;
	};
}