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

class ServicesEditor {

    constructor() {

        this.types = ['Acquisition', 'EDRS', 'Production', 'LTA', 'ADGS', 'CDSE - Data Access', 'CDSE - Traceability',
                      'MPC', 'POD', 'MP', 'FOS', 'Monitoring', 'Reference System - Processor Publication',
                      'Reference System - Sample Production'];

        this.interfacePoints = ['PRIP', 'AIP', 'AUXIP', 'DDP', 'CADIP', 'PEDC/BEDC EDRS, EDIP', 'DDIP', 'MPCIP',
                                'SFTP', 'CPODIP', 'MPIP', 'API', 'RSIP', 'FTP', 'Email', 'E2E', 'Not Applicable'];

        this.interfaceStatus = ['Operational', 'Future'];

        this.services = [];

        this.interfaces = [];

    }

    init() {

        // Init the Service Type selector
        this.initServiceTypesSelector();

        // Init the Interface Point selector
        this.initInterfacePointsSelector();

        // Init the WYSISWYG Editor
        this.initWYSIWYGEditors();

        // Init the Services table
        this.initServicesTable();

        // Remove any previous value in the services editing fields
        this.cleanupServicesEditor();

        // Init the widgets for configuring interfaces
        this.initInterfacesEditor();

        // Init the Interfaces configuration table
        this.initInterfacesTable();

        // Remove any previous value in the interfaces editing fields
        this.cleanupInterfacesEditor();

        // Load the Services and relevant interfaces Configuration
        this.loadServices();

    }

    initExternalFlagSelector() {

    }

    initServiceTypesSelector() {

        // Reset the dropdown menu and set options
        $('#service-type').find('option').remove().end();
        servicesEditor.types.forEach(type => {
            $('#service-type').append($('<option>', {
                value: type,
                text : type
            }));
        });
    }

    initInterfacePointsSelector() {

        // Reset the dropdown menu and set options
        $('#interface-point').find('option').remove().end();
        servicesEditor.interfacePoints.forEach(ip => {
            $('#interface-point').append($('<option>', {
                value: ip,
                text : ip
            }));
        });
    }

