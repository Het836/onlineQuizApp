# Online Quiz System

A comprehensive online quiz system built with Node.js, Express, and MySQL. This is Phase 1 of the project, focusing on setting up the foundation.

## Features

- Express.js server with RESTful API
- MySQL database connection using mysql2
- Environment variable configuration
- RESTful API structure with controllers and middleware
- Static file serving
- Error handling middleware
- Responsive frontend design
- Health check endpoint

## Project Structure

```
quiz-system/
├── server.js
├── package.json
├── .env.example
├── .gitignore
├── README.md
├── config/
│   └── db.js
├── controllers/
│   └── homeController.js
├── middleware/
│   └── errorHandler.js
├── public/
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── main.js
├── routes/
│   └── index.js
└── views/
    ├── index.html
    ├── 404.html
    ├── 500.html
    ├── about.html
    └── contact.html
```

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd quiz-system
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Configure your environment variables in `.env`:
   ```
   PORT=3000
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=quiz_db
   ```

5. Set up the MySQL database:
   ```sql
   CREATE DATABASE quiz_db;
   ```

6. Start the server:
   ```bash
   npm start
   ```

   For development with auto-reload:
   ```bash
   npm run dev
   ```

## Environment Variables

- `PORT`: Server port (default: 3000)
- `DB_HOST`: Database host (default: localhost)
- `DB_PORT`: Database port (default: 3306)
- `DB_USER`: Database username (default: root)
- `DB_PASSWORD`: Database password
- `DB_NAME`: Database name (default: quiz_db)

## API Endpoints

- `GET /` - Homepage
- `GET /api/health` - Health check endpoint
- `GET /about` - About page
- `GET /contact` - Contact page

## Development

This project follows MVC architecture:
- **Models**: Database models (to be implemented in future phases)
- **Views**: HTML templates in the `views` directory
- **Controllers**: Request handlers in the `controllers` directory
- **Routes**: Route definitions in the `routes` directory
- **Middleware**: Custom middleware in the `middleware` directory

## Built With

- [Node.js](https://nodejs.org/) - JavaScript runtime
- [Express.js](https://expressjs.com/) - Web framework
- [MySQL2](https://www.npmjs.com/package/mysql2) - MySQL client
- [Dotenv](https://www.npmjs.com/package/dotenv) - Environment variable loader

## License

This project is licensed under the ISC License.

## Acknowledgments

- Thanks to all contributors and open-source projects used
