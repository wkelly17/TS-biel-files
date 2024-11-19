const core = require("@actions/core");
const github = require("@actions/github");

async function run() {
  try {
    // `who-to-greet` input defined in action metadata file
    const accessToken = core.getInput("token");
    const octokit = github.getOctokit(accessToken);
    const allFilesInGit = core.getInput("all-files");
    const filesModifiedInCommit = core.getInput("files-modified");
    const exisitingMetadataJson = core.getInput("existing-meta");

    const metaParsed = JSON.parse(exisitingMetadataJson); //Record<string string>
    const filesModifiedArr = filesModifiedInCommit.split("\n");
    const allFilesInGitArr = filesModifiedInCommit.split("\n");
    console.log(
      `Received ${allFilesInGit.length} all files and ${filesModifiedInCommit.length} modified files`
    );

    const metadataUpdated = Object.entries(metaParsed).reduce(
      (acc, [key, value]) => {
        if (!allFilesInGitArr.includes(key)) {
          // If this key is in the metadata but not our project any more, don't return it;
          return acc;
        }
        if (filesModifiedArr.includes(key)) {
          //file has been updated;
          acc[key] = new Date().toISOString();
          return acc;
        }
        // file has not been updated
        acc[key] = value;
        return acc;
      },
      {}
    );
    const stringified = JSON.stringify(metadataUpdated);
    if (stringified !== exisitingMetadataJson) {
      const existingMeta = await octokit.rest.repos.getContent({
        ...github.context.repo,
        path: "metadata.json",
      });

      // commit if the metadata has changed
      // https://docs.github.com/en/rest/repos/contents?apiVersion=2022-11-28#create-or-update-file-contents
      await octokit.rest.repos.createOrUpdateFileContents({
        ...github.context.repo,
        path: "metadata.json",
        message: "Automated Update of metadata.json with latest file dates",
        content: Buffer.from(stringified).toString("base64"),
        sha: existingMeta.data.sha,
        committer: {
          name: "github-actions[bot]",
          email: "github-actions@users.noreply.github.com",
        },
      });
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
