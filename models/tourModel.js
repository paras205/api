const mongoose = require('mongoose');
const slugify = require('slugify');

const tourSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: [ true, 'A tour must have a name' ],
			unique: true,
			trim: true,
			maxLength: [ 40, 'A tour name must be less than 40 characters' ]
		},
		slug: {
			type: String
		},
		duration: {
			type: Number,
			required: [ true, 'A tour must have a duration' ]
		},
		maxGroupSize: {
			type: Number,
			required: [ true, 'A tour must have a group size' ]
		},
		difficulty: {
			type: String,
			required: [ true, 'A tour must have a difficulty' ],
			enum: [ 'easy', 'medium', 'difficult' ]
		},
		ratingsAverage: {
			type: Number,
			default: 4.5,
			set: (val) => Math.round(val * 10) / 10
		},
		ratingsQuantity: {
			type: Number,
			default: 0
		},
		price: {
			type: Number,
			required: [ true, 'A tour must have a price' ]
		},
		priceDiscount: {
			type: Number
		},
		summary: {
			type: String,
			trim: true,
			required: [ true, 'A tour must have a summary' ]
		},
		description: {
			type: String,
			trim: true
		},
		imageCover: {
			type: String,
			required: [ true, 'A tour must have a cover image' ]
		},
		images: [ String ],
		createdAt: {
			type: Date,
			default: Date.now()
		},
		startDates: [ Date ],
		startLocation: {
			type: {
				type: String,
				default: 'Point',
				enum: [ 'Point' ]
			},
			coordinates: [ Number ],
			address: String,
			description: String
		},
		locations: [
			{
				type: {
					type: String,
					default: 'Point',
					enum: [ 'Point' ]
				},
				coordinates: [ Number ],
				address: String,
				description: String,
				day: Number
			}
		],
		guides: [
			{
				type: mongoose.Schema.ObjectId,
				ref: 'User'
			}
		]
	},
	{
		toJSON: { virtuals: true },
		toObject: { virtuals: true }
	}
);

// calculate weeks
tourSchema.virtual('durationWeeks').get(function() {
	return this.duration / 7;
});

// virtual populate reviews
tourSchema.virtual('reviews', {
	ref: 'Review',
	foreignField: 'tour',
	localField: '_id'
});

// generate slug
tourSchema.pre('save', function(next) {
	this.slug = slugify(this.name, { lower: true });
	next();
});

tourSchema.pre(/^find/, function(next) {
	this.populate({ path: 'guides', select: '-__v' });
	next();
});

const Tour = mongoose.model('Tour', tourSchema);
module.exports = Tour;
