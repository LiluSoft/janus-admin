// destroy can be used to destroy an existing video room, whether created dynamically or statically, and has to be formatted as follows:
export interface IDestroyRequest {
	"request": "destroy";
	/**
	 * unique numeric ID of the room to destroy
	 */
	"room": number;
	/**
	 * room secret, mandatory if configured
	 */
	"secret": string;
	/**
	 * true|false, whether the room should be also removed from the config file, default false
	 */
	"permanent": boolean;
}