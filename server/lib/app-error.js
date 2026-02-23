class AppError extends Error {
    constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', safe = false) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.safe = safe;

        // Maintain proper stack trace for where our error was thrown (only available on V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, AppError);
        }
    }
}

const notFound = (resource) => new AppError(`${resource} niet gevonden`, 404, 'NOT_FOUND', true);
const validationError = (msg) => new AppError(msg, 400, 'VALIDATION_ERROR', true);
const dbError = (err) => new AppError('Database operatie mislukt', 500, 'DB_ERROR', false);

module.exports = {
    AppError,
    notFound,
    validationError,
    dbError
};
