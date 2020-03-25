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
import { IAttachedEvent } from "./models/events/IAttachedEvent";
import { ISwitchRequest } from "./models/ISwitchRequest";
import { ISwitchedEvent } from "./models/events/ISwitchEvent";
import { IListParticipantsResponse } from "./models/IListParticipantsResponse";
import { ITransport } from "../../transports/ITransport";
import { IRequest } from "../../transports/IRequest";
import { IResponse } from "../../transports/IResponse";
import { PluginHandle } from "../../abstractions/PluginHandle";
import { IPluginDataResponse } from "../../abstractions/IPluginDataResponse";
import { IVideoRoomResponse } from "./models/IVideoRoomResponse";
import { IVideoRoomError } from "./models/IVideoRoomError";
import { JanusSession } from "../../abstractions/JanusSession";

import { IRequestWithBody } from "../../transports/IRequestWithBody";
import { JanusClient } from "../../client/JanusClient";
import { IRequestWithToken } from "../../transports/index_server";
import { ISuccessResponse } from ".";
import { IEventData } from "../../transports/IEventData";
import { IConfigured, IUnpublishRequest } from "./models";
import { IUnpublishResponse } from "./models/IUnpublishResponse";
import { IAudioLevelEvent } from "./models/events/IAudioLevelEvent";
import { EventEmitter } from "events";
import { ILeavingEvent } from "./models/events/ILeavingEvent";
import { IUnpublishedEvent } from "./models/events/ILurkingEvent";
import { IVideoRoomEvent } from "./models/events/IVideoRoomEvent";
import { IStartedEvent } from "./models/events/IStartedEvent";
import { IPausedEvent } from "./models/events/IPausedEvent";
import { ILeftEvent } from "./models/events/ILeftEvent";
import { ILogger } from "../../logger/ILogger";
import { ILoggerFactory } from "../../logger/index_server";
import { IJoinedEvent } from "./models/events/IJoinedEvent";
import { IPublishersEvent } from "./models/events/IPublishersEvent";
import { IJSEPEvent } from "./models/events/IJSEPEvent";
import { ITemporalSubstreamEvent } from "./models/events/ITemporalSubstreamEvent";
import { ITrickleRequest } from "../../client/models/ITrickleRequest";
import { IJoinSubscriberResponse } from "./models/IJoinSubscriberResponse";
import { IStartRequest } from "./models/IStartRequest";
import { IStartResponse } from "./models/IStartResponse";

/**
 * VideoRoom SFU Plugin
 *
 * @export
 * @class VideoRoomPlugin
 */
export class VideoRoomPlugin {
	private _logger: ILogger;
	private _eventEmitter = new EventEmitter();

	private _unregister_callback: (() => void) | undefined;

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
		if (!session) {
			session = await client.CreateSession();
		}
		const handle = await client.CreateHandle(session, "janus.plugin.videoroom");

		const plugin = new VideoRoomPlugin(client.loggerFactory, client, session, handle);


		if (plugin._unregister_callback) {
			plugin._logger.trace("Unregister existing plugin events listener");
			plugin._unregister_callback();
			plugin._unregister_callback = undefined;
		}
		plugin._logger.trace("Registering plugin events listener");
		plugin._unregister_callback = client.transport.subscribe_plugin_events((event) => {
			plugin.handle_event(event as IEventData<unknown>);
		}, session);

