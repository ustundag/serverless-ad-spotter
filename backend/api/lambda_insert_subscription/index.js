var AWS = require('aws-sdk');
var mysql2 = require('mysql2/promise');

exports.handler = (event) => {
	const body = event.Records[0].body;

	console.log(`event.body ->`)
	console.log(`${JSON.stringify(body)}`)

	if(typeof body == 'undefined' || body == "{}"){
		console.log("*** return here")
		return;
	}
	insertToStorage(JSON.parse(body));
}

async function insertToStorage(sbs){
	const connectionConfig = {
		host: process.env['envEndpoint'],
		port: parseInt(process.env['envPort'], 10),
		user: process.env['envUser'],
		database: process.env['envDatabase'],
        password: process.env['envPassword']
	};
    let connection;
	try {
		connection = await mysql2.createConnection(connectionConfig);
	} catch(err) {
		console.error('Error connecting to the database - ', err);
	}
	try {
		const sql_query = 
		"insert into Subscription (Title, UserId, Hostname, Url, NotificationType, PollPeriod, CreatedDate, LastModifiedDate) " +
		`values ("${sbs.Title}", ${sbs.UserId}, "${sbs.Hostname}", "${sbs.Url}", ${sbs.NotificationType}, ${sbs.PollPeriod}, `+
		`"${new Date().toISOString()}", "${new Date().toISOString()}");`
		connection.execute(sql_query);
	} catch(err) {
		console.error('error running query - ', err);
	}
	return await connection.end();
}
