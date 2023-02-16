FROM python:3.8

WORKDIR /usr/src/app

RUN \
    # Make sure that we aren't prompted for timezone information
    export DEBIAN_FRONTEND=noninteractive && \
    # Install necessary tools for the build
    apt-get update && \
    apt-get install -y --no-install-recommends git-core

RUN \
    git clone "https://github.com/waikato-ufdl/ufdl-python-client.git" && \
    git clone "https://github.com/waikato-ufdl/ufdl-json-messages.git" && \
    pip install --no-cache-dir ./ufdl-json-messages && \
    pip install --no-cache-dir ./ufdl-python-client

CMD ["python", "./test-download-all-dog-job-metadata.py"]
