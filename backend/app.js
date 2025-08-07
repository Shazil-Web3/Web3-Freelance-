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
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/jobs', require('./routes/jobRoutes'));
app.use('/api/milestones', require('./routes/milestoneRoutes'));
app.use('/api/applications', require('./routes/applicationRoutes'));
app.use('/api/submissions', require('./routes/projectSubmissionRoutes'));
app.use('/api/disputes', require('./routes/disputeRoutes'));
app.use('/api/test', require('./routes/testRoutes'));

// Error handler
app.use(errorHandler);

module.exports = app; 