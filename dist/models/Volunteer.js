"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const VolunteerSchema = new mongoose_1.default.Schema({
    name: { type: String, required: true },
    contact: { type: String, required: true },
    location: { type: String, required: true },
    skills: { type: String, required: true },
    availability: { type: String, required: true },
    preferredArea: { type: String },
    createdAt: { type: Date, default: Date.now }
});
exports.default = mongoose_1.default.model('Volunteer', VolunteerSchema);
