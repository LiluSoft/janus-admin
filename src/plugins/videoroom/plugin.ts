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
import { JanusSession } from "../../abstractions/JanusSession";

import bunyan from "bunyan";
import { IRequestWithBody } from "../../transports/IRequestWithBody";
import { JanusClient } from "../../client/JanusClient";
import { IRequestWithToken } from "../../transports";
import { ISuccessResponse } from ".";
import { IEventData } from "../../transports/IEventData";
import { IConfigured } from "./models";

/**
 * VideoRoom SFU Plugin
 *
 * @export
 * @class VideoRoomPlugin
 */
export class VideoRoomPlugin {
	private _logger = bunyan.createLogger({ name: "VideoRoomPlugin" });

	/**
	 * Attach a new VideoRoomPlugin to Janus Client
	 *
	 * @static
	 * @param {JanusClient} client JanusClient to create a video room plugin from
	 * @param {JanusSession} session optional  Janus Session to use, otherwise create a new session
	 * @returns {Promise<VideoRoomPlugin>}
	 * @memberof VideoRoomPlugin
	 */
	public static async attach(client: JanusClient, session?: JanusSession): Promise<VideoRoomPlugin> {
		const logger = bunyan.createLogger({ name: "VideoRoomPlugin" });

		if (!session) {
			session = await client.CreateSession();
			logger.debug("got session", session);
		}
		const handle = await client.CreateHandle(session, "janus.plugin.videoroom");

		const plugin = new VideoRoomPlugin(client.transport, client, session, handle);
		client.transport.subscribe_plugin_events(session, plugin._handle_event);
		return plugin;
	}

	private _handle_event<T>(event: IEventData<T>) {
		console.log(event);
	}

	/**
	 * Cleanup VideoRoomPlugin
	 */
	public async dispose() {
		const destroyedHandle = await this._client.DetachHandle(this._handle);
		const destroyedSession = await this._client.DestroySession(this._session);
		this._logger.debug("destroyed", destroyedHandle, destroyedSession);
	}

	/**
	 * Create a new VideoRoomPlugin
	 *
	 * @param _transport transport to use
	 * @param _client janus client to use
	 * @param _session janus session to use
	 * @param _handle  plugin handle to use
	 */
	private constructor(private _transport: ITransport, private _client: JanusClient, private _session: JanusSession, private _handle: PluginHandle) {

	}

	/**
	 * Create a new Video Room
	 *
	 * @param req
	 *
	 * ```TypeScript
	 * const janusClient = new JanusClient(...);
	 * const videoPlugin = await VideoRoomPlugin.attach(janusClient);
	 * const create_result = await videoPlugin.create({
	 * 		request: "create",
	 * 		room: 1234,
	 * 		is_private: false
	 * });
	 * ```
	 */
	public async create(req: ICreateRequest): Promise<ICreatedResponse> {
		this._logger.debug("create", req);

		const create_request: IRequestWithBody<ICreateRequest> & IRequestWithToken = {
			janus: "message",
			body: req
		};

		if (this._client && this._client.token) {
			create_request.token = this._client.token;
		}

		const created_result = await this._transport.request<IPluginDataResponse<IVideoRoomResponse<ICreatedResponse>>>(create_request, this._session, this._handle);

		return created_result.plugindata.data;
	}


	/**
	 * Edit Video Room
	 *
	 * @param req
	 *
	 * ```TypeScript
	 * const janusClient = new JanusClient(...);
	 * const videoPlugin = await VideoRoomPlugin.attach(janusClient);
	 * const edit_result = await videoPlugin.edit({
	 * 		request: "edit",
	 * 		room: 1234,
	 * 		new_description: "new description"
	 * });
	 * ```
	 */
	public async edit(req: IEditRequest): Promise<IEditedResponse> {
		this._logger.debug("edit", req);

		const edit_request: IRequestWithBody<IEditRequest> & IRequestWithToken = {
			janus: "message",
			body: req
		};

		if (this._client && this._client.token) {
			edit_request.token = this._client.token;
		}

		const edit_result = await this._transport.request<IPluginDataResponse<IVideoRoomResponse<IEditedResponse>>>(edit_request, this._session, this._handle);

		return edit_result.plugindata.data;
	}


