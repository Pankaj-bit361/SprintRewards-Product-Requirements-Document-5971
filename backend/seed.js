import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const seedFounder = async () => {
  if (process.env.NODE_ENV === 'production') {
    console.log('Seed script is intended for development use only. Aborting.');
    return;
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB for seeding.');

    const founderEmail = 'shubham@questera.ai';
    const founderExists = await User.findOne({ email: founderEmail });

    if (founderExists) {
      console.log('Founder account already exists. No action needed.');
    } else {
      const founder = new User({
        name: 'Shubham Nigam',
        email: founderEmail,
        password: 'shubham@123',
        role: 'founder',
        sprintPoints: 0,
        isEligible: false,
      });
      await founder.save(); // pre-save hook will hash the password
      console.log('Founder "Shubham Nigam" created successfully!');
    }
  } catch (error) {
    console.error('Error seeding founder data:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed.');
  }
};

seedFounder();