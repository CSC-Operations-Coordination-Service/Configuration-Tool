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

class Profiles {

    constructor() {

        // Conservatively, set the "viewer" role
        this.role = 'viewer';

        // Retrieve users from local MYSQL DB
        ajaxCall('/rest/auth/user', 'GET', {}, this.successLoadUser.bind(this), this.errorLoadUser.bind(this));

    }

    successLoadUser(response) {
        if (response.hasOwnProperty('role')) {
            this.role = response.role.toLowerCase();
        }
        if (this.role === 'admin') {
            this.addAdminPaths();
        }
    }

    errorLoadUser(response) {
        console.error(response);
        return ;
    }

    addAdminPaths() {
        let path = window.location.href;
        let activeRoles = path.toUpperCase().includes('ROLES') ? ' active ' : '';
        let activeUsers = path.toUpperCase().includes('USERS') ? ' active ' : '';
        let activeMng = path.toUpperCase().includes('MANAGE') ? ' active ' : '';
        let active = path.toUpperCase().includes('MANAGE') || path.toUpperCase().includes('USERS')
                || path.toUpperCase().includes('ROLES') ? ' active ' : '';
        let show = path.toUpperCase().includes('MANAGE')  || path.toUpperCase().includes('USERS')
                || path.toUpperCase().includes('ROLES') ? ' show ' : '';
        $('#custom-admin-paths').remove();
        $('#sidebar-navigation-menu').append(
            '<li class="nav-item' + active + '" id="custom-admin-paths">' +
                '<a data-toggle="collapse" href="#admin">' +
                    '<i class="fas fa-cogs"></i>' +
                    '<p>Administration</p>' +
                    '<span class="caret"></span>' +
                '</a>' +
                '<div class="collapse' + show + '" id="admin">' +
                    '<ul class="nav nav-collapse">' +
                        '<li class="' + activeRoles + '">' +
                            '<a href="/roles.html">' +
                                '<span class="sub-item">Roles</span>' +
                            '</a>' +
                        '</li>' +
                        '<li class="' + activeUsers + '">' +
                            '<a href="/users.html">' +
                                '<span class="sub-item">Users</span>' +
                            '</a>' +
                        '</li>' +
                        '<li class="' + activeMng + '">' +
                            '<a href="/configuration-manager.html">' +
                                '<span class="sub-item">Configurations</span>' +
                            '</a>' +
                        '</li>' +
                    '</ul>' +
                '</div>' +
            '</li>');
    }

}

profiles = new Profiles();