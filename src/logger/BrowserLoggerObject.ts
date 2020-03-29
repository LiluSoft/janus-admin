// tslint:disable-next-line:only-arrow-functions
export const  browserLoggerObject = function() {
	// NOP
};
// tslint:disable-next-line:only-arrow-functions
browserLoggerObject.toString = function(){
	return `${(new Date()).toISOString()}`;
};
