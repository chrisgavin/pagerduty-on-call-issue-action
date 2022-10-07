"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
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
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOnBusinessDay = exports.createIssueInAdvance = exports.minimumShiftLength = exports.issueTemplate = exports.pagerDutyICalendarURL = exports.githubRepository = void 0;
const core = __importStar(require("@actions/core"));
const moment_1 = __importDefault(require("moment"));
function githubRepository() {
    return core.getInput("github_repository", { required: true });
}
exports.githubRepository = githubRepository;
function pagerDutyICalendarURL() {
    return core.getInput("pagerduty_icalendar_url", { required: true });
}
exports.pagerDutyICalendarURL = pagerDutyICalendarURL;
function issueTemplate() {
    return core.getInput("issue_template", { required: true });
}
exports.issueTemplate = issueTemplate;
function minimumShiftLength() {
    return moment_1.default.duration(core.getInput("minimum_shift_length", { required: true }));
}
exports.minimumShiftLength = minimumShiftLength;
function createIssueInAdvance() {
    return moment_1.default.duration(core.getInput("create_issue_in_advance", { required: true }));
}
exports.createIssueInAdvance = createIssueInAdvance;
function createOnBusinessDay() {
    return core.getInput("create_on_business_day", { required: true }).toLowerCase() === "true";
}
exports.createOnBusinessDay = createOnBusinessDay;
//# sourceMappingURL=inputs.js.map