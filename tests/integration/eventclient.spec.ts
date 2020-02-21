import { fail } from "assert";
import { expect } from "chai";
import "mocha";

import { MQTTEventClient } from "../../src";
import { AMQPEventClient } from "../../src";
import { waitfor } from "../timing";
import { IEventClient } from "../../src";

const eventClients: {
	name: string;
	subscribeClient: () => IEventClient;
	publishClient: () => IEventClient;
	subscribeQueueName: string;
	publishQueueName: string;
}[] = [
		{
			name: "MQTT",
			subscribeClient: () => new MQTTEventClient("tcp://192.168.99.100:1883", { username: "guest", password: "guest" }),
			publishClient: () => new MQTTEventClient("tcp://192.168.99.100:1883", { username: "guest", password: "guest" }),

			subscribeQueueName: "janus-test-events/#",
			publishQueueName: "janus-test-events"
		},
		{
			name: "AMQP",
			subscribeClient: () => new AMQPEventClient({ hostname: "192.168.99.100", username: "guest", password: "guest" }, { noDelay: true }),
			publishClient: () => new AMQPEventClient({ hostname: "192.168.99.100", username: "guest", password: "guest" }, { noDelay: true }),

			subscribeQueueName: "janus-test-events",
			publishQueueName: "janus-test-events"
		}
	];

for (const eventClient of eventClients) {

	describe(`${eventClient.name} client`, () => {

		it("should send a custom event", async () => {
			const subscriberClient = eventClient.subscribeClient();
			await subscriberClient.waitForReady();

			const messages: any[] = [];
			const result = await subscriberClient.subscribe(eventClient.subscribeQueueName, (incomingMessage) => {
				messages.push(incomingMessage);
			});

			const publisherClient = eventClient.publishClient();
			await publisherClient.waitForReady();
			const message = { hello: "world" };
			await publisherClient.publish(eventClient.publishQueueName, message);

			await waitfor(100);
			console.log(messages);

			expect(messages).to.deep.include(message);

			await publisherClient.dispose();
			await subscriberClient.dispose();

		});

	});
}