
// You can configure whether to check tokens or add/remove people who
// can join a room using the allowed request, which has to be formatted as follows:
export interface IAllowedRequest {
	"request": "allowed",
	/**
	 * room secret, mandatory if configured
	 */
	"secret": string;
	"action": "enable" | "disable" | "add" | "remove";
	/**
	 * unique numeric ID of the room to update
	 */
	"room": number;
	/**
	 * Array of strings (tokens users might pass in "join", only for add|remove)
	 */
	"allowed": string[];
}