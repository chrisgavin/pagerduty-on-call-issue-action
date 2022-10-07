import * as inputs from "./../src/inputs";
import * as pagerduty from "./../src/pagerduty";
import * as sinon from "sinon";
import {default as moment} from "moment"

describe("test getOnCallShifts()", () => {
	it("should correctly parse the file", async () => {
		sinon.stub(inputs, "minimumShiftLength").returns(moment.duration(23, "hours"));
		sinon.stub(inputs, "pagerDutyICalendarURL").returns("file://./tests/fixtures/schedule-with-cover.ics");
		const shifts = await pagerduty.getOnCallShifts();

		expect(shifts.length).toBe(3);

		expect(shifts[0].id).toBe("Q0DR9KA5FQMJ34");
		expect(shifts[0].email).toBe("user1@example.com");
		expect(shifts[0].start.toISOString()).toEqual("2021-02-16T16:00:00.000Z");
		expect(shifts[0].end.toISOString()).toEqual("2021-02-18T16:00:00.000Z");

		expect(shifts[1].id).toBe("Q0QHV7O3JFOT61");
		expect(shifts[1].email).toBe("user2@example.com");
		expect(shifts[1].start.toISOString()).toEqual("2021-02-18T16:00:00.000Z");
		expect(shifts[1].end.toISOString()).toEqual("2021-02-19T16:00:00.000Z");

		expect(shifts[2].id).toBe("Q01NDTM216A08L");
		expect(shifts[2].email).toBe("user1@example.com");
		expect(shifts[2].start.toISOString()).toEqual("2021-02-19T16:00:00.000Z");
		expect(shifts[2].end.toISOString()).toEqual("2021-02-22T16:00:00.000Z");
	});

	it("should ignore shifts that are too short", async () => {
		sinon.stub(inputs, "minimumShiftLength").returns(moment.duration(24, "hours"));
		sinon.stub(inputs, "pagerDutyICalendarURL").returns("file://./tests/fixtures/schedule-with-cover.ics");
		const shifts = await pagerduty.getOnCallShifts();

		expect(shifts.length).toBe(1);

		expect(shifts[0].id).toBe("Q0DR9KA5FQMJ34");
		expect(shifts[0].email).toBe("user1@example.com");
		expect(shifts[0].start.toISOString()).toEqual("2021-02-16T16:00:00.000Z");
		expect(shifts[0].end.toISOString()).toEqual("2021-02-22T16:00:00.000Z");
	});

	it("should return sensible annotations for shifts and allow them to move by up to a day", async () => {
		sinon.stub(inputs, "minimumShiftLength").returns(moment.duration(24, "hours"));
		sinon.stub(inputs, "pagerDutyICalendarURL").returns("file://./tests/fixtures/schedule-with-cover.ics");
		const shifts = await pagerduty.getOnCallShifts();

		expect(shifts.length).toBe(1);

		expect(shifts[0].annotation()).toBe("<!-- pagerduty-on-call-issue-action: user1@example.com-2021-02-16 -->");
		expect(shifts[0].alternativeAnnotations()).toEqual([
			"<!-- pagerduty-on-call-issue-action: user1@example.com-2021-02-16 -->",
			"<!-- pagerduty-on-call-issue-action: user1@example.com-2021-02-15 -->",
			"<!-- pagerduty-on-call-issue-action: user1@example.com-2021-02-17 -->",
			"<!-- pagerduty-on-call-issue-action: Q0DR9KA5FQMJ34 -->",
		]);
	});

	it("should still take short shifts into account when merging shifts", async () => {
		sinon.stub(inputs, "minimumShiftLength").returns(moment.duration(24, "hours"));
		sinon.stub(inputs, "pagerDutyICalendarURL").returns("file://./tests/fixtures/schedule-with-cover-near-start.ics");
		const shifts = await pagerduty.getOnCallShifts();

		expect(shifts.length).toBe(1);

		expect(shifts[0].id).toBe("Q0DR9KA5FQMJ34");
		expect(shifts[0].email).toBe("user1@example.com");
		expect(shifts[0].start.toISOString()).toEqual("2021-02-16T16:00:00.000Z");
		expect(shifts[0].end.toISOString()).toEqual("2021-02-22T16:00:00.000Z");
	});
});

afterEach(function () {
	sinon.restore();
});
