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

class Roles {

    constructor() {

        // Roles table
        try {
            this.rolesTable = $('#basic-datatables-roles').DataTable({
                "language": {
                  "emptyTable": "Retrieving roles..."
                },
                columnDefs: [{
                        targets: -1,
                        data: null,
                        render: function (data, type, row) {

                            // Allow deletion only of roles different from "viewer" and "admin"
                            if ((type === 'display') && (data[0].toString() !== 'admin')
                                    && (data[0].toString() !== 'viewer')) {
                                return '<button type="button" class="btn-link" onclick="roles.deleteRole(\'' + data[0] + '\')"><i class="icon-trash"></i></button>';
                            }
                            return '<p>This role cannot be deleted</p>';
                        }
                    }]
                });
        } catch(err) {
            console.info('Initializing roles class - skipping table creation...')
        }

        // Map containing serialized roles accessed from "role name" field
        this.roles = [];

    }

    init() {

        // Retrieve roles from local MYSQL DB
        ajaxCall('/rest/auth/roles', 'GET', {}, this.successLoadRoles.bind(this), this.errorLoadRoles.bind(this));

        return;
    }

    successLoadRoles(response) {

        // Acknowledge the successful retrieval of roles
        var rows = format_response(response);

        // Parse response
        var data = new Array();
        for (var i = 0 ; i < rows.length ; ++i) {
            let role = rows[i]['name'];
            let description = rows[i]['description'] ? rows[i]['description'] : '';
            data.push([role, description]);
        }

        // Refresh roles table and return
        this.rolesTable.clear().rows.add(data).draw();
        return;
    }

    errorLoadRoles(response){
        console.error(response)
        return;
    }

    validateRole() {

        // Retrieve new role's name
        let rolename = $('#role-name').val();

        // Validate role name
        if (!rolename) {
            $('#role-name-div').addClass('has-error');
            $('#role-name-div-help').remove();
            $('#role-name-div').append('<small id="role-name-div-help" class="form-text text-muted">role name cannot be null</small>')
            $("#role-add-btn").prop("disabled", true);
            return ;
        } else {
            $('#role-name-div').removeClass('has-error');
            $('#role-name-div-help').remove();
            $("#role-add-btn").prop("disabled", false);
        }
    }

    addRole(user) {

        // Retrieve the new role fields
        let name = $('#role-name').val();
        let description = $('#role-description').val();

        // Add the new role to the local MYSQL DB
        let data = {'role_name': name, 'description': description};
        ajaxCall('/rest/auth/roles', 'POST', data, this.successAddRole.bind(this), this.errorAddRole.bind(this));
    }

    successAddRole(response) {

        // Reload the role table
        ajaxCall('/rest/auth/roles', 'GET', {}, this.successLoadRoles.bind(this), this.errorLoadRoles.bind(this));

        // Clear the editing form fields
        $('#role-name').val('');
        $('#role-description').val('');
        $("#role-add-btn").prop("disabled", true);
    }

    errorAddRole(response) {

    }

    deleteRole(role) {

        // Delete the specified role from the local MYSQL DB
        let data = {'role_name': role};
        ajaxCall('/rest/auth/roles', 'DELETE', data, this.successDeleteRole.bind(this), this.errorDeleteRole.bind(this));
    }

    successDeleteRole(response) {

        // Reload the role table
        ajaxCall('/rest/auth/roles', 'GET', {}, this.successLoadRoles.bind(this), this.errorLoadRoles.bind(this));
    }

    errorDeleteRole(response) {
        console.error(response)
        return;
    }
}

let roles = new Roles();