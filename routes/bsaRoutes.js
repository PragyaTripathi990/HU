const express = require('express');
const router = express.Router();
const bsaService = require('../services/bsa/bsaService');

/**
 * POST /internal/aa/bsa/analyze
 * Initiate BSA analysis for a stored report
 */
router.post('/analyze', async (req, res) => {
  try {
    const { report_id } = req.body;

    // Validate required fields
    if (!report_id) {
      return res.status(400).json({
        success: false,
        error: 'report_id is required'
      });
    }

    // Initiate analysis
    const result = await bsaService.initiateAnalysis(report_id);

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: 'BSA analysis initiated successfully',
        data: {
          tracking_id: result.tracking_id,
          bsa_run_id: result.bsa_run._id,
          status: result.bsa_run.status
        }
      });
    } else {
      return res.status(400).json({
        success: false,
        error: result.error,
        details: result.details,
        ...(result.tracking_id && { tracking_id: result.tracking_id })
      });
    }
  } catch (error) {
    console.error('Error in BSA analysis initiation:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
});

/**
 * GET /internal/aa/bsa/status/:tracking_id
 * Check BSA analysis status
 */
router.get('/status/:tracking_id', async (req, res) => {
  try {
    const { tracking_id } = req.params;

    if (!tracking_id) {
      return res.status(400).json({
        success: false,
        error: 'tracking_id is required'
      });
    }

    // Check status
    const result = await bsaService.checkStatus(tracking_id);

    if (result.success) {
      return res.status(200).json({
        success: true,
        data: {
          tracking_id: result.tracking_id,
          status: result.status,
          json_docs_url: result.json_docs_url,
          xlsx_docs_url: result.xlsx_docs_url,
          bsa_run: result.bsa_run
        }
      });
    } else {
      return res.status(400).json({
        success: false,
        error: result.error,
        details: result.details
      });
    }
  } catch (error) {
    console.error('Error checking BSA status:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

/**
 * GET /internal/aa/bsa/report/:report_id
 * Get BSA run by report ID
 */
router.get('/report/:report_id', async (req, res) => {
  try {
    const { report_id } = req.params;

    const bsaRun = await bsaService.getBSARunByReportId(report_id);

    if (!bsaRun) {
      return res.status(404).json({
        success: false,
        error: 'BSA run not found for this report'
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        tracking_id: bsaRun.tracking_id,
        status: bsaRun.status,
        json_docs_url: bsaRun.json_docs_url,
        xlsx_docs_url: bsaRun.xlsx_docs_url,
        bsa_run: bsaRun
      }
    });
  } catch (error) {
    console.error('Error fetching BSA run by report ID:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

module.exports = router;


