import { JanusSession } from "./JanusSession";

/**
 * Plugin Handle Container
 *
 * Hold handle id, session and related plugin
 * @export
 * @class PluginHandle
 */
export class PluginHandle {
	constructor(public readonly handle_id: number, public readonly session: JanusSession, public readonly plugin: string) {
	}
}