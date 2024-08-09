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

class ConfigurationManager {

    init() {

        // Init class members
        this.configurationsMap = {};

        // Configurations table
        try {
            this.configurationsTable = $('#basic-datatable-configurations').DataTable({
                "language": {
                  "emptyTable": "Retrieving configurations..."
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
                            var configuration = manager.configurationsMap[full[0]];
                            var name = configuration['name'];
                            if (name === 'Interfaces') {
                                return manager.buildInterfacesActionButtons(configuration);
                            } else if (name == 'Processors') {
                                return manager.buildProcessorsActionButtons(configuration);
                            } else if (name == 'Services') {
                                return manager.buildServicesActionButtons(configuration);
                            } else ;
                        } else {
                            return data;
                        }
                    }
                }]
            });
        } catch(err) {
            console.info('Initializing configurations table class - skipping table creation...')
        }

        // Retrieve available scenarios
        ajaxCall('/rest/api/configurations', 'GET', {}, manager.successLoadConfigurations, manager.errorLoadConfigurations);

        return;
    }

    buildInterfacesActionButtons(configuration) {
        let actions =
            '<div class="input-group-append">' +
                '<button type="button" class="btn btn-primary btn-border dropdown-toggle" data-toggle="dropdown" aria-expanded="false">' +
                    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-three-dots-vertical" viewBox="0 0 16 16">' +
                        '<path d="M9.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/>' +
                    '</svg>' +
                '</button>' +
                '<div class="dropdown-menu">' +
                    '<a class="dropdown-item rounded-top" href="/interfaces-editor.html?id='+configuration['id']+'" target="_blank">' +
                        '<img class="navbar-brand-light" src="/static/assets/img/icons/preview_black_24dp.svg" alt="Open configuration" />' +
                        'Edit configuration' +
                    '</a>' +
                    '<a class="dropdown-item rounded-top" href="/interfaces-versioning.html?id='+configuration['id']+'" target="_blank">' +
                        '<img class="navbar-brand-light" src="/static/assets/img/icons/database_black_24px.png" alt="Download description document" />' +
                        'Open configuration versioning' +
                    '</a>' +
                    '<a class="dropdown-item rounded-top" href="/rest/api/interfaces/document/'+configuration['id']+'">' +
                        '<img class="navbar-brand-light" src="/static/assets/img/icons/document-signed.svg" alt="Download description document" />' +
                        'Download description document' +
                    '</a>' +
                    '<a name="delete_scenario_link" class="dropdown-item rounded-top" href="#" onClick="manager.deleteConfiguration(\''+configuration['id']+'\');">' +
                        '<img id=\'ID_ACTION_DELETE_'+configuration['id']+'\' class="navbar-brand-light" src="/static/assets/img/icons/delete_black_24dp.svg" alt="Delete configuration" />' +
                        'Delete configuration' +
                    '</a>' +
                '</ul>' +
            '</div>'
        return actions;
    }

    buildProcessorsActionButtons(configuration) {
        let actions =
            '<div class="input-group-append">' +
                '<button type="button" class="btn btn-primary btn-border dropdown-toggle" data-toggle="dropdown" aria-expanded="false">' +
                    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-three-dots-vertical" viewBox="0 0 16 16">' +
                        '<path d="M9.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/>' +
                    '</svg>' +
                '</button>' +
                '<div class="dropdown-menu">' +
                    '<a class="dropdown-item rounded-top" href="/processors-editor.html?id='+configuration['id']+'" target="_blank">' +
                        '<img class="navbar-brand-light" src="/static/assets/img/icons/preview_black_24dp.svg" alt="Open configuration" />' +
                        'Edit configuration' +
                    '</a>' +
                    '<a name="delete_scenario_link" class="dropdown-item rounded-top" href="#" onClick="manager.deleteConfiguration(\''+configuration['id']+'\');">' +
                        '<img id=\'ID_ACTION_DELETE_'+configuration['id']+'\' class="navbar-brand-light" src="/static/assets/img/icons/delete_black_24dp.svg" alt="Delete configuration" />' +
                        'Delete configuration' +
                    '</a>' +
                '</ul>' +
            '</div>'
        return actions;
    }

    buildServicesActionButtons(configuration) {
        let actions =
            '<div class="input-group-append">' +
                '<button type="button" class="btn btn-primary btn-border dropdown-toggle" data-toggle="dropdown" aria-expanded="false">' +
                    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-three-dots-vertical" viewBox="0 0 16 16">' +
                        '<path d="M9.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/>' +
                    '</svg>' +
                '</button>' +
                '<div class="dropdown-menu">' +
                    '<a class="dropdown-item rounded-top" href="/services-editor.html?id='+configuration['id']+'" target="_blank">' +
                        '<img class="navbar-brand-light" src="/static/assets/img/icons/preview_black_24dp.svg" alt="Open configuration" />' +
                        'Edit configuration' +
                    '</a>' +
                    '<a class="dropdown-item rounded-top" href="/rest/api/services/document/'+configuration['id']+'">' +
                        '<img class="navbar-brand-light" src="/static/assets/img/icons/document-signed.svg" alt="Download description document" />' +
                        'Download description document' +
                    '</a>' +
                    '<a name="delete_scenario_link" class="dropdown-item rounded-top" href="#" onClick="manager.deleteConfiguration(\''+configuration['id']+'\');">' +
                        '<img id=\'ID_ACTION_DELETE_'+configuration['id']+'\' class="navbar-brand-light" src="/static/assets/img/icons/delete_black_24dp.svg" alt="Delete configuration" />' +
                        'Delete configuration' +
                    '</a>' +
                '</ul>' +
            '</div>'
        return actions;
    }

    successLoadConfigurations(response) {

        // Format response
        var rows = response;
        if(!Array.isArray(rows)){
            var arr = [];
            arr.push(rows);
            rows = arr;
        }

        // Auxiliary variable declaration
         var data = new Array();

        // Loop over the available configurations, and append the corresponding
        // entry in the configuration table
        console.info('Configurations successfully loaded.');
        for (var i = 0 ; i < rows.length; i++) {

            // Save the configuration row in a class member
            var configuration = manager.buildElement(rows[i]);
            manager.configurationsMap[configuration['id']] = configuration;

            // Append the scenario row
            var row = new Array();
            row.push(configuration['id']);
            row.push(configuration['name']);
            row.push(configuration['createDate']);
            row.push(configuration['last_modify']);
            row.push(configuration['description']);
            data.push(row);
        }

        // Refresh the configurations datatable
        manager.configurationsTable.clear().rows.add(data).draw();

        return;
    }

    errorLoadConfigurations(response) {
        console.error('Unable to retrieve configurations');
    }

    buildElement(row) {
        return {
            'id' : row.id,
            'name' : row.name,
            'createDate': row.createDate,
            'last_modify': row.last_modify,
            'last_commit': row.last_commit,
            'last_tag': row.last_tag,
            'comment': row.comment,
            'locked': row.locked,
            'description': row.description
        };
    }

    addConfiguration() {

        // Collect the configuration characteristics
        var body = {};
        body['name'] = $('#config-name').val();
        body['description'] = $('#config-description').val();

        // Try saving the new configuration
        ajaxCall('/rest/api/configurations', 'POST', body, manager.successAddConfiguration, manager.errorAddConfiguration);
    }

    successAddConfiguration(response) {

        // Reload configurations
        ajaxCall('/rest/api/configurations', 'GET', {}, manager.successLoadConfigurations, manager.errorLoadConfigurations);
    }

    errorAddConfiguration(response) {
        console.warn('Unable to save the specified configuration');
        console.warn(response);
    }

    deleteConfiguration(configId) {
        $('<div></div>').appendTo('body')
        .html('<div class="modal-dialog"><p class"modal-body">' + 'By clicking \'Yes\', the selected configuration will be deleted. ' +
            'Are you sure you want to proceed?' + '</p></div>')
        .dialog({
            modal: true,
            title: 'Configuration deletion',
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
                    var data = {configId}
                    ajaxCall('/rest/api/configurations', 'DELETE', data, manager.successDeleteConfiguration,
                            manager.errorDeleteConfiguration);
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

        return;
    }

    successDeleteConfiguration(response) {
        window.location.reload()
        return;
    }

    errorDeleteConfiguration(response) {
        console.error('Unable to delete the selected Configuration');
    }

}

let manager = new ConfigurationManager();