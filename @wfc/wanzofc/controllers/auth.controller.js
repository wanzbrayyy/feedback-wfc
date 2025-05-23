const User = require('../models/user.model');
const bcrypt = require('bcryptjs'); 

exports.getLoginPage = (req, res) => {
    res.render('auth/login', { title: 'Login' });
};

exports.postLogin = async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        req.flash('error_msg', 'Please enter both username and password.');
        return res.redirect('/auth/login');
    }
    try {
        const user = await User.findOne({ username: username });
        if (!user) {
            req.flash('error_msg', 'Invalid username or password.');
            return res.redirect('/auth/login');
        }

        const isMatch = await user.comparePassword(password);
        if (isMatch) {
            req.session.user = { // Simpan data user yang aman di session
                _id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            };
            req.flash('success_msg', 'You are now logged in!');
            res.redirect('/'); // Atau ke dashboard
        } else {
            req.flash('error_msg', 'Invalid username or password.');
            res.redirect('/auth/login');
        }
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Something went wrong. Please try again.');
        res.redirect('/auth/login');
    }
};

exports.getRegisterPage = (req, res) => {
    res.render('auth/register', { title: 'Register' });
};

exports.postRegister = async (req, res) => {
    const { username, email, password, password2 } = req.body;
    let errors = [];

    if (!username || !email || !password || !password2) {
        errors.push({ msg: 'Please fill in all fields' });
    }
    if (password !== password2) {
        errors.push({ msg: 'Passwords do not match' });
    }
    if (password && password.length < 6) {
        errors.push({ msg: 'Password should be at least 6 characters' });
    }

    if (errors.length > 0) {
        return res.render('auth/register', {
            title: 'Register',
            errors,
            username,
            email
        });
    }

    try {
        const existingUserByUsername = await User.findOne({ username: username });
        if (existingUserByUsername) {
            errors.push({ msg: 'Username already exists' });
        }
        const existingUserByEmail = await User.findOne({ email: email });
        if (existingUserByEmail) {
            errors.push({ msg: 'Email already registered' });
        }

        if (errors.length > 0) {
            return res.render('auth/register', {
                title: 'Register',
                errors,
                username,
                email
            });
        }

        const hashedPassword = await User.hashPassword(password);
        await User.create({
            username,
            email,
            password: hashedPassword
        });
        req.flash('success_msg', 'You are now registered and can log in');
        res.redirect('/auth/login');

    } catch (err) {
        console.error(err);
        if (err.errors) { // Validation errors from WFC-SQL
            Object.values(err.errors).forEach(val => errors.push({ msg: val }));
             return res.render('auth/register', {
                title: 'Register',
                errors,
                username,
                email
            });
        }
        req.flash('error_msg', 'Something went wrong during registration.');
        res.redirect('/auth/register');
    }
};

exports.logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error("Session destruction error:", err);
            req.flash('error_msg', 'Could not log out. Please try again.');
            return res.redirect('/');
        }
        res.clearCookie('connect.sid'); // Nama cookie default express-session
        req.flash('success_msg', 'You have successfully logged out.');
        res.redirect('/auth/login');
    });
};