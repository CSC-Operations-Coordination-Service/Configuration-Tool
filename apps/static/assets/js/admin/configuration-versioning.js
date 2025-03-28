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

class VersionManager {

    constructor() {

        // Init the versioning table, listing all commits
        this.initVersioningTable();
    }

    init() {

        // Retrieve the list of commits
        this.loadCommits();

    }

    initVersioningTable() {
        try {
            this.versioningTable = $('#versioning-datatable').DataTable({
                "language": {
                  "emptyTable": "Retrieving versions..."
                },
                columnDefs: [
                {
                    targets: 0,
                    visible: false
                },
                {
                    targets: -1,
                    data: null,
                    render: function (data, type, full, meta) {
                        if (type === 'display') {
                            var tag = full[0];
                            var revId = full[2];
                            var url = new URL(window.location);
                            var configId = url.searchParams.get('id');
                            let actions = '';
                            if (tag != null && tag.trim().length > 0) {
                                actions +=
                                    '<button type="button" class="btn-link">' +
                                        '<i class="icon-tag"></i>' +
                                    '</button>'
                            } else {
                                actions +=
                                    '<button type="button" class="btn-link" onClick="versionManager.deleteVersion(\'' +
                                            configId + '\',\'' + revId + '\');">' +
                                        '<i class="icon-trash"></i>' +
                                    '</button>'
                            }
                            return actions;
                        } else {
                            return data;
                        }
                    }
                }]
            });
        } catch(err) {
            console.info('Initializing versioning table class - skipping table creation...')
        }
    }

    loadCommits() {
        var url = new URL(window.location);
        var configId = url.searchParams.get('id');
        ajaxCall('/rest/api/configurations/commit/' + configId, 'GET', {}, this.successLoadCommits, this.errorLoadCommits);
        return;
    }

    successLoadCommits(response) {

        // Auxiliary variable declaration
        var versions = formatResponse(response);
        var data = new Array();

        // Loop over the available versions, and append the corresponding
        // entry in the versioning table
        for (var i = 0 ; i < versions.length ; i++) {

            // Save the interface row in a class member
            var version = versions[i];

            // Append the interface row
            var row = new Array();
            row.push(version['tag']);
            row.push(version['last_modify']);
            row.push(version['n_ver']);
            row.push(version['comment']);
            data.push(row);
        }

        // Refresh the scenario datatable
        versionManager.versioningTable.clear().rows.add(data).draw();
    }

    errorLoadCommits(response) {
        console.error('Unable to open the selected version');
        console.error(response);
    }

    deleteVersion(configId, revId) {
        $('<div></div>').appendTo('body')
        .html('<div class="modal-dialog"><p class"modal-body">' + 'By clicking \'Yes\', the selected version will be deleted. ' +
            'Are you sure you want to proceed?' + '</p></div>')
        .dialog({
            modal: true,
            title: 'Configuration version deletion',
            zIndex: 10000,
            autoOpen: true,
            width: 'auto',
            resizable: false,
            closeOnEscape: false,
            buttons: [
            {
                text: 'No',
                click: function() {
                    $(this).dialog("close");
                },
                class: "btn btn-sm btn-gray-800 animate-up-2",
                style: "height: 40px; width: 90px"
            },
            {
                text: 'Yes',
                click: function() {
                    var data = {'configId': configId, 'revId': revId}
                    ajaxCall('/rest/api/configurations/commit', 'DELETE', data, versionManager.successDeleteVersion,
                            versionManager.errorDeleteVersion);
                    $(this).dialog("close");
                },
                class: "btn btn-sm btn-gray-800 animate-up-2",
                style: "height: 40px; width: 90px"
            }
          ],
          open: function(event, ui) {
              $(".ui-dialog-titlebar-close").hide();
          }
        });

        return ;
    }

    successDeleteVersion(response) {
        window.location.reload()
        return;
    }

    errorDeleteVersion(response) {
        console.error('Unable to delete the selected version');
    }
}

let versionManager = new VersionManager();