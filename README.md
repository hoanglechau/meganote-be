<a name="readme-top"></a>

<!-- PROJECT TITLE -->

# **Meganote - The ultimate task management app**

<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#project-description">Project Description</a></li>
        <li><a href="#user-stories">User Stories</a></li>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li>
      <a href="#api-endpoints">API Endpoints</a>
      <ul>
        <li><a href="#auth-apis">Auth APIs</a></li>
        <li><a href="#user-apis">User APIs</a></a></li>
        <li><a href="#account-apis">Account APIs</a></a></li>
        <li><a href="#note-apis">Note APIs</a></li>
      </ul>
    </li>
    <li>
      <a href="#entity-relationship-diagram">Entity Relationship Diagram</a>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#links">Links</a></li>
  </ol>
</details>

---

<!-- ABOUT THE PROJECT -->

## **About The Project**

[![Meganote Public Screen Shot][public-screenshot]](https://example.com)

[![Meganote Screen Shot][product-screenshot]](https://example.com)

### **Project Description**

Meganote is an app that aims to solve a problem that companies often have - how to manage employees' tasks efficiently.

This app acts like the traditional sticky note board system in which users stick notes that contain the tasks need to be done on a board and then proceed to complete them one-by-one.

Challenges: Designing logical schema models for the API, implementing authentication and authorization, designing an easy-to-use user interface, making the app responsive.

Features for the future: Making a mobile version of the app for iOS and Android.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

### **User Stories**

#### _Authentication_

- As a user, I can sign in with my username and password
- As a user, I can choose to stay signed in after refreshing the page
- As a user, I can edit my own username, avatar URL, and password
- As a user, I can sign out from the system

#### _Admin_

- As an admin, I can view a list of all the notes in the system
- As an admin, I can edit the information of all existing notes
- As an admin, I can delete my own notes, and the notes of managers and employees, but I cannot delete the notes of other admins
- As an admin, I can create new notes and assign them to myself, other admins, and any users
- As an admin, I can view a list of all the users in the system
- As an admin, I can create new users with username, avatar URL, password, and role (admin, manager, or employee)
- As an admin, I can edit the information of all existing users
- As an admin, I can delete all users from the system

#### _Manager_

- As a manager, I can view a list of all the notes in the system except the notes of admins
- As a manager, I can edit the information of all existing notes except the notes of admins
- As a manager, I can delete my own notes, and the notes employees, but I cannot delete the notes of other managers. I cannot delete admins' notes
- As a manager, I can create new notes and assign them to myself, other managers, and employees. I cannot assign notes to admins
- As a manager, I can view a list of all the users in the system except admins

#### _Employee_

- As an employee, I can view a list of the notes assigned to me
- As an employee, I can edit the information of the notes currently assigned to me
- As an employee, I can create new notes and assign them to myself or other employees. I cannot assign notes to admins or managers

<p align="right">(<a href="#readme-top">back to top</a>)</p>

### **Built With**

- [![React][React.js]][React-url]
- [![React Router][ReactRouter.com]][ReactRouter-url]
- [![Redux][Redux.js]][Redux-url]
- [![Material UI][Mui.com]][Mui-url]
- [![NodeJS][Node.js]][Node-url]
- [![Express][Express.js]][Express-url]
- [![MongoDB][MongoDB.com]][MongoDB-url]
- [![JWT][JWT.io]][JWT-url]
- [![ESLint][Eslint.org]][Eslint-url]
- [![Prettier][Prettier.io]][Prettier-url]
- [![Stylelint][Stylelint.io]][Stylelint-url]

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

<!-- API ENDPOINTS -->

## **API Endpoints**

### **Auth APIs**

```js
/**
 * @route POST /auth
 * @description Log in with username and password
 * @body {username, passsword}
 * @access Public
 */
```

```js
/**
 * @route POST /auth/register
 * @description Register new user (for demo purposes only)
 * @body {username, password, role, avatarUrl}
 * @access Public
 */
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

### **User APIs**

```js
/**
 * @route GET /users
 * @description Get users with search query, filter, and paginations
 * @query {page, limit, username, role, active}
 * @access Private - only for Admins
 */
```

```js
/**
 * @route GET /users/all
 * @description Get all users
 * @access Private - only for Admins
 */
```

```js
/**
 * @route GET /users/:id
 * @description Get a single user by their id
 * @params {id}
 * @access Private - only for Admins
 */
```

```js
/**
 * @route POST /users
 * @description Create a new user
 * @body {username, password, role, avatarUrl}
 * @access Private - only for Admins
 */
```

```js
/**
 * @route PATCH /users
 * @description Update an existing user
 * @body {id, username, role, active, password, avatarUrl}
 * @access Private - only for Admins
 */
```

```js
/**
 * @route DELETE /users
 * @description Soft delete an existing user
 * @params {id}
 * @access Private - only for Admins
 */
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

### **Account APIs**

```js
/**
 * @route GET /account/:id
 * @description Get the currently logged-in user's account by their id
 * @params {id}
 * @access Private - for all users
 */
```

```js
/**
 * @route PATCH /account/:id
 * @description Update the currently logged-in user's account
 * @body {id, username, password, avatarUrl}
 * @access Private - for all users
 */
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

### **Note APIs**

```js
/**
 * @route GET /notes/all
 * @description Get all notes
 * @access Private - for all users
 */
```

```js
/**
 * @route GET /notes/
 * @description Get notes with search query, filter, and paginations
 * @query {page, limit, ticket, title, status}
 * @access Private - for all users
 */
```

```js
/**
 * @route GET /notes/:id
 * @description Get a single note by its id
 * @params {id}
 * @access Private - for all users
 */
```

```js
/**
 * @route POST /notes
 * @description Create a new note
 * @body {user, title, text, status}
 * @access Private - for all users
 */
```

```js
/**
 * @route PATCH /notes/:id
 * @description Update an existing note
 * @body {id, user, title, text, status}
 * @access Private - for all users
 */
```

```js
/**
 * @route DELETE /notes/:id
 * @description Soft delete an existing note
 * @params {id}
 * @access Private - only for Admins and Managers
 */
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

<!-- ENTITY RELATIONSHIP DIAGRAM -->

## **Entity Relationship Diagram**

[![Meganote ERD][erd]](https://example.com)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

<!-- GETTING STARTED -->

## **Getting Started**

### **Prerequisites**

1. Check your version of Node.js and npm
   ```sh
   node -v
   npm -v
   ```
2. Install Node.js and npm if needed at [https://nodejs.org/en/download](https://nodejs.org/en/download)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

### **Installation**

#### _Backend_

1. Clone the repo
   ```sh
   git clone https://github.com/hoanglechau/meganote-be.git
   cd meganote-be
   ```
2. Install NPM packages
   ```sh
   npm install
   ```
3. Create an `.env` file with the following contents
   ```js
   MONGO_URI = your_mongodb_uri;
   PORT = your_preferred_port; // default: 5000
   NODE_ENV = development;
   ACCESS_TOKEN_SECRET = your_access_token_secret;
   REFRESH_TOKEN_SECRET = your_refresh_token_secret;
   ```
4. Generate two different secret keys for `ACCESS_TOKEN_SECRET` and `REFRESH_TOKEN_SECRET` using the built-in `crypto` module of `node`
   ```sh
   node
   require('crypto').randomBytes(64).toString('hex')
   ```
5. Replace the default values with your own values for `PORT` (optional), `MONGO_URI`, `ACCESS_TOKEN_SECRET`, and `REFRESH_TOKEN_SECRET` in the `.env` file
6. Start the server
   ```sh
   npm start
   ```

#### _Frontend_

1. Clone the repo
   ```sh
   git clone https://github.com/hoanglechau/meganote-fe-v3.git
   cd meganote-fe-v3
   ```
2. Install NPM packages
   ```sh
   npm install
   ```
3. Create an `.env` file with the following contents
   ```js
   VITE_NODE_ENV = development;
   VITE_API_URL = your_api_url; // default: http://localhost:5000
   ```
4. Optional: Replace the value of `VITE_API_URL` with the URL of your deployed API
5. Build the app
   ```sh
   npm run build
   ```
6. Run the app
   ```sh
   npm run dev
   ```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

<!-- LINKS -->

## **Links**

- Frontend Repository: [https://github.com/hoanglechau/meganote-fe-v3](https://github.com/hoanglechau/meganote-fe-v3)
- Backend Repository: [https://github.com/hoanglechau/meganote-be](https://github.com/hoanglechau/meganote-be)
- Deployed Frontend: [https://meganote-fe-v3.vercel.app/](https://meganote-fe-v3.vercel.app/)
- Deployed Backend: [https://meganote-be-production.up.railway.app/](https://meganote-be-production.up.railway.app/)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->

[public-screenshot]: public/images/Meganote-public.png
[product-screenshot]: public/images/Meganote.png
[erd]: public/images/Meganote%20ERD.png
[React.js]: https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB
[React-url]: https://reactjs.org/
[Redux.js]: https://img.shields.io/badge/Redux-593D88?style=for-the-badge&logo=redux&logoColor=white
[Redux-url]: https://redux.js.org/
[Mui.com]: https://img.shields.io/badge/Material--UI-0081CB?style=for-the-badge&logo=material-ui&logoColor=white
[Mui-url]: https://mui.com/
[ReactRouter.com]: https://img.shields.io/badge/React_Router-CA4245?style=for-the-badge&logo=react-router&logoColor=white
[ReactRouter-url]: https://reactrouter.com/en/main
[Node.js]: https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white
[Node-url]: https://nodejs.org/en
[Express.js]: https://img.shields.io/badge/Express.js-404D59?style=for-the-badge
[Express-url]: https://expressjs.com/
[MongoDB.com]: https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white
[MongoDB-url]: https://www.mongodb.com/
[JWT.io]: https://img.shields.io/badge/json%20web%20tokens-323330?style=for-the-badge&logo=json-web-tokens&logoColor=pink
[JWT-url]: https://jwt.io/
[Eslint.org]: https://img.shields.io/badge/eslint-3A33D1?style=for-the-badge&logo=eslint&logoColor=white
[Eslint-url]: https://eslint.org/
[Prettier.io]: https://img.shields.io/badge/prettier-1A2C34?style=for-the-badge&logo=prettier&logoColor=F7BA3E
[Prettier-url]: https://prettier.io/
[Stylelint.io]: https://img.shields.io/badge/stylelint-000?style=for-the-badge&logo=stylelint&logoColor=white
[Stylelint-url]: https://stylelint.io/
