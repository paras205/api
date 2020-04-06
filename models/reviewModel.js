const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
	{
		review: {
			type: String,
			required: [ true, 'This field cannot be empty' ]
		},
		rating: {
			type: Number,
			min: 1,
			max: 5
		},
		tour: {
			type: mongoose.Schema.ObjectId,
			ref: 'Tour',
			required: [ true, 'This field cannot be empty' ]
		},
		user: {
			type: mongoose.Schema.ObjectId,
			ref: 'User',
			required: [ true, 'This field cannot be empty' ]
		},
		createdAt: {
			type: Date,
			default: Date.now()
		}
	},
	{
		toJSON: { virtuals: true },
		toObject: { virtuals: true }
	}
);

reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function(next) {
	this.populate({ path: 'user', select: 'name photo' });
	next();
});

reviewSchema.statics.calcAverageRating = async function(tourId) {
	const stats = await this.aggregate([
		{
			$match: { tour: tourId }
		},
		{
			$group: {
				_id: '$tour',
				nRatings: { $sum: 1 },
				avgRating: { $avg: '$rating' }
			}
		}
	]);
	if (stats.length > 0) {
		await Tour.findByIdAndUpdate(tourId, {
			ratingsAverage: stats[0].avgRating,
			ratingsQuantity: stats[1].nRatings
		});
	} else {
		await Tour.findByIdAndUpdate(tourId, {
			ratingsAverage: 4.5,
			ratingsQuantity: 0
		});
	}
};

reviewSchema.post('save', function() {
	this.contructor.calcAverageRating(this.tour);
});

reviewSchema.pre(/^findOneAnd/, async function(next) {
	this.r = await this.findOne();
	next();
});

reviewSchema.post(/^findOneAnd/, async function() {
	await this.r.contructor.calcAverageRating(this.r.tour);
});

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
