import { JanusSession } from "./JanusSession";

/**
 * Plugin Handle
 *
 * @export
 * @class PluginHandle
 */
export class PluginHandle {
	constructor(public readonly handle_id: number, public readonly session: JanusSession, public readonly plugin: string) {
	}
}