var AWS = require('aws-sdk');
var mysql2 = require('mysql2/promise');

exports.handler = async (event, context, callback) => {
	const body = JSON.parse(event.body);
	const countKeysInUserObject = Object.keys(body).length;

	if(typeof body == 'undefined' || countKeysInUserObject != 3){
		const response = getResponse(400, "Gönderilen bilgiler eksik ya da uygun değil. Lütfen bir süre sonra tekrar deneyiniz.", -1)
		return callback(null, response);
	}
	const response = await insertToStorage(body);
	return callback(null, response);
}

async function insertToStorage(user){
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
	} catch(error) {
		console.error('Error connecting to the database - ', error);
		return getResponse(500, "Bir hatayla karşılaştık. Lütfen bir süre sonra tekrar deneyiniz.", -1)
	}

	let response = {}
	try {
		const sql_query = `insert into User (Name, Email, Phone, CreatedDate, LastModifiedDate) VALUES (?,?,?,?,?)`
		const inputs = [user.Name, user.Email, user.Phone, new Date().toISOString(), new Date().toISOString()]
		const callback = function (results) { return results; }
		const results = await connection.execute(sql_query, inputs, callback);
		userId = results[0].insertId;
		response = getResponse(200, "Kullanıcı sisteme başarıyla eklendi.", results[0].insertId)
	} catch(error) {
		console.error('Error connecting to the database - ', error);
		response = getResponse(500, "Bir hatayla karşılaştık. Lütfen bir süre sonra tekrar deneyiniz.", -1)
	}

	// const [error, result, fields] = await connection.query(
	// 	'insert into User (Name, Email, Phone, CreatedDate, LastModifiedDate) VALUES (?,?,?,?,?)', 
	// 	[user.Name, user.Email, user.Phone, new Date().toISOString(), new Date().toISOString()],
	// 	async function (error, result, fields) {
	// 		return [error, result, fields];
	// });
		  
	await connection.end();
	return response
}

function getResponse(statusCode, message, userId){
	const body = {
		message: message,
		userId: userId
	}
	return {
		headers: {
			'Content-Type': 'application/json',
			'Access-Control-Allow-Origin' : '*',
			'Access-Control-Allow-Methods': '*'
		},
		statusCode: statusCode,
		body: JSON.stringify(body),
        isBase64Encoded: false
	}
}