	/**
	 * Destroy a Video Room
	 *
	 * @param {IDestroyRequest} req
	 * @returns {Promise<IDestroyedResponse>}
	 * @memberof VideoRoomPlugin
	 *
	 * ```TypeScript
	 * const janusClient = new JanusClient(...);
	 * const videoPlugin = await VideoRoomPlugin.attach(janusClient);
	 * const destroy_result = await videoPlugin.destroy({
	 * 		request: "destroy",
	 * 		room: 1234
	 * });
	 * ```
	 */
	public async destroy(req: IDestroyRequest): Promise<IDestroyedResponse> {
		this._logger.debug("destroy", req);

		const destroy_request: IRequestWithBody<IDestroyRequest> & IRequestWithToken = {
			janus: "message",
			body: req
		};

		if (this._client && this._client.token) {
			destroy_request.token = this._client.token;
		}

		const destroy_result = await this._transport.request<IPluginDataResponse<IVideoRoomResponse<IDestroyedResponse>>>(destroy_request, this._session, this._handle);

		return destroy_result.plugindata.data;
	}


	/**
	 * Check if a Video Room Exists
	 *
	 * @param {IExistsRequest} req
	 * @returns {Promise<IExistsResponse>}
	 * @memberof VideoRoomPlugin
	 * ```TypeScript
	 * const janusClient = new JanusClient(...);
	 * const videoPlugin = await VideoRoomPlugin.attach(janusClient);
	 * const destroy_result = await videoPlugin.exists({
	 * 		request: "exists",
	 * 		room: 1234
	 * });
	 * ```
	 */
	public async exists(req: IExistsRequest): Promise<IExistsResponse> {
		this._logger.debug("exists", req);

		const exists_request: IRequestWithBody<IExistsRequest> & IRequestWithToken = {
			janus: "message",
			body: req
		};

		if (this._client && this._client.token) {
			exists_request.token = this._client.token;
		}

		const exists_result = await this._transport.request<IPluginDataResponse<IVideoRoomResponse<IExistsResponse>>>(exists_request, this._session, this._handle);

		return exists_result.plugindata.data;
	}


	/**
	 * Sets Permissions on existing room
	 *
	 * where action can be enable/disable token checking or add/remove tokens
	 *
	 * @param req
	 *
	 * ```TypeScript
	 * const janusClient = new JanusClient(...);
	 * const videoPlugin = await VideoRoomPlugin.attach(janusClient);
	 * const allowed_result = await videoPlugin.allowed({
	 * 		request: "allowed",
	 * 		room: 1234,
	 * 		action: "disable"
	 * });
	 * ```
	 */
	public async allowed(req: IAllowedRequest): Promise<IAllowedResponse> {
		this._logger.debug("allowed", req);

		const allowed_request: IRequestWithBody<IAllowedRequest> & IRequestWithToken = {
			janus: "message",
			body: req
		};

		if (this._client && this._client.token) {
			allowed_request.token = this._client.token;
		}

		const exists_result = await this._transport.request<IPluginDataResponse<IVideoRoomResponse<IAllowedResponse>>>(allowed_request, this._session, this._handle);

		return exists_result.plugindata.data;
	}


	/**
	 * kick participants using the kick request. Notice that this only kicks the user out of the
	 * room, but does not prevent them from re-joining: to ban them, you need to first remove
	 * them from the list of authorized users (see allowed request) and then kick them
	 *
	 * @param {IKickRequest} req
	 * @returns {Promise<ISuccessResponse>}
	 * @memberof VideoRoomPlugin
	 *
	 * ```TypeScript
	 * const janusClient = new JanusClient(...);
	 * const videoPlugin = await VideoRoomPlugin.attach(janusClient);
	 * const allowed_result = await videoPlugin.kick({
	 * 		request: "kick",
	 * 		room: 1234,
	 * 		id: participant
	 * });
	 * ```
	 */
	public async kick(req: IKickRequest): Promise<ISuccessResponse> {
		this._logger.debug("kick", req);

		const allowed_request: IRequestWithBody<IKickRequest> & IRequestWithToken = {
			janus: "message",
			body: req
		};

		if (this._client && this._client.token) {
			allowed_request.token = this._client.token;
		}

		const exists_result = await this._transport.request<IPluginDataResponse<IVideoRoomResponse<ISuccessResponse>>>(allowed_request, this._session, this._handle);

		return exists_result.plugindata.data;
	}