    initServicesTable() {
        try {
            this.servicesTable = $('#services-datatable').DataTable({
                "language": {
                  "emptyTable": "Retrieving services..."
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
                            var serviceId = data[0];
                            let actions =
                                '<div class="form-button-action">' +
                                    '<button name="edit-service" type="button" title="" class="btn btn-link" ' +
                                          'onclick="servicesEditor.editService(\'' + serviceId + '\');">' +
                                          '<i class="fa fa-edit"></i>'+
                                    '</button>'+
                                    '<button name="delete-service" type="button" title="" class="btn btn-link btn-danger" ' +
                                          'onclick="servicesEditor.deleteService(\'' + serviceId + '\');"><i class="fas fa-trash"></i>' +
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
            console.info('Initializing Services table class - skipping table creation...')
        }
    }

    initWYSIWYGEditors() {
        $('#operational-ipfs-wysiwyg-editor').summernote({
            minHeight: 100
        });
        $('#references-wysiwyg-editor').summernote({
            minHeight: 100
        });
    }

    cleanupServicesEditor() {
        $('#service-id').val('');
        $('#service-type').val('');
        $('#service-provider').val('');
        $('#external-service').prop("checked", false);
        $('#satellite-units').val('');
        $('#interface-point').val('');
        $('#cloud-provider').val('');
        $('#rolling-period').val('');
        $('#operational-ipfs-wysiwyg-editor').summernote('code', '');
        $('#references-wysiwyg-editor').summernote('code', '');
    }

    initInterfacesEditor() {

        // Source service - Reset the dropdown menu and set options
        $('#source-service-type').find('option').remove().end();
        servicesEditor.types.forEach(type => {
            $('#source-service-type').append($('<option>', {
                value: type,
                text : type
            }));
        });

        // On change, refresh the Source service select
        $('#source-service-type').change(function() {
            $('#source-service-provider').find('option').remove().end();
            servicesEditor.services.forEach(service => {
                if (service['type'] == $(this).val()) {
                    $('#source-service-provider').append($('<option>', {
                        value: service['id'],
                        text : service['provider']
                    }));
                }
            });
        });

        // Target service - Reset the dropdown menu and set options
        $('#target-service-type').find('option').remove().end();
        servicesEditor.types.forEach(type => {
            $('#target-service-type').append($('<option>', {
                value: type,
                text : type
            }));
        });

        // On change, refresh the Target service select
        $('#target-service-type').change(function() {
            $('#target-service-provider').find('option').remove().end();
            servicesEditor.services.forEach(service => {
                if (service['type'] == $(this).val()) {
                    $('#target-service-provider').append($('<option>', {
                        value: service['id'],
                        text : service['provider']
                    }));
                }
            });
        });

        // Interface status - Reset the dropdown menu and set options
        $('#interface-status').find('option').remove().end();
        servicesEditor.interfaceStatus.forEach(status => {
            $('#interface-status').append($('<option>', {
                value: status,
                text : status
            }));
        });
    }

    initInterfacesTable() {
        try {
            this.interfacesTable = $('#interfaces-datatable').DataTable({
                "language": {
                  "emptyTable": "Retrieving interfaces..."
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
                            var ifId = data[0];
                            let actions =
                                '<div class="form-button-action">' +
                                    '<button name="edit-service" type="button" title="" class="btn btn-link" ' +
                                          'onclick="servicesEditor.editInterface(\'' + ifId + '\');">' +
                                          '<i class="fa fa-edit"></i>'+
                                    '</button>'+
                                    '<button name="delete-service" type="button" title="" class="btn btn-link btn-danger" ' +
                                          'onclick="servicesEditor.deleteInterface(\'' + ifId + '\');"><i class="fas fa-trash"></i>' +
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
            console.info('Initializing Interfaces table class - skipping table creation...')
        }
    }

    cleanupInterfacesEditor() {
        $('#interface-id').val('');
        $('#source-service-type').val('');
        $('#source-service-provider').val('');
        $('#target-service-type').val('');
        $('#target-service-provider').val('');
        $('#interface-status').val('');
    }

    loadServices() {
        var url = new URL(window.location);
        var configId = url.searchParams.get('id');
        var ajaxCallURL = '/rest/api/services/' + configId;
        ajaxCall(ajaxCallURL, 'GET', {}, this.successLoadConfiguration, this.errorLoadConfiguration);
    }

    successLoadConfiguration(response) {

        // Store the Services Configuration as a class member
        console.info("Services configuration loaded.");
        var graph = JSON.parse(formatResponse(response)[0].graph);
        servicesEditor.services = graph['services'] != null ? graph['services'] : [];
        servicesEditor.interfaces = graph['interfaces'] != null ? graph['interfaces'] : [];

        // 1. Loop over the available services, and append the corresponding
        // entry in the relevant table
        var data = new Array();
        for (var i = 0 ; i < servicesEditor.services.length; i++) {

            // Save the interface row in a class member
            var sr = servicesEditor.services[i];
            var row = new Array();
            row.push(sr['id']);
            row.push(sr['type']);
            row.push(sr['provider']);
            row.push(sr['satellite_units']);
            row.push(sr['interface_point']);
            row.push(sr['cloud_provider']);
            row.push(sr['rolling_period']);
            row.push(sr['operational_ipfs']);
            row.push(sr['references']);
            data.push(row);
        }

        // Refresh the services datatable
        servicesEditor.servicesTable.clear().rows.add(data).draw();

        // 2. Loop over the available interfaces, and append the corresponding
        // entry in the relevant table
        data = new Array();
        for (var i = 0 ; i < servicesEditor.interfaces.length; i++) {

            // Save the interface row in a class member
            var ifc = servicesEditor.interfaces[i];
            var row = new Array();
            row.push(ifc['id']);

            // Find the source / target services
            var source = servicesEditor.getService(ifc['source_service_id']);
            var target = servicesEditor.getService(ifc['target_service_id']);

            // Fill the remaining cells with the information from source / target
            row.push(source['type']);
            row.push(source['provider']);
            row.push(target['type']);
            row.push(target['provider']);
            row.push(ifc['status']);
            data.push(row);
        }

        // Refresh the interface datatable
        servicesEditor.interfacesTable.clear().rows.add(data).draw();

    }

    errorLoadConfiguration(response) {
        console.error('Unable to retrieve the Services configuration');
        console.error(response);
        return;
    }

    editService(serviceId) {

        // Edit the service with the specified Id
        if (serviceId == null || serviceId.length == 0) {
            console.warn('Missing service identifier');
            return ;
        }

        // Retrieve the corresponding entity
        var service = null;
        servicesEditor.services.forEach(sr => {
            if (sr['id'] === serviceId) {
                service = sr;
            }
        });

        // Check the service instance consistency
        if (service == null) {
            console.warn('Invalid service identifier: ' + serviceId);
            return ;
        }

        // Fill the service editor properties
        $('#service-id').val(service['id']);
        $('#service-type').val(service['type']);
        $('#service-provider').val(service['provider']);
        $("#external-service").prop("checked", service['external']);
        $('#satellite-units').val(service['satellite_units']);
        $('#interface-point').val(service['interface_point']);
        $('#cloud-provider').val(service['cloud_provider']);
        $('#rolling-period').val(service['rolling_period']);
        $('#operational-ipfs-wysiwyg-editor').summernote('code', service['operational_ipfs']);
        $('#references-wysiwyg-editor').summernote('code', service['references']);
    }

    saveService() {
        var serviceId = $('#service-id').val();
        if (serviceId === null || serviceId.trim().length == 0) {
            servicesEditor.addService();
        } else {
            servicesEditor.updateService();
        }
    }

    addService() {

        // Auxiliary variable declaration
        var url = new URL(window.location);
        var configId = url.searchParams.get('id');

        // Define the new service
        var body = {};
        body['config_id'] = configId;
        body['type'] = $('#service-type').val();
        body['provider'] = $('#service-provider').val();
        body['external'] = document.getElementById('external-service').checked;
        body['satellite_units'] = $('#satellite-units').val();
        body['interface_point'] = $('#interface-point').val();
        body['cloud_provider'] = $('#cloud-provider').val();
        body['rolling_period'] = $('#rolling-period').val();
        body['operational_ipfs'] = $('#operational-ipfs-wysiwyg-editor').summernote('code');
        body['references'] = $('#references-wysiwyg-editor').summernote('code');

	    // Save the new entity
        ajaxCall('/rest/api/services', 'POST', body, this.successAddService, this.errorAddService);
    }

    successAddService(response) {

        // Refresh the services table
        servicesEditor.loadServices();

        // Cleanup the service editor
        servicesEditor.cleanupServicesEditor();
    }

    errorAddService(response) {
        console.error('Unable to add the specified service');
        console.error(response);
    }

    updateService() {

        // Auxiliary variable declaration
        var url = new URL(window.location);
        var configId = url.searchParams.get('id');

        // Update the existing entity
        var body = {};
        body['config_id'] = configId;
        body['id'] = $('#service-id').val();
        body['type'] = $('#service-type').val();
        body['provider'] = $('#service-provider').val();
        body['external'] = document.getElementById('external-service').checked;
        body['satellite_units'] = $('#satellite-units').val();
        body['interface_point'] = $('#interface-point').val();
        body['cloud_provider'] = $('#cloud-provider').val();
        body['rolling_period'] = $('#rolling-period').val();
        body['operational_ipfs'] = $('#operational-ipfs-wysiwyg-editor').summernote('code');
        body['references'] = $('#references-wysiwyg-editor').summernote('code');

	    // Save the new entity
        ajaxCall('/rest/api/services', 'PUT', body, this.successUpdateService, this.errorUpdateService);
    }

    successUpdateService(response) {

        // Refresh the services table
        servicesEditor.loadServices();

        // Cleanup the service editor
        servicesEditor.cleanupServicesEditor();
    }

    errorUpdateService(response) {
        console.error('Unable to update the specified service');
        console.error(response);
    }

    deleteService(serviceId) {

        // Auxiliary variable declaration
        var url = new URL(window.location);
        var configId = url.searchParams.get('id');

        // Delete the selected service
        var body = {};
        body['config_id'] = configId;
        body['service_id'] = procId;

        // Delete the processor release
        ajaxCall('/rest/api/services', 'DELETE', body, this.successDeleteService, this.errorDeleteService);
    }

    successDeleteService(response) {

        // Refresh the services table
        servicesEditor.loadServices();

        // Cleanup the services editor
        servicesEditor.cleanupServicesEditor();
    }

    errorDeleteService(response) {
        console.error('Unable to delete the specified service');
        console.error(response);
    }

    loadInterfaces() {
        var url = new URL(window.location);
        var configId = url.searchParams.get('id');
        var ajaxCallURL = '/rest/api/services/' + configId;
        ajaxCall(ajaxCallURL, 'GET', {}, this.successLoadInterfaces, this.errorLoadInterfaces);
    }

    successLoadInterfaces(response) {

        // Store the Services Configuration as a class member
        console.info("Interfaces configuration loaded.");
        var graph = JSON.parse(formatResponse(response)[0].graph);
        servicesEditor.interfaces = graph['interfaces'] != null ? graph['interfaces'] : [];

        // Loop over the available interfaces, and append the corresponding
        // entry in the relevant table
        var data = new Array();
        for (var i = 0 ; i < servicesEditor.interfaces.length; i++) {

            // Save the interface row in a class member
            var ifc = servicesEditor.interfaces[i];
            var row = new Array();
            row.push(ifc['id']);

            // Find the source / target services
            var source = servicesEditor.getService(ifc['source_service_id']);
            var target = servicesEditor.getService(ifc['target_service_id']);

            // Fill the remaining cells with the information from source / target
            row.push(source['type']);
            row.push(source['provider']);
            row.push(target['type']);
            row.push(target['provider']);
            row.push(ifc['status']);
            data.push(row);
        }

        // Refresh the interface datatable
        servicesEditor.interfacesTable.clear().rows.add(data).draw();

    }

    errorLoadInterfaces(response) {
        console.error('Unable to retrieve the Interfaces configuration');
        console.error(response);
        return;
    }

    getService(serviceId) {
        if (!serviceId) {
            console.warn('Unable to create the interface instance. Service identifier null or empty');
            return null;
        }
        var service = null;
        for (var j = 0; j < servicesEditor.services.length; j++) {
            if (serviceId === servicesEditor.services[j]['id']) {
                service = servicesEditor.services[j];
                break ;
            }
        }
        if (service == null) {
            console.warn('Unable to find service with ID: ' + serviceId);
        }
        return service;
    }

    editInterface(ifId) {

        // Edit the service with the specified Id
        if (ifId == null || ifId.length == 0) {
            console.warn('Missing interface identifier');
            return ;
        }

        // Retrieve the corresponding entity
        var iff = null;
        servicesEditor.interfaces.forEach(ifc => {
            if (ifc['id'] === ifId) {
                iff = ifc;
            }
        });

        // Check the service instance consistency
        if (iff == null) {
            console.warn('Invalid interface identifier: ' + ifId);
            return ;
        }

        // Retrieve the source / target services
        var source = servicesEditor.getService(iff['source_service_id']);
        var target = servicesEditor.getService(iff['target_service_id']);

        // Fill the service editor properties
        $('#interface-id').val(ifId);
        $('#source-service-type').val(source['type']);
        $('#source-service-provider').find('option').remove().end();
        servicesEditor.services.forEach(service => {
            if (service['type'] == source['type']) {
                $('#source-service-provider').append($('<option>', {
                    value: service['id'],
                    text : service['provider']
                }));
            }
        });
        $('#source-service-provider').val(source['id']);
        $('#target-service-type').val(target['type']);
        $('#target-service-provider').find('option').remove().end();
        servicesEditor.services.forEach(service => {
            if (service['type'] == target['type']) {
                $('#target-service-provider').append($('<option>', {
                    value: service['id'],
                    text : service['provider']
                }));
            }
        });
        $('#target-service-provider').val(target['id']);
        $('#interface-status').val(iff['status']);
    }

    saveInterface() {
        var ifId = $('#interface-id').val();
        if (ifId === null || ifId.trim().length == 0) {
            servicesEditor.addInterface();
        } else {
            servicesEditor.updateInterface();
        }
    }

    addInterface() {

        // Auxiliary variable declaration
        var url = new URL(window.location);
        var configId = url.searchParams.get('id');

        // Retrieve the source / target services
        var source = servicesEditor.getService($('#source-service-provider').val());
        var target = servicesEditor.getService($('#target-service-provider').val());

        // Define the new service
        var body = {};
        body['config_id'] = configId;
        body['source_service_id'] = $('#source-service-provider').val();
        body['target_service_id'] = $('#target-service-provider').val();
        body['satellite_units'] = source['satellite_units'].length > target['satellite_units'].length ?
                target['satellite_units'] : source['satellite_units'];
        body['status'] = $('#interface-status').val();

	    // Save the new interface
        ajaxCall('/rest/api/services/interfaces', 'POST', body, this.successAddInterface, this.errorAddInterface);
    }

    successAddInterface(response) {

        // Refresh the interfaces table
        servicesEditor.loadInterfaces();

        // Cleanup the interface editor
        servicesEditor.cleanupInterfacesEditor();
    }

    errorAddInterface(response) {
        console.error('Unable to add the specified interface');
        console.error(response);
    }

    updateInterface() {

        // Auxiliary variable declaration
        var url = new URL(window.location);
        var configId = url.searchParams.get('id');

        // Retrieve the source / target services
        var source = servicesEditor.getService($('#source-service-provider').val());
        var target = servicesEditor.getService($('#target-service-provider').val());

        // Define the new service
        var body = {};
        body['config_id'] = configId;
        body['id'] = $('#interface-id').val();
        body['source_service_id'] = $('#source-service-provider').val();
        body['target_service_id'] = $('#target-service-provider').val();
        body['satellite_units'] = source['satellite_units'].length > target['satellite_units'].length ?
                target['satellite_units'] : source['satellite_units'];
        body['status'] = $('#interface-status').val();

	    // Save the new interface
        ajaxCall('/rest/api/services/interfaces', 'PUT', body, this.successUpdateInterface, this.errorUpdateInterface);
    }

    successUpdateInterface(response) {

        // Refresh the interfaces table
        servicesEditor.loadInterfaces();

        // Cleanup the interface editor
        servicesEditor.cleanupInterfacesEditor();
    }

    errorUpdateInterface(response) {
        console.error('Unable to update the specified interface');
        console.error(response);
    }

    deleteInterface(ifId) {

        // Auxiliary variable declaration
        var url = new URL(window.location);
        var configId = url.searchParams.get('id');

        // Delete the selected service
        var body = {};
        body['config_id'] = configId;
        body['interface_id'] = ifId;

        // Delete the processor release
        ajaxCall('/rest/api/services/interfaces', 'DELETE', body, this.successDeleteInterface, this.errorDeleteInterface);
    }

    successDeleteInterface(response) {

        // Refresh the interfaces table
        servicesEditor.loadInterfaces();

        // Cleanup the interface editor
        servicesEditor.cleanupInterfacesEditor();
    }

    errorDeleteInterface(response) {
        console.error('Unable to delete the specified interface');
        console.error(response);
    }

}

let servicesEditor = new ServicesEditor();