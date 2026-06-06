const router = require('express').Router();
const { listProblems, getProblem, createProblem, updateProblem, deleteProblem, getProblemStats, getTagsCloud } = require('../controllers/problemController');
const { getTemplate } = require('../services/judgeService');
const { optionalAuth, adminOnly } = require('../middleware/auth');

router.get('/', optionalAuth, listProblems);
router.get('/stats', getProblemStats);
router.get('/templates/:language', (req, res) => {
  res.json({ template: getTemplate(req.params.language) });
});
router.get('/tags', getTagsCloud);
router.get('/:id', optionalAuth, getProblem);
router.post('/', adminOnly, createProblem);
router.put('/:id', adminOnly, updateProblem);
router.delete('/:id', adminOnly, deleteProblem);

module.exports = router;
