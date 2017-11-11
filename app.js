var express = require("express");
const sql = require('mssql');
const {SHA256} = require('crypto-js');
const validator = require('validator');

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
var salt = "some salt please!";

app.get('/signup/:userName/:email/:password', (req, res) => {
	sql.close();
	var user_name = req.params.userName;
	var email = req.params.email;
	var password = req.params.password;
	if(!validator.isEmail(email)){
		return res.send(`please enter a valid email!`);
	};
	var hash = SHA256(password+salt).toString();
	var query = `INSERT INTO users (user_name, email, password) VALUES ('${user_name}', '${email}', '${hash}')`;
	sql.connect(DbConnectionString).then((pool) => {
		return pool.request()
		.query(query);
	}).then((result) => {
		sql.close();
		return res.send(`'${user_name}' added successfully!!`);
	}).catch((err) => {
		console.dir(err);
		if(err.number === 2627 && err.class === 14) {
			res.status(432).send(`Duplicate 'User Name' or 'Email'!!`);
		}
		sql.close();
	});
});

app.get('/login/:user_name/:password', (req, res) => {
	sql.close();
	var user_name = req.params.user_name;
	var password = req.params.password;
	var hash = SHA256(password+salt).toString();
	// var query = `SELECT * FROM users WHERE user_name = '${user_name}' and password = '${hash}';`;
	var query = `SELECT * FROM users WHERE user_name = '${user_name}';`;
	sql.connect(DbConnectionString).then((pool) => {
		return pool.request()
		.query(query);
	}).then((result) => {
		if(result.recordset.length === 0) {
			res.status(435).send('No user found!!');
		} else if(result.recordset[0].password === hash) {
			res.send('Logged In!!');
		} else {
			res.send('Incorrect password!!');
		}
		sql.close();
	}).catch((err) => {
		console.dir(err);
		sql.close();
	});
});

app.get('/comments', (req, res) => {
	sql.close();
	var query = `SELECT u.email, u.user_name, c.comments FROM comments AS c JOIN users AS u ON u.user_name = c.user_name;`;
	sql.connect(DbConnectionString).then((pool) => {
		return pool.request()
		.query(query);
	}).then((result) => {
		if(result.recordset.length === 0) {
			res.status(437).send("No comments found!!");
		} else {
			res.json(result.recordset);
		}
		sql.close();
	}).catch((err) => {
		console.dir(err);
		sql.close();
	});
});

app.get("/name/:name", (req, res) => {
	sql.close();
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
			return res.status(433).send(`no results found against "${name}"!!`);
		}
		sql.close();
		return res.json(match);
	}).catch((error) => {
		console.dir(err);
		sql.close();
	});
});

app.get('/id/:id', (req, res) => {
	sql.close();
	var id = req.params.id;
	var query = `SELECT p.Prop_id, o.Owner_name, p.Incareof, p.Own_city, p.Own_state, p.Own_zip, p.Prop_bal, p.Hldr_name FROM Owners AS o JOIN PropertiesRange1 AS p ON o.Prop_id = p.Prop_id AND o.Prop_id = '${id}'`;
	// var query = `SELECT Prop_id, Owner_name, Own_Code FROM Owners WHERE Prop_id ='${id}'`;
	sql.connect(DbConnectionString).then((pool) => {
		return pool.request()
		.query(query);
	}).then((result) => {
		sql.close();
		if(!result.recordset === undefined || result.recordset === null || result.recordset.length === 0 ) {
			return res.status(434).send(`no results found against "${id}"!!`);
		}
		sql.close();
		return res.json(result.recordset);
	}).catch((err) => {
		console.dir(err);
		sql.close();
	});
});

app.get('/addcomment/:userName/:comment', (req, res) => {
	sql.close();
	var user_name = req.params.userName;
	var comment = req.params.comment;
	var query = `INSERT INTO comments (user_name, comments) VALUES ('${user_name}', '${comment}')`;
	sql.connect(DbConnectionString).then((pool) => {
		return pool.request()
		.query(query);
	}).then((result) => {
		sql.close();
		return res.send(`Comments added against user name: '${user_name}'`);
	}).catch((err) => {
		console.dir(err);
		if(err.number === 547 && err.class === 16) {
			res.status(438).send(`User not registered!!`);
		}
		sql.close();
	});
}) 

app.listen(port, function() {
	console.log(`node server listening at port : ${port}`);
});