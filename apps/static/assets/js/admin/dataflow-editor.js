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

class DataflowEditor {

    constructor() {

        this.missions = ['S1', 'S2', 'S3', 'S5P', 'S6'];

        this.missionNames = {
                'S1': 'Sentinel-1',
                'S2': 'Sentinel-2',
                'S3': 'Sentinel-3',
                'S5P': 'Sentinel-5P',
                'S6': 'Sentinel-6'};

        this.payloadsTree = {
                'S1': ['SAR', 'GPS', 'HKTM', 'AIS'],
                'S2': ['MSI', 'HKTM', 'SAD', 'N/A'],
                'S3': ['DORIS', 'GNSS', 'MWR', 'OLCI', 'SLSTR', 'SRAL', 'SYN', 'HKTM'],
                'S5P': ['TROPOMI'],
                'S6': []
        };

        this.levelsTree = {
                'S1': ['L0', 'L1', 'L2'],
                'S2': ['L0', 'L1', 'L2', 'AUX'],
                'S3': ['L0', 'L1', 'L2'],
                'S5P': ['L0', 'L1', 'L2', 'CAL', 'VDAF', 'PyCAMA'],
                'S6': []
        };

        this.groups = ['Products', 'AUX Data', 'MP and FOS files', 'OLQC Reports', 'Removed Products', 'Removed AUX Data'];

        this.entities = ['ADG', 'DA', 'E2E', 'EDRS', 'EUM', 'EXT', 'FOS', 'LTA', 'MP', 'MPC', 'POD', 'PR', 'RS', 'X-Band'];

        this.productTypes = [];

    }

    init() {

        // Init the version selector panel
        initVersionSelector();

        // Init the commit modal window - by default, disable tagging
        initCommitModal();

        // Init the Mission selector
        this.initMissionSelector();

        // Init the Product Types Group selector
        this.initGroupSelector();

        // Init the Description Editor
        this.initDescriptionEditor();

        // Init the CSC Ground Segment Entities selector
        this.initEntitiesSelector();

        // Init the Entity Relations table
        this.initEntitiesRelationsTable();

        // Init the Product Types table
        this.initProductTypesTable();

        // Load the Dataflow Configuration
        this.loadDataflow();

    }

    initMissionSelector() {

        // Reset the dropdown menu and set options
        $('#dataflow-missions').find('option').remove().end();
        dataflowEditor.missions.forEach(mission => {
            $('#dataflow-missions').append($('<option>', {
                value: mission,
                text : dataflowEditor.missionNames[mission]
            }));
        });

        // On Mission selection change, update the payload and the level selectors
        $('#dataflow-missions').on('change', function (e) {

            // Retrieve the selected mission
            var optionSelected = $("option:selected", this);
            var valueSelected = this.value;

            // Update the payload options accordingly
            $('#product-type-payload').find('option').remove().end();
            dataflowEditor.payloadsTree[valueSelected].forEach(payload => {
                $('#product-type-payload').append($('<option>', {
                    value: payload,
                    text : payload
                }));
            });

            // Update the level options accordingly
            $('#product-type-level').find('option').remove().end();
            dataflowEditor.levelsTree[valueSelected].forEach(level => {
                $('#product-type-level').append($('<option>', {
                    value: level,
                    text : level
                }));
            });

            // Disable the sensor mode and the type fields for missions other than Sentinel-1
            document.getElementById('product-type-s1-sensor-mode').disabled = valueSelected != 'S1'
            document.getElementById('product-type-s1-type').disabled = valueSelected != 'S1'
        });

        // On dataflow group selection change, enable or disable the payload, level, sensor mode
        // and type widgets
        $('#dataflow-groups').on('change', function (e) {

            // Retrieve the selected dataflow group
            var optionSelected = $("option:selected", this);
            var valueSelected = this.value;

            // Disable the widgets below if the dataflow is other than "Products"
            document.getElementById('product-type-payload').disabled = valueSelected != 'Products';
            document.getElementById('product-type-level').disabled = valueSelected != 'Products';
            document.getElementById('product-type-s1-sensor-mode').disabled = valueSelected != 'Products';
            document.getElementById('product-type-s1-type').disabled = valueSelected != 'Products';
        });

        // By default, select 'Sentinel-1' and trigger the update of the
        // related selectors in cascade
        $("#dataflow-missions").val('S1');
        $("#dataflow-missions").trigger("change");

        // By default, select the 'Products' group
        $("#dataflow-groups").val('Products');
    }

