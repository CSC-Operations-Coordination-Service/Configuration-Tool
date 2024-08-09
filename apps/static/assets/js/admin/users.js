/*
Configuration Tool

The Configuration Tool is a software program produced for the European Space
Agency.

The purpose of this tool is to keep under configuration control the changes
in the Ground Segment components of the Copernicus Programme, in the
framework of the Coordination Desk Programme, managed by Telespazio S.p.A.

This program is free software: you can redistribute it and/or modify it under
the terms of the GNU General Public License as published by the Free Software
Foundation, either version 3 of the License, or (at your option) any later
version.

This program is distributed in the hope that it will be useful, but WITHOUT
ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
You should have received a copy of the GNU General Public License along with
this program. If not, see <http://www.gnu.org/licenses/>.
*/

class Users {

    constructor() {

        // Users table
        try {
            this.usersTable = $('#basic-datatables-users').DataTable({
                "language": {
                  "emptyTable": "Retrieving users..."
                },
                columnDefs: [
                {
                    targets: 0,
                    visible: false
                },
                {
                    targets: -1,
                    data: null,
                    render: function (data, type, row) {
                        if (type === 'display' &&

                                // Allow deletion only of roles different from "admin"
                                (data[1].toString() === 'admin')) {

                            return '<button type="button" class="btn-link" onclick="users.editUserDetails(\'' + data[0] + '\')"><i class="icon-pencil"></i></button>';

                        } else if (type === 'display' &&

                                // Allow deletion only of roles different from "admin"
                                (data[1].toString() !== 'admin')) {

                            return '<button type="button" class="btn-link" onclick="users.editUserDetails(\'' + data[0] + '\')"><i class="icon-pencil"></i></button>' +
                                   '<button type="button" class="btn-link" onclick="users.deleteUser(\'' + data[0] + '\')"><i class="icon-trash"></i></button>';

                        } else {
                            return data;
                        }
                    }
                }]
            });
        } catch(err) {
            console.info('Initializing users class - skipping table creation...')
        }

        // Map containing serialized users accessed from "username" field
        this.users = {};

        // Map containing serialized roles accessed from "role name" field
        this.roles = [];

    }

    init() {

        // Retrieve roles from local MYSQL DB
        ajaxCall('/rest/auth/roles', 'GET', {}, this.loadRoles.bind(this), this.errorLoadRoles.bind(this));

        // Retrieve users from local MYSQL DB
        ajaxCall('/rest/auth/users', 'GET', {}, this.loadUsers.bind(this), this.errorLoadUsers.bind(this));

        return;
    }

    loadRoles(response) {

        // Acknowledge the successful retrieval of users
        var rows = format_response(response);

        // Parse response
        for (var i = 0 ; i < rows.length ; ++i){
            this.roles.push(rows[i]['name']);
        }

        // Populate the select in the modal window to add a new user
        users.roles.forEach(function(role) {
            $('#new-user-role').append('<option value="' + role + '">' + role + '</option>');
        });
    }

    errorLoadRoles(response){
        console.error(response)
        return;
    }

    loadUsers(response) {

        // Acknowledge the successful retrieval of users
        var rows = format_response(response);

        // Parse response
        var data = new Array();
        for (var i = 0 ; i < rows.length ; ++i){

            // Auxiliary variables
            var element = rows[i];
            var id = element['userid'];
            var username = element['username'];
            var email = element['email'];
            var password = element['password'];
            var role = element['role'];
            var modify_date = moment(element['modifyDate'], 'yyyy-MM-DD HH:mm:ss.SSS').toDate();

            // Save a local copy of the user
            this.users[id] = element;

            // Push the element row, with the collected information
            // row is a datatable row, related to a single user
            // User status record:
            // username, email, role, modify date
            data.push([id, username, email, role]);
        }

        // Refresh users table and return
        this.usersTable.clear().rows.add(data).draw();
        return;
    }

    errorLoadUsers(response){
        console.error(response)
        return;
    }

    addUser() {

        // Return if input values are incomplete / missing
        if (!users.validateNewUserDetails()) {
            return ;
        }

        // Retrieve user parameters from new user form
        let username = $('#new-username').val();
        let email = $('#new-user-email').val();
        let role = $('#new-user-role').val();
        let password = $('#new-user-password').val();

        // Invoke new user creation
        let data = {'username': username, 'email': email, 'password': password, 'repeat-password': password, 'role': role}
        ajaxCall('/rest/auth/users', 'POST', data, this.successAddUser.bind(this), this.errorAddUser.bind(this));
    }

    successAddUser(response) {

        // Close new user modal window
        $('#addUserModal').modal('hide');

        // Empty input fields
        $('#new-username').val('');
        $('#new-user-email').val('');
        $('#new-user-password').val('');

        // Reload the users table
        ajaxCall('/rest/auth/users', 'GET', {}, this.loadUsers.bind(this), this.errorLoadUsers.bind(this));
    }

    errorAddUser(response) {
        console.error(response)
        return;
    }

