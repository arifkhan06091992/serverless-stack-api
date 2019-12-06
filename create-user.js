import AWS from "aws-sdk";
//import { success, failure } from "./libs/response-lib";
const poolData = {
    UserPoolId: "ap-northeast-1_vOqZPZVoI",
    ClientId: "5el8l5gb5i681n02j7qvm5gopu",
    pool_region : "ap-northeast-1",
    SuperAdminGroup : 'SuperAdmin',
    CompanyAdminGroup : 'CompanyAdmin',
};

export function main(event, context, callback) {
    // Request body is passed in as a JSON encoded string in 'event.body'

    const body = JSON.parse(event.body);

    var username = body.username;
    var employee_code = body.employee_code;
    var name = body.name;
    var email = body.email;
    var password = body.password;

    let cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider({apiVersion: '2016-04-18'});

    var params = {
        UserPoolId: poolData.UserPoolId, /* required */
        Username: username, /* required */
        TemporaryPassword: password,
        UserAttributes: [
            {
                Name: "email", Value: email
            },
            {
                Name: "email_verified", Value: 'true'
            },
            {
                Name: "name", Value: name
            },
            {
                Name: "preferred_username", Value: employee_code
            }
        ]
    };

    try {

        cognitoidentityserviceprovider.adminCreateUser(params, function(err, data) {
            if (err)
                callback(err);
            console.log("Register Data",data);
            params = {
                GroupName: poolData.CompanyAdminGroup, /* required */
                UserPoolId: poolData.UserPoolId, /* required */
                Username: username /* required */
            };

            cognitoidentityserviceprovider.adminAddUserToGroup(params, function(err, data) {
                if (err)
                    callback(err);
                callback(null,data);
            });
        });

    } catch (e) {
        callback(`${e.message}`);
    }
}