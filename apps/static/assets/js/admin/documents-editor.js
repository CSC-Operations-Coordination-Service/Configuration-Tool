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

class DocumentsEditor {

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

        // Init the Group and Services selector
        this.initSelectors();

        // Init the Editor for the current version
        this.initCurrentVersionEditor();

        // Init the Editor for the previous versions
        this.initPreviousVersionsEditor();

        // Init the Documents table
        this.initDocumentsTable();

        // Load the Documents Configuration
        this.loadDocuments();

    }

    initSelectors() {

        // Reset the dropdown menu and set options
        $('#docs-groups').find('option').remove().end();
        documentsEditor.groups.forEach(group => {
            $('#docs-groups').append($('<option>', {
                value: group,
                text : group
            }));
        });

        // On Group selection change, update the payload and the level selectors
        $('#docs-groups').on('change', function (e) {

            // Retrieve the selected group
            var selectedGroup = this.value;

            // Update the services options accordingly
            $('#docs-services').find('option').remove().end();
            documentsEditor.services[selectedGroup].forEach(service => {
                $('#docs-services').append($('<option>', {
                    value: service,
                    text : service
                }));
            });

            // By default, when the group changes, select the first service of the chosen group
            $('#docs-services').val(documentsEditor.services[selectedGroup][0]);

        });

        // By default, select 'ESA Baseline' group and trigger the update of the
        // related services in cascade
        $("#docs-groups").val('ESA Baseline');
        $("#docs-groups").trigger("change");
    }

    initCurrentVersionEditor() {
        $('#doc-current-version-editor').summernote({
            minHeight: 100
        });
    }

    initPreviousVersionsEditor() {
        $('#doc-previous-versions-editor').summernote({
            minHeight: 100
        });
    }

    initDocumentsTable() {
        try {
            this.docsDataTable = $('#docs-datatable').DataTable({
                "language": {
                  "emptyTable": "Retrieving documents..."
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
                            var docId = data[0];
                            let actions =
                                '<div class="form-button-action">' +
                                    '<button name="edit-product-type" type="button" title="" class="btn btn-link" ' +
                                          'onclick="documentsEditor.editDocument(\'' + docId + '\');">' +
                                          '<i class="fa fa-edit"></i>'+
                                    '</button>'+
                                    '<button name="delete-product-type" type="button" title="" class="btn btn-link btn-danger" ' +
                                          'onclick="documentsEditor.deleteDocument(\'' + docId + '\');"><i class="fas fa-trash"></i>' +
                                    '</button>'+
                                '</div>'
                            return actions;
                        } else {
                            return data;
                        }
                    }
                }]
            });
        } catch(err) {
            console.info('Initializing Documents table class - skipping table creation...')
        }
    }

    cleanupDocumentEditor() {
        $('#doc-id').val('');
        $('#docs-groups').val('');
        $('#docs-services').val('');
        $('#doc-code').val('');
        $('#doc-title').val('');
        $('#doc-current-version-editor').summernote('code', '');
        $('#doc-previous-versions-editor').summernote('code', '');
        documentsEditor.docsDataTable.clear().draw();
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
        documentsEditor.documents = graph['documents'] != null ? graph['documents'] : [];

        // Loop over the available documents, and append the corresponding
        // entry in the relevant table
        var data = new Array();
        for (var i = 0 ; i < documentsEditor.documents.length; i++) {

            // Save the document row in a class member
            var doc = documentsEditor.documents[i];
            var row = new Array();
            row.push(doc['id']);
            row.push(doc['group']);
            row.push(doc['service']);
            row.push(doc['code']);
            row.push(doc['title']);
            row.push(doc['current_version']);
            row.push(doc['previous_versions']);
            data.push(row);
        }

        // Refresh the documents datatable
        documentsEditor.docsDataTable.clear().rows.add(data).draw();

    }

    errorLoadConfiguration(response) {
        console.error('Unable to retrieve the Documents configuration');
        console.error(response);
        return;
    }

    editDocument(docId) {

        // Edit the document with the specified Id
        if (docId == null || docId.length == 0) {
            console.warn('Missing document identifier');
            return ;
        }

        // Retrieve the corresponding entity
        var doc = null;
        documentsEditor.documents.forEach(dc => {
            if (dc['id'] === docId) {
                doc = dc;
            }
        });

        // Check the document instance consistency
        if (doc == null) {
            console.warn('Invalid document identifier: ' + docId);
            return ;
        }

        // Fill the document editor properties
        $('#doc-id').val(doc['id']);
        $('#docs-groups').val(doc['group']);
        $('#docs-services').val(doc['service']);
        $('#doc-code').val(doc['code']);
        $('#doc-title').val(doc['title']);
        $('#doc-current-version-editor').summernote('code', doc['current_version']);
        $('#doc-previous-versions-editor').summernote('code', doc['previous_versions']);
    }

    saveDocument(clean) {
        var docId = $('#doc-id').val();
        if (docId === null || docId.trim().length == 0) {
            documentsEditor.addDocument(clean);
        } else {
            documentsEditor.updateDocument(clean);
        }
    }

    addDocument(clean) {

        // Auxiliary variable declaration
        var url = new URL(window.location);
        var configId = url.searchParams.get('id');

        // Define the new product type
        var body = {};
        body['config_id'] = configId;
        body['group'] = $('#docs-groups').val();
        body['service'] = $('#docs-services').val();
        body['code'] = $('#doc-code').val();
        body['title'] = $('#doc-title').val();
        body['current_version'] = $('#doc-current-version-editor').summernote('code');
        body['previous_versions'] = $('#doc-previous-versions-editor').summernote('code');

	    // Save the new entity
        ajaxCall('/rest/api/documents', 'POST', body, this.successAddDocument, this.errorAddDocument);

        // Cleanup the document editor if requested
        if (clean) {
            documentsEditor.cleanupDocumentEditor();
        } else {
            $('#doc-id').val('');
        }
    }

    successAddDocument(response) {

        // Refresh the documents table
        documentsEditor.loadDocuments();
    }

    errorAddDocument(response) {
        console.error('Unable to add the specified document');
        console.error(response);
    }

    updateDocument(clean) {

        // Auxiliary variable declaration
        var url = new URL(window.location);
        var configId = url.searchParams.get('id');

        // Define the new product type
        var body = {};
        body['config_id'] = configId;
        body['id'] = $('#doc-id').val();
        body['group'] = $('#docs-groups').val();
        body['service'] = $('#docs-services').val();
        body['code'] = $('#doc-code').val();
        body['title'] = $('#doc-title').val();
        body['current_version'] = $('#doc-current-version-editor').summernote('code');
        body['previous_versions'] = $('#doc-previous-versions-editor').summernote('code');

	    // Update the existing entity
        ajaxCall('/rest/api/documents', 'PUT', body, this.successUpdateDocument, this.errorUpdateDocument);

        // Cleanup the document editor if requested
        if (clean) {
            documentsEditor.cleanupDocumentEditor();
        } else {
            $('#doc-id').val('');
        }
    }

    successUpdateDocument(response) {

        // Refresh the document table
        documentsEditor.loadDocuments();
    }

    errorUpdateDocument(response) {
        console.error('Unable to update the specified document');
        console.error(response);
    }

    deleteDocument(docId) {

        // Auxiliary variable declaration
        var url = new URL(window.location);
        var configId = url.searchParams.get('id');

        // Delete the selected service
        var body = {};
        body['config_id'] = configId;
        body['document_id'] = docId;

        // Delete the document
        ajaxCall('/rest/api/documents', 'DELETE', body, this.successDeleteDocument, this.errorDeleteDocument);
    }

    successDeleteDocument(response) {

        // Refresh the document table
        documentsEditor.loadDocuments();

        // Cleanup the document editor
        documentsEditor.cleanupDocumentEditor();
    }

    errorDeleteDocument(response) {
        console.error('Unable to delete the specified document');
        console.error(response);
    }

}

let documentsEditor = new DocumentsEditor();