    validateNewUserDetails() {

        // Retrieve new user's details
        let username = $('#new-username').val();
        let email = $('#new-user-email').val();
        let role = $('#new-user-role').val();
        let password = $('#new-user-password').val();

        // Username
        if (!username) {
            $('#new-username-div').addClass('has-error');
            $('#new-username-div-help').remove();
            $('#new-username-div').append('<small id="new-username-div-help" class="form-text text-muted">username cannot be null</small>');
            $("#new-user-btn").prop("disabled", true);
            return false;
        } else {
            $('#new-username-div').removeClass('has-error');
            $('#new-username-div-help').remove();
            $("#new-user-btn").prop("disabled", false);
        }

        // Email
        if (!email) {
            $('#new-user-email-div').addClass('has-error');
            $('#new-user-email-div-help').remove();
            $('#new-user-email-div').append('<small id="new-user-email-div-help" class="form-text text-muted">enter a valid email address</small>');
            $("#new-user-btn").prop("disabled", true);
            return false;
        } else {
            $('#new-user-email-div').removeClass('has-error');
            $('#new-user-email-div-help').remove();
            $("#new-user-btn").prop("disabled", false);
        }

        // Role
        if (!role) {
            $('#new-user-role-div').addClass('has-error');
            $('#new-user-role-div-help').remove();
            $('#new-user-role-div').append('<small id="new-user-role-div-help" class="form-text text-muted">role cannot be null</small>');
            $("#new-user-btn").prop("disabled", true);
            return false;
        } else {
            $('#new-user-role-div').removeClass('has-error');
            $('#new-user-role-div-help').remove();
            $("#new-user-btn").prop("disabled", false);
        }

        // Password
        if (!password) {
            $('#new-user-password-div').addClass('has-error');
            $('#new-user-password-div-help').remove();
            $('#new-user-password-div').append('<small id="new-user-role-div-help" class="form-text text-muted">password cannot be null</small>');
            $("#new-user-btn").prop("disabled", true);
            return false;
        } else {
            $('#new-user-password-div').removeClass('has-error');
            $('#new-user-password-div-help').remove();
            $("#new-user-btn").prop("disabled", false);
        }

        // Successful validation
        return true;
    }

    editUserDetails(userid) {
        let user = users.users[userid];
        users.buildUserDetailsPanel(user);
    }

    buildUserDetailsPanel(user) {

        // Build widgets
        $('#user-details').html('');
        $('#user-details').append(
            '<div class="form-group" id="username-div">' +
                '<label for="username">Username *</label>' +
                '<input type="text" class="form-control" id="username" placeholder="Enter username" required onkeyup="users.validateUserDetails()">' +
            '</div>');
        $('#username').val(user['username']);
        $('#user-details').append(
            '<div class="form-group" id="user-email-div">' +
                '<label for="user-email">Email *</label>' +
                '<input type="text" class="form-control" id="user-email" placeholder="Enter e-mail" required onkeyup="users.validateUserDetails()">' +
            '</div>');
        $('#user-email').val(user['email']);
        $('#user-details').append(
            '<div class="form-group">' +
                '<label for="user-role-select">Role</label>' +
                '<select class="form-control" id="user-role-select" placeholder="User role"></select>' +
            '</div>');
        users.roles.forEach(function(role) {
            let selected = user['role'] === role ? ' selected ' : '';
            $('#user-role-select').append('<option value="' + role + '"' + selected + '>' + role + '</option>');
        });
        $('#user-details').append(
            '<div class="form-group" id="user-password-div">' +
                '<label for="user-password">Password</label>' +
                '<input type="password" class="form-control" id="user-password" placeholder="Password" onkeyup="users.validateUserDetails()">' +
            '</div>');
        $('#user-password').val(user['password']);
        $('#user-details').append(
            '<div class="form-group">' +
                '<button id="save-user-details-btn" class="btn btn-primary pull-right" onclick="users.updateUserDetails(\'' + user['userid'] + '\')">Update</button>' +
            '</div>');

        // Invoke form validation
        users.validateUserDetails();
    }

    updateUserDetails(id) {

        // Retrieve new user's details
        let username = $('#username').val();
        let email =  $('#user-email').val();
        let role = $('#user-role-select').val();
        let password = $('#user-password').val();

        // Invoke user's details update
        let data = {'user_id': id, 'username': username, 'email': email, 'password': password, 'repeat-password': password, 'role': role}
        ajaxCall('/rest/auth/users', 'PUT', data, this.successUpdateUser.bind(this), this.errorUpdateUser.bind(this));
    }

    successUpdateUser(response) {

        // Clean user details panel
        $('#username').val('');
        $('#user-email').val('');
        $('#user-role-select').val('');
        $('#user-password').val('');

        // Reload users table
        ajaxCall('/rest/auth/users', 'GET', {}, this.loadUsers.bind(this), this.errorLoadUsers.bind(this));
    }

    errorUpdateUser(response) {
        console.error(response)
        return;
    }

    validateUserDetails() {

        // Retrieve existing user's details
        let username = $('#username').val();
        let email =  $('#user-email').val();

        // Username
        if (!username) {
            $('#username-div').addClass('has-error');
            $('#username-div-help').remove();
            $('#username-div').append('<small id="username-div-help" class="form-text text-muted">username cannot be null</small>');
            $("#save-user-details-btn").prop("disabled", true);
            return ;
        } else {
            $('#username-div').removeClass('has-error');
            $('#username-div-help').remove();
            $("#save-user-details-btn").prop("disabled", false);
        }

        // Email
        if (!email) {
            $('#user-email-div').addClass('has-error');
            $('#user-email-div-help').remove();
            $('#user-email-div').append('<small id="user-email-div-help" class="form-text text-muted">enter a valid email address</small>');
            $("#save-user-details-btn").prop("disabled", true);
            return ;
        } else {
            $('#user-email-div').removeClass('has-error');
            $('#user-email-div-help').remove();
            $("#save-user-details-btn").prop("disabled", false);
        }
    }

    deleteUser(userid) {

        // Delete the specified role from the local MYSQL DB
        let data = {'user_id': userid};
        ajaxCall('/rest/auth/users', 'DELETE', data, this.successDeleteUser.bind(this), this.errorDeleteUser.bind(this));
    }

    successDeleteUser(response) {

        // Reload the role table
        ajaxCall('/rest/auth/users', 'GET', {}, this.loadUsers.bind(this), this.errorLoadUsers.bind(this));
    }

    errorDeleteUser(response) {
        console.error(response)
        return;
    }

}

let users = new Users();