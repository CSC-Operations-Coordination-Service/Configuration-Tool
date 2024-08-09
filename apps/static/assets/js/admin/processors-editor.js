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

class ProcessorsEditor {

    constructor() {

        this.missions = ['S1', 'S2', 'S3', 'S5P'];

        this.satellitesMap = {
            'S1': ['S1A', 'S1B', 'S1C', 'S1D'],
            'S2': ['S2A', 'S2B', 'S2C', 'S2D'],
            'S3': ['S3A', 'S3B', 'S3C', 'S3D'],
            'S5P': ['S5P']
        };

        this.IPFsMap = {
            'S1': ['S1_L0', 'S1_L1L2', 'S1_ERRMAT', 'S1_SETAP'],
            'S2': ['S2_L0', 'S2_L1', 'S2_L2'],
            'S3': ['S3_PUG', 'S3_L0', 'S3_OL1', 'S3_OL1_RAC', 'S3_OL1_SPC', 'S3_OL2',
                   'S3_SL1', 'S3_SL2', 'S3_SL2_LST', 'S3_SL2_FRP',
                   'S3_SR1', 'S3_SR2', 'S3_SM2_HY', 'S3_SM2_LI', 'S3_SM2_SI', 'S3_MW1',
                   'S3_SY2', 'S3_SY2_AOD', 'S3_SY2_VGS', 'S3_SY2_VGP', 'S3_SY2_VGS'],
            'S5P': ['S5P_L1B',
                    'S5P_L2O3_NRT', 'S5P_L2O3_OFFL', 'S5P_L2O3_TCL', 'S5P_L2O3_PR',
                    'S5P_L2_NO2', 'S5P_L2_SO2', 'S5P_L2_CO', 'S5P_L2_CH4', 'S5P_L2_HCHO',
                    'S5P_L2_CLOUD', 'S5P_L2AER_AI', 'S5P_L2AER_LH', 'S5P_L2SUOMI_CLOUD']
        };

        this.processorsReleases = [];

    }

    init() {

        // Init the Mission selector
        this.initMissionSelector();

        // Init the Satellite selector
        this.initSatellitesSelector();

        // Init the IPF selector
        this.initIPFsSelector();

        // Init the impacted IPF table
        this.initIPFsTable();

        // Init the WYSISWYG Editor
        this.initWYSIWYGEditor();

        // Init the Processing Baselines table
        this.initProcessorsReleasesTable();

        // Remove any previous value in the editing fields
        this.cleanup();

        // Load the Processing Baselines Configuration
        this.loadProcessorsReleases();

    }

    initMissionSelector() {

        // Reset the dropdown menu and set options
        $('#processor-mission').find('option').remove().end();
        procEditor.missions.forEach(mission => {
            $('#processor-mission').append($('<option>', {
                value: mission,
                text : mission
            }));
        });

        // Anytime the mission selection change, update the satellite selector
        $('#processor-mission').on('change', function (e) {
            var optionSelected = $("option:selected", this);
            var mission = this.value.trim();
            $('#impacted-satellites').find('option').remove().end();
            procEditor.satellitesMap[mission].forEach(satellite => {
                $('#impacted-satellites').append($('<option>', {
                    value: satellite,
                    text : satellite
                }));
            });
        });

        // Update the IPFs selector on the basis of the mission
        $('#processor-mission').on('change', function (e) {
            var optionSelected = $("option:selected", this);
            var mission = this.value.trim();
            $('#impacted-ipf').find('option').remove().end();
            procEditor.IPFsMap[mission].forEach(ipf => {
                $('#impacted-ipf').append($('<option>', {
                    value: ipf,
                    text : ipf
                }));
            });
        });
    }

    initSatellitesSelector() {

        // Reset the dropdown menu and set options
        // By default, set the satellites of S1 mission
        $('#impacted-satellites').find('option').remove().end();
    }

