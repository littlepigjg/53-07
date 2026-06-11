import { Router } from 'express';
import { TestFrameworkService } from '../services/TestFrameworkService.js';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const cases = await TestFrameworkService.listTestCases();
    res.json(cases);
  } catch (e) {
    next(e);
  }
});

router.get('/suites', async (_req, res, next) => {
  try {
    const suites = await TestFrameworkService.listSuites();
    res.json(suites);
  } catch (e) {
    next(e);
  }
});

router.get('/search', async (req, res, next) => {
  try {
    const query: { suite?: string; tags?: string[]; name?: string } = {};
    if (req.query.suite) query.suite = req.query.suite as string;
    if (req.query.name) query.name = req.query.name as string;
    if (req.query.tags) query.tags = (req.query.tags as string).split(',');
    const cases = await TestFrameworkService.searchTestCases(query);
    res.json(cases);
  } catch (e) {
    next(e);
  }
});

router.get('/baselines', async (_req, res, next) => {
  try {
    const baselines = await TestFrameworkService.listBaselines();
    res.json(baselines);
  } catch (e) {
    next(e);
  }
});

router.post('/run', async (req, res, next) => {
  try {
    const { suite, parallel } = req.body;
    const report = await TestFrameworkService.runTests({
      suite,
      parallel: parallel ?? true,
    });
    res.json(report);
  } catch (e) {
    next(e);
  }
});

router.post('/import', async (req, res, next) => {
  try {
    const imported = await TestFrameworkService.importTestCases(req.body);
    res.json({ imported });
  } catch (e) {
    next(e);
  }
});

router.get('/export', async (req, res, next) => {
  try {
    const suite = req.query.suite as string | undefined;
    const suiteNames = suite ? [suite] : undefined;
    const data = await TestFrameworkService.exportTestCases(suiteNames);
    res.json(data);
  } catch (e) {
    next(e);
  }
});

router.delete('/baselines/:id', async (req, res, next) => {
  try {
    await TestFrameworkService.deleteBaseline(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await TestFrameworkService.deleteTestCase(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;
