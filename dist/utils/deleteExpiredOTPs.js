"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_cron_1 = __importDefault(require("node-cron"));
const prisma_1 = __importDefault(require("../shared/prisma"));
// Schedule the task to run every minute to check for expired OTPs
node_cron_1.default.schedule('* * * * *', () => __awaiter(void 0, void 0, void 0, function* () {
    console.log('Running cron job to delete expired OTPs...');
    const now = new Date();
    try {
        // Delete OTP records where the expiresAt time has passed
        const result = yield prisma_1.default.oTPVerification.deleteMany({
            where: {
                expiresAt: {
                    lt: now, // Less than the current time
                },
            },
        });
        console.log(`Deleted ${result.count} expired OTP records.`);
    }
    catch (error) {
        console.error('Error deleting expired OTPs:', error);
    }
}));
