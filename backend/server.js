const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const categoryRoutes = require('./routes/category');
const cartRoutes = require('./routes/cart');
const customerRoutes = require('./routes/customer');
const orderRoutes = require('./routes/order');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const app = express();
const PORT = process.env.PORT || 5001;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/userdb';
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../frontend')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/category', categoryRoutes);
app.use('/api/product', require('./routes/product'));
app.use('/api/cart', cartRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/order', orderRoutes);

// Swagger setup
const swaggerOptions = {
	definition: {
		openapi: '3.0.0',
		info: {
			title: 'User API',
			version: '1.0.0',
			description: 'API documentation for User Registration and Profile Management'
		},
		servers: [
			{
				url: 'http://localhost:5001', // Change port if needed
			},
		],
	},
	apis: ['./routes/*.js'], // Path to the API docs (JSDoc comments in your route files)
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Connect to MongoDB and start server
mongoose.connect(MONGO_URI)
	.then(() => {
		console.log('MongoDB connected');
		app.listen(PORT, () => {
			console.log(`Server running on port ${PORT}`);
			console.log(`Frontend: http://localhost:${PORT}/`);
			console.log(`API Docs: http://localhost:${PORT}/api-docs`);
			console.log('--- API Endpoints ---');
			console.log(`Register: POST ${BASE_URL}/api/auth/register`);
			console.log(`Login:    POST ${BASE_URL}/api/auth/login`);
			console.log(`Profile View:  GET ${BASE_URL}/api/profile`);
			console.log(`Profile Edit:  PUT ${BASE_URL}/api/profile`);
			console.log('---------------------');
		});
	})
	.catch(err => {
		console.error('MongoDB connection error:', err);
		console.error('Make sure MongoDB is running locally, or set MONGO_URI to a valid Atlas connection string.');
	});
