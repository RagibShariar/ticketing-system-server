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
exports.sendEmail = void 0;
/* eslint-disable no-console */
const nodemailer_1 = __importDefault(require("nodemailer"));
const config_1 = require("../config");
const transporter = nodemailer_1.default.createTransport({
    host: config_1.config.smtp_host,
    port: Number(config_1.config.smtp_port),
    secure: false, // Use `true` for port 465, `false` for all other ports
    auth: {
        user: config_1.config.smtp_mail,
        pass: config_1.config.smtp_password,
    },
});
const sendEmail = (options) => __awaiter(void 0, void 0, void 0, function* () {
    const emailOptions = {
        from: config_1.config.smtp_mail, // sender address
        to: options.to, // list of receivers
        subject: options.subject, // Subject line
        // text: `OTP Verification", Your OTP is: ${otp}` // plain text body
        html: options.html, // html body
    };
    try {
        yield transporter.sendMail(emailOptions);
        console.log("✅ Email sent successfully");
    }
    catch (error) {
        console.error("Error sending email:", error);
        throw new Error("❌ Error sending email");
    }
});
exports.sendEmail = sendEmail;
