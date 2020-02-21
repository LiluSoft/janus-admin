export class VideoRoomError extends Error {
	constructor(private code: number, private reason: string) {
		super(reason);
	}
}