const User = require('../models/user.model');

exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find();
        res.render('users/index', { title: 'All Users', users });
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Could not fetch users.');
        res.redirect('/');
    }
};

exports.getNewUserForm = (req, res) => {
    res.render('users/new', { title: 'Add New User' });
};

exports.createNewUser = async (req, res) => {
    const { username, email, password, role } = req.body;
    try {
        const hashedPassword = await User.hashPassword(password);
        await User.create({ username, email, password: hashedPassword, role });
        req.flash('success_msg', 'User created successfully.');
        res.redirect('/users');
    } catch (err) {
        console.error(err);
         if (err.errors) {
            const errorMessages = Object.values(err.errors).join(', ');
            req.flash('error_msg', `Validation failed: ${errorMessages}`);
        } else {
            req.flash('error_msg', 'Could not create user.');
        }
        res.render('users/new', { title: 'Add New User', username, email, role });
    }
};

exports.getEditUserForm = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            req.flash('error_msg', 'User not found.');
            return res.redirect('/users');
        }
        res.render('users/edit', { title: 'Edit User', user });
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Could not fetch user for editing.');
        res.redirect('/users');
    }
};

exports.updateUser = async (req, res) => {
    const { username, email, role, isActive } = req.body;
    try {
        const updateData = { username, email, role, isActive: isActive === 'on' };
        // Password update needs special handling, omitted for brevity here
        // if (req.body.password) { updateData.password = await User.hashPassword(req.body.password); }
        
        const updatedUser = await User.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
        if (!updatedUser) {
            req.flash('error_msg', 'User not found or could not be updated.');
            return res.redirect('/users');
        }
        req.flash('success_msg', 'User updated successfully.');
        res.redirect('/users');
    } catch (err) {
        console.error(err);
         if (err.errors) {
            const errorMessages = Object.values(err.errors).join(', ');
            req.flash('error_msg', `Validation failed: ${errorMessages}`);
        } else {
            req.flash('error_msg', 'Could not update user.');
        }
        // Re-fetch user to populate form correctly after error
        const user = await User.findById(req.params.id) || { _id: req.params.id, username, email, role, isActive };
        res.render('users/edit', { title: 'Edit User', user, currentUsername: username, currentEmail: email, currentRole: role });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const deletedUser = await User.findByIdAndDelete(req.params.id);
        if (!deletedUser) {
            req.flash('error_msg', 'User not found or could not be deleted.');
            return res.redirect('/users');
        }
        req.flash('success_msg', 'User deleted successfully.');
        res.redirect('/users');
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Could not delete user.');
        res.redirect('/users');
    }
};