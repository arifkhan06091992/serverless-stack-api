import jwt from "jsonwebtoken";
import _ from 'lodash';
import {failure, success} from "./libs/response-lib";
const JWT_EXPIRATION_TIME = '5m';

const UsersDB = [
    {
        username: 'Cthon98',
        password: 'hunter2', // User password
        scopes: ['pangolins'], // Authorized actions
    },
    {
        username: 'AzureDiamond',
        password: '*********',
        scopes: [],
    },
];
const login = (username, password) => {
    const user = _.find(UsersDB, { username });
    if (!user) throw new Error('User not found!');

    const hasValidPassword = (user.password === password);
    if (!hasValidPassword) throw new Error('Invalid password');

    return _.omit(user, 'password');
};

export async function main(event, context, callback) {

    console.log('login');
    const { username, password } = JSON.parse(event.body);

    try {
        // Authenticate user
        const user = login(username, password);
        console.log(user);

        // Issue JWT
        const token = jwt.sign({ user }, 'KxyaVupTFaUQT9gdjgKDFUK9C9YX5HiF', { expiresIn: JWT_EXPIRATION_TIME });
        console.log(`JWT issued: ${token}`);
        return success(token);
    } catch (e) {
        console.log(`Error logging in: ${e.message}`);
        return failure({ status: false, error: `${e.message}` });
    }
};