    initIPFsSelector() {

        // Reset the dropdown menu and set options
        // By default, set the satellites of S1 mission
        $('#impacted-ipf').find('option').remove().end();
        procEditor.IPFsMap['S1'].forEach(ipf => {
            $('#impacted-ipf').append($('<option>', {
                value: ipf,
                text : ipf
            }));
        });
    }

    initIPFsTable() {
        try {
            this.ipfDataTable = $('#ipf-datatable').DataTable({
                "language": {
                  "emptyTable": "Select the impacted IPF and version..."
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
                                    // '<button name="edit-target-ipf" type="button" title="" class="btn btn-link" ' +
                                    //       'onclick="procEditor.editTargetIPF(\'' + ipf + '\');">' +
                                    //       '<i class="fa fa-edit"></i>'+
                                    // '</button>'+
                                    '<button name="delete-target-ipf" type="button" title="" class="btn btn-link btn-danger" ' +
                                          'onclick="procEditor.deleteTargetIPF(\'' + index + '\');"><i class="fas fa-trash"></i>' +
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
            console.info('Initializing IPF table class - skipping table creation...')
        }
    }

    initWYSIWYGEditor() {
        $('#wysiwyg-editor').summernote({
            minHeight: 100
        });
    }

    initProcessorsReleasesTable() {
        try {
            this.procDataTable = $('#proc-datatable').DataTable({
                "language": {
                  "emptyTable": "Retrieving processor releases..."
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
                            var procId = full[0];
                            let actions =
                                '<div class="form-button-action">' +
                                    '<button name="edit-proc-release" type="button" title="" class="btn btn-link" ' +
                                          'onclick="procEditor.editProcessorRelease(\'' + procId + '\');">' +
                                          '<i class="fa fa-edit"></i>'+
                                    '</button>'+
                                    '<button name="delete-proc-release" type="button" title="" class="btn btn-link btn-danger" ' +
                                          'onclick="procEditor.deleteProcessorRelease(\'' + procId + '\');"><i class="fas fa-trash"></i>' +
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
            console.info('Initializing processors releases table class - skipping table creation...')
        }
    }

    loadProcessorsReleases() {
        var url = new URL(window.location);
        var configId = url.searchParams.get('id');
        var ajaxCallURL = '/rest/api/processors-releases/' + configId;
        ajaxCall(ajaxCallURL, 'GET', {}, this.successLoadConfiguration, this.errorLoadConfiguration);
    }

    successLoadConfiguration(response) {

        // Store the Interface Configuration as a class member
        console.info("Processors releases configuration loaded.");
        var graph = JSON.parse(formatResponse(response)[0].graph);
        if (graph['processors_releases']) {
            procEditor.processorsReleases = graph['processors_releases'];
        } else {
            procEditor.processorsReleases = [];
        }

        // Loop over the available processing baselines, and append the corresponding
        // entry in the relevant table
        var data = new Array();
        for (var i = 0 ; i < procEditor.processorsReleases.length; i++) {

            // Save the interface row in a class member
            var pr = procEditor.processorsReleases[i];
            var row = new Array();
            row.push(pr['id']);
            row.push(pr['satellite_units']);
            var targetIPFsStr = '';
            pr['target_ipfs'].forEach(ipf => {
                if (ipf.length > 0) targetIPFsStr += ipf + ' ';
            })
            row.push(targetIPFsStr);
            row.push(pr['processing_baseline']);
            row.push(pr['release_date']);
            row.push(pr['validity_start_date']);
            row.push(pr['validity_end_date']);
            row.push(pr['release_notes']);
            data.push(row);
        }

        // Refresh the processing baseline datatable
        procEditor.procDataTable.clear().rows.add(data).draw();

    }

    errorLoadConfiguration(response) {
        console.error('Unable to retrieve the Processors releases');
        console.error(response);
        return;
    }

    editProcessorRelease(procId) {

        // Edit the processor release with the specified Id
        if (procId == null || procId.length == 0) {
            console.warn('Missing processor release identifier');
            return ;
        }

        // Retrieve the corresponding entity
        var processorRelease = null;
        procEditor.processorsReleases.forEach(pr => {
            if (pr['id'] === procId) {
                processorRelease = pr;
            }
        });

        // Check the processor release consistency
        if (processorRelease == null) {
            console.warn('Invalid processor release identifier: ' + procId);
            return ;
        }

        // Fill the processor release editor properties
        $('#processor-id').val(processorRelease['id']);
        $('#processor-mission').val(processorRelease['mission']);

        // Reset the satellite selection dropdown menu and set options
        $('#impacted-satellites').find('option').remove().end();
        procEditor.satellitesMap[processorRelease['mission']].forEach(satellite => {
            $('#impacted-satellites').append($('<option>', {
                value: satellite,
                text : satellite
            }));
        });
        $('#impacted-satellites').val(processorRelease['satellite_units']);

        // Reset the IPF selection dropdown menu and set options
        $('#impacted-ipf').find('option').remove().end();
        procEditor.IPFsMap[processorRelease['mission']].forEach(ipf => {
            $('#impacted-ipf').append($('<option>', {
                value: ipf,
                text : ipf
            }));
        });
        $('#impacted-ipf').val('');

        // Fill the target IPF table
        var data = new Array();
        var targetIPFs = processorRelease['target_ipfs'];
        targetIPFs.forEach(ipf => {
            if (ipf != null) {
                var row = new Array();
                row.push(ipf.split(':')[0]);
                row.push(ipf.split(':')[1]);
                data.push(row);
            }
        });
        procEditor.ipfDataTable.clear().rows.add(data).draw();
        $('#processing-baseline').val(processorRelease['processing_baseline']);
        $('#processor-release-date').val(processorRelease['release_date']);
        $('#processor-validity-start').val(processorRelease['validity_start_date']);
        $('#processor-validity-end').val(processorRelease['validity_end_date']);
        $('#wysiwyg-editor').summernote('code', processorRelease['release_notes']);
    }

    saveTargetIPF() {
        var data = new Array();
        var row = new Array();
        row.push($('#impacted-ipf').val());
        row.push($('#ipf-version').val());
        data.push(row);
        procEditor.ipfDataTable.rows.add(data).draw();
        $('#impacted-ipf').val('');
        $('#ipf-version').val('');
    }

    editTargetIPF(selectedIpf) {
        var ipf = '';
        var version = '';
        var selectedIndex = -1;
        procEditor.ipfDataTable.rows().every(function(index, tl, rl) {
            var row = procEditor.ipfDataTable.row(index);
            if (row.data()[0] == selectedIpf) {
                ipf = row.data()[0];
                version = row.data()[1];
                selectedIndex = index;
            }
        });
        $('#impacted-ipf').val(ipf);
        $('#ipf-version').val(version);
        procEditor.ipfDataTable.row(selectedIndex).remove().draw();
    }

    deleteTargetIPF(index) {
        procEditor.ipfDataTable.row(index).remove().draw();
    }

    saveProcessorRelease() {
        var procId = $('#processor-id').val();
        if (procId === null || procId.trim().length == 0) {
            procEditor.addProcessorRelease();
        } else {
            procEditor.updateProcessorRelease();
        }
    }

    addProcessorRelease() {

        // Auxiliary variable declaration
        var url = new URL(window.location);
        var configId = url.searchParams.get('id');

        // Define the new processor release
        var body = {};
        body['config_id'] = configId;
        body['mission'] = $('#processor-mission').val();
        body['satellite_units'] = $('#impacted-satellites').val();

        // Fill the target IPF table
        var targetIPFs = [];
        procEditor.ipfDataTable.rows().every(function(index, tl, rl) {
            let ipf = procEditor.ipfDataTable.rows(index).data()[0];
            let ipfStr = ipf[0] + ':' + ipf[1];
            targetIPFs.push(ipfStr);
        });
        body['target_ipfs'] = targetIPFs;
        body['processing_baseline'] = $('#processing-baseline').val();
        body['release_date'] = $('#processor-release-date').val();
        body['validity_start_date'] = $('#processor-validity-start').val() ?
                $('#processor-validity-start').val() : $('#processor-release-date').val();
        body['validity_end_date'] = $('#processor-validity-end').val();
        body['release_notes'] = $('#wysiwyg-editor').summernote('code');

	    // Save the new entity
        ajaxCall('/rest/api/processors-releases', 'POST', body, this.successAddProcessorRelease,
                this.errorAddProcessorRelease);
    }

    successAddProcessorRelease(response) {

        // Refresh the processing baseline table
        procEditor.loadProcessorsReleases();

        // Cleanup the processing baseline editor
        procEditor.cleanup();
    }

    errorAddProcessorRelease(response) {
        console.error('Unable to add the specified processor release');
        console.error(response);
    }

    updateProcessorRelease() {

        // Auxiliary variable declaration
        var url = new URL(window.location);
        var configId = url.searchParams.get('id');

        // Update the existing entity
        var body = {};
        body['config_id'] = configId;
        body['id'] = $('#processor-id').val();
        body['mission'] = $('#processor-mission').val();
        body['satellite_units'] = $('#impacted-satellites').val();

        // Fill the target IPF table
        var targetIPFs = [];
        procEditor.ipfDataTable.rows().every(function(index, tl, rl) {
            let ipf = procEditor.ipfDataTable.rows(index).data()[0];
            let ipfStr = ipf[0] + ':' + ipf[1];
            targetIPFs.push(ipfStr);
        });
        body['target_ipfs'] = targetIPFs;
        body['processing_baseline'] = $('#processing-baseline').val();
        body['release_date'] = $('#processor-release-date').val();
        body['validity_start_date'] = $('#processor-validity-start').val();
        body['validity_end_date'] = $('#processor-validity-end').val();
        body['release_notes'] = $('#wysiwyg-editor').summernote('code');

	    // Save the new entity
        ajaxCall('/rest/api/processors-releases', 'PUT', body, this.successUpdateProcessorRelease,
                this.errorUpdateProcessorRelease);
    }

    successUpdateProcessorRelease(response) {

        // Refresh the processing baseline table
        procEditor.loadProcessorsReleases();

        // Cleanup the processing baseline editor
        procEditor.cleanup();
    }

    errorUpdateProcessorRelease(response) {
        console.error('Unable to update the specified processor release');
        console.error(response);
    }

    deleteProcessorRelease(procId) {

        // Auxiliary variable declaration
        var url = new URL(window.location);
        var configId = url.searchParams.get('id');

        // Delete the selected processor release
        var body = {};
        body['config_id'] = configId;
        body['processor_release_id'] = procId;

        // Delete the processor release
        ajaxCall('/rest/api/processors-releases', 'DELETE', body, this.successDeleteProcessorRelease,
                this.errorDeleteProcessorRelease);
    }

    successDeleteProcessorRelease(response) {

        // Refresh the processing baseline table
        procEditor.loadProcessorsReleases();

        // Cleanup the processing baseline editor
        procEditor.cleanup();
    }

    errorDeleteProcessorRelease(response) {
        console.error('Unable to delete the specified processor release');
        console.error(response);
    }

    cleanup() {
        $('#processor-id').val('');
        $('#processor-mission').val('');
        $('#impacted-satellites').find('option').remove().end();
        $('#impacted-ipf').find('option').remove().end();
        $('#ipf-version').val('');
        procEditor.ipfDataTable.clear().draw();
        $('#processing-baseline').val('');
        $('#processor-release-date').val('');
        $('#processor-validity-start').val('');
        $('#processor-validity-end').val('');
        $('#wysiwyg-editor').summernote('code', '');
    }

}

let procEditor = new ProcessorsEditor();