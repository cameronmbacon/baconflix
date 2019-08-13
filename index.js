var express = require('express');
const path = require('path');
const sql = require('mssql');
const bodyParser = require('body-parser');

const PORT = process.env.PORT || 3000;

const config = {
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    server: process.env.SQL_SERVER_NAME,
    database: 'BaconFlix_Video_Streaming_Service',
    port: 1433,
    options: {
        encrypt: true // Use this if you're on Windows Azure
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

var app = express();

// Setup Pug view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// handles parsing of request/response body values.
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Routes
app.get('/', function (req, res) {
    res.render('index');
})

app.get('/user', function (req, res) {
    getList('User', (recordset) => {
        res.render('User', { users : recordset });
    });
});

app.get('/subscription', function (req, res) {
    getList('Subscription', (recordset) => {
        res.render('Subscription', { subscriptions : recordset });
    });
});

app.get('/movie', function (req, res) {
    getList('Movie', (recordset) => {
        res.render('Movie', { movies : recordset });
    });
});

app.get('/tvseries', function (req, res) {
    getList('TV_Series', (recordset) => {
        res.render('TV_Series', { tvSeriesArray : recordset });
    });
});

app.get('/tvshow', function (req, res) {
    getList('TV_Show', (recordset) => {
        res.render('TV_Show', { tvShows : recordset });
    });
});

// This route updates the Subscription_ID of the specified user
app.get('/user/:ID/edit', function(req, res) {
    req.body.user = {
        ID: req.params.ID,
        Subscription_ID: null
    };

    if (req.body.user.ID == 1) {
        req.body.user.Subscription_ID = 2;
    }
    else if (req.params.ID == 2) {
        req.body.user.Subscription_ID = 3;
    }
    else if (req.params.ID == 3) {
        req.body.user.Subscription_ID = 1;
    }
    
    updateUser(req.body.user, (recordset) => {
        res.redirect('/user');
    });
});

// This route reverts all Subscription_ID fields to null
app.get('/user/:ID/undo', function(req, res) {
    req.body.user = {
        ID: req.params.ID,
        Subscription_ID: null
    };
    
    updateUser(req.body.user, (recordset) => {
        res.redirect('/user');
    });
});

// Controller functions for SQL database
function getList(tableName, callback) {
    var conn = new sql.ConnectionPool(config);
    conn.connect(function (err) {
        if (err) throw err;
    
        var req = new sql.Request(conn);
        req.query(`SELECT * FROM [${tableName}]`, function(err, results) {
            if (err) throw err;
        
            conn.close();
            callback(results.recordset);
        });
    });
};

function updateUser(reqBody, callback) {
    var conn = new sql.ConnectionPool(config);
    conn.connect(function (err) {
        if (err) throw err;

        let data = reqBody;    
        let queryString = 'UPDATE [User] SET ';

        if (data.Subscription_ID != null) {
            queryString += `Subscription_ID = ${data.Subscription_ID}`;
        } else {
            queryString += `Subscription_ID = NULL`;
        }

        queryString += ` WHERE ID = ${data.ID};`;
        
        var req = new sql.Request(conn);
        req.query(queryString, function(err, results) {       
            if (err) throw err;
        
            conn.close();
            callback(results.recordset);
        });
    });
};

// if an error is emitted, the error will be logged and the connection will be closed.
sql.on('error', err => {
    console.dir(err);
    sql.close();
});

// starts the express server on localhost:3000
app.listen(PORT, function() {
    console.log('app listening on port ' + PORT); 
});