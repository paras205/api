const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Tour = require('../../models/tourModel');
const Reviews = require('../../models/reviewModel');
const User = require('../../models/userModel');
dotenv.config({ path: './config.env' });

const DB = process.env.DATABASE;
mongoose
	.connect(DB, {
		useNewUrlParser: true,
		useCreateIndex: true,
		useUnifiedTopology: true,
		useFindAndModify: false
	})
	.then(() => {
		console.log('Database connected...');
	});

// read json file
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const reviews = JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8'));

// import data in database
const importData = async () => {
	try {
		await Tour.create(tours);
		await User.create(users, { validateBeforeSave: false });
		await Reviews.create(reviews);
		console.log('data successfully loaded');
		process.exit();
	} catch (err) {
		console.log(err);
	}
};

// delete all data from database
const deleteData = async () => {
	try {
		await Tour.deleteMany();
		await User.deleteMany();
		await Reviews.deleteMany();
		console.log('data successfully deleted');
		process.exit();
	} catch (err) {
		console.log(err);
	}
};
if (process.argv[2] === '--import') {
	importData();
} else if (process.argv[2] === '--delete') {
	deleteData();
}
