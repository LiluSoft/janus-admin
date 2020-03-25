export function BrowserLoggerObject() {
	function toString() {
		return `${(new Date()).toISOString()}`;
	}

	return {
		toString,
		valueOf: toString
	};
}
