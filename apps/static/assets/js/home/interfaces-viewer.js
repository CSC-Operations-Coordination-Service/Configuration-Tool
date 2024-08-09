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

class InterfacesViewer {

    constructor() {

        // Configuration flow chart class element
        this.configFlowChart = null;

        // Focused entity identifier
        this.focusedEntityId = null;

        // Selected mission
        this.selectedMission = null;

    }

    init() {

        // Set custom JsPlumb properties
        this.initCanvas();

        // Init the configuration scenario interface table
        this.initInterfaceTable();

        // Init the entity selector
        this.initEntitySelector();

        // Init the mission selector
        this.initMissionSelector();

        // Init the WYSIWYG Editors for references and notes
        this.initWYSIWYGEditors();

        // Init the version selector panel
        this.initVersionSelector();

        // Load the specified Interface Configuration
        this.loadInterfaceConfiguration();

    }

    initCanvas() {

        // Reset HTML page
        $('#dynamic-page-container').empty();
        $('#dynamic-page-container').append('<div class="jtk-container" id="id-jtk-container-0"></div>');
        $('#id-jtk-container-0').append('<div class="jtk-demo-main" id="id-jtk-container-1"></div>');
        $('#id-jtk-container-1').append('<div class="jtk-demo-canvas canvas-wide flowchart-demo jtk-surface jtk-surface-nopan content" id="canvas"></div>');
        $('#canvas').append('<div id="idDrawArea" class="fixed-height-800"></div>');

        // Hide the interface property panel
        $("#interface-viewer-panel").fadeOut();

        // Empty jsPlumb canvas
        jsPlumb.empty("idDrawArea");

        // Overrides default jsPlumb Properties
        jsPlumb.Defaults.Overlays = [[ "Arrow", { location: 1 }],];
        jsPlumb.Defaults.Connector = ["Bezier", { curviness: 30 }];
        jsPlumb.Defaults.PaintStyle = {stroke: "#61B7CF", strokeWidth: 4};
    }

