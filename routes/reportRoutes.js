const express = require('express');
const router = express.Router();
const reportService = require('../services/fi/reportService');

/**
 * POST /internal/aa/reports/retrieve
 * Retrieve report from Saafe and store in database
 */
router.post('/retrieve', async (req, res) => {
  try {
    const { txn_id, internal_user_id, report_type, report_category } = req.body;

    // Validate required fields
    if (!txn_id) {
      return res.status(400).json({
        success: false,
        error: 'txn_id is required'
      });
    }

    // Retrieve report
    const result = await reportService.retrieveReport(txn_id, {
      report_type: report_type || 'json',
      report_category: report_category || 'bank',
      internal_user_id: internal_user_id
    });

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: 'Report retrieved and stored successfully',
        data: {
          report_id: result.report_id,
          txn_id: result.txn_id,
          report_type: result.report_type,
          status: result.status,
          report_data: result.report_data
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
    console.error('Error in report retrieval:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
});

/**
 * GET /internal/aa/reports/:txn_id
 * Get stored report by txn_id
 */
router.get('/:txn_id', async (req, res) => {
  try {
    const { txn_id } = req.params;

    const report = await reportService.getReportByTxnId(txn_id);

    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        report_id: report._id,
        txn_id: report.txn_id,
        report_type: report.report_type,
        status: report.status,
        report_data: report.json_data || report.report_data,
        retrieved_at: report.retrieved_at,
        metadata: report.metadata
      }
    });
  } catch (error) {
    console.error('Error fetching report:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

module.exports = router;

