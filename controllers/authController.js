const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');

const signToken = (id) => {
	return jwt.sign({ id }, process.env.JWT_SECRET, {
		expiresIn: process.env.JWT_EXPIRES
	});
};

const createAndSendToken = (user, statusCode, res) => {
	const token = signToken(user._id);
	const cookieOptions = {
		expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000),
		httpOnly: true
	};
	if (process.env.NODE_ENV === 'production') {
		cookieOptions.secure = true;
	}
	res.cookie('jwt', token, cookieOptions);
	user.password = undefined;
	res.status(statusCode).json({
		status: 'success',
		token,
		user
	});
};

exports.register = async (req, res) => {
	try {
		const user = await User.create({
			name: req.body.name,
			email: req.body.email,
			password: req.body.password,
			passwordConfrim: req.body.passwordConfrim
		});
		createAndSendToken(user, 201, res);
	} catch (err) {
		res.status(500).json({
			status: 'fail',
			message: err
		});
	}
};

exports.login = async (req, res, next) => {
	try {
		const { email, password } = req.body;
		if (!email || !password) {
			return next(new AppError('Please enter and password', 400));
		}
		const user = await User.findOne({ email }).select('+password');
		if (!user || !await user.comparePassword(password, user.password)) {
			// 401 => unauthorized
			return next(new AppError('Incorrect email or password', 401));
		}
		createAndSendToken(user, 201, res);
	} catch (err) {
		console.log(err);
	}
};

exports.protect = async (req, res, next) => {
	try {
		let token;
		if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
			token = req.headers.authorization.split(' ')[1];
		}
		if (!token) {
			return next(new AppError('Unauthorized', 401));
		}
		let decoded;
		try {
			decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
		} catch (err) {
			res.status(401).json({
				status: 'fail',
				message: 'Invalid token'
			});
		}
		const currentUser = await User.findById(decoded.id);
		if (!currentUser) {
			return next(new AppError('The user belongs to token does not exists', 401));
		}
		if (currentUser.changedPassword(decoded.iat)) {
			return next(new AppError('User not found', 401));
		}
		req.user = currentUser;
		next();
	} catch (err) {
		console.log(err);
	}
};

exports.restrictTo = (...roles) => {
	return (req, res, next) => {
		if (!roles.includes(req.user.role)) {
			// 403 => forbidden
			return next(new AppError('You do not have permission to perfom this action', 403));
		}
		next();
	};
};

exports.forgotPassword = async (req, res, next) => {
	const user = await User.findOne({ email: req.body.email });
	if (!user) {
		return next(new AppError('User not found', 404));
	}
	const resetToken = user.createPasswordResetToken();
	await user.save({ validateBeforeSave: false });
	const resetUrl = `${req.protocal}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
	const message = `Forgot your password? Please enter your email address ${resetUrl}`;
	try {
		await sendEmail({
			email: user.email,
			subject: 'Your password reset token (valid for 10 min only)',
			message
		});
		res.status(200).json({
			status: 'success',
			message: 'Token send to email'
		});
		console.log(user.passwordResetToken);
	} catch (err) {
		user.passwordResetToken = undefined;
		user.passwordResetExpires = undefined;
		await user.save({ validateBeforeSave: false });
		return next(new AppError('There was error sending an email, Please try again later', 500));
	}
};

exports.resetPassword = async (req, res, next) => {
	try {
		const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
		const user = await User.findOne({ passwordResetToken: hashedToken, passwordResetExpires: { $gt: Date.now() } });
		if (!user) {
			return next(new AppError('Invalid token', 400));
		}
		user.password = req.body.password;
		user.passwordConfrim = req.body.passwordConfrim;
		user.passwordResetToken = undefined;
		user.passwordResetExpires = undefined;
		await user.save();
		createAndSendToken(user, 200, res);
	} catch (err) {
		console.log(err);
	}
};

exports.updatePassword = async (req, res, next) => {
	try {
		const user = await User.findById(req.user.id).select('+password');
		if (!await user.comparePassword(req.body.passwordCurrent, user.password)) {
			return next(new AppError('Password does not match', 401));
		}
		user.password = req.body.password;
		user.passwordConfrim = req.body.passwordConfrim;
		await user.save();
		createAndSendToken(user, 200, res);
	} catch (err) {
		console.log(err);
	}
};
