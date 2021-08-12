const core = require('@actions/core');
const github = require('@actions/github');

const main = async () => {
  try {
    const { INVITE_TOKEN } = process.env;
    const repoToken = core.getInput('repo-token', { required: true });

    if (!INVITE_TOKEN) {
      return core.setFailed('ENV required and not supplied: INVITE_TOKEN');
    }
    const octokit = github.getOctokit(INVITE_TOKEN);
    const client = github.getOctokit(repoToken);

    const { payload } = github.context;
    const inviteeId = payload.issue.user.id;
    const currentLabel = payload.label.name;

    const org = core.getInput('organization', { required: true });
    const label = core.getInput('label', { required: true });
    const comment = core.getInput('comment');

    // if (currentLabel === label) {    //改成无条件邀请
      try {
        await octokit.orgs.checkMembership({
          org,
          username: payload.issue.user.login,
        });
      } catch (error) {
        await octokit.orgs.createInvitation({
          org,
          invitee_id: inviteeId,
        });
        core.info('Invitation sent successfully 🎉🎉');

        core.info('Adding a comment before closing the issue');
        await client.issues.createComment({
          owner: payload.repository.owner.login,
          repo: payload.repository.name,
          issue_number: payload.issue.number,
          body: comment,
        });

        core.info('Closing the issue');
        await client.issues.update({
          owner: payload.repository.owner.login,
          repo: payload.repository.name,
          issue_number: payload.issue.number,
          state: 'closed',
        });
      }
    // }
  } catch (error) {
    return core.setFailed(error.message);
  }
  return core.setOutput('Invitation sent successfully 🎉🎉');
};
main();
