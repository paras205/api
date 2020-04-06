const User = require('../models/userModel');
const AppError = require('../utils/appError');

const filterObj = (obj, ...allowedFields) => {
	const newObj = {};
	Object.keys(obj).forEach((el) => {
		if (allowedFields.includes(el)) newObj[el] = obj[el];
	});
	return newObj;
};

exports.getAllUsers = async (req, res) => {
	try {
		const user = await User.find();
		res.status(200).json({
			status: 'success',
			results: user.length,
			user
		});
	} catch (err) {
		res.status(404).json({
			status: 'fail',
			message: err
		});
	}
};

exports.updateMe = async (req, res, next) => {
	try {
		if (req.body.password || req.body.passwordConfirm) {
			return next(new AppError('You cannot peform this action', 400));
		}
		const filteredBody = filterObj(req.body, 'name', 'email');
		const user = await User.findByIdAndUpdate(req.user.id, filteredBody, { new: true, runValidators: true });
		res.status(200).json({
			status: 'success',
			user
		});
	} catch (err) {
		console.log(err);
	}
};

exports.deleteMe = async (req, res, next) => {
	try {
		await User.findByIdAndUpdate(req.user.id, { active: false });
		res.status(204).json({
			status: 'success',
			data: null
		});
	} catch (err) {
		console.log(err);
	}
};
exports.createUser = (req, res) => {
	res.status(500).json({
		status: 'fail'
	});
};

exports.getUser = (req, res) => {
	res.status(500).json({
		status: 'fail'
	});
};

exports.updateUser = (req, res) => {
	res.status(500).json({
		status: 'fail'
	});
};

exports.deleteUser = (req, res) => {
	res.status(500).json({
		status: 'fail'
	});
};
