Docker Stream Cleanser
=========

Docker Stream Cleanser is a drop-in module to clean the headers from Docker Logs

  - Cleans the header from finished, stored logs
  - Cleans as it pipes from one stream to another
  - Accounts for any irregularities in streaming
  - Handles any encoding (Ones compatible with Node.js Buffer)


Seeing weird characters at the beginning of each line coming from your Docker container's log stream?  This will clear that right up!  Docker places a header on each message to help you determine which stream (stdout or stderr) a message should belong to.  Thanks Docker, but I just want to read the output!  Since there is no setting to turn off this functionality, I wrote this.

[More info on Docker's Container Logs](https://docs.docker.com/reference/api/docker_remote_api_v1.14/#get-container-logs)

Version
----

0.0.11

Installation
--------------

```sh
npm install docker-stream-cleanser --save
```


License
----

MIT
