
export interface IParticipant {
	/**
	 * unique numeric ID of the participant
	 */
	"id": number;
	/**
	 * display name of the participant, if any; optional
	 */
	"display": string;
	/**
	 * true|false, whether user is talking or not (only if audio levels are used)
	 */
	"talking": boolean;
	/**
	 * audio Synchronization Source (SSRC) used internally for this active publisher
	 */
	"internal_audio_ssrc": string;
	/**
	 * video Synchronization Source (SSRC) used internally for this active publisher
	 */
	"internal_video_ssrc": string;
}