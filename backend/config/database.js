"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDatabase = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const connectDatabase = async () => {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/live-polling';
    mongoose_1.default.connection.on('connected', () => {
        console.log('MongoDB connected');
    });
    mongoose_1.default.connection.on('error', (err) => {
        console.error('MongoDB error:', err);
    });
    mongoose_1.default.connection.on('disconnected', () => {
        console.log('MongoDB disconnected');
    });
    try {
        await mongoose_1.default.connect(uri);
    }
    catch (error) {
        console.error('Failed to connect to MongoDB:', error);
        process.exit(1);
    }
};
exports.connectDatabase = connectDatabase;
//# sourceMappingURL=database.js.map