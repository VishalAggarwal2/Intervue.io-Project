"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFound = exports.errorHandler = void 0;
const errorHandler = (err, req, res, 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
_next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ success: false, message: err.message || 'Internal server error' });
};
exports.errorHandler = errorHandler;
const notFound = (req, res) => {
    res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
};
exports.notFound = notFound;
//# sourceMappingURL=errorHandler.js.map