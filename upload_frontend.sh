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

# delete hidden macos related files
find . -name ".DS_Store" -delete

# empty bucket
# aws s3 rm "s3://$S3_BUCKET" --recursive

# upload files
# aws s3 cp ./frontend/ "s3://$S3_BUCKET" --recursive --exclude "*.yaml"
# aws s3 cp ./pipeline/ "s3://$S3_BUCKET" --recursive

# get status and name of the changed files in a specific commit
# git diff-tree --no-commit-id --name-status -r bdb95e4cba3b0b86cc66b43d4371916479dc3986

# declare the arrays to add/delete changed files
upload_changed_files=()
delete_changed_files=()

function fill_changed_file_list {
    status=$(echo $1 | cut -d $'\t' -f 1)
    file=$(echo $1 | cut -d $'\t' -f 2)

    if [[ "${status}" == "D" ]]; then
        if [[ "${upload_changed_files[@]}" == *"${file}"* ]]; then
            upload_changed_files=( "${upload_changed_files[@]/"${file}"}" )
        fi

        if [[ ! "${delete_changed_files[@]}" == *"${file}"* ]]; then
            delete_changed_files+=( "${file}" )
        fi
    else
        if [[ "${delete_changed_files[@]}" == *"${file}"* ]]; then
            delete_changed_files=( "${delete_changed_files[@]/"${file}"}" )
        fi

        if [[ ! "${upload_changed_files[@]}" == *"${file}"* ]]; then
            upload_changed_files+=( "${file}" )
        fi
    fi
}

function inspect_changed_files_in_commit {
    IFS=$'\n'
    # get status and name of the changed files in a specific commit
    files_in_commit=($(git diff-tree --no-commit-id --name-status -r "$1"))

    for index in "${!files_in_commit[@]}"
    do
        if [[ ${files_in_commit[index]} == *"frontend"* ]]; then
            fill_changed_file_list ${files_in_commit[index]}
        fi
    done
}

function get_commit_sha {
    IFS=' ' read -a commit_row <<< "$1"
    echo "${commit_row[1]}"
}

# declare an array including all commits yet to be pushed
unpushed_commits_sha_list=( $(git cherry -v | cut -d $' ' -f 2) )

for index in "${!unpushed_commits_sha_list[@]}"
do
    echo "${unpushed_commits_sha_list[index]}"
    # commit_sha=$(get_commit_sha "${unpushed_commits[index]}")
    # inspect_changed_files_in_commit "${commit_sha}"
done

echo ""
echo "------ print list start ---------"
echo "------- upload list ---------"
printf '%s\n' "${upload_changed_files[@]}"
echo "------- delete list --------"
printf '%s\n' "${delete_changed_files[@]}"
echo "------ print list end ---------" 
echo ""