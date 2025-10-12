import bcrypt from 'bcryptjs';

const plainPassword = 'shubham@123';
const saltRounds = 10;

bcrypt.hash(plainPassword, saltRounds, function(err, hash) {
    if (err) {
        console.error("Error hashing password:", err);
        return;
    }
    console.log("Your bcrypted password hash is:");
    console.log(hash);
});