const bcrypt = require('bcryptjs');

const hashPassword = (password) => {
    var salt = bcrypt.genSaltSync(10)
    var hash = bcrypt.hashSync(password, salt);
    return hash
}

const comparepassword = (password, dbpassword) => {
        return bcrypt.compareSync(password, dbpassword);
};

// console.log(hashPassword('123')) 
module.exports = {hashPassword,comparepassword}