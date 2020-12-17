var AWS = require('aws-sdk');
var mysql2 = require('mysql2/promise');

exports.handler = (event) => {
	console.log(event)
	const adList = event.Records[0].body;
	if(typeof adList == 'undefined' || adList.length <= 0){
		console.log("*** return here")
		return;
	}
	insertAdsToStorage(JSON.parse(adList));
}

async function insertAdsToStorage(adList){
	console.log("*** adlist: ", adList)
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
	adList.forEach(ad => {
		try {
			const sql_query = 
			"insert into Ads (AdNo, Title, SubscriptionId, ImageUrl, Price, CreatedDate, LastModifiedDate) " +
			`values ("${ad.AdNo}", "${ad.AdTtitle}", ${ad.SubscriptionId}, "${ad.ImageUrl}", ${ad.Price}, `+
			`"${new Date().toISOString()}", "${new Date().toISOString()}");`
			connection.execute(sql_query);
		} catch(err) {
			console.error('error running query - ', err);
		}
	});
	return await connection.end();
}
