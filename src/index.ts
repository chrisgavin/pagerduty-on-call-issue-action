import * as core from "@actions/core";
import * as github from "./github";
import * as pagerduty from "./pagerduty";
import {default as moment} from "moment";

async function main() {
	const createIssueInAdvance = moment.duration(core.getInput("create_issue_in_advance", {required: true}));
	const pagerdutyShifts = await pagerduty.getOnCallShifts();
	const existingIssues = await github.getExistingIssues();
	for (const shift of pagerdutyShifts) {
		console.log(`${shift.id} - ${shift.email} (@${shift.assignee()}) - ${shift.start} - ${shift.end}`);
		if (shift.end < moment()) {
			console.log("Not making an issue. Shift is already over.");
			continue;
		}
		if (shift.start > moment().add(createIssueInAdvance)) {
			console.log(`Not making an issue. Shift starts in more than ${createIssueInAdvance.toISOString()}.`);
			continue;
		}
		const matchingExistingIssues = existingIssues.filter(issue => issue.body?.includes(shift.annotation()));
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
