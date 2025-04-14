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

class ServicesNetworkConfigViewer {

    constructor() {

        this.services = [];

        this.interfaces = [];

    }

    init() {

        // Init the Services Network Configuration table
        this.initServicesNetworkConfigTable();

        // Init the Interfaces Network Configuration table
        this.initInterfacesNetworkConfigTable();

        // Load the Services and relevant interfaces Configuration
        this.loadServices();

    }

    initServicesNetworkConfigTable() {
        try {
            this.servicesTable = $('#services-network-config-datatable').DataTable({
                "language": {
                  "emptyTable": "Retrieving services..."
                },
                columnDefs: [
                {
                    targets: 0,
                    visible: false
                }]
            });
        } catch(err) {
            console.info('Initializing Services Network Configuration table class - skipping table creation...')
        }
    }

    initInterfacesNetworkConfigTable() {
        try {
            this.interfacesTable = $('#interfaces-network-config-datatable').DataTable({
                "language": {
                  "emptyTable": "Retrieving interfaces..."
                },
                columnDefs: [
                {
                    targets: 0,
                    visible: false
                }]
            });
        } catch(err) {
            console.info('Initializing Interfaces Network Configuration table class - skipping table creation...')
        }
    }

    loadServices() {
        var url = new URL(window.location);
        var configId = url.searchParams.get('id');
        var ajaxCallURL = '/rest/api/services/' + configId;
        ajaxCall(ajaxCallURL, 'GET', {}, this.successLoadConfiguration, this.errorLoadConfiguration);
    }

    successLoadConfiguration(response) {

        // Store the Services Configuration as a class member
        console.info("Services Network Configuration loaded.");
        var graph = JSON.parse(formatResponse(response)[0].graph);
        servicesNetworkConfigViewer.services = graph['services'] != null ? graph['services'] : [];
        servicesNetworkConfigViewer.interfaces = graph['interfaces'] != null ? graph['interfaces'] : [];

        // 1. Loop over the available services, and append the corresponding
        // entry in the relevant table
        var data = new Array();
        for (var i = 0 ; i < servicesNetworkConfigViewer.services.length; i++) {

            // Save the interface row in a class member
            var sr = servicesNetworkConfigViewer.services[i];
            var row = new Array();
            row.push(sr['id']);
            row.push(sr['type']);
            row.push(sr['provider']);
            row.push(sr['satellite_units']);
            row.push(sr['interface_point']);
            row.push(sr['cloud_provider']);
            row.push(sr['address']);
            data.push(row);
        }

        // Refresh the services datatable
        servicesNetworkConfigViewer.servicesTable.clear().rows.add(data).draw();

        // 2. Loop over the available interfaces, and append the corresponding
        // entry in the relevant table
        data = new Array();
        for (var i = 0 ; i < servicesNetworkConfigViewer.interfaces.length; i++) {

            // Save the interface row in a class member
            var ifc = servicesNetworkConfigViewer.interfaces[i];
            var row = new Array();
            row.push(ifc['id']);
            row.push(ifc['name']);

            // Find the source / target services
            var source = servicesNetworkConfigViewer.getService(ifc['source_service_id']);
            var target = servicesNetworkConfigViewer.getService(ifc['target_service_id']);

            // Fill the remaining cells with the information from source / target
            row.push(source != null ? source['type'] : '');
            row.push(source != null ? source['provider'] : '');
            row.push(target != null ? target['type'] : '');
            row.push(target != null ? target['provider'] : '');
            row.push(ifc['whitelisted_clients']);
            data.push(row);
        }

        // Refresh the interface datatable
        servicesNetworkConfigViewer.interfacesTable.clear().rows.add(data).draw();

    }

    errorLoadConfiguration(response) {
        console.error('Unable to retrieve the Services configuration');
        console.error(response);
        return;
    }

    getService(serviceId) {
        if (!serviceId) {
            console.warn('Unable to create the interface instance. Service identifier null or empty');
            return null;
        }
        var service = null;
        for (var j = 0; j < servicesNetworkConfigViewer.services.length; j++) {
            if (serviceId === servicesNetworkConfigViewer.services[j]['id']) {
                service = servicesNetworkConfigViewer.services[j];
                break ;
            }
        }
        if (service == null) {
            console.warn('Unable to find service with ID: ' + serviceId);
        }
        return service;
    }
}

let servicesNetworkConfigViewer = new ServicesNetworkConfigViewer();