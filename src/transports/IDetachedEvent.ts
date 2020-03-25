import { IEvent } from "./IEvent";

export interface IDetachedEvent  extends IEvent {
	janus: "detached";
}