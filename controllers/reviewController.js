const Review = require('../models/reviewModel');

exports.getAllReviews = async (req, res, next) => {
	try {
		let filter = {};
		if (req.params.tourId) filter = { tour: req.params.tourId };
		const review = await Review.find(filter);
		res.status(200).json({
			status: 'success',
			results: review.length,
			review
		});
	} catch (err) {
		console.log(err);
	}
};

exports.createReview = async (req, res, next) => {
	try {
		if (!req.body.tour) req.body.tour = req.params.tourId;
		if (!req.body.user) req.body.user = req.user.id;
		const review = await Review.create(req.body);
		res.status(201).json({
			status: 'success',
			review
		});
	} catch (err) {
		console.log(err);
	}
};
