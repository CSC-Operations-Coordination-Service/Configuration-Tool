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

class DocumentsViewer {

    constructor() {

        this.groups = ['ESA Baseline', 'Industrial Baseline'];

        this.services = {'ESA Baseline': [
                                'Acquisition Stations',
                                'Auxiliary Data Gathering',
                                'Copernicus Ground Segment',
                                'Data Dissemination',
                                'E2E Monitoring',
                                'FOS',
                                'LTA',
                                'Mission Planning',
                                'POD',
                                'Production Service',
                                'Reference System'],
                         'Industrial Baseline': [
                                'Acquisition - CADIP',
                                'Acquisition - DDP',
                                'Acquisition - EDRS',
                                'ADGS',
                                'LTA',
                                'Mission Planning',
                                'MPC',
                                'POD',
                                'PRIP',
                                'Spacecraft',
                                'Traceability']};

        this.documents = [];

    }

    init() {

        // Init the Documents table
        this.initDocumentsTable();

        // Init the Group and Services selector
        this.initSelectors();

        // Load the Documents Configuration
        this.loadDocuments();

    }

    initDocumentsTable() {

        // Initialize the documentation table
        try {
            this.docsDataTable = $('#docs-viewer-datatable').DataTable({
                "language": {
                  "emptyTable": "Retrieving documents..."
                },
                buttons: [
                    {
                        text: '<i class="icon-printer"></i><span>&nbsp&nbspExport to Excel</span>',
                        extend: 'excelHtml5',
                        exportOptions: {
                            columns: ':visible'
                        }
                    }
                ],
                columnDefs: [{
                    targets: 0,
                    visible: false
                }]
            });
        } catch(err) {
            console.info('Initializing Documents table class - skipping table creation...')
        }

        // Customize Excel export button
        this.docsDataTable.buttons().container().appendTo( $('#action-toolbar'));
        var expBtn = $('.dt-button').eq(0);
        expBtn.addClass('btn btn-primary animate-up-2 float-right mr-2');
    }

    initSelectors() {

        // Reset the dropdown menu and set options
        $('#docs-viewer-groups').find('option').remove().end();
        documentsEditor.groups.forEach(group => {
            $('#docs-viewer-groups').append($('<option>', {
                value: group,
                text : group
            }));
        });

        // On Group selection change, update the payload and the level selectors
        $('#docs-viewer-groups').on('change', function (e) {

            // Retrieve the selected group
            var selectedGroup = this.value;

            // Update the services options accordingly
            $('#docs-viewer-services').find('option').remove().end();
            documentsEditor.services[selectedGroup].forEach(service => {
                $('#docs-viewer-services').append($('<option>', {
                    value: service,
                    text : service
                }));
            });

            // By default, when the group changes, select the first service of the chosen group
            var selectedService = documentsViewer.services[selectedGroup][0];
            $('#docs-viewer-services').val(selectedService);

            // Trigger the refresh of the displayed documents
            documentsViewer.updateDisplayedDocumentation(selectedGroup, selectedService);

        });

        // On Service selection change, update the displayed documents
        $('#docs-viewer-services').on('change', function (e) {

            // Retrieve the selected configuration
            var selectedService = this.value;

            // Retrieve the selected group
            var selectedGroup = $('#docs-viewer-groups').val();

            // Trigger the refresh of the displayed documents
            documentsViewer.updateDisplayedDocumentation(selectedGroup, selectedService);

        });

        // By default, select 'ESA Baseline' group and trigger the update of the
        // related services in cascade
        $("#docs-viewer-groups").val('ESA Baseline');
        $("#docs-viewer-groups").trigger("change");
    }

    loadDocuments() {
        var url = new URL(window.location);
        var configId = url.searchParams.get('id');
        var ajaxCallURL = '/rest/api/documents/' + configId;
        ajaxCall(ajaxCallURL, 'GET', {}, this.successLoadConfiguration, this.errorLoadConfiguration);
    }

    successLoadConfiguration(response) {

        // Store the Documents Configuration as a class member
        console.info("Documents configuration loaded.");
        var graph = JSON.parse(formatResponse(response)[0].graph);
        documentsViewer.documents = graph['documents'] != null ? graph['documents'] : [];

        // Loop over the available documents, and append the corresponding
        // entry in the relevant table
        var data = new Array();
        for (var i = 0 ; i < documentsViewer.documents.length; i++) {

            // Save the document row in a class member
            var doc = documentsViewer.documents[i];
            var row = new Array();
            row.push(doc['id']);
            row.push(doc['code']);
            row.push(doc['title']);
            row.push(doc['current_version']);
            row.push(doc['previous_versions']);
            data.push(row);
        }

        // Refresh the documents datatable
        documentsViewer.docsDataTable.clear().rows.add(data).draw();
    }

    errorLoadConfiguration(response) {
        console.error('Unable to retrieve the Documents configuration');
        console.error(response);
        return;
    }

    updateDisplayedDocumentation(selectedGroup, selectedService) {

        // Loop over the available documents, and append the corresponding
        // entry in the class member array
        var data = new Array();
        for (var i = 0 ; i < documentsViewer.documents.length; i++) {

            // Display only documents matching the selected mission and dataflow configuration
            var dc = documentsViewer.documents[i];
            if (dc['group'] === selectedGroup && dc['service'] === selectedService) {

                // Append basic product types properties
                var row = new Array();
                row.push(dc['id']);
                row.push(dc['code']);
                row.push(dc['title']);
                row.push(dc['current_version']);
                row.push(dc['previous_versions']);
                data.push(row);
            }
        }

        // Refresh the dataflow datatable
        documentsViewer.docsDataTable.clear().rows.add(data).draw();

    }
}

let documentsViewer = new DocumentsViewer();