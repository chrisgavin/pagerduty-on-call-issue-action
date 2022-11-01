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
const core = __importStar(require("@actions/core"));
const github = __importStar(require("./github"));
const inputs = __importStar(require("./inputs"));
const pagerduty = __importStar(require("./pagerduty"));
const moment_1 = __importDefault(require("moment"));
async function main() {
    const createIssueInAdvance = inputs.createIssueInAdvance();
    const createOnBusinessDay = inputs.createOnBusinessDay();
    const pagerdutyShifts = await pagerduty.getOnCallShifts();
    const existingIssues = await github.getExistingIssues();
    for (const shift of pagerdutyShifts) {
        console.log(`${shift.id} - ${shift.email} (@${shift.assignee()}) - ${shift.start} - ${shift.end}`);
        if (shift.end < (0, moment_1.default)()) {
            console.log("Not making an issue. Shift is already over.");
            continue;
        }
        let shouldCreateIssueAfter = shift.start.clone();
        shouldCreateIssueAfter = shouldCreateIssueAfter.subtract(createIssueInAdvance);
        while (createOnBusinessDay && shouldCreateIssueAfter.isoWeekday() >= 6) {
            shouldCreateIssueAfter = shouldCreateIssueAfter.subtract(moment_1.default.duration(1, "days"));
        }
        if ((0, moment_1.default)() < shouldCreateIssueAfter) {
            console.log(`Not making an issue. The issue for this shift should be created after ${shouldCreateIssueAfter.toISOString()}.`);
            continue;
        }
        const matchingExistingIssues = existingIssues.filter(issue => shift.alternativeAnnotations().some(annotation => issue.body?.includes(annotation)));
        if (matchingExistingIssues.length > 0) {
            console.log(`Not making an issue. One already exists with number #${matchingExistingIssues[0].number}.`);
            continue;
        }
        console.log("Creating issue.");
        const issue = await github.createIssue(shift);
        console.log(`Created issue #${issue.data.number}.`);
    }
}
main().catch(error => core.setFailed(error.stack));
//# sourceMappingURL=index.js.map