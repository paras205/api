const Tour = require('../models/tourModel');
const ApiFeatures = require('../utils/apiFeatures');

exports.aliasTopTour = async (req, res, next) => {
	req.query.limit = '5';
	req.query.sort = '-ratingsAverage,price';
	req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
	next();
};

exports.getAllTours = async (req, res) => {
	try {
		const features = new ApiFeatures(Tour.find(), req.query).filter().sort().limitFields().paginate();
		const tours = await features.query;
		res.status(200).json({
			status: 'success',
			results: tours.length,
			tours
		});
	} catch (err) {
		res.status(404).json({
			status: 'fail',
			message: err
		});
	}
};

exports.getTour = async (req, res) => {
	try {
		const tour = await Tour.findById(req.params.id).populate('reviews');
		res.status(200).json({
			status: 'success',
			tour
		});
	} catch (err) {
		res.status(404).json({
			status: 'fail',
			message: err
		});
	}
};

exports.createTour = async (req, res) => {
	try {
		const newTour = await Tour.create(req.body);
		// 201 => created
		res.status(201).json({
			status: 'sucess',
			tour: newTour
		});
	} catch (err) {
		res.status(400).json({
			status: 'fail',
			message: err
		});
	}
};

exports.updateTour = async (req, res) => {
	try {
		const tour = Tour.findByIdAndUpdate(req.params.id, req.body, { new: true });
		res.status(201).json({
			status: 'sucess',
			tour
		});
	} catch (err) {
		res.status(400).json({
			status: 'fail',
			message: err
		});
	}
};

exports.deleteTour = async (req, res) => {
	try {
		await Tour.findByIdAndDelete(req.params.id);
		// 204 => no content
		res.status(204).json({
			status: 'sucess',
			tour: null
		});
	} catch (err) {
		res.status(404).json({
			status: 'fail',
			message: err
		});
	}
};

exports.getTourStats = async (req, res) => {
	try {
		const stats = await Tour.aggregate([
			{
				$match: { ratingsAverage: { $gte: 4.5 } }
			},
			{
				$group: {
					_id: '$ratingsAverage',
					// _id: '$difficulty',
					numTours: { $sum: 1 },
					numRatings: { $sum: '$ratingsQuantity' },
					avgRating: { $avg: '$ratingsAverage' },
					avgPrice: { $avg: '$price' },
					minPrice: { $min: '$price' },
					maxPrice: { $max: '$price' }
				}
			},
			{ $sort: { avgPrice: 1 } }
			// {
			// 	$match: {
			// 		_id: { $ne: 'easy' }
			// 	}
			// }
		]);
		res.status(200).json({
			message: 'Success',
			stats
		});
	} catch (err) {
		res.status(404).json({
			status: 'fail',
			message: err
		});
	}
};

exports.getMonthlyPlan = async (req, res) => {
	try {
		const year = req.params.year * 1;
		const plan = await Tour.aggregate([
			{
				$unwind: '$startDates'
			},
			{
				$match: {
					startDates: {
						$gte: new Date(`${year}-01-01`),
						$lte: new Date(`${year}-12-31`)
					}
				}
			},
			{
				$group: {
					_id: { $month: '$startDates' },
					numOfTourStarts: { $sum: 1 },
					tours: { $push: '$name' }
				}
			},
			{
				$addFields: { month: '$_id' }
			},
			{
				$project: { _id: 0 }
			},
			{
				$sort: { numOfTourStarts: -1 }
			}
			// {
			// 	$limit: 6
			// }
		]);
		res.status(200).json({
			message: 'Success',
			plan
		});
	} catch (err) {
		res.status(404).json({
			status: 'fail',
			message: err
		});
	}
};
