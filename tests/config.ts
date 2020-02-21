export const config = {
	admin: {
		ws: {
			url: 'ws://192.168.99.100:7188'
		},
		mqtt: {
			url: "tcp://192.168.99.100:1883",
			credentials: {
				username: "guest",
				password: "guest"
			},
			from_queue: "from-janus-admin/#",
			to_queue: "to-janus-admin"
		},
		amqp: {
			connect: {
				hostname: "192.168.99.100",
				username: "guest",
				password: "guest"
			},
			from_queue: "from-janus",
			to_queue: "to-janus"
		},
		http: {
			url: "http://192.168.99.100:7088/admin",
			admin_secret: "janusoverlord"
		}
	},
	events: {
		mqtt: {
			url: "tcp://192.168.99.100:1883",
			credentials: {
				username: "guest",
				password: "guest"
			},
			from_queue: "janus-test-events/#",
			to_queue: "janus-test-events"
		},
		amqp: {
			connect: {
				hostname: "192.168.99.100",
				username: "guest",
				password: "guest"
			},
			from_queue: "janus-test-events",
			to_queue: "janus-test-events"
		}
	}


};