"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const VoteSchema = new mongoose_1.Schema({
    studentId: { type: String, required: true },
    studentName: { type: String, required: true },
    option: { type: String, required: true },
    votedAt: { type: Date, default: Date.now },
    isCorrect: { type: Boolean },
    score: { type: Number, default: 0 },
});
const PollResultSchema = new mongoose_1.Schema({
    option: { type: String, required: true },
    count: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    textResponses: [{ type: String }],
});
const PollSchema = new mongoose_1.Schema({
    question: { type: String, required: true },
    type: {
        type: String,
        enum: ['mcq', 'truefalse', 'rating', 'openended'],
        default: 'mcq',
    },
    options: [{ type: String }],
    correctAnswer: { type: String },
    isAnonymous: { type: Boolean, default: false },
    timer: { type: Number, required: true, min: 5, max: 300 },
    roomCode: { type: String, required: true, index: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date },
    status: { type: String, enum: ['active', 'completed'], default: 'active' },
    votes: [VoteSchema],
    results: [PollResultSchema],
}, { timestamps: true });
exports.default = mongoose_1.default.model('Poll', PollSchema);
//# sourceMappingURL=Poll.js.map