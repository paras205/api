const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
	name: {
		type: String,
		required: [ true, 'This field is required' ]
	},
	email: {
		type: String,
		required: [ true, 'This field is required' ],
		unique: true,
		lowercase: true,
		validate: [ validator.isEmail, 'Invalid Email' ]
	},
	photo: String,
	role: {
		type: String,
		enum: [ 'user', 'guide', 'lead', 'admin' ],
		default: 'user'
	},
	password: {
		type: String,
		required: [ true, 'Password field is required' ],
		minlength: 8,
		select: false
	},
	passwordConfrim: {
		type: String,
		required: [ true, 'passwordConfrim field is required' ],
		validate: {
			validator: function(el) {
				return el === this.password;
			},
			message: 'Password does not match'
		}
	},
	passwordChangedAt: Date,
	passwordResetToken: String,
	passwordResetExpires: Date,
	active: {
		type: Boolean,
		default: true,
		select: false
	}
});

// convert user password to hash
userSchema.pre('save', async function(next) {
	if (!this.isModified('password')) return next();
	this.password = await bcrypt.hash(this.password, 12);
	this.passwordConfrim = undefined;
	next();
});

// password changed time
userSchema.pre('save', function(next) {
	if (!this.isModified('password') || this.isNew) return next();
	this.passwordChangedAt = Date.now() - 1000;
	next();
});

// only show active users
userSchema.pre(/^find/, function(next) {
	this.find({ active: { $ne: false } });
	next();
});

// compare hashed password and user input password
userSchema.methods.comparePassword = async function(candidatePassword, userPassword) {
	return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPassword = function(jwtTimestamp) {
	if (this.passwordChangedAt) {
		const changedtimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
		return jwtTimestamp < changedtimestamp;
	}
	return false;
};

// create jwt token for password reset
userSchema.methods.createPasswordResetToken = function() {
	const resetToken = crypto.randomBytes(32).toString('hex');
	this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
	this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
	return resetToken;
};

const User = mongoose.model('User', userSchema);
module.exports = User;
