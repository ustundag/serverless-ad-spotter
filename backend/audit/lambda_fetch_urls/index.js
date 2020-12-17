const AWS = require('aws-sdk');
var mysql2 = require('mysql2/promise');

exports.handler = (event) => {
	//var event = "2020-10-04T12:49:50Z" // coming from EventBridge.
	//var event = "2020-10-10T08:33:00";
	var pollPeriods = [1,2,3];
	//var pollPeriods = getEligiblePollPeriods(event);
	if(pollPeriods == -1){ return; }
	fetch_URLs(pollPeriods).then((urlList) => {
		send_SNS(urlList);
	});
};

async function fetch_URLs(pollPeriods){
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
		const sql_query = `
			SELECT u.Name, u.Email, u.Phone, s.Id, s.Title, s.Url, s.Hostname, s.NotificationType
			FROM User u INNER JOIN Subscription s on u.Id = s.UserId
			WHERE s.PollPeriod IN (${pollPeriods.toString()})`
		const [rows, fields] = await connection.execute(sql_query);
		result = rows;
	} catch(err) {
		console.error('error running query - ', err);
		result = {};
	}
	await connection.end();
	return result;
}

async function send_SNS(urlList){
	const region = process.env['envRegion']
	AWS.config.update({
	    region: region
	});
	const topicArn = process.env['envSnsTopicDistributeHostname']
	// https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SNS.html
	var params = {
		TopicArn: topicArn,
		Message: "",
		MessageAttributes: {}
	};
	const sns = new AWS.SNS();
	await urlList.forEach(function(url) {
		params.Message = JSON.stringify(url);
		params.MessageAttributes = {'hostname': {DataType: "String", StringValue: `${url["Hostname"]}`}};
		sns.publish(params, function(err, data) {
			if (err) { console.log(err, err.stack); }
		});
	});
}

function getEligiblePollPeriods(event){
	var pollPeriods=[];
	var hour = new Date(event).getHours();
	if([7, 8].includes(hour)){
		pollPeriods = [1,2,3];
		console.log('Fetching URLs based on poll period - morning.');
	}
	else if([13, 14].includes(hour)){
		pollPeriods = [3];
		console.log('Fetching URLs based on poll period - noon.');
	}
	else if([19, 20].includes(hour)){
		pollPeriods = [2];
		console.log('Fetching URLs based on poll period - evening.');
	}
	else{
		pollPeriods = -1;
		console.log('Do nothing since current time is out of available periods.');
	}
	return pollPeriods;
}

