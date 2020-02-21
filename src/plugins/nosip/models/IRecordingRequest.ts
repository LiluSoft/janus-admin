export interface IRecordingRequest {
	"request": "recording";
	/**
	 * start|stop, depending on whether you want to start or stop recording something
	 */
	"action": string;
	/**
	 * true|false; whether or not our audio should be recorded
	 */
	"audio": boolean;
	/**
	 * true|false; whether or not our video should be recorded
	 */
	"video": boolean;
	/**
	 * true|false; whether or not our peer's audio should be recorded
	 */
	"peer_audio": boolean;
	/**
	 * true|false; whether or not our peer's video should be recorded
	 */
	"peer_video": boolean;
	/**
	 * base path/filename to use for all the recordings
	 */
	"filename": string;
}