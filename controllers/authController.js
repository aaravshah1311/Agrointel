const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const pool = require('../config/db');

exports.getSignup = (req, res) => {
    res.render('auth/signup', { title: 'Sign Up', errors: [] });
};

exports.postSignup = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).render('auth/signup', {
            title: 'Sign Up',
            errors: errors.array(),
            oldInput: req.body
        });
    }

    const { name, email, password, state, city, land_area_sqft } = req.body;

    try {
        const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length > 0) {
            req.flash('error_msg', 'Email already exists');
            return res.redirect('/auth/signup');
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        await pool.query(
            'INSERT INTO users (name, email, password, state, city, land_area_sqft) VALUES (?, ?, ?, ?, ?, ?)',
            [name, email, hashedPassword, state, city, land_area_sqft]
        );

        req.flash('success_msg', 'You are now registered and can log in');
        res.redirect('/auth/login');

    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Something went wrong. Please try again.');
        res.redirect('/auth/signup');
    }
};

exports.getLogin = (req, res) => {
    res.render('auth/login', { title: 'Login' });
};

exports.postLogin = async (req, res) => {
    const { email, password } = req.body;

    try {
        const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            req.flash('error_msg', 'No user found with that email');
            return res.redirect('/auth/login');
        }

        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if (isMatch) {
            req.session.user = user;
            res.redirect('/user/dashboard');
        } else {
            req.flash('error_msg', 'Password incorrect');
            res.redirect('/auth/login');
        }

    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Something went wrong.');
        res.redirect('/auth/login');
    }
};

exports.logout = (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return console.log(err);
        }
        res.redirect('/auth/login');
    });
};