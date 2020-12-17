const AWS = require('aws-sdk');
var mysql2 = require('mysql2/promise');

exports.handler = async (event) => {
	const event_main = event.Records[0].body;
	if(typeof event_main == 'undefined' || event_main == {}){
		console.log("*** undefined body. return.");
		return;
	}
	const body = JSON.parse(event_main);
	const adList = body.AdList;
	if(typeof adList == 'undefined' || adList.length <= 0){ return; }

	let diff = [];
	let result = await getAlreadyNotifiedOlderAdNos(body.Id);
	result = result.map(x => x.AdNo)
	diff = adList.filter(x => !result.includes(x.AdNo));

	if(typeof diff == 'undefined' || diff.length <= 0){ return; }
	const email_event = {
		Name: body.Name,
		Title: body.Title,
		Email: body.Email,
		Diff: diff
	};
	const sqs_queue_insert = process.env['envSqsInsertAds'];
	const sqs_queue_email  = process.env['envSqsNotifyDiff'];
	return await Promise.all([
      sqsSendMessage(sqs_queue_insert, diff),
      sqsSendMessage(sqs_queue_email, email_event)
    ])
	.then(x=>{return;});
}

async function getAlreadyNotifiedOlderAdNos(subscriptionId){
	const connectionConfig = {
		host: process.env['envEndpoint'],
		port: parseInt(process.env['envPort'], 10),
		user: process.env['envUser'],
		database: process.env['envDatabase'],
        password: process.env['envPassword']
	};
	let result = {};
    let connection;
	try {
		connection = await mysql2.createConnection(connectionConfig);
	} catch(err) {
		console.error('Error connecting to the database - ', err);
		result = {};
	}
	try {
		const sql_query = `SELECT AdNo FROM Ads WHERE SubscriptionId=${subscriptionId}`
		const [rows, fields] = await connection.execute(sql_query);
		result = rows;
	} catch(err) {
		console.error('error running query - ', err);
		result = {};
	}
	await connection.end();
	return result;
}

async function sqsSendMessage(queueUrl, event){
	const AWS_ACCESS_KEY_ID = process.env['envAccessKeyId']
	const AWS_SECRET_ACCESS_KEY = process.env['envSecretAccessKey']
	const region = process.env['envRegion']
	AWS.config.update({
	    region: region,
	    accessKeyId: AWS_ACCESS_KEY_ID,
	    secretAccessKey: AWS_SECRET_ACCESS_KEY,
	});
    var params = {
  		MessageBody: JSON.stringify(event),
  		QueueUrl: queueUrl,
	};
	return await new AWS.SQS().sendMessage(params).promise();
}
