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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOnCallShifts = exports.OnCallShift = void 0;
const ical = __importStar(require("node-ical"));
const inputs = __importStar(require("./inputs"));
const moment_1 = __importDefault(require("moment"));
const FILE_URL_PREFIX = "file://";
class OnCallShift {
    constructor(event) {
        this.id = event.uid.substr(0, 14);
        this.email = event.attendee;
        this.start = (0, moment_1.default)(event.start);
        this.end = (0, moment_1.default)(event.end);
    }
    duration() {
        return moment_1.default.duration(this.end.diff(this.start));
    }
    assignee() {
        return this.email.split("@")[0];
    }
    annotation() {
        return `<!-- pagerduty-on-call-issue-action: ${this.email}-${this.start.format("YYYY-MM-DD")} -->`;
    }
    alternativeAnnotations() {
        return [
            this.annotation(),
            `<!-- pagerduty-on-call-issue-action: ${this.email}-${this.start.clone().subtract(1, "day").format("YYYY-MM-DD")} -->`,
            `<!-- pagerduty-on-call-issue-action: ${this.email}-${this.start.clone().add(1, "day").format("YYYY-MM-DD")} -->`,
            `<!-- pagerduty-on-call-issue-action: ${this.id} -->`,
        ];
    }
}
exports.OnCallShift = OnCallShift;
async function getRawCalendarData() {
    const pagerDutyICalendarURL = inputs.pagerDutyICalendarURL();
    if (pagerDutyICalendarURL.startsWith(FILE_URL_PREFIX)) {
        return ical.parseFile(pagerDutyICalendarURL.replace(FILE_URL_PREFIX, ""));
    }
    return await ical.fromURL(inputs.pagerDutyICalendarURL());
}
async function getRawOnCallShifts() {
    return Object.values(await getRawCalendarData())
        .filter(event => event.type === "VEVENT")
        .map(event => new OnCallShift(event))
        .sort((a, b) => a.start.unix() - b.start.unix());
}
async function getOnCallShifts() {
    const minimumShiftLength = inputs.minimumShiftLength();
    let shifts = await getRawOnCallShifts();
    // Filter out any shifts shorter than the minimum shift length.
    const filteredShifts = [];
    shifts.forEach((shift, index) => {
        if (shift.duration() > minimumShiftLength) {
            filteredShifts.push(shift);
        }
        else {
            // If the shift is shorter than the minimum shift length, we may still want to include it so long as the next shift that is longer than the minimum shift length is assigned to the same person.
            for (const nextShift of shifts.slice(index + 1)) {
                if (nextShift.duration() > minimumShiftLength) {
                    if (shift.email === nextShift.email) {
                        filteredShifts.push(shift);
                    }
                    break;
                }
            }
        }
    });
    // Combine any now adjacent shifts by the same person.
    const combinedShifts = [];
    let previousShift = undefined;
    for (const shift of filteredShifts) {
        if (previousShift !== undefined && shift.email === previousShift.email) {
            previousShift.end = shift.end;
        }
        else {
            combinedShifts.push(shift);
        }
        previousShift = shift;
    }
    shifts = combinedShifts;
    return shifts;
}
exports.getOnCallShifts = getOnCallShifts;
//# sourceMappingURL=pagerduty.js.map