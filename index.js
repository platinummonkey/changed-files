const core = require('@actions/core');
const github = require('@actions/github');

try {
  // get action metadata inputs
  const separator = core.getInput('separator');
  const patternsToIgnore = core.getInput('ignore_file_patterns');
  const patternsToFocus = core.getInput('only_file_patterns');


  


  // Get the JSON webhook payload for the event that triggered the workflow
  const payload = JSON.stringify(github.context.payload, undefined, 2)
} catch (error) {
  core.setFailed(error.message);
}
