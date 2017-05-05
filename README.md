[![NPM](https://nodei.co/npm/docker-stream-cleanser.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/docker-stream-cleanser/)

[![Build Status](https://travis-ci.org/Nathan219/docker-stream-cleanser.svg?branch=master)](https://travis-ci.org/Nathan219/docker-stream-cleanser)

Docker Stream Cleanser
=========

Docker Stream Cleanser is a drop-in module to clean the headers from Docker Logs (container attach or container logs)

  - Removes headers from a Docker logs streams and keeps payload
  - Handles any encoding (Ones compatible with Node.js Buffer)


Seeing weird characters at the beginning of each line coming from your Docker container's log stream?  This will clear that right up!  Docker places a header on each message to help you determine which stream (stdout or stderr) a message should belong to.  Thanks Docker, but I just want to read the output!  Since there is no setting to turn off this functionality, I wrote this.

[More info on Docker's Container Logs](https://docs.docker.com/reference/api/docker_remote_api_v1.14/#get-container-logs)


Usage
----

Usage with Docker Data Stream
```js
const StreamCleanser = require('docker-stream-cleanser');
const streamCleanser = new StreamCleanser()
dockerLogStream
  .pipe(streamCleanser)
  .pipe(/* stream */);
```

Usage with [Dockerode](https://github.com/apocas/dockerode)
```js
const Docker = require('dockerode');
const container = new Docker().getContainer(containerId);

const StreamCleanser = require('docker-stream-cleanser');
const streamCleanser = new StreamCleanser()

container.logs({ stderr: true, stdout: true }, function (err, stream) {
  stream
    .pipe(streamCleanser)
    .pipe(/* stream */);
});
```


Installation
--------------

```sh
npm install docker-stream-cleanser --save
```


License
----

MIT
