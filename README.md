# Create a Jest Coverage Badge and upload it to AWS

### Description
This actions allows to generate a jest coverage badge and upload it to an AWS S3 Bucket, You need to provide the path of your coverage report, the aws bucket where you want to upload the badge, and the aws folder/key where you badge will be saved in the bucket. 
The action uses the [node-jest-badges](https://github.com/jpb06/node-jest-badges) module to create the badge.
## How to use
You need to know that the action assumes that you have a bucket set up on AWS S3 with the ACL option enabled. Read more about it https://docs.aws.amazon.com/AmazonS3/latest/userguide/acl-overview.html 
1. First you need to set up the Jest Coverage report config in your jest config file:
```bash
"coverageReporters": [
    "json-summary", 
    "text",
    "lcov"
 ]
```
With this when you run the command ```jest --coverage``` it will generate the ```coverage``` with the ```coverage-summary.json``` file that is used by the action to generate the badge.

2. You need to add an step in your job in the workflow where you add AWS authentication, you could use the action [aws-actions/configure-aws-credentials](https://github.com/aws-actions/configure-aws-credentials) to set up de auth to AWS.
3. Add an step to run your coverage report to generate the coverage-summary.json.
4. Add the ```jest-badges-aws``` action to your job:
```bash
name: Generating Jest Badge and upload it to AWS
uses: LPMendoza/jest-badges-aws@v1
with:
  coverage-path: './coverage/coverage-summary.json'
  aws-bucket:  ${{ secrets.AWS_BADGES_BUCKET }}
  aws-bucket-folder: ${{ github.event.repository.name }}
```
Your Workflow with all the AWS auth action and the step tu run the jest coverage report may look like this:
```bash
name: Generating badges
on:
  push:
    branches: [master]
jobs:
  deploying:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repo
        uses: actions/checkout@v3
      - name: Installing Dependencies
        run: npm install

      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v1
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ secrets.AWS_REGION }}
     - name: Runing Jest Coverage Report
       run: jest --coverage
     - name: Generating Jest Badge and upload it to AWS
        if: github.ref == 'refs/heads/master'
        uses: LPMendoza/jest-badges-aws@v1
        id: generate-badge
        with:
          coverage-path: './coverage/coverage-summary.json'
          aws-bucket:  ${{ secrets.AWS_BADGES_BUCKET }}
          aws-bucket-folder: 'badgejest'
```
The file name will be save as ```coverage-jest-coverage.svg``` in the bucket you provided.
## Inputs
- **coverage-path:** Path where your coverage-summary.json file is located.
- **aws-bucket:** Bucket name of AWS where you want to upload the badges. It's recommended to use this input as a secret to keep this data safe. 
- **aws-bucket-folder:** Key or Folder where the badge will be saved in the bucket provided.
## Outputs
- **coverage-badge-path:** Path of the badge in the bucket.
