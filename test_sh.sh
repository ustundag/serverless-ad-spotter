my_array=(1 2 5)
printf '%s\n' "${my_array[@]}"
echo "---------------"

my_array+=(5)
printf '%s\n' "${my_array[@]}"
echo "---------------"

my_array=( "${my_array[@]/6}" )
# unset "my_array[2]"
printf '%s\n' "${my_array[@]}"
# echo "${#my_array[@]}"

# for index in "${!my_array[@]}"
# do
#     echo "${my_array[index]}"
#     if [[ ${my_array[index]} -eq "" ]]
#     then
#         echo "not found!"
#     else
#         echo "exists"
#     fi
# done
# echo "---------------"

# # check if istring consists anything
# STR='GNU/Linux is an operating system'
# SUB='Linux'

# string='My long frontend string'
# if [[ $string == *"frontend"* ]]; then
#   echo "It's there!"
# fi
