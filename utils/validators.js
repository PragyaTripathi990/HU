/**
 * Validation utilities for consent generation
 * Validates input fields according to Saafe TSP API requirements
 */

/**
 * Validate mobile number (10 digits)
 */
function validateMobileNumber(mobile) {
  if (!mobile || typeof mobile !== 'string') {
    return { valid: false, error: 'Mobile number is required and must be a string' };
  }
  
  const mobileRegex = /^[6-9]\d{9}$/;
  if (!mobileRegex.test(mobile)) {
    return { valid: false, error: 'Mobile number must be 10 digits starting with 6-9' };
  }
  
  return { valid: true };
}

/**
 * Validate email format
 */
function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email must be a string' };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Invalid email format' };
  }
  
  return { valid: true };
}

/**
 * Validate date format (YYYY-MM-DD)
 */
function validateDate(dateString, fieldName = 'Date') {
  if (!dateString || typeof dateString !== 'string') {
    return { valid: false, error: `${fieldName} must be a string in YYYY-MM-DD format` };
  }
  
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) {
    return { valid: false, error: `${fieldName} must be in YYYY-MM-DD format` };
  }
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return { valid: false, error: `${fieldName} is not a valid date` };
  }
  
  return { valid: true };
}

/**
 * Validate PAN number (10 characters, alphanumeric)
 */
function validatePAN(pan) {
  if (!pan || typeof pan !== 'string') {
    return { valid: false, error: 'PAN must be a string' };
  }
  
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  if (!panRegex.test(pan.toUpperCase())) {
    return { valid: false, error: 'PAN must be in format: ABCDE1234F' };
  }
  
  return { valid: true };
}

/**
 * Validate FI types array
 */
function validateFITypes(fiTypes) {
  if (!Array.isArray(fiTypes) || fiTypes.length === 0) {
    return { valid: false, error: 'FI types must be a non-empty array' };
  }
  
  const validFITypes = [
    'DEPOSIT',
    'TERM_DEPOSIT',
    'RECURRING_DEPOSIT',
    'MUTUAL_FUNDS',
    'EQUITY',
    'INSURANCE',
    'EPFO',
    'GST',
    'ITR'
  ];
  
  for (const fiType of fiTypes) {
    if (!validFITypes.includes(fiType)) {
      return { valid: false, error: `Invalid FI type: ${fiType}. Valid types: ${validFITypes.join(', ')}` };
    }
  }
  
  return { valid: true };
}

/**
 * Validate delivery mode array
 */
function validateDeliveryMode(deliveryMode) {
  if (!Array.isArray(deliveryMode)) {
    return { valid: false, error: 'Delivery mode must be an array' };
  }
  
  const validModes = ['SMS', 'EMAIL', 'WHATSAPP'];
  for (const mode of deliveryMode) {
    if (!validModes.includes(mode)) {
      return { valid: false, error: `Invalid delivery mode: ${mode}. Valid modes: ${validModes.join(', ')}` };
    }
  }
  
  return { valid: true };
}

/**
 * Validate FIP IDs array
 */
function validateFIPIds(fipIds) {
  if (!Array.isArray(fipIds)) {
    return { valid: false, error: 'FIP IDs must be an array' };
  }
  
  for (const fipId of fipIds) {
    if (typeof fipId !== 'string' || fipId.trim().length === 0) {
      return { valid: false, error: 'Each FIP ID must be a non-empty string' };
    }
  }
  
  return { valid: true };
}

module.exports = {
  validateMobileNumber,
  validateEmail,
  validateDate,
  validatePAN,
  validateFITypes,
  validateDeliveryMode,
  validateFIPIds
};

