#!/bin/bash

#############
# CONSTANTS #
#############

USAGE_EXIT_CODE=1
readonly USAGE_EXIT_CODE
CD_ERROR_STATUS=2
readonly CD_ERROR_STATUS
GIT_ERROR_STATUS=3
readonly GIT_ERROR_STATUS
CP_ERROR_STATUS=4
readonly CP_ERROR_STATUS
MISSING_REQUIRED_EXEC_ERROR_STATUS=5
readonly MISSING_REQUIRED_EXEC_ERROR_STATUS
DOCKER_ERROR_STATUS=6
readonly DOCKER_ERROR_STATUS
#CHROME_ERROR_STATUS=7
#readonly CHROME_ERROR_STATUS
RM_ERROR_STATUS=8
readonly RM_ERROR_STATUS
PARTICIPANT_NUMBER_ERROR_STATUS=9
readonly PARTICIPANT_NUMBER_ERROR_STATUS
MKDIR_ERROR_STATUS=10
readonly MKDIR_ERROR_STATUS
PYTHON_ERROR_STATUS=11
readonly PYTHON_ERROR_STATUS
SOURCE_ERROR_STATUS=128
readonly SOURCE_ERROR_STATUS

#############
# FUNCTIONS #
#############

# the usage of this script
function usage()
{
   echo
   echo "${0##*/} -p PARTICIPANT [-r] [-d] [-h]"
   echo
   echo "Initialises and runs the experiment."
   echo
   echo " -h   this help"
   echo " -r   reset the experiment"
   echo " -d   force rebuild the docker images"
   echo
}

function error()
{
  echo "$1" >&2
  exit "$2"
}

function is_number()
{
  [ -n "$1" ] && [ "$1" -eq "$1" ] 2>/dev/null
  return $?
}

function check_executable()
{
  if [ -z "$1" ]
  then
    error "No executable name given to check" $SOURCE_ERROR_STATUS
  fi

  echo -n "Checking $1..." >&2
  if which "$1";
  then
    echo " is present" >&2
    return 0
  else
    if [ "$2" = "required" ]
    then
      error "$1 executable not present!" $MISSING_REQUIRED_EXEC_ERROR_STATUS
    else
      echo " is NOT present" >&2
      return 1
    fi
  fi
}

function check_repository()
{
  echo "Updating repo $1..."

  if [ -d "$1" ]
  then
    cd "$1" || error "cd into $1 failed" $CD_ERROR_STATUS
    git pull || error "git pull in ../$1 failed" $GIT_ERROR_STATUS
    cd .. || error "cd back to experiment root failed" $CD_ERROR_STATUS
  else
    git clone "https://github.com/waikato-ufdl/$1.git" || error "git clone https://github.com/waikato-ufdl/$1.git failed" $GIT_ERROR_STATUS
  fi
}

function clean_up()
{
  # Download results
  ./venv/bin/python ../test-download-all-dog-job-metadata.py

  # Bring down the backend
  cd "ufdl-backend/docker/ufdl" || error "Couldn't cd into ufdl-backend/docker/ufdl" $CD_ERROR_STATUS
  docker-compose --project-name "ufdl-experiment-user-$PARTICIPANT_NUMBER" --profile with-job-launcher stop || error "Failed to stop Docker services" $DOCKER_ERROR_STATUS
  cd "../../.." || error "Couldn't cd back to original directory" $CD_ERROR_STATUS

  # Farewell message
  echo "Thank you for your participation. Press any key to exit."
  read -s -r -n 1

  exit 0
}

##############
# PARAMETERS #
##############

RESUME="yes"
PARTICIPANT_NUMBER=""
FORCE_DOCKER_BUILD=""
while getopts ":hrdp:" flag
do
   case $flag in
      p) PARTICIPANT_NUMBER=${OPTARG}
         ;;
      h) usage
         exit 0
         ;;
      r) RESUME="no"
         ;;
      d) FORCE_DOCKER_BUILD="--no-cache"
         ;;
      *) usage
         exit "$USAGE_EXIT_CODE"
         ;;
   esac
done

##########
# CHECKS #
##########

echo "Performing checks"

check_executable virtualenv required
#check_executable google-chrome required
check_executable python3.8 required
check_executable docker required
check_executable docker-compose required

if ! is_number "$PARTICIPANT_NUMBER";
then
  error "Invalid participant number '$PARTICIPANT_NUMBER'" $PARTICIPANT_NUMBER_ERROR_STATUS
fi

# Ensure Docker daemon is running
docker ps -q || error "Error running docker command" $DOCKER_ERROR_STATUS

