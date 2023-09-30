# dig-cert-nitrr
<h2>Developed by Team-Technocracy NIT-Raipur</h2>

Tool for completely digitizing the certificate generation, signing and verification process for any institute.

<h3>Setting up the developer workflow</h3>
<h4>Linux</h4>

* First install docker and docker-compose. You can follow the <a href=https://docs.docker.com/desktop/install/linux-install/>official docker website</a> of docker for more details on how to do it.
* To start the development server, run `docker-compose build && docker-compose up`
* The development server should have started by now.

<h4>Windows</h4>

* Install docker. Easiest way is to install the docker desktop. You can find the instructions for that on the <a href=https://docs.docker.com/desktop/install/windows-install/>official docker website</a>. Ensure that you correctly set the WSL configurations.
* To start the development server, run `docker-compose build && docker-compose up`
* The development server should have started by now.

<h3>The developer workflow</h3>

If pulled for the first time or the package.json changed run

`docker-compose build`

Then, run the following command to start the environment.

`docker-compose up -d`

To see the logs of your app

`docker-compose logs -f web`

If you need to install any npm package.

`docker-compose exec web npm install pacakge-name`

stop the containers

`docker-compose down`

Credits -- https://medium.com/@sudiptob2/properly-setting-up-react-development-environment-using-docker-a2de46464d0b
