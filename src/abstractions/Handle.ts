import { JanusSession } from "./JanusSession";

export class PluginHandle {
	constructor(public handle_id: number, public session: JanusSession, public plugin: string) {
	}
}