const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const Profile = require('./models/Profile');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors());

// Database Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error('MongoDB Connection Error:', err));

// Health Check Endpoint (to prevent Render from sleeping)
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// Routes
// Register
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password, department, year, sec, role } = req.body;

        // Validation
        if (!name || !email || !password || !department || !year || !sec) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Check if profile exists in the profile collection
        const existingProfile = await Profile.findOne({ email });
        if (existingProfile) {
            return res.status(400).json({ message: 'Your account already exists. Please login instead.' });
        }

        // Create Profile (password stored as plain text)
        const newProfile = new Profile({
            name,
            email,
            password, // Stored without encryption
            department,
            year,
            sec,
            role: role || 'user',
        });

        await newProfile.save();

        res.status(201).json({
            message: 'Registration successful',
            profile: {
                id: newProfile._id,
                name: newProfile.name,
                email: newProfile.email,
                department: newProfile.department,
                year: newProfile.year,
                sec: newProfile.sec,
                role: newProfile.role
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Login
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check profile
        const profile = await Profile.findOne({ email });
        if (!profile) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check password (plain text comparison)
        if (password !== profile.password) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        res.json({
            message: 'Login successful',
            profile: {
                id: profile._id,
                name: profile.name,
                email: profile.email,
                department: profile.department,
                year: profile.year,
                sec: profile.sec,
                role: profile.role
            }
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all profiles (optional - for admin)
app.get('/api/profiles', async (req, res) => {
    try {
        const profiles = await Profile.find().select('-password');
        res.json({ profiles });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