		return plugin;
	}

	private emitEvent(event: string | symbol, ...args: any[]) {
		// should be emitted in the next cycle to allow subscribers to complete
		setTimeout(() => {
			if (this._eventEmitter.listenerCount(event) > 0) {
				this._logger.trace("raising event", event, ...args);
				this._eventEmitter.emit(event, ...args);
			} else {
				this._logger.trace("no listeners to", event, ...args);
			}
		}, 0);
	}

	private handle_event<T>(event: IEventData<T | IAudioLevelEvent | ILeavingEvent | IStartedEvent | IPausedEvent | ISwitchedEvent | ILeftEvent | IJoinedEvent>) {
		if (event.session_id !== this.session.session_id) {
			this._logger.trace("Incoming Event", event.session_id, "not for this session", this.session.session_id);
			return;
		}
		this._logger.trace("Incoming Event", event);
		const videoroom_event = (event.plugindata && event.plugindata.data) ? (event.plugindata.data as IVideoRoomEvent).videoroom : undefined;
		switch (videoroom_event) {
			case "talking":
				this.emitEvent("audiolevel_event", event);
				break;
			case "stopped-talking":
				this.emitEvent("audiolevel_event", event);
				break;
			case "attached":
				this.emitEvent("attached", event);
				break;
			case "joined":
				this.emitEvent("joined", event);
				break;
			case "destroyed":
				this.emitEvent("destroyed", event);
				break;
		}

		if (event.plugindata) {



			const leaving_event = (event.plugindata.data) ? (event.plugindata.data as ILeavingEvent).leaving : undefined;
			if (leaving_event) {
				this.emitEvent("leaving", event);
			}

			const unpublished_event = (event.plugindata.data) ? (event.plugindata.data as IUnpublishedEvent).unpublished : undefined;
			if (unpublished_event) {
				this.emitEvent("unpublished", event);
			}

			const started_event = (event.plugindata.data) ? (event.plugindata.data as IStartedEvent).started : undefined;
			if (started_event) {
				this.emitEvent("started", event);
			}

			const paused_event = (event.plugindata.data) ? (event.plugindata.data as IPausedEvent).paused : undefined;
			if (paused_event) {
				this.emitEvent("paused", event);
			}

			const switched_event = (event.plugindata.data) ? (event.plugindata.data as ISwitchedEvent).switched : undefined;
			if (switched_event) {
				this.emitEvent("switched", event);
			}

			const left_event = (event.plugindata.data) ? (event.plugindata.data as ILeftEvent).left : undefined;
			if (left_event) {
				this.emitEvent("left", event);
			}

			const publishers_event = (event.plugindata.data) ? (event.plugindata.data as IPublishersEvent).publishers : undefined;
			if (publishers_event) {
				this.emitEvent("publishers", event);
			}

			const substream_event = (event.plugindata.data) ? (event.plugindata.data as ITemporalSubstreamEvent).substream : undefined;
			const temporal_event = (event.plugindata.data) ? (event.plugindata.data as ITemporalSubstreamEvent).temporal : undefined;
			if (temporal_event || substream_event) {
				this.emitEvent("temporal_substream", event);
			}

		}

		const jsep_event = (event.jsep) ? (event.jsep) : undefined;
		if (jsep_event) {

			this.emitEvent("jsep", event);
		}
	}

	/**
	 * Cleanup VideoRoomPlugin
	 */
	public async dispose() {
		if (this._unregister_callback) {
			this._unregister_callback();
			this._unregister_callback = undefined;
		}
		const destroyedHandle = await this._client.DetachHandle(this.handle);
		const destroyedSession = await this._client.DestroySession(this.session);
		this._logger.debug("destroyed", destroyedHandle, destroyedSession);
	}

	/**
	 * Create a new VideoRoomPlugin
	 *
	 * @param _transport transport to use
	 * @param _client janus client to use
	 * @param session janus session to use
	 * @param handle  plugin handle to use
	 */
	private constructor(private _loggerFactory: ILoggerFactory, private _client: JanusClient, public readonly session: JanusSession, public readonly handle: PluginHandle) {
		this._logger = _loggerFactory.create("VideoRoom");
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
		this._logger.trace("create", req);

		const created_result = await this._client.message<IVideoRoomResponse<ICreatedResponse>>(this.handle, req);
		this._logger.debug("created",req, created_result);
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
		this._logger.trace("edit", req);

		const edit_result = await this._client.message<IVideoRoomResponse<IEditedResponse>>(this.handle, req);
		this._logger.debug("edited", req, edit_result);

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
		this._logger.trace("destroy", req);

		const destroy_result = await this._client.message<IVideoRoomResponse<IDestroyedResponse>>(this.handle, req);
		this._logger.debug("destroyed", req, destroy_result);

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
		this._logger.trace("exists", req);

		const exists_result = await this._client.message<IVideoRoomResponse<IExistsResponse>>(this.handle, req);
		this._logger.debug("exists", req, exists_result);

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
		this._logger.trace("allowed", req);

		const exists_result = await this._client.message<IVideoRoomResponse<IAllowedResponse>>(this.handle, req);
		this._logger.debug("allowed", req, exists_result);

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
		this._logger.trace("kick", req);

		const kick_result = await this._client.message<IVideoRoomResponse<ISuccessResponse>>(this.handle, req);

		this._logger.debug("kick", req, kick_result);

		return kick_result.plugindata.data;
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
		this._logger.trace("list", req);

		const list = await this._client.message<IVideoRoomResponse<IListResponse>>(this.handle, req);
		this._logger.debug("list", list);
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
		this._logger.trace("listparticipants", req);

		const list = await this._client.message<IVideoRoomResponse<IListParticipantsResponse>>(this.handle, req);
		this._logger.debug("listparticipants", req, list);
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
		this._logger.trace("join/publisher", req);

		const publisher_result = await this._client.message<IVideoRoomResponse<IJoinPublisherResponse>>(this.handle, req);
		this._logger.debug("join/publisher", req, publisher_result);
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
	 * @param req publish object
	 * @param jsep jsep offer
	 */
	public async publish(req: IPublishRequest, jsep?: any): Promise<IConfigured> {
		this._logger.trace("publish", req);

		const publish_result = await this._client.message<IVideoRoomResponse<IConfigured>>(this.handle, req, jsep);
		this._logger.debug("publish", req, publish_result);
		return publish_result.plugindata.data;
	}
	/**
	 * stop publishing and tear down the related PeerConnection
	 *
	 * @returns {Promise<boolean>}
	 * @memberof VideoRoomPlugin
	 */
	public async unpublish(): Promise<boolean> {
		this._logger.trace("unpublish");

		const unpublish_result = await this._client.message<IVideoRoomResponse<IUnpublishResponse>>(this.handle, {
			request: "unpublish"
		});

		this._logger.debug("unpublish", unpublish_result);
		return unpublish_result.plugindata.data.unpublished === "ok";
	}


	/**
	 * tweak some of the properties of an active publisher session
	 *
	 * @param {IConfigureRequest} req
	 * @returns {Promise<boolean>}
	 * @memberof VideoRoomPlugin
	 *
	 * ```TypeScript
	 * const janusClient = new JanusClient(...);
	 * const videoPlugin = await VideoRoomPlugin.attach(janusClient);
	 * const allowed_result = await videoPlugin.configure({
	 * 		request: "configure",
	 * 		audio:true
	 * });
	 * ```
	 */
	public async configure(req: IConfigureRequest, jsep?: RTCSessionDescriptionInit): Promise<boolean> {
		this._logger.trace("configure", req, jsep);

		const configure_result = await this._client.message<IVideoRoomResponse<IConfigured>>(this.handle, req, jsep);

		this._logger.debug("configure", req, jsep, configure_result);

		return configure_result.plugindata.data.configured === "ok";
	}


	/**
	 * configuring the room to request the ssrc-audio-level RTP extension, ad-hoc
	 * events might be sent to all publishers if audiolevel_event is set to true
	 *
	 * @param {(event: IEventData<IAudioLevelEvent>) => void} handler
	 * @memberof VideoRoomPlugin
	 */
	public on_audiolevel_event(handler: (event: IEventData<IAudioLevelEvent>) => void) {
		this._logger.trace("registering on_audiolevel_event", handler);
		this._eventEmitter.on("audiolevel_event", handler);
	}

	/**
	 * forwards in real-time the media sent by a publisher via RTP (plain or encrypted) to a remote backend
	 *
	 * in case you configured an admin_key property and extended it to RTP forwarding as
	 * well, you'll need to provide it in the request as well or it will be rejected as unauthorized.
	 * By default no limitation is posed on rtp_forward
	 *
	 * @param {IRTPForwardRequest} req
	 * @returns {Promise<IRTPForwardResponse>}
	 * @memberof VideoRoomPlugin
	 */
	public async rtp_forward(req: IRTPForwardRequest): Promise<IRTPForwardResponse> {
		this._logger.trace("rtp_forward",req);

		const rtp_forward_result = await this._client.message<IVideoRoomResponse<IRTPForwardResponse>>(this.handle, req);
		this._logger.debug("rtp_forward", req,rtp_forward_result);
		return rtp_forward_result.plugindata.data;
	}

	/**
	 * stops a previously created RTP forwarder
	 *
	 * @param {IStopRTPForwardRequest} req
	 * @returns {Promise<IStopRTPForwardResponse>}
	 * @memberof VideoRoomPlugin
	 */
	public async stop_rtp_forward(req: IStopRTPForwardRequest): Promise<IStopRTPForwardResponse> {
		this._logger.trace("stop_rtp_forward");

		const stop_rtp_result = await this._client.message<IVideoRoomResponse<IStopRTPForwardResponse>>(this.handle, req);
		this._logger.debug("stop_rtp_forward", req, stop_rtp_result);
		return stop_rtp_result.plugindata.data;
	}


	/**
	 * list of all the forwarders in a specific room
	 *
	 * @param {IListForwardersRequest} req
	 * @returns {Promise<IListForwardersResponse>}
	 * @memberof VideoRoomPlugin
	 */
	public async listforwarders(req: IListForwardersRequest): Promise<IListForwardersResponse> {
		this._logger.trace("listforwarders", req);

		const listforwarders_result = await this._client.message<IVideoRoomResponse<IListForwardersResponse>>(this.handle, req);
		this._logger.debug("listforwarders", req, listforwarders_result);
		return listforwarders_result.plugindata.data;
	}

	/**
	 * leave a room you previously joined as publisher
	 *
	 * @returns {Promise<boolean>}
	 * @memberof VideoRoomPlugin
	 */
	public async leave(): Promise<void> {
		this._logger.trace("leave");

		const req = {
			request: "leave"
		};

		const leave_result = await this._client.message<IVideoRoomResponse<void>>(this.handle, req);
		console.log(leave_result);
		// return leave_result.plugindata.;
		// throw new Error("not implemented");
	}

	/**
	 * Other participants will receive an event if its a lurking member leaves
	 *
	 * @param {(event: IEventData<ILeavingEvent>) => void} handler
	 * @memberof VideoRoomPlugin
	 */
	public on_leaving(handler: (event: IEventData<ILeavingEvent>) => void) {
		this._logger.trace("registering leaving", handler);
		this._eventEmitter.on("leaving", handler);
	}

	/**
	 * Other participants will receive an event if its an active publisher
	 *
	 * @param {(event: IEventData<IUnpublishedEvent>) => void} handler
	 * @memberof VideoRoomPlugin
	 */
	public on_unpublished(handler: (event: IEventData<IUnpublishedEvent>) => void) {
		this._logger.trace("registering unpublished", handler);
		this._eventEmitter.on("unpublished", handler);
	}


	public async join_subscriber(req: IJoinSubscriberRequest): Promise<IJoinSubscriberResponse> {
		this._logger.trace("join_subscriber", req);

		const join_subscriber_result = await this._client.message<IVideoRoomResponse<IJoinSubscriberResponse>>(this.handle, req);
		this._logger.debug("join_subscriber",req, join_subscriber_result);
		return join_subscriber_result.plugindata.data;
	}

	/**
	 * if successful join_subscriber it will generate a new JSEP SDP offer, which will accompany an attached event
	 *
	 * @param {(event: IEventData<IAttachedEvent>) => void} handler
	 * @memberof VideoRoomPlugin
	 */
	public on_attached(handler: (event: IEventData<IAttachedEvent>) => void) {
		this._logger.trace("registering attached", handler);
		this._eventEmitter.on("attached", handler);
	}


	/**
	 * to complete the setup of the PeerConnection the subscriber is supposed
	 * to send a JSEP SDP answer back to the plugin. This is done by means of a start
	 * request, which in this case MUST be associated with a JSEP SDP answer
	 *
	 * @template T
	 * @param {T} jsep
	 * @returns {Promise<void>}
	 * @memberof VideoRoomPlugin
	 */
	public async start<T>(jsep: T): Promise<boolean> {
		this._logger.trace("start", jsep);

		const req :IStartRequest= {
			request: "start"
		};

		const start_result = await this._client.message<IVideoRoomResponse<IStartResponse>>(this.handle, req, jsep);
		this._logger.debug("start", jsep, start_result);
		return start_result.plugindata.data.started === "ok";
	}

	/**
	 * trickle candidates
	 *
	 * a message is related to a specific PeerConnection, it will need to be addressed to the right Handle
	 *
	 * @param {ITrickleRequest} req
	 * @param {JanusSession} session
	 * @returns
	 */
	public async trickle(req: ITrickleRequest) {
		this._logger.trace("trickle", req);
		return await this._client.trickle(req, this.handle);
	}

	/**
	 * of a start request is successful a started event is received
	 * As soon as that happens, the Streaming plugin can start relaying media from the
	 * mountpoint the viewer subscribed to to the viewer themselves.
	 *
	 * @param {(event:IEventData<IStartedEvent>)=>void} handler
	 * @memberof VideoRoomPlugin
	 */
	public on_started(handler: (event: IEventData<IStartedEvent>) => void) {
		this._logger.trace("registering started", handler);
		this._eventEmitter.on("started", handler);
	}

	/**
	 * As a subscriber, you can temporarily pause and resume the whole media
	 * delivery with a pause and, again, start request
	 * (in this case without any JSEP SDP answer attached)
	 *
	 * @returns {Promise<void>}
	 * @memberof VideoRoomPlugin
	 */
	public async pause(): Promise<void> {
		this._logger.trace("pause");

		const req = {
			request: "pause"
		};

		const pause_result = await this._client.message<IVideoRoomResponse<void>>(this.handle, req);
		console.log(pause_result);
		// return start_result.plugindata.data;
	}

	/**
	 * paused event
	 *
	 * @param {(event:IEventData<IPausedEvent>)=>void} handler
	 * @memberof VideoRoomPlugin
	 */
	public on_paused(handler: (event: IEventData<IPausedEvent>) => void) {
		this._logger.trace("registering paused", handler);
		this._eventEmitter.on("paused", handler);
	}



	/**
	 * publisher "switching".
	 *  when subscribed to a specific publisher and receiving media from them, you can at any time
	 * "switch" to a different publisher, and as such start receiving media from
	 * that other mountpoint instead. Think of it as changing channel on a TV: you
	 * keep on using the same PeerConnection, the plugin simply changes the source of
	 * the media transparently. Of course, while powerful and effective this request
	 * has some limitations. First of all, it switches both audio and video, meaning
	 * you can't just switch video and keep the audio from the previous publisher, for
	 * instance; besides, the two publishers must have the same media configuration, that is,
	 * use the same codecs, the same payload types, etc. In fact, since the same PeerConnection
	 * is used for this feature, switching to a publisher with a different configuration might
	 * result in media incompatible with the PeerConnection setup being relayed to the subscriber,
	 * and as such in no audio/video being played
	 *
	 * @param {ISwitchRequest} req
	 * @returns {Promise<ISwitchResponse>}
	 * @memberof VideoRoomPlugin
	 */
	public async switch(req: ISwitchRequest): Promise<void> {
		this._logger.trace("switch",req);

		const pause_result = await this._client.message<IVideoRoomResponse<void>>(this.handle, req);
		console.log(pause_result);
	}

	/**
	 * unsubscribed from the previous publisher, and subscribed to the new publisher instead.
	 * The event to confirm the switch was successful
	 *
	 * @param {(event: IEventData<ISwitchedEvent>) => void} handler
	 * @memberof VideoRoomPlugin
	 */
	public on_switched(handler: (event: IEventData<ISwitchedEvent>) => void) {
		this._logger.trace("registering switched", handler);
		this._eventEmitter.on("switched", handler);
	}

	/**
	 * If leave request is successful, the plugin will attempt to tear down the PeerConnection, and will send back a left event
	 *
	 * @param {(event: IEventData<ILeftEvent>)=>void} handler
	 * @memberof VideoRoomPlugin
	 */
	public on_left(handler: (event: IEventData<ILeftEvent>) => void) {
		this._logger.trace("registering left", handler);
		this._eventEmitter.on("left", handler);
	}

	public on_joined(handler: (event: IEventData<IJoinedEvent>) => void) {
		this._logger.trace("registering joined", handler);
		this._eventEmitter.on("joined", handler);
	}

	public on_destroyed(handler: () => void) {
		this._logger.trace("registering destroyed", handler);
		this._eventEmitter.on("destroyed", handler);
	}

	public on_publishers(handler: (event: IEventData<IPublishersEvent>) => void) {
		this._logger.trace("registering publishers", handler);
		this._eventEmitter.on("publishers", handler);
	}

	public on_jsep(handler: (event: IEventData<IPublisher>) => void) {
		this._logger.trace("registering jsep", handler);
		this._eventEmitter.on("jsep", handler);
	}

	public on_temporal_substream(handler: (event: IEventData<ITemporalSubstreamEvent>) => void) {
		this._logger.trace("registering temporal_substream", handler);
		this._eventEmitter.on("temporal_substream", handler);
	}


}