    initInterfaceTable() {
        try {
            this.interfaceTable = $('#interface-datatable').DataTable({
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
            console.info('Initializing interface table class - skipping table creation...')
        }
    }

    initEntitySelector() {
        $('#entity-focus-select').on('change', function (e) {
            var optionSelected = $("option:selected", this);
            var elementId = this.value.trim();
            if (elementId.length != 0) {
                viewer.invokeDisplayFocusedConfiguration(elementId);
            } else {
                viewer.invokeDisplayConfigurationMap();
            }
        });
    }

    initMissionSelector() {
        $('#mission-select').on('change', function (e) {
            var elementId = $('#entity-focus-select').val();
            if (elementId.length != 0) {
                viewer.invokeDisplayFocusedConfiguration(elementId);
            } else {
                viewer.invokeDisplayConfigurationMap();
            }
        });
    }

     initWYSIWYGEditors() {
        $('#interface-references-viewer').summernote({
            minHeight: 100
        });
        $('#interface-references-viewer').summernote('disable');
        $('#interface-notes-viewer').summernote({
            minHeight: 100
        });
        $('#interface-notes-viewer').summernote('disable');
    }

    initVersionSelector() {
        var url = new URL(window.location);
        var idScenario = url.searchParams.get('id');
        ajaxCall('/rest/api/interfaces/commit/'+idScenario, 'GET', {}, this.successLoadCommits, this.errorLoadCommits);
    }

    successLoadCommits(response) {

        // Auxiliary variable declaration
        var url = new URL(window.location);
        var idScenario = url.searchParams.get('id');
        var versions = formatResponse(response);
        var data = new Array();

        // Check if the URL already has the version parameter, and if yes, eliminate it
        if (url.searchParams.get('version')) {
            url = url.toString().replace(/[\?&]version=[^&]+/g, '');
        } else {
            url = url.toString();
        }

        // Loop over the available versions, and append the corresponding
        // entry in the versioning table
        for (var i = 0 ; i < versions.length ; i++) {

            // Save the interface row in a class member
            var version = versions[i];

            // Append the interface row
            var ver = {};
            ver['title'] = version['comment'];
            ver['date'] = moment(version['last_modify'], 'DD/MM/yyyy, HH:mm:ss').toDate().getTime();
            ver['link'] = url.toString() + '&version=' + version['n_ver'];
            data.push(ver);
        }

        // Refresh the scenario datatable
        $('#event-calendar').MEC({
            calendar_link: url.toString().replace(/[\?&]version=[^&]+/g, ''),
			events: data
        });

        // Customize the calendar
        $("#eventTitle").text('');
        $("#calLink").text('');
    }

    errorLoadCommits(response) {
        console.error("Unable to load the configuration versions");
        console.error(response);
    }

    loadInterfaceConfiguration() {
        var url = new URL(window.location);
        var configId = url.searchParams.get('id');
        var version = url.searchParams.get('version');
        var ajaxCallURL = '/rest/api/interfaces/' + configId;
        if (version) ajaxCallURL = '/rest/api/interfaces/commit/' + configId + '/' + version;
        ajaxCall(ajaxCallURL, 'GET', {}, this.successLoadConfiguration, this.errorLoadConfiguration);
    }

    successLoadConfiguration(response) {

        // Store the Interface Configuration as a class member
        console.info("Interfaces configuration loaded.");
        viewer.configFlowChart = formatResponse(response)[0];

        // Fill the entity combo box
        viewer.fillEntitiesLists();

        // Fill the mission combo box
        viewer.fillMissionsList();

        // Display the Interface Configuration Map or the Configuration focused on a specified entity
        var url = new URL(window.location);
        var configMapEnabled = url.searchParams.get('focusOn') == null;
        if (configMapEnabled) {
            viewer.displayConfigurationMap();
        } else {
            viewer.displayFocusedConfiguration();
        }
    }

    fillEntitiesLists() {

        // Auxiliary variable declaration
        var nodes = JSON.parse(viewer.configFlowChart.graph).nodes;

        // Reset all dropdown menus and set options
        ['entity-focus-select', 'service-source-select', 'service-target-select'].forEach(selector => {
            $('#' + selector).find('option').remove().end();
        });

        // Append the empty selection option as the first option
        $('#entity-focus-select').append($('<option>', {
            value: "",
            text : "Select entity..."
        }));

        // Fill again all dropdown menus
        $.each(nodes, function (i, item) {
            ['entity-focus-select', 'service-source-select', 'service-target-select'].forEach(selector => {
                $('#' + selector).append($('<option>', {
                    value: item.id,
                    text : item.name
                }));
            });
        });

        // Set properly the value of the entity focus select
        // If any focus on entity is selected in the URL, set it as the selected option
        var url = new URL(window.location);
        var entityId = url.searchParams.get('focusOn');
        $('#entity-focus-select').val(entityId);
    }

    fillMissionsList() {

        // Auxiliary variable declaration
        var missions = ['S1', 'S2', 'S3', 'S5p'];

        // Reset options
        $('#mission-select').find('option').remove().end();
        $('#mission-select').append($('<option>', {
            value: "",
            text : "Select mission..."
        }));

        // Fill again all dropdown menus
        $.each(missions, function (i, item) {
            $('#mission-select').append($('<option>', {
                value: item,
                text : item
            }));
        });

        // Set properly the value of the entity focus select
        // If any focus on entity is selected in the URL, set it as the selected option
        var url = new URL(window.location);
        var selectedMission = url.searchParams.get('selectedMission');
        $('#mission-select').val(selectedMission);
    }

    displayConfigurationMap() {

        // Empty jsPlumb
        jsPlumb.empty("idDrawArea");

        // Auxiliary variable declaration
        var configId = viewer.configFlowChart.id;
        var nodes = JSON.parse(viewer.configFlowChart.graph).nodes;
        var connections = JSON.parse(viewer.configFlowChart.graph).connections;
        var numNodes = nodes.length;
        var norm = 400;

        // Select connections and nodes (entities) on the basis of the selected mission
        var url = new URL(window.location);
        viewer.selectedMission = url.searchParams.get('selectedMission');
        if (viewer.selectedMission) {

            // Auxiliary variable declaration
            var selectedNodes = [];
            var selectedConnections = [];

            // Filter connections
            for (const conn of connections) {
                if (conn['impacted_elements'].includes(viewer.selectedMission)) {
                    if (!selectedConnections.includes(conn)) selectedConnections.push(conn);
                }
            }

            // Filter nodes
            for (const node of nodes) {
                if (!node.endpoints) continue ;
                for (const ep of node.endpoints) {
                    for (const conn of selectedConnections) {
                        if (conn['source_ep_id'] === ep.id || conn['target_ep_id'] === ep.id) {
                            if (!selectedNodes.includes(node)) selectedNodes.push(node);
                        }
                    }
                }
            }

            // Update nodes, connections and related variables
            nodes = selectedNodes;
            numNodes = nodes.length;
            connections = selectedConnections;
        }

        // Add symbolic entity representing the configuration scenario
        $('#idDrawArea').append(
            '<div class="window jtk-node jsplumb-draggable" ' +
                'style="top: ' + norm.toString() + 'px; left: ' + norm.toString() + 'px; background: cyan" ' +
                'id="' + configId + '"><strong>Interfaces configuration</strong>' +
            '</div>'
        );

        // Allow entity dragging
        jsPlumb.draggable($('#' + configId));

        // Loop over each node, and add it around the configuration scenario entity
        for (var index = 0; index < nodes.length; ++index) {

            // Add containers around the scenario configuration
            var elem = nodes[index];
            var background = elem['external'] ? 'background: red' : '';
            var x = norm * (1 + (0.7 * Math.cos(2 * Math.PI * index / numNodes)));
            var y = norm * (1 + (0.7 * Math.sin(2 * Math.PI * index / numNodes)));
            $('#idDrawArea').append(
                '<div class="window jtk-node jsplumb-draggable" ' +
                    'style="top: ' + y.toString() + 'px; left: ' + x.toString() + 'px; ' + background + '"' +
                    'id="' + elem.id + '"><strong>' + elem.name + '</strong>' +
                '</div>'
            );

            // Allow entity dragging
            jsPlumb.draggable(elem.id);

            // Allow focusing on each entity
            // This feature was temporarily disabled by double-click as per ESA request
            // $('#' + elem.id).attr('ondblclick', 'viewer.invokeDisplayFocusedConfiguration("' + elem.id + '");');

            // Add one endpoint to each container
            jsPlumb.addEndpoint(elem.id, {
                uuid: "containerEp" + index.toString(),
                endpoint: "Rectangle",
                paintStyle: {fill: "grey"},
                deleteEndpointsOnDetach: false,
                anchor: "AutoDefault"
            });

            // Add one endpoint to the scenario container for each entity
            jsPlumb.addEndpoint(configId, {
                uuid: "scenarioEp" + index.toString(),
                endpoint: "Rectangle",
                paintStyle: {fill: "grey"},
                deleteEndpointsOnDetach: false,
                anchor: "AutoDefault"
            });

            // Connect each container to the scenario one
            jsPlumb.connect({uuids:["scenarioEp" + index.toString(), "containerEp" + index.toString()]});
        }

        // Hide the interface table
        $('#interface-table-container').hide();

    }

    displayFocusedConfiguration() {

        // Store the information about the selected entity and mission in the dedicated class member
        var url = new URL(window.location);
        var entityId = url.searchParams.get('focusOn');
        viewer.focusedEntityId = entityId;
        var selectedMission = url.searchParams.get('selectedMission');
        viewer.selectedMission = selectedMission;

        // Auxiliary variable declaration
        var nodes = JSON.parse(viewer.configFlowChart.graph).nodes;
        var connections = JSON.parse(viewer.configFlowChart.graph).connections;

        // Pick up the central node
        var centralNode = null, centralNodeEndpoints = [];
        for (var node of nodes) {
            if (node.id === entityId) {
                centralNode = node;
                centralNodeEndpoints = node.endpoints;
            }
        }

        // Select connections from / to the central node, filtered on the basis of the selected mission
        var connectionsFocus = [];
        for (var conn of connections) {
            for (var ep of centralNodeEndpoints) {
                if (conn['source_ep_id'] === ep.id || conn['target_ep_id'] === ep.id) {
                    if (selectedMission == null || conn['impacted_elements'].includes(selectedMission)) {
                        if (!connectionsFocus.includes(conn)) connectionsFocus.push(conn);
                    }
                }
            }
        }

        // Select nodes connected to the central node
        var nodesFocus = [];
        for (var node of nodes) {
            if (!node.endpoints) continue ;
            for (var ep of node.endpoints) {
                for (var conn of connectionsFocus) {
                    if (conn['source_ep_id'] === ep.id || conn['target_ep_id'] === ep.id) {
                        if (selectedMission == null || conn['impacted_elements'].includes(selectedMission)) {
                            if (!nodesFocus.includes(node)) nodesFocus.push(node);
                        }
                    }
                }
            }
        }

        // Create the focused flowchart
        var flowChartFocus = {};
        flowChartFocus.nodes = nodesFocus;
        flowChartFocus.connections = connectionsFocus;
        var flowChartJson = JSON.stringify(flowChartFocus);

        // Display the focused flowchart
        viewer.displayFocusedFlowchart(entityId, flowChartJson);

        // Display only interfaces connected to the selected item
        viewer.displayInterfaceTable(entityId);

    }

    displayFocusedFlowchart(entityId, flowChartJson) {

        // Clear the flowchart
        jsPlumb.empty("idDrawArea");

        // Draw the element having the focus in a central position, and connected elements around it
        // There is no need to store the position of the elements for the moments, as the coordinates
        // won't fit for all focused elements
        var flowChart = JSON.parse(flowChartJson);
        var nodes = flowChart.nodes;
        var connections = flowChart.connections;
        var numNodes = nodes.length;
        var norm = 400;

        $.each(nodes, function(index, elem) {

            // Draw the entities in the proper position
            if (elem.id === entityId) {
                $('#idDrawArea').append(
                    '<div class="window jtk-node jsplumb-draggable" ' +
                        'style="background: orange; top: ' + norm.toString() + 'px; left: ' + norm.toString() + 'px" id="' + elem.id + '">' +
                        '<strong>' + elem.name + '</strong>' +
                    '</div>');

                // Allow entity dragging
                jsPlumb.draggable($('#' + entityId));

            } else {
                var background = elem['external'] ? 'background: red' : '';
                var x = norm * (1 + (0.7 * Math.cos(2 * Math.PI * index / numNodes)));
                var y = norm * (1 + (0.7 * Math.sin(2 * Math.PI * index / numNodes)));
                $('#idDrawArea').append(
                    '<div class="window jtk-node jsplumb-draggable" ' +
                        'style="top: ' + y.toString() + 'px; left: ' + x.toString() + 'px; ' + background + '"' +
                        'id="' + elem.id + '"><strong>' + elem.name + '</strong>' +
                    '</div>'
                );

                // Allow entity dragging
                jsPlumb.draggable($('#' + elem.id));

                // Allow focusing on peripheral entities
                // This feature was temporarily disabled by double-click as per ESA request
                // $('#' + elem.id).attr('ondblclick', 'viewer.invokeDisplayFocusedConfiguration("' + elem.id + '");');

            }

            // Draw endpoints for each entity
            if (elem.endpoints) {
                for (var endpoint of elem.endpoints) {

                    // Skip the visualization of endpoints not connected to the focused entity
                    for (var conn of connections) {
                        if (conn.source_ep_id === endpoint.id || conn.target_ep_id === endpoint.id) {
                            jsPlumb.addEndpoint(elem.id, {
                                id: endpoint.id,
                                uuid: endpoint.uuid,
                                endpoint: "Dot",
                                paintStyle: {fill: endpoint.type == "source" ? "green" : "red"},
                                isSource: endpoint.type == "source" ? true : false,
                                isTarget: endpoint.type == "target" ? true : false,
                                maxConnections: -1,
                                deleteEndpointsOnDetach: false,
                                anchor: "Continuous"
                            });
                        }
                    }
                }
            }
        });

        // Draw connections in the focused chart
        var connections = flowChart.connections;
        $.each(connections, function(index, connection) {
            var conn = jsPlumb.connect({
                id: connection.id,
                uuid: connection.id,
                uuids: [connection['source_ep_id'], connection['target_ep_id']],
                overlays:[[ "Label", {
                    id: connection.id,
                    label: "<span class='label-edge-class' id='" + connection.id + "'>" + connection.name + "</span>",
                }]]
            });
            if (conn) {
                conn.bind("click", function(conn) {
                    viewer.openInterfaceViewerPanel(connection);
                });
            } else {
                console.warn('Impaired connection: ' + connection.name + '; id: ' + connection.id);
                console.warn(connection);
            }
        });
    }

    displayInterfaceTable(entityId) {

        // Auxiliary variable declaration
        var nodes = JSON.parse(viewer.configFlowChart.graph).nodes;
        var connections = JSON.parse(viewer.configFlowChart.graph).connections;
        var entityName = null;
        var data = new Array();

        // Retrieve the name of the entity of interest
        for (var i = 0 ; i < nodes.length ; ++i) {
            if (nodes[i].id === entityId) {
                entityName = nodes[i].name;
                break ;
            }
        }

        // If the entity name cannot be found, log a warning message and return
        if (entityName === null) {
            console.warn('Unable to fill the interface table');
            return ;
        }

        // Loop over the available scenarios, and append the corresponding
        // entry in the scenario table
        for (var i = 0 ; i < connections.length ; i++) {

            // Save the interface row in a class member
            var connection = connections[i];

            // Append the interface row if the source or the target entities match the entityName
            if (connection['source_entity_name'] === entityName ||
                    connection['target_entity_name'] === entityName) {
                if (viewer.selectedMission == null || connection['impacted_elements'].includes(viewer.selectedMission)) {
                    var row = new Array();
                    row.push(connection['id']);
                    row.push(connection['name']);
                    row.push(connection['impacted_elements']);
                    row.push(connection['description']);
                    row.push(connection['source_entity_name']);
                    row.push(connection['target_entity_name']);
                    row.push(connection['content']);
                    row.push(connection['protocol']);
                    row.push(connection['references']);
                    data.push(row);
                }
            }
        }

        // Refresh the interface datatable
        viewer.interfaceTable.clear().rows.add(data).draw();

        // Display the interface datatable
        $('#interface-table-container').show();
    }

    errorLoadConfiguration(response) {
        console.error('Unable to retrieve the Interfaces Configuration');
        console.error(response);
        return;
    }

    invokeDisplayConfigurationMap() {

        // Auxiliary variable declaration
        var url = new URL(window.location);
        var updatedUrl = new URL(url.toString());

        // Check if the URL already has the "focusOn" or the "selectedMission" parameters, and if yes,
        // remove them
        updatedUrl.searchParams.delete('focusOn');
        updatedUrl.searchParams.delete('selectedMission');

        // Update the URL, by adding the "focusOn" and "selectedMission" parameters (if any)
        var focusOn = $('#entity-focus-select').val();
        if (focusOn) {
            updatedUrl = new URL(updatedUrl.toString() + '&focusOn=' + focusOn);
        }
        var selectedMission = $('#mission-select').val();
        if (selectedMission) {
            updatedUrl = new URL(updatedUrl.toString() + '&selectedMission=' + selectedMission);
        }

        // Update the browser address bar with the updated URL
        window.history.pushState({}, '', updatedUrl);
        viewer.displayConfigurationMap();
    }

    invokeDisplayFocusedConfiguration(idElement) {

        // Auxiliary variable declaration
        var url = new URL(window.location);
        var updatedUrl = new URL(url.toString());

        // Check if the URL already has the "focusOn" or the "selectedMission" parameters, and if yes,
        // remove them
        updatedUrl.searchParams.delete('focusOn');
        updatedUrl.searchParams.delete('selectedMission');

        // Update the URL, by adding the "focusOn" and "selectedMission" parameters (if any)
        var focusOn = $('#entity-focus-select').val();
        if (focusOn) {
            updatedUrl = new URL(updatedUrl.toString() + '&focusOn=' + focusOn);
        }
        var selectedMission = $('#mission-select').val();
        if (selectedMission) {
            updatedUrl = new URL(updatedUrl.toString() + '&selectedMission=' + selectedMission);
        }

        // Update the browser address bar with the updated URL
        window.history.pushState({}, '', updatedUrl);
        viewer.displayFocusedConfiguration(idElement);
    }

    openVersionSelectionPanel() {
        $('#version-selector-panel').fadeIn();
    }

    closeVersionSelectionPanel() {
        $('#version-selector-panel').fadeOut();
    }

    openInterfaceViewerPanel(connection) {

        // Fill (reset) the entities dropdown menu
        viewer.fillEntitiesLists();

        // Open the interface viewer panel. If the "connection" parameter is defined, use
        // the panel to update the current interface properties. If the parameter is null,
        // the viewer is used to create a new interface
        if (connection) {

            // Fill the interface properties panel
            $('#interface-id').val(connection['id']);
            $('#interface-name').val(connection['name']);
            $('#satellite-units').val(connection['impacted_elements']);
            $('#service-source-select').attr("readonly", true);
            $("#service-source-select > option").each(function(index, option) {
                if (option.text == connection['source_entity_name']) {
                    $('#service-source-select').val(option.value);
                }
            });
            $('#service-target-select').attr("readonly", true);
            $("#service-target-select > option").each(function(index, option) {
                if (option.text == connection['target_entity_name']) {
                    $('#service-target-select').val(option.value);
                }
            });
            $('#interface-description').val(connection['description']);
            $('#interface-protocol').val(connection['protocol']);
            $('#interface-content').val(connection['content']);
            $('#interface-notes-viewer').summernote('code', connection['notes']);
            $('#interface-references-viewer').summernote('code', connection['references']);

        } else {

            // Cleanup the interface editing panel
            $('#interface-id').val('');
            $('#interface-name').val('');
            $('#satellite-units').val('');
            $('#service-source-select').attr("readonly", false);
            $('#service-source-select').val('');
            $('#service-target-select').attr("readonly", false);
            $('#service-target-select').val('');
            $('#interface-description').val('');
            $('#interface-protocol').val('');
            $('#interface-content').val('');
            $('#interface-notes-viewer').summernote('code', '');
            $('#interface-references-viewer').summernote('code', '');

        }

        // Open the interface properties panel
        $('#interface-viewer-panel').fadeIn();
    }

    closeInterfaceViewerPanel() {

        // Hide the interface properties panel
        $('#interface-viewer-panel').fadeOut();

        // Cleanup the interface editing panel
        $('#interface-name').val('');
        $('#satellite-units').val('');
        $('#service-source-select').attr("readonly", true);
        $('#service-source-select').val('');
        $('#service-target-select').attr("readonly", true);
        $('#service-target-select').val('');
        $('#interface-description').val('');
        $('#interface-protocol').val('');
        $('#interface-content').val('');
        $('#interface-notes-viewer').summernote('code', '');
        $('#interface-references-viewer').summernote('code', '');
    }

    refreshTagField() {
        $('#id_commit_tag_block').attr("readonly",
            !document.getElementById('tag_commit_checkbox').checked);
    }

}

let viewer = new InterfacesViewer();