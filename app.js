var express = require("express");
const sql = require('mssql')

var app = express();

const port = process.env.PORT || 4501;

//const DbConnectionString = 'mssql://{user-name}:{password}@{db-server-ip}:{sql-server-port}/{db-name}';
// const DbConnectionString = 'mssql://test:pass@localhost:1433/DbScott';

// const DbConnectionString = 'mssql://sam:1909Blackhawk!@23.242.54.169:1225/unclaimed_2014_ca';
const DbConnectionString = {
	user: 'sam',
	password: '1909Blackhawk!',
	server: '23.242.54.169',
	port: '1225',
	database: 'unclaimed_2014_ca',
	options: {
		tdsVersion: '7_1'
	}
};

// sql.on('error', err => {
// 	console.dir(err);
// 	sql.close();
// });

app.get("/name/:name", (req, res) => {
	var name = req.params.name;
	// var query = `SELECT top 300 Prop_id, Owner_name, Own_Code FROM Owners WHERE (Owner_name LIKE '%${name}%')`;
	var query = `select top 300 Prop_id, Owner_name, Own_Code from names`;
	sql.connect(DbConnectionString).then((pool) => {
		return pool.request()
		// .query(`SELECT top 2 Prop_id, Owner_name, Own_Code FROM Owners WHERE (Owner_name LIKE '%${name}%');`);
		.query(query);
	}).then((result) => {
		if(result.recordset[0].Owner_name === name) {
			return res.json(result.recordset);
		}
		var match = [];
		result.recordset.forEach((person) => {
			var i = person.Owner_name.split(" ");
			for(x in i) {
				if(i[x].toLowerCase() == name.toLowerCase()){
					match = match.concat(person);
				}
			}
		});
		if(!match === undefined || match === null || match.length === 0 ) {
			return res.send(`no results found against "${name}"!!`);
		}
		sql.close();
		return res.json(match);
	}).catch((error) => {
		console.dir(err);
		sql.close();
	});
});

app.get('/id/:id', (req, res) => {
	var id = req.params.id;
	var query = `SELECT Prop_id, Owner_name, Own_Code FROM Owners WHERE Prop_id ='${id}'`;
	sql.connect(DbConnectionString).then((pool) => {
		return pool.request()
		.query(query);
	}).then((result) => {
		sql.close();
		if(!result.recordset === undefined || result.recordset === null || result.recordset.length === 0 ) {
			return res.send(`no results found against "${id}"!!`);
		}
		sql.close();
		return res.json(result.recordset);
	}).catch((err) => {
		console.dir(err);
		sql.close();
	});
});

app.get('/addcomment/:id/:comment', (req, res) => {
	var id = req.params.id;
	var comment = req.params.comment;
	if(id === '0') {
		return res.send('id can not be zer0!!');
	}
	var query = `INSERT INTO comments (user_id, comments) VALUES ('${id}', '${comment}')`;
	sql.connect(DbConnectionString).then((pool) => {
		return pool.request()
		.query(query);
	}).then((result) => {
		sql.close();
		return res.send(`Comments added against user_id: ${id}`);
	}).catch((err) => {
		console.dir(err);
		sql.close();
	});
}) 

app.listen(port, function() {
	console.log(`node server listening at port : ${port}`);
});