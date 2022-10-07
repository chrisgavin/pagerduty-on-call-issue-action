import * as core from "@actions/core";
import * as ical from "node-ical";
import * as inputs from "./inputs";
import {default as moment} from "moment";

const FILE_URL_PREFIX = "file://";

export class OnCallShift {
	id: string;
	email: string;
	start: moment.Moment;
	end: moment.Moment;

	constructor(event:ical.CalendarComponent) {
		this.id = (event.uid as string).substr(0, 14);
		this.email = (event as any).attendee;
		this.start = moment(event.start as Date);
		this.end = moment(event.end as Date);
	}

	duration() {
		return moment.duration(this.end.diff(this.start));
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

export async function getOnCallShifts() {
	const minimumShiftLength = inputs.minimumShiftLength();
	let shifts = await getRawOnCallShifts();
	// Filter out any shifts shorter than the minimum shift length.
	const filteredShifts: OnCallShift[] = [];
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
