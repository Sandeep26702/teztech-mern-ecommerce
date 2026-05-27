import { body, validationResult } from "express-validator";

/**
 * Middleware to intercept and format validation errors
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map((err) => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

/**
 * Validation chain for registration
 */
export const validateRegister = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").trim().isEmail().withMessage("Please provide a valid email address"),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters long"),
  handleValidationErrors
];

/**
 * Validation chain for login
 */
export const validateLogin = [
  body("email").trim().isEmail().withMessage("Please provide a valid email address"),
  body("password").notEmpty().withMessage("Password is required"),
  handleValidationErrors
];

/**
 * Validation chain for forgot password
 */
export const validateForgotPassword = [
  body("email").trim().isEmail().withMessage("Please provide a valid email address"),
  handleValidationErrors
];

/**
 * Validation chain for reset password
 */
export const validateResetPassword = [
  body("password").isLength({ min: 6 }).withMessage("New password must be at least 6 characters long"),
  handleValidationErrors
];
