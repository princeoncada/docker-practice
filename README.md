# Project Overview

This project is a full-stack application using Docker to containerize and manage the components. It includes a Vite + React frontend, a Node.js API server, and a MySQL database. The setup is designed for both development and production environments, with detailed steps to deploy the application on AWS Elastic Beanstalk.

### Structure
- `client`: Frontend client with Vite + React.
- `server`: Backend API server using Node.js.
- `nginx`: Web server and reverse proxy using Nginx.
- `database`: MySQL database configuration

### Prerequisites
- Docker
- Node.js
- npm
- git

<br></br>
# Inital Project Files

### Directory Structure
Create the main project directory and navigate into it:
```
mkdir my-project
cd my-project
```
Within this directory, we will create three subdirectories for our client, API server, and Nginx web server:

```
mkdir client
mkdir server
mkdir nginx
```
## Setting up the Client
1. **Create the Vite + React application:**
```
npm create vite@latest client --template react
cd client
```
2. **Install dependencies:**
```
npm install
npm install axios --save
npm install --save-dev vitest jsdom @testing-library/jest-dom @testing-library/react @testing-library/user-event
```
3. **Configure the development server in `vite.config.js`:**

    Add the server configuration block to the file.
```
export default defineConfig({
    // other configurations
    server: {
        host: '0.0.0.0',
        port: 3000
    },
});

```
4. **Replace `App.jsx` App() with the following code:**
```
function App() {
    const [response, setResponse] = useState([
        { id: 1, data: "default data #1" },
        { id: 2, data: "default data #2" },
        { id: 3, data: "default data #3" }
    ]);
    const [counter, setCounter] = useState(0);

    return (
        <>
            <button onClick={() => setCounter(count => count + 1)}>
                {response[counter % response.length].data}
            </button>
        </>
    );
}
```
5. **Setup Testing Environment:** ( *Vite + React doesn't have a default testing setup* )
>>- Inside `package.json` include in scripts this code:
```
"test": "vitest run"
```
>>- Create a directory called `tests` inside the `client` directory.
>>- Inside `tests`, create a file called `setup.js`.
>>- Add the following code into the file:
```
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

afterEach(() => {
    cleanup();
})
```
>>- Add to `vite.config.js`:
```
export default defineConfig({
    // other configurations
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: './tests/setup.js'
    }
});
```
>>- Inside client `src` directory, add a file called `App.test.jsx`
>>- Add the following code into the file:
```
import { render, screen } from '@testing-library/react'
import App from './App'

describe('App', () => {
    it('renders the App component', () => {
        render(<App />)
        screen.debug();
    })
})
```
>>- In your terminal, while inside client directory, run the test setup:
```
npm run test
```
## Setting Up the API Server
1. **Navigate to the server directory and initialize npm:**
```
cd ../server
npm init -y
```
2. **Install default packages:**
```
npm install express body-parser cors mysql2 nodemon
```
3. **Include necessary files inside server directory:**
>>- Create `keys.js` and add this code into it into the file:
```
module.exports = {
    mysqlUser: process.env.MYSQLUSER,
    mysqlHost: process.env.MYSQLHOST,
    mysqlDatabase: process.env.MYSQLDATABASE,
    mysqlPassword: process.env.MYSQLPASSWORD,
    mysqlPort: process.env.MYSQLPORT,
}
```
>>- Create `index.js` and add this code into the file:
```
const keys = require('./keys');

// Express App Setup
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// MySQL Client Setup
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: keys.mysqlHost,
    user: keys.mysqlUser,
    password: keys.mysqlPassword,
    database: keys.mysqlDatabase,
    port: keys.mysqlPort,
});

// MySQL Pool Connection Test
pool.getConnection((err, connection) => {
    if (err) {
        console.log('Error connecting to MySQL: ', err);
    } else {
        console.log('Connected to MySQL');
    }
});

// MySQL Pool Connection Test
pool.getConnection((err, connection) => {
    if (err) {
        console.log('Error connecting to MySQL: ', err);
    } else {
        console.log('Connected to MySQL');
    }
});

// MySQL low-level migration
pool
    .query(
        `CREATE TABLE IF NOT EXISTS tbl_test (
        id INT AUTO_INCREMENT PRIMARY KEY,
        data VARCHAR(255));`
    )
    .then(
        pool.query(
            `INSERT INTO tbl_test (data) VALUES ('data #1'), ('data #2'), ('data #3');`
        )
    )
    .catch((err) => {
        console.log('Error creating table: ', err);
    });

// ***********************
// QUERIES AND ROUTES HERE
// ***********************

// 5000 is default, you may change as needed
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
```
4. **Add scripts to package.json for development and start:**
```
"scripts": {
    // other scripts
    "dev": "nodemon index.js",
    "start": "node index.js"
}
```
## Setting Up NGINX
1. **Navigate to the nginx directory**
2. **Create a file called `default.conf` then add the following code into the file:**
```
upstream client {
    server client:3000;
}

upstream api {
    server api:5000;
}

server {
    listen 80;

    location / {
        proxy_pass http://client;
    }

    location /api {
        rewrite ^/api(/.*)$ $1 break;
        proxy_pass http://api;
    }
}
```
<br></br>
# Development Setup
1. **Inside `client` directory, create `Dockerfile.dev` and add the following code into the file:**
```
FROM node:alpine
WORKDIR '/app'
COPY package.json .
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]
```
2. **Inside `server` directory do the same this with this code:**
```
FROM node:alpine
WORKDIR '/usr/src/app'
COPY package.json .
RUN npm install
COPY . .
EXPOSE 5000
CMD ["npm", "run", "dev"]
```
3. **Inside `nginx` directory do the same thing as well this with this code:**
```
FROM nginx
COPY default.conf /etc/nginx/conf.d/default.conf
```
4. **Inside your `root` directory, create `docker-compose-dev.yml` and add the follow code into the file:**
```
version: "3"
services:
    client:
        build:
            context: ./client
            dockerfile: Dockerfile.dev
        volumes:
            - ./client:/app
            - /app/node_modules
        ports:
            - "3000:3000"
        environment:
            - CHOKIDAR_USEPOLLING=true

    nginx:
        restart: always
        build:
            context: ./nginx
            dockerfile: Dockerfile.dev
        ports:
            - "4000:80"
        depends_on:
            - client
            - api

    api:
        build:
            context: ./server
            dockerfile: Dockerfile.dev
        volumes:
            - ./server:/usr/src/app
            - /usr/src/app/node_modules
        ports:
            - "5000:5000"
        environment:
            - CHOKIDAR_USEPOLLING=true
            - MYSQLUSER=root
            - MYSQLHOST=database
            - MYSQLDATABASE=mydb
            - MYSQLPASSWORD=password
            - MYSQLPORT=3306
        depends_on:
            - database

    database:
        image: mysql:5.7
        environment:
            - MYSQL_ROOT_PASSWORD=password
            - MYSQL_DATABASE=mydb
        ports:
            - "3306:3306"
        volumes:
            - db-data:/var/lib/mysql

volumes:
    db-data:
```
5. **Run using your terminal while inside the `root` directory to see if everything is working:**
( _Expect initial errors to be raised_ )
```
docker-compose -f docker-compose-dev.yml up --build
```
<br></br>
# Production Setup
1. **Create a GitHub Repository and push your current working code into the remote.**
2. **For `client`:**
>> - Create a `nginx` directory inside the `client` directory and create a `default.conf` file.
>> - Add the following code into the file:

```
server {
    listen 3000;
    
    location / {
        root /usr/share/nginx/html;
        index index/html index.htm;
        try_files $uri $uri/ /index.html;
    }
}
```
>> - Create a `Dockerfile` inside the `client` directory.
>> - Add the following code into the file:
```
FROM node:alpine as builder
WORKDIR '/app'
COPY ./package.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx
EXPOSE 3000
COPY ./nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
```
3. **For `server`:**
>> - Create a `Dockerfile` inside the `server` directory.
>> - Add the following code into the file:
```
FROM node:alpine
WORKDIR '/usr/src/app'
COPY package.json .
RUN npm install
COPY . .
EXPOSE 5000
CMD ["npm", "run", "start"]
```
4. **For `nginx`:**
>> - Create a `Dockerfile` inside the `nginx` directory.
>> - Add the following code into the file:
```
FROM nginx
COPY default.conf /etc/nginx/conf.d/default.conf
```
5. **Inside your `root` directory, create a `.travis.yml` file and add the following code.**
```
sudo: required
services:
  - docker

before_install:
  - docker build -t pgsoncada/vite-test -f ./client/Dockerfile.dev ./client

script:
  - docker run pgsoncada/vite-test npm test

after_success:
  - docker build -t pgsoncada/practice-client ./client
  - docker build -t pgsoncada/practice-nginx ./nginx
  - docker build -t pgsoncada/practice-server ./server

  - echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_ID" --password-stdin

  - docker push pgsoncada/practice-client
  - docker push pgsoncada/practice-nginx
  - docker push pgsoncada/practice-server
```
6. **Go to your `Travis` account and include your current working repository into your `Travis` repositories.**
7. **Once added, go to `More options` and head over to `Environmental Variables`.**
8. **Set 2 `Environmental Variables` as follows:**
>> - _DOCKER_PASSWORD = $your_docker_hub_password_
>> - _DOCKER_ID = $your_docker_hub_username_
9. **Now commit your current directory and push into your working repository and test to see if your images have been sent over to your `Docker Hub` repository.**

<br></br>
# AWS Management Console Setup

**🚩 If this is your first time deploying**
- Go to your `AWS Management Console` and find `IAM`.
- At your left side panel, under `Access management` navigate to `Roles`.
- Click `Create role` and select `AWS service` for `Trusted entity type` selection.
- For `Use case` select `EC2` then click `Next`.
- Type `AWSElasticBeanstalk` in the search bar and check the following policies:
    - `AWSElasticBeanstalkWebTier`
    - `AWSElasticBeanstalkWorkerTier`
    - `AWSElasticBeanstalkMulticontainerDocker`
- Name it `aws-elasticbeanstalk-ec2-role`, then click `Create role`.

## Elastic Beanstalk Application Creation
- Go to your `AWS Management Console` and find `Elastic Beanstalk`.
- Click `Create Application`, then set your application name.
- Scroll down to find the `Platform` section, then select Docker as `Platform`.
- If you are using free-tier, set your `Configuration presents` to `Single instance (free tier eligible)`.
- Click Next, then you will have to `Configure service access`.
- If this is your first time deploying, then for `Service role`, select `Create and use new service role` and name your service role appropriately. ( _aws-elasticbeanstalk-service-role_ )
- Otherwise, just select `Use and existing service role`.
- For `EC2 instance profile`, select the one you previously created.
- Click `Skip to review`, click `Submit`, then continue while you wait for your new Elastic Beanstalk application to be created and launch.

## RDS Database Creation
- Go to your `AWS Management Console` and find `RDS`.
- At your left side panel, navigate to `Databases`.
- Click `Create database` and set th following:
    - Choose a database creation method &rarr; **Standard create**
	- Engine options &rarr; **MySQL**
	- Templates &rarr; **Depends on the user** ( _For now Free tier_ )
	- DB cluster identifier &rarr; **Chosen Database Identifier**
	- Master username &rarr; **Chosen Database Access Username**
	- Credentials management &rarr; **Self managed**
	- Master password &rarr; **Chosen Database Access Password**
	- VPC &rarr; **Default VPC**
	- Find and unhide **Additional Configuration**
	- Initial database name &rarr; **Chosen Initial Database Name**
	- Go to the bottom and press **Create Database**
- Continue while you wait for your new RDS application to finish creating.

## Custom Security Group Creation
- Go to your `AWS Management Console` and find `VPC`.
- At your left side panel, under `Security`, navigate to `Security groups`.
- Click `Create security group`, and set an appropriate `Security group name` and `Description`.
- Make sure VPC is set to default VPC.
- Scroll down and click `Create Security Group`.
- After creating your security group, find and click `Edit inbound rules`.
- Click `Add rule` and set `Port range` to `3000-5000`.
- Set your `Source` to the Security Group you just created.
- Lastly, click `Save rules`.

## Apply Security Group to RDS
- Navigate back to `RDS` then `Databases`.
- Select your created database and click `Modify`.
- Under the `Connectivity` section, include in `Security group` the one you recently created.
- Scroll down and click `Continue` then `Modify DB instance`.

## Apply Security Group to Elastic Beanstalk
- Navigate back to `Elastic Beanstalk` then to your Application's Environment.
- At your left side panel, navigate to `Configuration`.
- Go to `Instance traffic and scaling` section then press `Edit.
- Go to `EC2 security groups` and include your created security group.
- Scroll down and click `Apply`.

## Set Elastic Beanstalk Environment Variables
- Navigate back to `Configuration`, go to `Updates, monitoring, and logging` section, then click `Edit`.
- Navigate to `Environment properties` and include the following properties:
	- MYSQLUSER -> `Chosen Database Access Username`
	- MYSQLPASSWORD -> `Chosen Database Access Password`
	- MYSQLHOST -> Locate endpoint at your created RDS under `Connectivity & Security`
	- MYSQLDATABASE -> `Chosen Initial Database Name`
	- MYSQLPORT -> `3306`

## Retrieve IAM Keys for Deployment
- Navigate to `IAM` in your `AWS Management Console`.
- At your left side panel, under `Access management`, navigate to `Users`.
- Click `Create user` and provide an appropriate Username.
- Under `Permissions options`, select `Attach policies directly`.
- In the search bar, type beanstalk, and include `AdministratorAccess-AWSElasticBeanstalk`.
- Scroll down, click `Next`, then click `Create user`.
- Select your created user and find `Security credentials`.
- Find `Access keys` and then click `Create access key`.
- For use case, select `Command Line Interface (CLI)`, tick the confirmation box, click `Next`, then `Create access key`.
- Save your Access key and Secret access key to be used in Travis CI Environment.
<br></br>
# Deployment Setup
1. **Inside your root directory, create a `docker-compose.yml` file and add the following code:**
```
version: '3'
services:
  client:
    image: 'pgsoncada/practice-client'
    mem_limit: 128m
    hostname: client
    
  server:
    image: 'pgsoncada/practice-server'
    mem_limit: 128m
    hostname: api
    environment:
      - MYSQLUSER=$MYSQLUSER
      - MYSQLHOST=$MYSQLHOST
      - MYSQLDATABASE=$MYSQLDATABASE
      - MYSQLPASSWORD=$MYSQLPASSWORD
      - MYSQLPORT=$MYSQLPORT

  nginx:
    image: 'pgsoncada/practice-nginx'
    mem_limit: 128m
    hostname: nginx
    ports:
      - '80:80'
```
2. **Inside your `.travis.yml` file, include the following code under `after_success`:**
```
deploy:
  provider: elasticbeanstalk
  region: "your_aws_cloud_region"
  app: "your-application-name"
  env: "your-application-environment-name"
  bucket_name: "your-s3-bucket-name"
  bucket_path: "your-preferred-bucket-path"
  access_key_id: $AWS_ACCESS_KEY
  secret_access_key: $AWS_SECRET_KEY
```
3. **Include your `AWS keys` into `Travis Environment Variables`.**
>>- Go to your `Travis CI` active repositories.
>>- Find your current working repository and go to `More options` > `Settings`.
>>- Find the `Environment Variables` section and include the following variables:
>>      - AWS_ACCESS_KEY -> **Your AWS Access Key**
>>      - AWS_SECRET_KEY -> **Your recently created AWS Secret Access Key**

4. **To test is everything is working, simply push all of your changes in your project directory file into your GitHub Repository**