	/**
	 * Get a list of the available rooms (excluded those configured or created as private rooms)
	 *
	 * @param {IListRequest} req
	 * @returns {Promise<IListResponse>}
	 * @memberof VideoRoomPlugin
	 *
	 * ```TypeScript
	 * const janusClient = new JanusClient(...);
	 * const videoPlugin = await VideoRoomPlugin.attach(janusClient);
	 * const allowed_result = await videoPlugin.list({
	 * 		request: "list"
	 * });
	 * ```
	 */
	public async list(req: IListRequest): Promise<IListResponse> {
		this._logger.debug("list", req);

		const list_request: IRequestWithBody<IListRequest> & IRequestWithToken = {
			janus: "message",
			body: req
		};

		if (this._client && this._client.token) {
			list_request.token = this._client.token;
		}

		const list = await this._transport.request<IPluginDataResponse<IVideoRoomResponse<IListResponse>>>(list_request, this._session, this._handle);
		return list.plugindata.data;
	}

	/**
	 * Get a list of the participants in a specific room
	 *
	 * @param {IListParticipantsRequest} req
	 * @returns {Promise<IListParticipantsResponse>}
	 * @memberof VideoRoomPlugin
	 *
	 * ```TypeScript
	 * const janusClient = new JanusClient(...);
	 * const videoPlugin = await VideoRoomPlugin.attach(janusClient);
	 * const allowed_result = await videoPlugin.listparticipants({
	 * 		request: "listparticipants",
	 * 		room: 1234
	 * });
	 * ```
	 */
	public async listparticipants(req: IListParticipantsRequest): Promise<IListParticipantsResponse> {
		this._logger.debug("listparticipants", req);

		const list_participants: IRequestWithBody<IListParticipantsRequest> & IRequestWithToken = {
			janus: "message",
			body: req
		};

		if (this._client && this._client.token) {
			list_participants.token = this._client.token;
		}

		const list = await this._transport.request<IPluginDataResponse<IVideoRoomResponse<IListParticipantsResponse>>>(list_participants, this._session, this._handle);
		return list.plugindata.data;
	}


	/**
	 * publishers are those participant handles that are able (although may choose not to, more on this later)
	 * publish media in the room, and as such become feeds that you can subscribe to.
	 *
	 * @param {IJoinPublisherRequest} req
	 * @returns {Promise<IJoinPublisherResponse>}
	 * @memberof VideoRoomPlugin
	 *
	 * ```TypeScript
	 * const janusClient = new JanusClient(...);
	 * const videoPlugin = await VideoRoomPlugin.attach(janusClient);
	 * const allowed_result = await videoPlugin.join_publisher({
	 * 		request: "join",
	 * 		ptype: "publisher",
	 * 		room: 1234
	 * });
	 * ```
	 */
	public async join_publisher(req: IJoinPublisherRequest): Promise<IJoinPublisherResponse> {
		this._logger.debug("join/publisher", req);

		const list_request: IRequestWithBody<IJoinPublisherRequest> & IRequestWithToken = {
			janus: "message",
			body: req
		};

		if (this._client && this._client.token) {
			list_request.token = this._client.token;
		}

		const publisher_result = await this._transport.request<IPluginDataResponse<IVideoRoomResponse<IJoinPublisherResponse>>>(list_request, this._session, this._handle);
		return publisher_result.plugindata.data;
	}



	/**
	 * If you're interested in publishing media within a room, you can do that
	 * with a publish request. This request MUST be accompanied by a JSEP
	 * SDP offer to negotiate a new PeerConnection. The plugin will match it
	 * to the room configuration (e.g., to make sure the codecs you negotiated
	 * are allowed in the room), and will reply with a JSEP SDP answer to
	 * close the circle and complete the setup of the PeerConnection. As soon
	 * as the PeerConnection has been establisher, the publisher will become
	 * active, and a new active feed other participants can subscribe to.
	 *
	 * @param req
	 */
	public async publish(req: IPublishRequest): Promise<IConfigured> {
		this._logger.debug("publish", req);

		const list_request: IRequestWithBody<IPublishRequest> & IRequestWithToken = {
			janus: "message",
			body: req
		};

		if (this._client && this._client.token) {
			list_request.token = this._client.token;
		}

		const publish_result = await this._transport.request<IPluginDataResponse<IVideoRoomResponse<IConfigured>>>(list_request, this._session, this._handle);
		return publish_result.plugindata.data;
	}
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

	public join() {
		throw new Error("not implemented");
	}

	public joinandconfigure() {
		throw new Error("not implemented");
	}


}