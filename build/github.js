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
exports.createIssue = exports.getExistingIssues = void 0;
const fs = __importStar(require("fs"));
const mustache = __importStar(require("mustache"));
const octokit = __importStar(require("@octokit/action"));
const inputs = __importStar(require("./inputs"));
const front_matter_1 = __importDefault(require("front-matter"));
const client = new octokit.Octokit();
class IssueData {
    constructor(title, labels, body) {
        this.title = title;
        this.labels = labels.split(", ");
        this.body = body;
    }
}
function getRepository() {
    const repository = inputs.githubRepository().split("/");
    return { repositoryOwner: repository[0], repositoryName: repository[1] };
}
async function getExistingIssues() {
    const { repositoryOwner, repositoryName } = getRepository();
    return client.paginate(client.issues.listForRepo, { owner: repositoryOwner, repo: repositoryName, state: "all" });
}
exports.getExistingIssues = getExistingIssues;
async function renderIssueTemplate(shift) {
    const path = inputs.issueTemplate();
    const template = await fs.promises.readFile(path);
    const { attributes, body } = (0, front_matter_1.default)(template.toString());
    const templateVariables = {
        start_date: shift.start.format("YYYY-MM-DD"),
        end_date: shift.end.format("YYYY-MM-DD"),
        assignee: shift.assignee(),
    };
    return new IssueData(mustache.render(attributes.title, templateVariables), attributes.labels, mustache.render(body, templateVariables));
}
async function createIssue(shift) {
    const { repositoryOwner, repositoryName } = getRepository();
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
exports.createIssue = createIssue;
//# sourceMappingURL=github.js.map