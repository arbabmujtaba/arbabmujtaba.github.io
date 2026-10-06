/**
 * The publishing pipeline, end to end, against a throwaway repository.
 *
 * Guards the three ways publishing used to "stick":
 *  - POST /api/publish waited for the whole pipeline before replying → start()
 *    must hand back a job before any git work happens;
 *  - a push waiting on a hidden credential prompt ran for ever → a git process
 *    that goes quiet is killed, the job fails with a hint, and the push can be
 *    retried once the remote is fixed;
 *  - a failure "rolled back" with `git checkout -- <file>`, discarding the edit
 *    the author had just saved → the file must be left exactly as written.
 *
 * Nothing here touches the real repository or the network: the remote is a
 * local bare repo, and the "hanging" remote is an ssh command that just sleeps.
 */
import { execFileSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

let passed = 0;
let failed = 0;
function check(name: string, condition: boolean, detail = '') {
  if (condition) {
    passed += 1;
    console.log(`  ✓ ${name}`);
  } else {
    failed += 1;
    console.error(`  ✗ ${name} ${detail}`);
  }
}

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'publish-test-'));
const work = path.join(root, 'site');
const remote = path.join(root, 'remote.git');
const git = (...args: string[]) => execFileSync('git', args, { cwd: work, encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();

fs.mkdirSync(path.join(work, 'content', 'journal'), { recursive: true });
fs.mkdirSync(path.join(work, 'content', 'portfolio'), { recursive: true });
fs.mkdirSync(path.join(work, 'public', 'uploads', 'journal'), { recursive: true });
execFileSync('git', ['init', '-q', '--bare', remote]);
execFileSync('git', ['init', '-q', '-b', 'main', work]);
git('config', 'user.name', 'Test');
git('config', 'user.email', 'test@example.invalid');
git('config', 'commit.gpgsign', 'false');
git('config', 'core.hooksPath', '/dev/null');
fs.writeFileSync(path.join(work, 'README.md'), 'test\n');
git('add', 'README.md');
git('commit', '-q', '-m', 'init');
git('remote', 'add', 'origin', remote);
git('push', '-q', '-u', 'origin', 'main');

process.chdir(work);
process.env.GIT_TIMEOUT_MS = '1500';

async function main() {
  const { classifyPushError } = await import('../src/services/GitService');
  const { ValidationService } = await import('../src/services/ValidationService');
  const { PublishingService, collectUploadRefs } = await import('../src/services/PublishingService');

  console.log('push errors');
  check('auth prompt → PUSH_AUTH', classifyPushError("fatal: could not read Username for 'https://github.com': terminal prompts disabled") === 'PUSH_AUTH');
  check('bad token → PUSH_AUTH', classifyPushError('remote: Invalid username or password.\nfatal: Authentication failed') === 'PUSH_AUTH');
  check('non-fast-forward → PUSH_REJECTED', classifyPushError(' ! [rejected]        main -> main (fetch first)') === 'PUSH_REJECTED');
  check('DNS → PUSH_NETWORK_ERROR', classifyPushError("fatal: unable to access '…': Could not resolve host: github.com") === 'PUSH_NETWORK_ERROR');
  check('block timeout → PUSH_TIMEOUT', classifyPushError('block timeout reached') === 'PUSH_TIMEOUT');

  console.log('media references');
  const refs = collectUploadRefs(
    { video: '/uploads/home/a.webm', videoPoster: '/uploads/home/a.webp', image: '/uploads/x.webp?v=2', nested: { list: ['/uploads/y.png'] }, link: 'https://x' },
    'text ![a](/uploads/body.webp) <img src="/uploads/raw.jpg">'
  );
  for (const ref of ['/uploads/home/a.webm', '/uploads/home/a.webp', '/uploads/x.webp', '/uploads/y.png', '/uploads/body.webp', '/uploads/raw.jpg']) {
    check(`collects ${ref}`, refs.includes(ref), JSON.stringify(refs));
  }

  console.log('validation');
  const v = new ValidationService();
  check('portfolio needs no date', v.validateMetadata({ title: 'P' }, 'portfolio').valid);
  check('home reel is publishable', v.validateMetadata({ title: 'Reel', configType: 'reel' }, 'home').valid);
  check('timeline/secrets/gear/favorites publishable', ['timeline', 'secrets', 'gear', 'favorites'].every((c) => v.validateMetadata({ title: 'T' }, c).valid));
  check('journal still needs a date', !v.validateMetadata({ title: 'J' }, 'journal').valid);
  check('a YAML Date is a date', v.validateMetadata({ title: 'J', date: new Date('2026-10-06') }, 'journal').valid);
  check('unknown collection rejected', !v.validateMetadata({ title: 'J' }, 'nope').valid);

  console.log('pipeline: success');
  const service = new PublishingService();
  const body = 'Hello.\n';
  const job = service.start({
    collection: 'journal',
    slug: 'first-light',
    title: 'First light',
    body,
    frontmatter: { title: 'First light', date: '2026-10-06', slug: 'first-light' },
  });
  check('start() returns before any step has finished', job.steps.every((s) => s.status === 'pending'), JSON.stringify(job.steps.map((s) => s.status)));
  const again = service.start({ collection: 'journal', slug: 'first-light', title: 'First light', body, frontmatter: { title: 'First light', date: '2026-10-06' } });
  check('a double publish returns the same job', again.id === job.id);
  await service.whenDone(job.id);
  check('job succeeded', job.status === 'success', `${job.status}: ${job.error}`);
  check('commit hash recorded', !!job.commitHash);
  const remoteLog = execFileSync('git', ['--git-dir', remote, 'log', '--oneline', '-1', 'main'], { encoding: 'utf-8' });
  check('the commit reached the remote', remoteLog.includes('Published: First light'), remoteLog);
  check('every step reported', job.steps.filter((s) => s.step !== 'complete').every((s) => s.status === 'success' || s.status === 'skipped'));

  console.log('pipeline: file name differs from slug');
  fs.writeFileSync(path.join(work, 'content', 'portfolio', 'old-name.md'), '---\ntitle: Renamed\nslug: new-slug\n---\nx\n');
  git('add', '.');
  git('commit', '-q', '-m', 'add project');
  const renamed = await service.publish({
    collection: 'portfolio',
    slug: 'new-slug',
    title: 'Renamed',
    body: 'y\n',
    frontmatter: { title: 'Renamed', slug: 'new-slug' },
    filePath: path.join(work, 'content', 'portfolio', 'old-name.md'),
  });
  check('publishes into the existing file', renamed.status === 'success' && !fs.existsSync(path.join(work, 'content', 'portfolio', 'new-slug.md')), renamed.error);

  console.log('pipeline: validation failure keeps the saved edit');
  const draftPath = path.join(work, 'content', 'journal', 'first-light.md');
  const edited = '---\ntitle: First light\n---\nAn edit the author just saved.\n';
  fs.writeFileSync(draftPath, edited);
  const bad = await service.publish({
    collection: 'journal',
    slug: 'first-light',
    title: 'First light',
    body: 'An edit the author just saved.\n',
    frontmatter: { title: 'First light' }, // no date
  });
  check('fails at validate_metadata', bad.status === 'error' && bad.steps.find((s) => s.step === 'validate_metadata')?.status === 'error', bad.error);
  check('has a hint', !!bad.hint);
  check('the saved edit is still on disk', fs.readFileSync(draftPath, 'utf-8').includes('An edit the author just saved.'));
  check('nothing left staged', git('diff', '--cached', '--name-only') === '');

  console.log('pipeline: a push that hangs is stopped, then retried');
  git('remote', 'set-url', 'origin', 'git@hang.invalid:x/y.git');
  process.env.GIT_SSH_COMMAND = 'sleep 30; true';
  const service2 = new PublishingService();
  const t0 = Date.now();
  const hung = await service2.publish({
    collection: 'journal',
    slug: 'second',
    title: 'Second',
    body: 'b\n',
    frontmatter: { title: 'Second', date: '2026-10-06' },
  });
  const took = Date.now() - t0;
  check('the hang is cut short', took < 20_000, `${took}ms`);
  check('fails at push', hung.status === 'error' && hung.steps.find((s) => s.step === 'push')?.status === 'error', `${hung.status} ${hung.error}`);
  check('reported as a timeout, not a crash', hung.errorCode === 'PUSH_TIMEOUT', `${hung.errorCode}: ${hung.error}`);
  check('commit was kept', !!hung.commitHash);
  check('offers a retry', hung.canRetryPush === true);
  check('explains itself', !!hung.hint && hung.hint.length > 20, hung.hint);

  delete process.env.GIT_SSH_COMMAND;
  git('remote', 'set-url', 'origin', remote);
  const service3 = new PublishingService();
  // Re-home the job on a fresh service (its git env was captured with the sleeping ssh).
  (service3 as any).jobs.set(hung.id, hung);
  const retried = service3.retryPush(hung.id);
  check('retry accepted', !!retried);
  await service3.whenDone(hung.id);
  check('retry succeeded', hung.status === 'success', hung.error);
  const remoteLog2 = execFileSync('git', ['--git-dir', remote, 'log', '--oneline', '-1', 'main'], { encoding: 'utf-8' });
  check('the retried commit reached the remote', remoteLog2.includes('Published: Second'), remoteLog2);
  check('a finished job cannot be retried', service3.retryPush(hung.id) === null);
}

main()
  .catch((error) => {
    failed += 1;
    console.error(error);
  })
  .finally(() => {
    process.chdir(os.tmpdir());
    fs.rmSync(root, { recursive: true, force: true });
    console.log(`\n${passed} passed, ${failed} failed`);
    process.exit(failed > 0 ? 1 : 0);
  });
