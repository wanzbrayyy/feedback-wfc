require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const flash = require('connect-flash');
const methodOverride = require('method-override');

const wfcqlConnect = require('./config/wfcql');
const setLocalsMiddleware = require('./middleware/setLocals');

const indexRouter = require('./routes/index.routes');
const authRouter = require('./routes/auth.routes');
const userRouter = require('./routes/user.routes');


const app = express();
const PORT = process.env.PORT || 3000;

// Connect to WFC-SQL Database
wfcqlConnect();

// View Engine Setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(methodOverride('_method'));

// Session & Flash
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 } // 1 day
}));
app.use(flash());

// Custom middleware to make user and flash messages available in all views
app.use(setLocalsMiddleware);

// Routes
app.use('/', indexRouter);
app.use('/auth', authRouter);
app.use('/users', userRouter); // Contoh CRUD

// Basic 404 handler
app.use((req, res, next) => {
    res.status(404).render('error', { 
        title: 'Page Not Found', 
        errorCode: 404,
        errorMessage: "Sorry, the page you are looking for does not exist.",
        currentUser: req.session.user
    });
});

// Basic error handler
app.use((err, req, res, next) => {
    console.error("Global Error Handler:", err.stack);
    res.status(err.status || 500).render('error', {
        title: 'Server Error',
        errorCode: err.status || 500,
        errorMessage: err.message || "Something went wrong on our server.",
        currentUser: req.session.user
    });
});


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});