const router = require('express').Router();
const { submit, listSubmissions, getSubmission } = require('../controllers/submissionController');
const { authenticate } = require('../middleware/auth');

router.post('/', authenticate, submit);
router.get('/', authenticate, listSubmissions);
router.get('/:id', authenticate, getSubmission);

module.exports = router;
