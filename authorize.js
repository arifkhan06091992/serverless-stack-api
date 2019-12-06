//import _ from 'lodash';
import jwt from "jsonwebtoken";
import request from "request";
import jwkToPem from "jwk-to-pem";
//import {failure, success} from "./libs/response-lib";

// Returns a boolean whether or not a user is allowed to call a particular method
// A user with scopes: ['pangolins'] can
// call 'arn:aws:execute-api:ap-southeast-1::random-api-id/dev/GET/pangolins'
// const authorizeUser = (userScopes, methodArn) => {
//     console.log('------------authorizeUser-----------------------');
//     console.log(`${JSON.stringify(userScopes)} ${methodArn}`);
//     return _.some(userScopes, scope => _.endsWith(methodArn, scope));
// };

const poolData = {
    UserPoolId: "ap-northeast-1_vOqZPZVoI",
    ClientId: "5el8l5gb5i681n02j7qvm5gopu",
    pool_region : "ap-northeast-1",
    SuperAdminGroup : 'SuperAdmin',
    CompanyAdminGroup : 'CompanyAdmin',
};


const buildIAMPolicy = (userId, effect, resource, context) => {
    console.log('------------buildIAMPolicy-----------------------');
    console.log(`${userId} ${effect} ${resource}`);
    const policy = {
        principalId: userId,
        policyDocument: {
            Version: '2012-10-17',
            Statement: [
                {
                    Action: 'execute-api:Invoke',
                    Effect: effect,
                    Resource: resource,
                },
            ],
        },
        context,
    };

    console.log('------------policy-----------------------');

    console.log(JSON.stringify(policy));
    return policy;
};

export function main(event, context, callback) {
    console.log('------------In authorize main function-----------------------');
    console.log(event);
    const token = event.authorizationToken;
    let userData=null;

    try {

        console.log(`https://cognito-idp.${poolData.pool_region}.amazonaws.com/${poolData.UserPoolId}/.well-known/jwks.json`);
        request({
            url: "https://cognito-idp."+poolData.pool_region+".amazonaws.com/"+poolData.UserPoolId+"/.well-known/jwks.json",
            json: true
        }, function (error, response, body) {

            console.log('------------In http request response-----------------------');

            if (!error && response.statusCode === 200) {
                console.log('------------body-----------------------');
                console.log(body);
                let pems = {};
                var keys = body['keys'];
                for(var i = 0; i < keys.length; i++) {
                    //Convert each key to PEM
                    var key_id = keys[i].kid;
                    var modulus = keys[i].n;
                    var exponent = keys[i].e;
                    var key_type = keys[i].kty;
                    var jwk = { kty: key_type, n: modulus, e: exponent};
                    pem = jwkToPem(jwk);
                    pems[key_id] = pem;
                }
                //validate the token
                var decodedJwt = jwt.decode(token, {complete: true});
                if (!decodedJwt) {
                    console.log("Not a valid JWT token");
                    callback('Unauthorized');
                }

                var kid = decodedJwt.header.kid;
                var pem = pems[kid];
                if (!pem) {
                    console.log('Invalid token');
                    callback('Unauthorized');
                }

                jwt.verify(token, pem, function(err, payload) {
                    if(err) {
                        callback('Unauthorized'); // Return a 401 Unauthorized response
                    } else {
                        console.log("Valid Token.");
                        userData = payload;
                        // Return an IAM policy document for the current endpoint
                        const effect = (userData) ? 'Allow' : 'Deny';
                        const userId = userData.username;
                        const authorizerContext = { user: JSON.stringify(userData) };
                        console.log('------------authorizerContext-----------------------');
                        console.log(authorizerContext);


                        const policyDocument = buildIAMPolicy(userId, effect, event.methodArn, authorizerContext);

                        console.log('Returning IAM policy document');

                        callback(null, policyDocument);
                    }
                });
            } else {
                console.log('------------body-----------------------');
                console.log(error);
                callback('Unauthorized'); // Return a 401 Unauthorized response
            }
        });

        // Verify JWT
        /*const decoded = jwt.verify(token, 'KxyaVupTFaUQT9gdjgKDFUK9C9YX5HiF');
        console.log('------------Decoded token-----------------------');
        console.log(JSON.stringify(decoded));

        // Checks if the user's scopes allow her to call the current endpoint ARN
        const user = decoded.user;
        const isAllowed = 1;
        console.log('------------isAllowed-----------------------');
        console.log(isAllowed);*/

    } catch (e) {
        console.log(e.message);
        callback('Unauthorized'); // Return a 401 Unauthorized response
    }
};