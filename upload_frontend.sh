#!/usr/bin/env bash

function usage {
    echo """
    This script updates the website components in the S3 bucket which is
    created to host the website. Checking the file changes in '${folder}' folder,
    it uploads & removes files based on unpushed local git commits.
    
    To get better experience, please commit your changes, then pass the S3 bucket name.

    ex:
    upload_frontend.sh s3-bucket-name
    """
 }

S3_BUCKET=''

# specify the folder
folder="frontend"

 # Get the table name
 if [ $# -eq 0 ]; then
    usage;
    exit;
 else
    S3_BUCKET="$1"
 fi

# delete hidden macos related files
find . -name ".DS_Store" -delete

# declare the arrays to add/delete changed files
upload_changed_files=()
delete_changed_files=()

function fill_changed_file_list {
    status=$(echo $1 | cut -d $'\t' -f 1)
    file=$(echo $1 | cut -d $'\t' -f 2)

    if [[ "${status}" == "D" ]]; then
        upload_changed_files=( "${upload_changed_files[@]/"${file}"}" )
        delete_changed_files+=( "${file}" )
    else
        delete_changed_files=( "${delete_changed_files[@]/"${file}"}" )
        upload_changed_files+=( "${file}" )
    fi
}

function inspect_changed_files_in_commit {
    IFS=$'\n'
    # get status and name of the changed files in a specific commit
    files_in_commit=($(git diff-tree --no-commit-id --name-status -r "$1"))

    for index in "${!files_in_commit[@]}"
    do
        if [[ ${files_in_commit[index]} == *"${folder}/"* ]]; then
            fill_changed_file_list ${files_in_commit[index]}
        fi
    done
}

# declare an array including all commits yet to be pushed
unpushed_commits_sha_list=( $(git cherry -v | cut -d $' ' -f 2) )

for index in "${!unpushed_commits_sha_list[@]}"
do
    inspect_changed_files_in_commit "${unpushed_commits_sha_list[index]}"
done

# tr command may break the file list in case of any space in file name.
upload_changed_files=($(echo "${upload_changed_files[@]}" | tr ' ' '\n' | sort -u ))
delete_changed_files=($(echo "${delete_changed_files[@]}" | tr ' ' '\n' | sort -u ))

echo "------- upload list ---------"
printf '%s\n' "${upload_changed_files[@]}"
echo "------- delete list --------"
printf '%s\n' "${delete_changed_files[@]}"
echo "------ print list end ---------" 
echo ""
echo ""

# empty bucket
# aws s3 rm "s3://$S3_BUCKET" --recursive

# upload files
# aws s3 cp ./frontend/ "s3://$S3_BUCKET" --recursive --exclude "*.yaml"
# aws s3 cp ./pipeline/ "s3://$S3_BUCKET" --recursive

# delete files from S3
for index in "${!delete_changed_files[@]}"
do
    file=${delete_changed_files[index]#"${folder}/"}
    aws s3 rm "s3://$S3_BUCKET/$file"
done
# upload files to S3
for index in "${!upload_changed_files[@]}"
do
    file=${upload_changed_files[index]#"${folder}/"}
    aws s3 cp "$folder/$file" "s3://$S3_BUCKET/$file"
done