##############
# INITIALISE #
##############

# Prompt if reset is selected
if [ "$RESUME" = "no" ]
then
  echo -n "Are you sure you want to reset? [y/N]"
  ANSWER=$(read -s -r -n 1)
  if [ "$ANSWER" != "y" ] && [ "$ANSWER" != "Y" ]
  then
    exit 0
  fi
fi

# Initialise and change into the directory for the participant
if [ ! -d "./$PARTICIPANT_NUMBER" ]
then
  RESUME="no"
  mkdir "./$PARTICIPANT_NUMBER" || error "Couldn't create participant directory ./$PARTICIPANT_NUMBER" $MKDIR_ERROR_STATUS
fi
cd "./$PARTICIPANT_NUMBER" || error "Couldn't cd into participant directory ./$PARTICIPANT_NUMBER" $CD_ERROR_STATUS

if [ "$RESUME" = "no" ]
then
  # Update all repositories
  check_repository "ufdl-backend"
  check_repository "ufdl-python-client"
  check_repository "ufdl-json-messages"

  # Remove the previous virtual environment
  rm -rf ./venv || error "Error removing Python virtual environment" $RM_ERROR_STATUS

  # Create the Python environment for downloading the results
  virtualenv -p "$(which python3.8)" ./venv || error "Failed to create virtual Python environment" $PYTHON_ERROR_STATUS
  ./venv/bin/pip install ./ufdl-json-messages || error " Failed to install the JSON messages into venv" $PYTHON_ERROR_STATUS
  ./venv/bin/pip install ./ufdl-python-client || error " Failed to install the UFDL client into venv" $PYTHON_ERROR_STATUS

  # Remove the extras from the extra folder
  rm -rf "./ufdl-backend/docker/ufdl/extra/*" || error "Error removing extra folder contents" $RM_ERROR_STATUS

  # Copy the dataset into the extra folder
  cp -r "../dogs" "./ufdl-backend/docker/ufdl/extra/dogs" || error "Error copying extras into ufdl-backend/docker/ufdl/extra" $CP_ERROR_STATUS

  # Set the participant number
  echo "$PARTICIPANT_NUMBER" > "./ufdl-backend/docker/ufdl/extra/participantNumber"
fi

if [ "$FORCE_DOCKER_BUILD" = "--no-cache" ]
then
  # Build the backend
  cd "ufdl-backend/docker/ufdl" || error "Couldn't cd into ufdl-backend/docker/ufdl" $CD_ERROR_STATUS
  docker-compose build $FORCE_DOCKER_BUILD --build-arg UFDL_FRONTEND_BRANCH=ui-experiment || error "docker-compose build failed" $DOCKER_ERROR_STATUS
  cd "../../.." || error "Couldn't cd back to original directory" $CD_ERROR_STATUS
fi

#############
# EXECUTION #
#############

# Start the backend without the job-launcher (in case we need to reset)
export UFDL_SERVER_PORT=$((PARTICIPANT_NUMBER + 8000))
cd "ufdl-backend/docker/ufdl" || error "Couldn't cd into ufdl-backend/docker/ufdl" $CD_ERROR_STATUS
docker-compose --project-name "ufdl-experiment-user-$PARTICIPANT_NUMBER" up -d || error "Couldn't bring up backend" $DOCKER_ERROR_STATUS

# Reset the database if we're not resuming
if [ "$RESUME" = "no" ]
then
  docker exec "ufdl-experiment-user-${PARTICIPANT_NUMBER}_ufdl_1" ./dev_reset.sh || error "Failed to reset database" $DOCKER_ERROR_STATUS
fi

# Now start the job-launcher
docker-compose --project-name "ufdl-experiment-user-$PARTICIPANT_NUMBER" --profile with-job-launcher up -d || error "Failed to start job-launcher" $DOCKER_ERROR_STATUS
cd "../../.." || error "Couldn't cd back to original directory" $CD_ERROR_STATUS

# Remove the Chrome directory if we are resetting
if [ "$RESUME" = "no" ]
then
  rm -rf "./chrome-data" || error "Failed to remove previous Chrome data directory" $RM_ERROR_STATUS
fi

# For running the browser locally
# Open chrome
# google-chrome --user-data-dir="./chrome-data" "http://localhost:8000/v1/html" || error "Failed to launch Chrome" $CHROME_ERROR_STATUS

trap clean_up SIGINT

# Tail the server's log
docker logs -f "ufdl-experiment-user-${PARTICIPANT_NUMBER}_ufdl_1"

clean_up
