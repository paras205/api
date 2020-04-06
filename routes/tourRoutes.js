const express = require('express');

const router = express.Router();
const tourController = require('../controllers/tourController');
const reviewRouter = require('./reviewRoutes');

router.use('/:tourId/reviews', reviewRouter);
router.route('/top-5-cheap').get(tourController.aliasTopTour, tourController.getAllTours);
router.route('/tours-stats').get(tourController.getTourStats);
router.route('/monthly-plan/:year').get(tourController.getMonthlyPlan);
router.route('/').get(tourController.getAllTours).post(tourController.createTour);
router.route('/:id').get(tourController.getTour).patch(tourController.updateTour).delete(tourController.deleteTour);

module.exports = router;
