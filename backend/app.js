const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const dotenv = require('dotenv');
const { errorHandler } = require('./middleware/errorMiddleware');

dotenv.config();

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(morgan('dev'));

// Routes (to be added)
// app.use('/api/auth', require('./routes/authRoutes'));
// app.use('/api/users', require('./routes/userRoutes'));
// app.use('/api/jobs', require('./routes/jobRoutes'));
// app.use('/api/milestones', require('./routes/milestoneRoutes'));
// app.use('/api/contracts', require('./routes/contractRoutes'));

// Error handler
app.use(errorHandler);

module.exports = app; 