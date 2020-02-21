import { ICreateRequest } from "./models/ICreateRequest";
import { ICreatedResponse } from "./models/ICreatedResponse";
import { IEditRequest } from "./models/IEditRequest";
import { IEditedResponse } from "./models/IEditedResponse";
import { IDestroyRequest } from "./models/IDestroyRequest";
import { IDestroyedResponse } from "./models/IDestroyedResponse";
import { IExistsRequest } from "./models/IExistsRequest";
import { IExistsResponse } from "./models/IExistsResponse";
import { IAllowedRequest } from "./models/IAllowedRequest";
import { IAllowedResponse } from "./models/IAllowedResponse";
import { IKickRequest } from "./models/IKickRequest";
import { IListRequest } from "./models/IListRequest";
import { IListResponse } from "./models/IListResponse";
import { IListParticipantsRequest } from "./models/IListParticipantsRequest";
import { IJoinPublisherRequest } from "./models/IJoinPublisherRequest";
import { IJoinPublisherResponse } from "./models/IJoinPublisherResponse";
import { IPublishRequest } from "./models/IPublishRequest";
import { IPublisher } from "./models/IPublisher";
import { IConfigureRequest } from "./models/IConfigureRequest";
import { IRTPForwardRequest } from "./models/IRTPForwardRequest";
import { IRTPForwardResponse } from "./models/IRTPForwardResponse";
import { IStopRTPForwardResponse } from "./models/IStopRTPForwardResponse";
import { IStopRTPForwardRequest } from "./models/IStopRTPForwardRequest";
import { IListForwardersRequest } from "./models/IListForwardersRequest";
import { IListForwardersResponse } from "./models/IListForwardersResponse";
import { IJoinSubscriberRequest } from "./models/IJoinSubscriberRequest";
import { IAttachedResponse } from "./models/IJoinSubscriberResponse";
import { ISwitchRequest } from "./models/ISwitchRequest";
import { ISwitchResponse } from "./models/ISwitchResponse";
import { IListParticipantsResponse } from "./models/IListParticipantsResponse";
import { ITransport } from "../../transports/ITransport";
import { IRequest } from "../../transports/IRequest";
import { IResponse } from "../../transports/IResponse";
import { PluginHandle } from "../../abstractions/PluginHandle";
import { IPluginDataResponse } from "../../abstractions/IPluginDataResponse";
import { IVideoRoomResponse } from "./models/IVideoRoomResponse";
import { IVideoRoomError } from "./models/IVideoRoomError";
import { VideoRoomError } from "./VideoRoomError";
import { JanusSession } from "../../abstractions/JanusSession";

import bunyan from "bunyan";
import { IRequestWithBody } from "../../transports/IRequestWithBody";
import { JanusClient } from "../JanusClient";

export class VideoRoomPlugin {
	private _logger = bunyan.createLogger({ name: "VideoRoomPlugin" });

	public static async attach(client: JanusClient, session?: JanusSession): Promise<VideoRoomPlugin> {
		const logger = bunyan.createLogger({ name: "VideoRoomPlugin" });
		// let client = new JanusClient(transport);

		if (!session) {
			session = await client.CreateSession();
			logger.debug("got session", session);
		}
		const handle = await client.CreateHandle(session, "janus.plugin.videoroom");

		return new VideoRoomPlugin(client.transport, client, session, handle);
	}

	public async dispose() {
		const destroyedHandle = await this._client.DetachHandle(this._handle);
		const destroyedSession = await this._client.DestroySession(this._session);
		this._logger.debug("destroyed", destroyedHandle, destroyedSession);
	}

	constructor(private _transport: ITransport, private _client: JanusClient, private _session: JanusSession, private _handle: PluginHandle) {

	}

	public get handle() {
		return this._handle;
	}

	public async create(req: ICreateRequest): Promise<ICreatedResponse> {
		const listReq: IRequestWithBody<ICreateRequest> = {
			janus: "message",
			body: req
		};

		const list = await this._transport.request<IPluginDataResponse<IVideoRoomResponse<ICreatedResponse>>>(listReq, this._session, this._handle)
		if ((list.plugindata.data as any).error) {
			const error = (list.plugindata.data as any as IVideoRoomError);
			throw new VideoRoomError(error.error_code, error.error);
		}
		this._logger.debug(list);
		return list.plugindata.data;
	}
	public edit(req: IEditRequest): Promise<IEditedResponse> { throw new Error("not implemented"); }
	public destroy(req: IDestroyRequest): Promise<IDestroyedResponse> { throw new Error("not implemented"); }
	public exists(req: IExistsRequest): Promise<IExistsResponse> { throw new Error("not implemented"); }
	public allowed(req: IAllowedRequest): Promise<IAllowedResponse> { throw new Error("not implemented"); }
	public kick(req: IKickRequest): Promise<boolean> { throw new Error("not implemented"); }
	public async list(req: IListRequest): Promise<IListResponse> {
		const listReq: IRequestWithBody<IListRequest> = {
			janus: "message",
			body: req
		};

		const list = await this._transport.request<IPluginDataResponse<IVideoRoomResponse<IListResponse>>>(listReq, this._session, this._handle)
		this._logger.debug(list);
		return list.plugindata.data;
	}
	public listparticipants(req: IListParticipantsRequest): Promise<IListParticipantsResponse> { throw new Error("not implemented"); }

	public join_publisher(req: IJoinPublisherRequest): Promise<IJoinPublisherResponse> { throw new Error("not implemented"); }
	public publish(req: IPublishRequest): Promise<boolean> { throw new Error("not implemented"); }
	public unpublish() {
		// nop
	}
	public configure(req: IConfigureRequest): Promise<boolean> { throw new Error("not implemented"); }
	public rtp_forward(req: IRTPForwardRequest): Promise<IRTPForwardResponse> { throw new Error("not implemented"); }
	public stop_rtp_forward(req: IStopRTPForwardRequest): Promise<IStopRTPForwardResponse> { throw new Error("not implemented"); }
	public listforwarders(req: IListForwardersRequest): Promise<IListForwardersResponse> { throw new Error("not implemented"); }
	public leave(): Promise<boolean> { throw new Error("not implemented"); }

	public join_subscriber(req: IJoinSubscriberRequest): Promise<IAttachedResponse> { throw new Error("not implemented"); }
	public start(): Promise<boolean> { throw new Error("not implemented"); }
	public pause(): Promise<boolean> { throw new Error("not implemented"); }
	// public configure(){}
	public switch(req: ISwitchRequest): Promise<ISwitchResponse> { throw new Error("not implemented"); }
	// public leave(){}

	public onJoining(cb: (room: number, id: number, display: string) => void) {
		// register in event emitter
		/*
          "videoroom" : "event",
            "room" : <room ID>,
            "joining" : {
                    "id" : <unique ID of the new participant>,
                    "display" : "<display name of the new participant, if any>"
            }

        */
	}

	public onPublish(cb: (room: number, publishers: IPublisher[]) => void) {
		// register in event emitter
	}
}