// ==========================================
//      MIDDLEWARE FUNCTIONS
// ==========================================
// Reusable middleware for request validation and error handling

// ==========================================
//      EMPLOYEE ID VALIDATION
// ==========================================
// Validates and extracts employee ID from request
const validateEmpId = (req, res, next) => {
    const { emp_id } = req.query || req.params;
    
    // Validation: Check for non-empty employee ID
    if (!emp_id || emp_id.trim() === '') {
        return res.status(400).json({ message: "Employee ID required" });
    }
    
    // Attach to request for downstream use
    req.empId = emp_id.trim();
    next();
};

// ==========================================
//      GLOBAL ERROR HANDLER
// ==========================================
// Centralized error handling middleware
const errorHandler = (err, req, res, next) => {
    console.error(err);
    res.status(err.status || 500).json({ 
        message: err.message || "Internal Server Error" 
    });
};

// ==========================================
//      EXPORT MIDDLEWARE
// ==========================================
module.exports = { validateEmpId, errorHandler };

// ==========================================
//      USAGE EXAMPLE
// ==========================================
// const { validateEmpId } = require('./middleware');
// router.get('/endpoint', validateEmpId, (req, res) => {
//   const empId = req.empId;
// });