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
    const allFilesInGitArr = allFilesInGit.split("\n");
    console.log(
      `Received ${allFilesInGit.length} all files and ${filesModifiedInCommit.length} modified files`
    );

    const metaDataUpdated = allFilesInGitArr.reduce((acc, file) => {
      const isModified = filesModifiedArr.includes(file);
      const existingDate = metaParsed[file];
      if (isModified || !existingDate) {
        console.log(`Updating metadata for ${file} to new date`);
        acc[file] = new Date().toISOString();
      } else {
        acc[file] = existingDate;
      }
      return acc;
    }, {});

    const stringified = JSON.stringify(metaDataUpdated);
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
