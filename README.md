❗Work In Progress❗



# RailQuest

## About the project
RailQuest is a train route planner that helps users find the shortest and most efficient routes between train stations. It aims to leverage RAPTOR algorithm to calculate optimal paths and eventually support real-time updates for train schedules and delays using GTFS data. For now the focus will be put on the backend to have a functional API the frontend will come well after that.

The project includes a backend built with Node.js and an interactive frontend built using React.js, TailwindCSS, and Material Tailwind.

For storage reasons the mongoDB server is hosted locally if this web app would be deployed a real server will be hosted.

## Table of contents
* [RailQuest](#railquest)
    * [About the project](#about-the-project)
    * [Table of contents](#table-of-contents)
    * [TODO](#todo)
    * [Installation](#installation)
        * [Clone the repo](#clone-the-repo)
            * [Backend](#backend)
            * [Frontend](#frontend)
    * [Usage](#usage)
        * [Example](#example)
    * [Development usage](#development-usage)
        * [Backend](#backend-1)
        * [Frontend](#frontend-1)
            * [USAGE](#usage-1)
                * [Example](#example-1)

## TODO
Things done and not yet done:
- Design
    - [ ] Moodboard and ideas
    - [ ] Make the design for the pages
        - [ ] Home page design
        - [ ] Search page design
        - [ ] Historic page design
        - [ ] User page design
        - [ ] Error page design
- Backend
    - General
        - [x] Error handling
        - [x] DB connection
        - [x] Cors and allowed origins
    - Route Management
        - [x] Fetch GTFS data
        - [x] Parse and save GTFS data
        - [ ] Calculate shortest route using Dijkstra's algorithm
        - [ ] Integrate real-time GTFS feed
    - User Management
        - [x] User model
        - [x] Basic authentication and session handling
        - [x] Token handling
- Frontend
    - Route Finder
        - [ ] User input for start and end stations
        - [ ] Display shortest route and duration
    - Station Overview
        - [ ] Display list of available train stations
        - [ ] Visualize train routes on a map
    - Real-Time Updates
        - [ ] Show train delays and cancellations in UI

## Installation
### Clone the repo
Clone the repository to your local machine.
```bash
git clone https://github.com/Paul-Lecomte/railquest.git
cd railquest
```

#### Backend
Navigate to the backend folder and install the dependencies.
```bash
cd backend
npm install
npm run dev
```

#### Frontend
For the frontend, navigate to the frontend folder and install the dependencies.
```bash
cd frontend
npm install
npm run dev
```

## Usage
To use the project, you'll need some environment variables. Create a `.env` file in the backend folder and add the following variables:
```env
PORT
NODE_ENV
DATABASE_URI
JWT_SECRET
```

### Example
```env
PORT=3000
NODE_ENV=development
DATABASE_URI=mongodb://localhost:27017/railquest
JWT_SECRET=supersecretkey
```

## Development usage
### Backend
Navigate to the backend folder and run the server.
```bash
cd backend
npm run start
```

### Frontend
Navigate to the frontend folder and start the React app.
```bash
cd frontend
npm run start
```

#### USAGE
To use the frontend, you'll need to set the following environment variables in the `.env` file in the frontend folder:
```env
VITE_API_URL
```

##### Example
```env
VITE_API_URL=http://localhost:3000/api
```