    initGroupSelector() {

        // Reset the dropdown menu and set options
        $('#dataflow-groups').find('option').remove().end();
        dataflowEditor.groups.forEach(group => {
            $('#dataflow-groups').append($('<option>', {
                value: group,
                text : group
            }));
        });
    }

    initDescriptionEditor() {
        $('#product-type-description-wysiwyg-editor').summernote({
            minHeight: 100
        });
    }

    initEntitiesSelector() {

        // Reset the dropdown menu and set options
        $('#dataflow-entities').find('option').remove().end();
        dataflowEditor.entities.forEach(entity => {
            $('#dataflow-entities').append($('<option>', {
                value: entity,
                text : entity
            }));
        });
    }

    initEntitiesRelationsTable() {
        try {
            this.relationsDataTable = $('#relations-datatable').DataTable({
                "language": {
                  "emptyTable": "Add a dataflow relation between entities..."
                },
                "sDom": "rt",
                columnDefs: [
                {
                    targets: -1,
                    data: null,
                    render: function (data, type, full, meta) {
                        if (type === 'display') {
                            var index = meta.row;
                            let actions =
                                '<div class="form-button-action">' +
                                    '<button name="delete-relation" type="button" title="" class="btn btn-link btn-danger" ' +
                                          'onclick="dataflowEditor.deleteEntityRelation(\'' + index + '\');"><i class="fas fa-trash"></i>' +
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
            console.info('Initializing Entities Relations table class - skipping table creation...')
        }
    }

    initProductTypesTable() {
        try {
            this.productTypesDataTable = $('#product-types-datatable').DataTable({
                "language": {
                  "emptyTable": "Retrieving dataflow product types..."
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
                            var prodTypeId = data[0];
                            let actions =
                                '<div class="form-button-action">' +
                                    '<button name="edit-product-type" type="button" title="" class="btn btn-link" ' +
                                          'onclick="dataflowEditor.editProductType(\'' + prodTypeId + '\');">' +
                                          '<i class="fa fa-edit"></i>'+
                                    '</button>'+
                                    '<button name="delete-product-type" type="button" title="" class="btn btn-link btn-danger" ' +
                                          'onclick="dataflowEditor.deleteProductType(\'' + prodTypeId + '\');"><i class="fas fa-trash"></i>' +
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
            console.info('Initializing Product Types table class - skipping table creation...')
        }
    }

    cleanupProductTypeEditor() {
        $('#product-type-id').val('');
        $('#dataflow-missions').val('');
        $('#dataflow-groups').val('');
        $('#product-type-name').val('');
        $('#product-type-payload').val('');
        $('#product-type-level').val('');
        $('#product-type-s1-sensor-mode').val('');
        $('#product-type-s1-type').val('');
        $('#product-type-description-wysiwyg-editor').summernote('code', '');
        dataflowEditor.relationsDataTable.clear().draw();
    }

    loadDataflow() {
        var url = new URL(window.location);
        var configId = url.searchParams.get('id');
        var version = url.searchParams.get('version');
        var ajaxCallURL = '/rest/api/dataflow/' + configId;
        if (version) ajaxCallURL = '/rest/api/configurations/commit/' + configId + '/' + version;
        ajaxCall(ajaxCallURL, 'GET', {}, this.successLoadConfiguration, this.errorLoadConfiguration);
    }

    successLoadConfiguration(response) {

        // Store the Dataflow Configuration as a class member
        console.info("Dataflow configuration loaded.");
        var graph = JSON.parse(formatResponse(response)[0].graph);
        dataflowEditor.productTypes = graph['product_types'] != null ? graph['product_types'] : [];

        // Loop over the available product types, and append the corresponding
        // entry in the relevant table
        var data = new Array();
        for (var i = 0 ; i < dataflowEditor.productTypes.length; i++) {

            // Save the product type row in a class member
            var pt = dataflowEditor.productTypes[i];
            var row = new Array();
            row.push(pt['id']);
            row.push(dataflowEditor.missionNames[pt['mission']]);
            row.push(pt['group']);
            row.push(pt['name']);
            row.push(pt['payload']);
            row.push(pt['level']);
            row.push(pt['description']);
            row.push(pt['entities_relations']);
            data.push(row);
        }

        // Refresh the dataflow datatable
        dataflowEditor.productTypesDataTable.clear().rows.add(data).draw();

    }

    errorLoadConfiguration(response) {
        console.error('Unable to retrieve the Dataflow configuration');
        console.error(response);
        return;
    }

    editProductType(productTypeId) {

        // Edit the product type with the specified Id
        if (productTypeId == null || productTypeId.length == 0) {
            console.warn('Missing product type identifier');
            return ;
        }

        // Retrieve the corresponding entity
        var productType = null;
        dataflowEditor.productTypes.forEach(pt => {
            if (pt['id'] === productTypeId) {
                productType = pt;
            }
        });

        // Check the product type instance consistency
        if (productType == null) {
            console.warn('Invalid product type identifier: ' + productTypeId);
            return ;
        }

        // Fill the product type editor properties
        $('#product-type-id').val(productType['id']);
        $('#dataflow-missions').val(productType['mission']);
        $('#dataflow-groups').val(productType['group']);
        $('#product-type-name').val(productType['name']);
        $('#product-type-payload').val(productType['payload']);
        $('#product-type-level').val(productType['level']);
        $('#product-type-s1-sensor-mode').val(productType['sensor-mode']);
        $('#product-type-s1-type').val(productType['type']);
        $('#product-type-description-wysiwyg-editor').summernote('code', productType['description']);

        // Fill the entities relations table
        var data = new Array();
        var relations = productType['entities_relations'];
        relations.forEach(relation => {
            if (relation != null) {
                var row = new Array();
                row.push(relation.split(':')[0]);
                row.push(relation.split(':')[1]);
                data.push(row);
            }
        });
        dataflowEditor.relationsDataTable.clear().rows.add(data).draw();
    }

    saveEntityRelation() {
        var data = new Array();
        var row = new Array();
        row.push($('#dataflow-entities').val());
        row.push($('#dataflow-relation').val());
        data.push(row);
        dataflowEditor.relationsDataTable.rows.add(data).draw();
        $('#dataflow-entities').val('');
        $('#dataflow-relation').val('');
    }

    editEntityRelation(selectedRelation) {
        var entity = '';
        var relation = '';
        var selectedIndex = -1;
        dataflowEditor.relationsDataTable.rows().every(function(index, tl, rl) {
            var row = dataflowEditor.relationsDataTable.row(index);
            if (row.data()[0] == selectedRelation) {
                entity = row.data()[0];
                relation = row.data()[1];
                selectedIndex = index;
            }
        });
        $('#dataflow-entities').val(entity);
        $('#dataflow-relation').val(relation);
        dataflowEditor.relationsDataTable.row(selectedIndex).remove().draw();
    }

    deleteEntityRelation(index) {
        dataflowEditor.relationsDataTable.row(index).remove().draw();
    }

    saveProductType(clean) {
        var productTypeId = $('#product-type-id').val();
        if (productTypeId === null || productTypeId.trim().length == 0) {
            dataflowEditor.addProductType(clean);
        } else {
            dataflowEditor.updateProductType(clean);
        }
    }

    addProductType(clean) {

        // Auxiliary variable declaration
        var url = new URL(window.location);
        var configId = url.searchParams.get('id');

        // Define the new product type
        var body = {};
        body['config_id'] = configId;
        body['mission'] = $('#dataflow-missions').val();
        body['group'] = $('#dataflow-groups').val();
        body['name'] = $('#product-type-name').val();
        body['payload'] = $('#product-type-payload').val();
        body['level'] = $('#product-type-level').val();
        body['sensor-mode'] = $('#product-type-s1-sensor-mode').val();
        body['type'] = $('#product-type-s1-type').val();
        body['description'] = $('#product-type-description-wysiwyg-editor').summernote('code');

        // Retrieve the entities relations
        var relations = [];
        dataflowEditor.relationsDataTable.rows().every(function(index, tl, rl) {
            let relation = dataflowEditor.relationsDataTable.rows(index).data()[0];
            let relationStr = relation[0] + ':' + relation[1];
            relations.push(relationStr);
        });
        body['entities_relations'] = relations;

	    // Save the new entity
        ajaxCall('/rest/api/dataflow', 'POST', body, this.successAddProductType, this.errorAddProductType);

        // Cleanup the product type editor if requested
        if (clean) {
            dataflowEditor.cleanupProductTypeEditor();
        } else {
            $('#product-type-id').val('');
        }
    }

    successAddProductType(response) {

        // Refresh the dataflow table
        dataflowEditor.loadDataflow();
    }

    errorAddProductType(response) {
        console.error('Unable to add the specified product type');
        console.error(response);
    }

    updateProductType(clean) {

        // Auxiliary variable declaration
        var url = new URL(window.location);
        var configId = url.searchParams.get('id');

        // Define the new product type
        var body = {};
        body['config_id'] = configId;
        body['id'] = $('#product-type-id').val();
        body['mission'] = $('#dataflow-missions').val();
        body['group'] = $('#dataflow-groups').val();
        body['name'] = $('#product-type-name').val();
        body['payload'] = $('#product-type-payload').val();
        body['level'] = $('#product-type-level').val();
        body['sensor-mode'] = $('#product-type-s1-sensor-mode').val();
        body['type'] = $('#product-type-s1-type').val();
        body['description'] = $('#product-type-description-wysiwyg-editor').summernote('code');

        // Retrieve the entities relations
        var relations = [];
        dataflowEditor.relationsDataTable.rows().every(function(index, tl, rl) {
            let relation = dataflowEditor.relationsDataTable.rows(index).data()[0];
            let relationStr = relation[0] + ':' + relation[1];
            relations.push(relationStr);
        });
        body['entities_relations'] = relations;

	    // Update the existing entity
        ajaxCall('/rest/api/dataflow', 'PUT', body, this.successUpdateProductType, this.errorUpdateProductType);

        // Cleanup the product type editor if requested
        if (clean) {
            dataflowEditor.cleanupProductTypeEditor();
        } else {
            $('#product-type-id').val('');
        }
    }

    successUpdateProductType(response) {

        // Refresh the dataflow table
        dataflowEditor.loadDataflow();
    }

    errorUpdateService(response) {
        console.error('Unable to update the specified product type');
        console.error(response);
    }

    deleteProductType(productTypeId) {

        // Auxiliary variable declaration
        var url = new URL(window.location);
        var configId = url.searchParams.get('id');

        // Delete the selected service
        var body = {};
        body['config_id'] = configId;
        body['product_type_id'] = productTypeId;

        // Delete the processor release
        ajaxCall('/rest/api/dataflow', 'DELETE', body, this.successDeleteProductType, this.errorDeleteProductType);
    }

    successDeleteProductType(response) {

        // Refresh the dataflow table
        dataflowEditor.loadDataflow();

        // Cleanup the product type editor
        dataflowEditor.cleanupProductTypeEditor();
    }

    errorDeleteProductType(response) {
        console.error('Unable to delete the specified product type');
        console.error(response);
    }

}

let dataflowEditor = new DataflowEditor();