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

class DataflowViewer {

    constructor() {

        this.missions = ['S1', 'S2', 'S3', 'S5P', 'S6'];

        this.missionNames = {
                'S1': 'Sentinel-1',
                'S2': 'Sentinel-2',
                'S3': 'Sentinel-3',
                'S5P': 'Sentinel-5P',
                'S6': 'Sentinel-6'};

        this.groups = ['Products', 'AUX Data', 'MP and FOS files', 'OLQC Reports', 'Removed Products', 'Removed AUX Data'];

        this.entities = ['PR', 'FOS', 'MP', 'ADG', 'E2E', 'MPC', 'LTA', 'DA', 'EUM', 'EXT', 'RS', 'POD', 'EDRS', 'X-Band'];

        this.productTypes = [];

    }

    init() {

        // Init the version selector panel
        initVersionSelector();

        // Init the dropdown menus permitting to select the Dataflow configuration
        this.initDataflowConfigurationSelectors();

        // Init the Dataflow table
        this.initDataflowTable();

        // Load the Dataflow configuration
        this.loadDataflow();

    }

    initDataflowConfigurationSelectors() {

        // Reset the Missions dropdown menu and set options
        $('#dataflow-viewer-missions').find('option').remove().end();
        dataflowViewer.missions.forEach(mission => {
            $('#dataflow-viewer-missions').append($('<option>', {
                value: mission,
                text : dataflowViewer.missionNames[mission]
            }));
        });

        // Reset the Dataflow Configuration dropdown menu and set options
        $('#dataflow-viewer-groups').find('option').remove().end();
        dataflowViewer.groups.forEach(group => {
            $('#dataflow-viewer-groups').append($('<option>', {
                value: group,
                text : group
            }));
        });

        // On Mission selection change, update the displayed dataflow configuration
        $('#dataflow-viewer-missions').on('change', function (e) {

            // Retrieve the selected mission
            var optionSelected = $("option:selected", this);
            var missionSelected = this.value;

            // Retrieve the selected configuration
            var configurationSelected = $('#dataflow-viewer-groups').val();

            // Update the displayed product types
            dataflowViewer.updateDisplayedConfiguration(missionSelected, configurationSelected);

        });

        // On Group selection change, update the displayed dataflow configuration
        $('#dataflow-viewer-groups').on('change', function (e) {

            // Retrieve the selected configuration
            var optionSelected = $("option:selected", this);
            var configurationSelected = this.value;

            // Retrieve the selected mission
            var missionSelected = $('#dataflow-viewer-missions').val();

            // Update the displayed product types
            dataflowViewer.updateDisplayedConfiguration(missionSelected, configurationSelected);

        });
    }

