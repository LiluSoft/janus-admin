import * as crypto from "crypto";

export function generate_random_number() {
	const randomBytes = crypto.randomBytes(8);
	return randomBytes.readUInt32LE(0);
}