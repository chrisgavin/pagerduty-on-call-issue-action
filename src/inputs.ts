import * as core from "@actions/core";
import {default as moment} from "moment";

export function githubRepository() {
	return core.getInput("github_repository", {required: true});
}

export function pagerDutyICalendarURL() {
	return core.getInput("pagerduty_icalendar_url", {required: true});
}

export function issueTemplate() {
	return core.getInput("issue_template", {required: true});
}

export function minimumShiftLength() {
	return moment.duration(core.getInput("minimum_shift_length", {required: true}));
}

export function createIssueInAdvance() {
	return moment.duration(core.getInput("create_issue_in_advance", {required: true}));
}

export function createOnBusinessDay() {
	return core.getInput("create_on_business_day", {required: true}).toLowerCase() === "true";
}
