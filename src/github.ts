import * as core from "@actions/core";
import * as fs from "fs";
import * as mustache from "mustache";
import * as octokit from "@octokit/action";
import * as pagerduty from "./pagerduty";
import fm from "front-matter";

const client = new octokit.Octokit();

class IssueData {
	title: string;
	labels: string[];
	body: string;

	constructor(title:string, labels:string, body:string) {
		this.title = title;
		this.labels = labels.split(", ");
		this.body = body;
	}
}

function getRepository() {
	const repository = core.getInput("github_repository", {required: true}).split("/");
	return {repositoryOwner: repository[0], repositoryName: repository[1]};
}

export async function getExistingIssues() {
	const {repositoryOwner, repositoryName} = getRepository();
	return client.paginate(client.issues.listForRepo, {owner: repositoryOwner, repo: repositoryName, state: "all"});
}

interface TemplateAttributes {
	title: string;
	labels: string;
}

async function renderIssueTemplate(shift:pagerduty.OnCallShift) {
	const path = core.getInput("issue_template", {required: true});
	const template = await fs.promises.readFile(path);
	const {attributes, body} = fm<TemplateAttributes>(template.toString());
	const templateVariables = {
		start_date: shift.start.format("YYYY-MM-DD"),
		end_date: shift.end.format("YYYY-MM-DD"),
		assignee: shift.assignee(),
	}
	return new IssueData(mustache.render(attributes.title, templateVariables), attributes.labels, mustache.render(body, templateVariables));	
}

export async function createIssue(shift:pagerduty.OnCallShift) {
	const {repositoryOwner, repositoryName} = getRepository();
	const issueData = await renderIssueTemplate(shift);
	return client.issues.create({
		owner: repositoryOwner,
		repo: repositoryName,
		title: issueData.title,
		labels: issueData.labels,
		body: issueData.body + "\n" + shift.annotation(),
		assignee: shift.assignee(),
	});
}
