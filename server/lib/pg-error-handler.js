const { AppError, validationError, dbError } = require('./app-error');

function handlePgError(err) {
    if (!err || !err.code) {
        // If it's not a Postgres error, treat it as a generic DB error or pass it through
        return err instanceof AppError ? err : dbError(err);
    }

    switch (err.code) {
        case '23505': // unique_violation
            return validationError('Dit item bestaat al');
        case '23503': // foreign_key_violation
            return validationError('Item is in gebruik en kan niet verwijderd worden');
        case '23502': // not_null_violation
            return validationError(`Verplicht veld ontbreekt: ${err.column}`);
        case '42P01': // undefined_table
            return new AppError('Tabel niet gevonden', 500, 'SCHEMA_ERROR', false);
        default:
            return dbError(err);
    }
}

module.exports = {
    handlePgError
};
