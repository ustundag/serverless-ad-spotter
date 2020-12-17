#!/usr/bin/env bash

function usage {
     echo """
     This script is to update the cloudformation files. To use, pass the S3 bucket name.

     ex:
     upload_pipeline_files.sh s3-bucket-name
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
# upload files
aws s3 cp ./pipeline/ "s3://$S3_BUCKET" --recursive

