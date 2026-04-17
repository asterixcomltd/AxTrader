// AxTrader Form Validation Utilities

const VALIDATORS = {
  required: (value) => value !== '' && value !== null && value !== undefined,
  email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
  min: (value, min) => (value || '').length >= min,
  max: (value, max) => (value || '').length <= max,
  password: (value) => (value || '').length >= 8,
  url: (value) => /^(https?:\/\/)[^\s$.?#].[^\s]*$/i.test(value),
  phone: (value) => /^[+]?[\d\s()-]{6,}$/.test(value),
};

const MESSAGES = {
  required: 'This field is required',
  email: 'Please enter a valid email address',
  min: (min) => `Must be at least ${min} characters`,
  max: (max) => `Must be no more than ${max} characters`,
  password: 'Password must be at least 8 characters',
  url: 'Please enter a valid URL',
  phone: 'Please enter a valid phone number',
};

/**
 * Validate a single field against its rules.
 * @param {string} value - The field value
 * @param {object} rules - Validation rules (e.g. { required: true, email: true })
 * @returns {object} { valid: boolean, errors: string[] }
 */
export function validateField(value, rules) {
  const errors = [];
  for (const [rule, param] of Object.entries(rules)) {
    const validator = VALIDATORS[rule];
    if (!validator) continue;
    const valid = validator(value, param);
    if (!valid) {
      const message = typeof MESSAGES[rule] === 'function'
        ? MESSAGES[rule](param)
        : MESSAGES[rule];
      errors.push(message);
    }
  }
  return { valid: errors.length === 0, errors };
}

/**
 * Validate an entire form at once.
 * @param {object} fields - { fieldName: { value, rules } }
 * @returns {object} { valid: boolean, errors: { fieldName: string[] } }
 */
export function validateForm(fields) {
  const errors = {};
  let valid = true;
  for (const [fieldName, config] of Object.entries(fields)) {
    const result = validateField(config.value, config.rules || {});
    if (!result.valid) {
      valid = false;
      errors[fieldName] = result.errors;
    }
  }
  return { valid, errors };
}

/**
 * Show validation errors next to form fields.
 */
export function showFieldErrors(fieldId, errors, errorElSelector) {
  const errorEl = document.querySelector(`#${errorElSelector || `${fieldId}-error`}`);
  if (errorEl) {
    errorEl.textContent = errors.join(', ');
    errorEl.style.display = 'block';
  }
}

/**
 * Clear validation errors for a field.
 */
export function clearFieldError(fieldId, errorElSelector) {
  const errorEl = document.querySelector(`#${errorElSelector || `${fieldId}-error`}`);
  if (errorEl) {
    errorEl.textContent = '';
    errorEl.style.display = 'none';
  }
}
