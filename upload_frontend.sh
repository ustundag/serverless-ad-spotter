#!/usr/bin/env bash

function usage {
     echo """
     This script is to update the website components to the S3 bucket
     created to host the website. To use, pass the S3 bucket name.

     ex:
     upload_frontend.sh s3-bucket-name
     """
 }

S3_BUCKET=''

 # Get the table name
 if [ $# -eq 0 ]; then
     usage;
     exit;
 else
     S3_BUCKET="$1"
 fi

# delete hidden macos related file
find . -name ".DS_Store" -delete
# empty bucket
# aws s3 rm "s3://$S3_BUCKET" --recursive
# upload files
aws s3 cp ./frontend/ "s3://$S3_BUCKET" --recursive --exclude "*.yaml"