    initDataflowTable() {
        try {

            // Initialize dataflow table
            this.dataflowTable = $('#dataflow-datatable').DataTable({
                "language": {
                  "emptyTable": "Retrieving dataflow configuration..."
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
                columnDefs: [
                {
                    targets: 0,
                    visible: false
                }]
            });

            // Customize Excel export button
            this.dataflowTable.buttons().container().appendTo( $('#action-toolbar'));
            var expBtn = $('.dt-button').eq(0);
            expBtn.addClass('btn btn-primary animate-up-2 float-right mr-2');

        } catch(err) {
            console.info('Initializing Dataflow Configuration table class - skipping table creation...')
        }
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
        dataflowViewer.productTypes = graph['product_types'] != null ? graph['product_types'] : [];

        // By default, select the "Sentinel-1" mission and the "Products" configuration and trigger the update of the
        // displayed dataflow configuration
        $("#dataflow-viewer-missions").val('S1');
        $("#dataflow-viewer-groups").val('Products');
        $("#dataflow-viewer-groups").trigger("change");
    }

    errorLoadConfiguration(response) {
        console.error('Unable to retrieve the Dataflow configuration');
        console.error(response);
        return;
    }

    updateDisplayedConfiguration(selectedMission, selectedConfiguration) {

        // Loop over the available product types, and append the corresponding
        // entry in the class member array
        var data = new Array();
        for (var i = 0 ; i < dataflowViewer.productTypes.length; i++) {

            // Display only product types matching the selected mission and dataflow configuration
            var pt = dataflowViewer.productTypes[i];
            if (pt['mission'] === selectedMission && pt['group'] === selectedConfiguration) {

                // Append basic product types properties
                var row = new Array();
                row.push(pt['id']);
                row.push(pt['name']);
                row.push(pt['payload']);
                row.push(pt['level']);

                // Add the sensor mode and sensor type for S1 Products dataflow configuration
                if (selectedMission === 'S1' && selectedConfiguration === 'Products') {
                    row.push(pt['sensor-mode']);
                    row.push(pt['type']);
                } else {
                    row.push(' ');
                    row.push(' ');
                }

                // Append the description
                row.push(pt['description']);

                // Loop over all GS entities, and set the corresponding relation
                var relations = pt['entities_relations'];
                dataflowViewer.entities.forEach(entity => {
                    var found = false;
                    relations.forEach(relation => {
                        var relationEntity = relation.split(':')[0];
                        var relationship = relation.split(':')[1];
                        if (entity === relationEntity) {
                            var html = relationship.replace(';', '<br>').replace('/', '<br>').trim();
                            row.push(html);
                            found = true;
                        }
                    });
                    if (!found) row.push(' ');
                });


                row.push(pt['entities_relations']);
                data.push(row);
            }
        }

        // Refresh the dataflow datatable
        dataflowViewer.dataflowTable.clear().rows.add(data).draw();

        // Hide columns on the basis of the selected configuration group
        // 'ID' 'Prod Type' 'Payload' 'Level' 'S1-Mode' 'S1-Typ' 'Desc' 'PR' 'FOS' 'MP' 'ADG' 'E2E' 'MPC' 'LTA' 'DA' 'EUM' 'EXT' 'RS' 'POD' 'EDRS' 'X-Band'
        //   0        1         2        3         4        5       6     7     8    9    10    11    12    13   14    15    16   17    18     19      20
        if (selectedConfiguration === 'Products') {
            if (selectedMission === 'S1') {
                dataflowViewer.dataflowTable.columns([1,2,3,4,5,7,8,12,13,14,18]).visible(true);
                dataflowViewer.dataflowTable.columns([0,6,9,10,11,15,16,17,19,20]).visible(false);
            } else if (selectedMission === 'S2') {
                dataflowViewer.dataflowTable.columns([1,2,3,6,7,8,12,13,14,18]).visible(true);
                dataflowViewer.dataflowTable.columns([0,4,5,9,10,11,15,16,17,19,20]).visible(false);
            } else if (selectedMission === 'S3') {
                dataflowViewer.dataflowTable.columns([1,2,3,6,7,12,13,14,15,18]).visible(true);
                dataflowViewer.dataflowTable.columns([0,4,5,8,9,10,11,16,17,19,20]).visible(false);
            } else {
                dataflowViewer.dataflowTable.columns([1,2,3,6,7,8,12,13,14,18]).visible(true);
                dataflowViewer.dataflowTable.columns([0,4,5,9,10,11,15,16,17,19,20]).visible(false);
            }
        }
        if (selectedConfiguration === 'AUX Data') {
            if (selectedMission === 'S3') {
                dataflowViewer.dataflowTable.columns([1,6,7,8,9,10,12,13,14,15,16,17,18]).visible(true);
                dataflowViewer.dataflowTable.columns([0,2,3,4,5,11,19,20]).visible(false);
            } else {
                dataflowViewer.dataflowTable.columns([1,6,7,8,9,10,12,13,14,18,20]).visible(true);
                dataflowViewer.dataflowTable.columns([0,2,3,4,5,11,15,16,17,19]).visible(false);
            }
        }
        if (selectedConfiguration === 'MP and FOS files') {
            if (selectedMission === 'S1') {
                dataflowViewer.dataflowTable.columns([1,6,7,8,9,10,12,14,18,19,20]).visible(true);
                dataflowViewer.dataflowTable.columns([0,2,3,4,5,11,13,15,16,17]).visible(false);
            } else {
                dataflowViewer.dataflowTable.columns([1,6,7,8,9,10,12,14,18]).visible(true);
                dataflowViewer.dataflowTable.columns([0,2,3,4,5,11,13,15,16,17,19,20]).visible(false);
            }
        }
        if (selectedConfiguration === 'OLQC Reports') {
            dataflowViewer.dataflowTable.columns([1,7,11,12,13,14]).visible(true);
            dataflowViewer.dataflowTable.columns([0,2,3,4,5,6,8,9,10,15,16,17,18,19]).visible(false);
        }
        if (selectedConfiguration === 'Removed Products') {
            dataflowViewer.dataflowTable.columns([,,,]).visible(false);
        }
        if (selectedConfiguration === 'Removed AUX Data') {
            dataflowViewer.dataflowTable.columns([,,,]).visible(false);
        }
    }
}

let dataflowViewer = new DataflowViewer();