// Get the client
import mysql from 'mysql2/promise';
import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import flash from 'connect-flash';
import path from 'path';
import methodOverride from 'method-override';
import userRouter from './routes/user.js';
import authRouter from './routes/auth.js';

const app = express();
const __dirname = path.resolve();
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "/public")));

app.use(session({
  secret: process.env.SECRET_KEY, 
  resave: false,
  saveUninitialized: false,
  cookie: { 
    maxAge: 600000,  //expires after 10 minutes
    httpOnly: true,
    sameSite: 'lax'
  } 
}));

app.use(flash());
// Make flash messages available in all views
app.use((req, res, next) => {
  res.locals.successMessage = req.flash('success');
  res.locals.errorMessage = req.flash('error');
  res.locals.infoMessage = req.flash('info');
  res.locals.formData = req.flash('formData')[0] || {};
  next();
});


app.use((req, res, next) => {
  res.locals.emailError = null;
  res.locals.passwordError = null;
  res.locals.formData = {};
  res.locals.wasValidated = false;
  res.locals.userId = req.session.userId || null;
  next();
});


(async() => {
// Create the connection to database
const connection = await mysql.createConnection({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  database: process.env.MYSQL_DATABASE,
  password: process.env.MYSQL_PASSWORD
});


try {
    // Step 1: Get all table names
    const [tables] = await connection.query('SHOW TABLES');

    console.log('--- Database Tables and their Fields ---');

    // Step 2: Iterate through the table names
    for (const tableRow of tables) {
        const tableName = Object.values(tableRow)[0];
        console.log(`\nTable: ${tableName}`);
        console.log('------------------------------');

        // Step 3: Use DESCRIBE to get the fields for the current table
        const [fields] = await connection.query(`DESCRIBE ${tableName}`);
        
        // Step 4: Print the fields for the current table
        for (const field of fields) {
            console.log(`Field: ${field.Field.padEnd(20)} | Type: ${field.Type}`);
        }
    }
} catch (err) {
    console.error('Error:', err);
} finally {
    // Ensure the connection is closed
    connection.end();
}
})()


app.use("/", userRouter);
app.use("/auth", authRouter);
app.get('/test-session', (req, res) => {
  console.log("Session userId in /test-session:", req.session.userId);
  res.send(`Session userId: ${req.session.userId}`);
});

app.use((req, res) => {
  req.flash('info', 'Page not found. Redirected to home.');
  res.redirect('/');
});

app.listen(process.env.PORT, () => {
    console.log(`Server listening to port ${process.env.PORT}`);
})