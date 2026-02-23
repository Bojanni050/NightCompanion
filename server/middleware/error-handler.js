const { AppError } = require('../lib/app-error');
const logger = require('../lib/logger');

function getGenericMessage(status) {
    switch (status) {
        case 404:
            return 'Niet gevonden';
        case 400:
            return 'Ongeldige aanvraag';
        default:
            return 'Serverfout';
    }
}

function errorMiddleware(err, req, res, next) {
    let statusCode = 500;
    let clientMessage = 'Er is een onverwachte fout opgetreden';
    let errorCode = 'INTERNAL_ERROR';

    if (err instanceof AppError) {
        statusCode = err.statusCode;
        clientMessage = err.safe ? err.message : getGenericMessage(err.statusCode);
        errorCode = err.code;
    }

    // Always log the full details securely
    logger.error('Error in request', {
        method: req.method,
        url: req.url,
        statusCode,
        code: errorCode,
        message: err.message,
        stack: err.stack,
        safe: err instanceof AppError ? err.safe : undefined
    });

    const response = {
        error: clientMessage,
        code: errorCode,
    };

    if (process.env.NODE_ENV === 'development') {
        response.debug = err.message;
        response.stack = err.stack;
    }

    res.status(statusCode).json(response);
}

module.exports = errorMiddleware;
