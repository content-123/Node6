const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();
const PORT = 3001;

app.use(express.json());
app.use(cors());

mongoose.connect('mongodb://localhost/urlShortener', { useNewUrlParser: true, useUnifiedTopology: true });
const User = mongoose.model('User', { username: String, password: String, activationToken: String, active: Boolean });

app.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    const existingUser = await User.findOne({ username });

    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const activationToken = jwt.sign({ username }, 'secretkey');
    const newUser = new User({ username, password: await bcrypt.hash(password, 10), activationToken });
    await newUser.save();

    // Send activation email
    const transporter = nodemailer.createTransport({
        host: 'smtp.mail.yahoo.com', // Replace with your email service SMTP server
  port: 587, // Replace with your email service SMTP port
  secure: false, // true for 465, false for other ports
  auth: {
    user: 'keerthanakk10@yahoo.com', // Replace with your email address
    pass: 'Liyas@2019', // Replace with your email password or app password
  },
    });

    const mailOptions = {
        from: 'keerthanakk10@yahoo.com', // Replace with your email address
  to: 'recipient-email@example.com', // Replace with the recipient's email address
  subject: 'Test Email',
  text: 'Hello, this is a test email!',
    };

    transporter.sendMail(mailOptions, (error) => {
      if (error) {
        console.error('Error sending activation email:', error);
        res.status(500).json({ error: 'Error sending activation email' });
      } else {
        res.json({ message: 'User registered. Check your email for activation.' });
      }
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/activate/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { username } = jwt.verify(token, 'secretkey');
    await User.updateOne({ username }, { active: true, activationToken: null });

    res.json({ message: 'Account activated successfully' });
  } catch (error) {
    console.error('Error:', error);
    res.status(400).json({ error: 'Invalid activation token' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
