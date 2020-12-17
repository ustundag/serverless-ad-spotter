var AWS = require('aws-sdk');
var mysql2 = require('mysql2/promise');

exports.handler = (event) => {
	return deleteAdsFromStorage();
}

async function deleteAdsFromStorage(){
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
		connection.execute("DELETE FROM Ads");
	} catch(err) {
		console.error('error running query - ', err);
	}
	return await connection.end();
}
