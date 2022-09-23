const path = require('path');
const fs = require('fs');
const AWS = require('aws-sdk');
const { generateBadges } = require('node-jest-badges');
const core = require('@actions/core');

function uploadToAWS(bucket, target, pathFile) {
  return new Promise((resolve, reject) => {
    try {
      const fileContent = fs.readFileSync(pathFile);
      const s3 = new AWS.S3({ signatureVersion: 'v4' });
      s3.putObject(
        {
          Bucket: bucket,
          Key: target,
          Body: fileContent,
          ContentType: 'image/svg+xml',
          ACL: 'public-read',
        },
        putError => {
          if (putError) {
            console.log(`${putError}\n`);
            reject();
          } else {
            core.setOutput('coverage-badge-path', `target`);
            console.log(`Successfully uploaded '${target}'`);
            resolve();
          }
        },
      );
    } catch(error) {
      core.setFailed(error);
      reject();
    }
  });

}

const coveragePath = core.getInput('coverage-path');
const awsBucket = core.getInput('aws-bucket');
const folder = core.getInput('aws-bucket-folder');

const baseBadgesPathOrigin = path.join(process.cwd(), 'badges');
const baseByProject = path.join(__dirname, `./badgesByProject`);
const baseBadgesPathByProject = `${baseByProject}/${folder}`;

generateBadges(coveragePath).then(() =>{
  if (!fs.existsSync(baseByProject)) {
    fs.mkdirSync(baseByProject);
  }
  if (!fs.existsSync(baseBadgesPathByProject)) {
    fs.mkdirSync(baseBadgesPathByProject);
  }

  const filesExisted = fs.readdirSync(baseBadgesPathByProject);
  if (filesExisted.length) {
    filesExisted.forEach((file) => fs.unlinkSync(`${baseBadgesPathByProject}/${file}`));
  }

  fs.rename((baseBadgesPathOrigin), baseBadgesPathByProject, (error) => {
    if (error) throw new Error(error);

    fs.readdirSync(baseBadgesPathByProject).forEach((file) => {
      const newNameFile = file.split(' ').join('-');
      fs.renameSync(`${baseBadgesPathByProject}/${file}`, `${baseBadgesPathByProject}/${newNameFile}`);
      console.log(`Save locally in: ${folder}/${newNameFile}`);
    });

    if (awsBucket) uploadToAWS(awsBucket, `${folder}/coverage-jest-coverage.svg`, `${baseBadgesPathByProject}/coverage-jest-coverage.svg`);
  });
})
.catch((error) => {
  core.setFailed(error);
});

