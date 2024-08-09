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

class InterfacesEditor {

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

        // Init the commit modal window - by default, disable tagging
        this.initCommitModal();

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
        $("#interface-editor-panel").fadeOut();

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
                },
                {
                    targets: -1,
                    data: null,
                    render: function (data, type, full, meta) {
                        if (type === 'display') {
                            var interfaceId = full[0];
                            if (editor.isEditingEnabled()) {
                                let actions =
                                    '<a name="delete_interface_link" class="dropdown-item rounded-top" href="#" onClick="editor.deleteInterface(\''+interfaceId+'\');">' +
                                        '<img id=\'ID_ACTION_DELETE_'+interfaceId+'\' class="navbar-brand-light" src="/static/assets/img/icons/delete_black_24dp.svg" alt="Volt logo" />' +
                                    '</a>'
                                return actions;
                            } else {
                                let actions =
                                    '<a name="delete_interface_link" class="dropdown-item rounded-top" href="javascript: void(0)" >' +
                                        '<img id=\'ID_ACTION_DELETE_'+interfaceId+'\' class="navbar-brand-light" src="/static/assets/img/icons/delete_black_24dp.svg" alt="Volt logo" />' +
                                    '</a>'
                                return actions;
                            }

                        } else {
                            return data;
                        }
                    }
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
                editor.invokeDisplayFocusedConfiguration(elementId);
            } else {
                editor.invokeDisplayConfigurationMap();
            }
        });
    }

    initMissionSelector() {
        $('#mission-select').on('change', function (e) {
            var elementId = $('#entity-focus-select').val();
            if (elementId.length != 0) {
                editor.invokeDisplayFocusedConfiguration(elementId);
            } else {
                editor.invokeDisplayConfigurationMap();
            }
        });
    }

     initWYSIWYGEditors() {
        $('#interface-references').summernote({
            minHeight: 100
        });
        $('#interface-notes').summernote({
            minHeight: 100
        });
    }

    initVersionSelector() {
        var url = new URL(window.location);
        var idScenario = url.searchParams.get('id');
        ajaxCall('/rest/api/interfaces/commit/'+idScenario, 'GET', {}, this.successLoadCommits, this.errorLoadCommits);
    }

    initCommitModal() {
        document.getElementById('tag-commit-checkbox').checked = false;
        $('#tag-commit').attr("readonly", true);
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
        editor.configFlowChart = formatResponse(response)[0];

        // Fill the entity combo boxes
        editor.fillEntitiesLists();

        // Fill the mission combo box
        editor.fillMissionsList();

        // Enable / disable widgets
        editor.manageFunctionalities();

        // Display the Interface Configuration Map or the Configuration focused on a specified entity
        var url = new URL(window.location);
        var configMapEnabled = url.searchParams.get('focusOn') == null;
        if (configMapEnabled) {
            editor.displayConfigurationMap();
        } else {
            editor.displayFocusedConfiguration();
        }
    }

    fillEntitiesLists() {

        // Auxiliary variable declaration
        var nodes = JSON.parse(editor.configFlowChart.graph).nodes;

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

    manageFunctionalities() {
        if (!editor.isEditingEnabled()) {
            disableComponentById("add-entity-btn");
            disableComponentById("entity-name");
            disableComponentById("external-entity");
            disableComponentById("entity-description");
            disableComponentById("save-entity-btn");
            disableComponentById("add-interface-btn");
            disableComponentById("interface-name");
            disableComponentById("satellite-units");
            disableComponentById("interface-description");
            disableComponentById("interface-protocol");
            disableComponentById("interface-content");
            disableComponentById("interface-notes");
            disableComponentById("interface-references");
            disableComponentById("save-interface-btn");
            disableComponentById("commit-btn");
        }
    }

    displayConfigurationMap() {

        // Empty jsPlumb
        jsPlumb.empty("idDrawArea");

        // Auxiliary variable declaration
        var configId = editor.configFlowChart.id;
        var nodes = JSON.parse(editor.configFlowChart.graph).nodes;
        var connections = JSON.parse(editor.configFlowChart.graph).connections;
        var numNodes = nodes.length;
        var norm = 400;

        // Select connections and nodes (entities) on the basis of the selected mission
        var url = new URL(window.location);
        editor.selectedMission = url.searchParams.get('selectedMission');
        if (editor.selectedMission) {

            // Auxiliary variable declaration
            var selectedNodes = [];
            var selectedConnections = [];

            // Filter connections
            for (const conn of connections) {
                if (conn['impacted_elements'].includes(editor.selectedMission)) {
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
            // $('#' + elem.id).attr('ondblclick', 'editor.invokeDisplayFocusedConfiguration("' + elem.id + '");');

            // Add one endpoint to each container
            jsPlumb.addEndpoint(elem.id, {
                uuid: "containerEp" + index.toString(),
                endpoint: "Rectangle",
                paintStyle: {fill: "grey"},
                deleteEndpointsOnDetach: false,
                anchor: "AutoDefault"
            });

            // Build the entity set of buttons
            editor.buildActionButtons(elem);

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

        // Store the information about the selected entity in the dedicated class member
        var url = new URL(window.location);
        var entityId = url.searchParams.get('focusOn');
        editor.focusedEntityId = entityId;
        var selectedMission = url.searchParams.get('selectedMission');
        editor.selectedMission = selectedMission;

        // Auxiliary variable declaration
        var nodes = JSON.parse(editor.configFlowChart.graph).nodes;
        var connections = JSON.parse(editor.configFlowChart.graph).connections;

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
        editor.displayFocusedFlowchart(entityId, flowChartJson);

        // Display only interfaces connected to the selected item
        editor.displayInterfaceTable(entityId);

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
                // $('#' + elem.id).attr('ondblclick', 'editor.invokeDisplayFocusedConfiguration("' + elem.id + '");');
            }

            // Set the action buttons
            editor.buildActionButtons(elem);

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
                    editor.openInterfaceEditorPanel(connection);
                });
            } else {
                console.warn('Impaired connection: ' + connection.name + '; id: ' + connection.id);
                console.warn(connection);
            }
        });
    }

    displayInterfaceTable(entityId) {

        // Auxiliary variable declaration
        var nodes = JSON.parse(editor.configFlowChart.graph).nodes;
        var connections = JSON.parse(editor.configFlowChart.graph).connections;
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
                if (editor.selectedMission == null || connection['impacted_elements'].includes(editor.selectedMission)) {
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
        editor.interfaceTable.clear().rows.add(data).draw();

        // Display the interface datatable
        $('#interface-table-container').show();
    }

    errorLoadConfiguration(response) {
        console.error('Unable to retrieve the Interfaces Configuration');
        console.error(response);
        return;
    }

    isEditingEnabled() {
        var url = new URL(window.location);
        return url.searchParams.get('version') == null;
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
        editor.displayConfigurationMap();
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
        editor.displayFocusedConfiguration(idElement);
    }

    openVersionSelectionPanel() {
        $('#version-selector-panel').fadeIn();
    }

    closeVersionSelectionPanel() {
        $('#version-selector-panel').fadeOut();
    }

    openEntityEditorPanel(entityId) {

        // Open the entity editor panel. If the "entity" parameter is defined, use
        // the panel to update the current entity properties. If the entity is null,
        // the editor is used to create a new entity
        if (entityId) {

            // Retrieve the node entity
            var entity = null;
            var nodes = JSON.parse(editor.configFlowChart.graph).nodes;
            $.each(nodes, function (i, node) {
                if (node['id'] === entityId) {
                    entity = node;
                }
            });

            // Fill the interface properties panel
            $('#entity-id').val(entity['id']);
            $('#entity-name').val(entity['name']);
            $('#entity-description').val(entity['description']);
            $("#external-entity").attr("checked", entity['external']);

        } else {

            // Cleanup the entity editing panel
            $('#entity-id').val('');
            $('#entity-name').val('');
            $('#entity-description').val('');
            $('#external-entity').attr("checked", false);
        }

        // Open the interface properties panel
        $('#entity-editor-panel').modal('show');
    }

    closeEntityEditorPanel() {

        // Hide the entity properties panel
        $('#entity-editor-panel').modal('hide');

        // Cleanup the entity editing panel
        $('#entity-id').val('');
        $('#entity-name').val('');
        $('#entity-description').val('');
        $('#external-entity').attr("checked", false);

    }

    saveEntity() {
        var entityId = $('#entity-id').val();
        if (entityId.trim() === null || entityId.trim().length == 0) {
            editor.addEntity();
        } else {
            editor.updateEntity();
        }
    }

    addEntity() {

        // Retrieve the scenario identifier
        var url = new URL(window.location);
        var idScenario = url.searchParams.get('id');

        // Define the new entity
        // By default, all added entities are brother to each other
        // Nesting of entities is intentionally disabled
        var body = {};
        body['idFragment'] = '';
        body['idScenario'] = idScenario;
        body['name'] = $('#entity-name').val();
        body['description'] = $('#entity-description').val();
        body['external'] = document.getElementById('external-entity').checked;

	    // Save the new entity
        ajaxCall('/rest/api/interfaces/entity', 'POST', body, this.successAddEntity, this.errorAddEntity);

        // Cleanup the modal window
        $('#entity-name').val('');
        $('#entity-description').val('');
    }

    successAddEntity(response) {
        location.reload();
    }

    errorAddEntity(response) {
        console.error('Unable to add the specified entity');
        console.error(response);
    }

    buildActionButtons(entity) {

        // Allow editing only in the event of admin role, and if the current version is displayed
        if (editor.isEditingEnabled()) {

            // Delete entity button
            let buttonId = entity.id + '-delete-btn';
            $('#' + entity.id).append('<button name="button_delete_fragment" class="btn btn-gray-200 mt-2 animate-up-2"' +
                'id="' + buttonId + '" style="position: absolute; top: -45px; right: -35px; color: white' +
                'border-color: transparent; background: transparent" onclick="editor.deleteEntity(\'' + entity.id + '\');" ' +
                'type="button"><i class="fas fa-trash" style="color: black" alt=""></button>');
            $('#' + buttonId).hide();
            $('#' + entity.id).hover(
                function() {
                    $('#' + buttonId).show();
                },
                function() {
                    $('#' + buttonId).hide();
            })

            // Edit entity button
            let button_modifyId = entity.id + '-modify-btn';
            $('#' + entity.id).append('<button name="button_modify_fragment" class="btn btn-gray-200 mt-2 animate-up-2"' +
                'id="' + button_modifyId + '" style="position: absolute; top: -67px; right: -35px; color: white' +
                'border-color: transparent; background: transparent" onclick="editor.openEntityEditorPanel(\'' + entity.id + '\');" ' +
                'type="button" data-toggle="modal" data-target="#modify-fragment-modal"><i class="fas fa-edit" style="color: black" alt=""></button>');
            $('#' + button_modifyId).hide();
            $('#' + entity.id).hover(
                function() {
                    $('#' + button_modifyId).show();
                },
                function() {
                    $('#' + button_modifyId).hide();
            })
        }
    }

    updateEntity() {

        // Retrieve the scenario identifier
        var url = new URL(window.location);
        var configId = url.searchParams.get('id');

        // Define the new entity
        // By default, all added entities are brother to each other
        // Nesting of entities is intentionally disabled
        var body = {};
        body['config_id'] = configId;
        body['entity_id'] = $('#entity-id').val();
        body['name'] = $('#entity-name').val();
        body['description'] = $('#entity-description').val();
        body['external'] = document.getElementById('external-entity').checked;

	    // Save the new entity
        ajaxCall('/rest/api/interfaces/entity', 'PUT', body, this.successUpdateEntity, this.errorUpdateEntity);

        // Cleanup and close the modal window
        editor.closeEntityEditorPanel();

    }

    successUpdateEntity(response) {
        location.reload();
    }

    errorUpdateEntity(response) {
        console.error('Unable to modify the specified entity');
        console.error(response);
    }

    deleteEntity(entityId) {
        $('<div></div>').appendTo('body')
            .html('<div class="modal-dialog"><p class"modal-body">' + 'By clicking \'Yes\', the selected entity will be deleted. ' +
                'Are you sure you want to proceed?' + '</p></div>').dialog({
            modal: true,
            title: 'Fragment deletion',
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
                            var url = new URL(window.location);
                            var configId = url.searchParams.get('id');
                            var json = {};
                            json.id = configId;
                            json.graph = editor.configFlowChart.graph;
                            json.removedEntityId = entityId;
                            ajaxCall('/rest/api/interfaces/entity', 'DELETE', json, editor.successDeleteEntity,
                                    editor.errorDeleteEntity);
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

    successDeleteEntity(response) {
        location.reload();
    }

    errorDeleteEntity(response) {
        console.error('Unable to delete the selected entity');
        console.error(response);
    }

    openInterfaceEditorPanel(connection) {

        // Fill (reset) the entities dropdown menu
        editor.fillEntitiesLists();

        // Open the interface editor panel. If the "connection" parameter is defined, use
        // the panel to update the current interface properties. If the parameter is null,
        // the editor is used to create a new interface
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
            $('#interface-notes').summernote('code', connection['notes']);
            $('#interface-references').summernote('code', connection['references']);

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
            $('#interface-references').summernote('code', '');
            $('#interface-notes').summernote('code', '');

        }

        // Open the interface properties panel
        $('#interface-editor-panel').fadeIn();
    }

    closeInterfaceEditorPanel() {

        // Hide the interface properties panel
        $('#interface-editor-panel').fadeOut();

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
        $('#interface-references').summernote('code', '');
        $('#interface-notes').summernote('code', '');
    }

    saveInterface() {
        var interfaceId = $('#interface-id').val();
        if (interfaceId.trim() === null || interfaceId.trim().length == 0) {
            editor.addInterface();
        } else {
            editor.updateInterface();
        }
    }

    addInterface() {

        // Retrieve the scenario identifier
        var url = new URL(window.location);
        var idScenario = url.searchParams.get('id');

        // Retrieve the interface main properties and store in the body request
        var body = {};
        body['idScenario'] = idScenario;
        body['name'] = $('#interface-name').val();
        body['elements'] = $('#satellite-units').val();
        body['source'] = $('#service-source-select').val();
        body['target'] = $('#service-target-select').val();
        body['description'] = $('#interface-description').val();
        body['protocol'] = $('#interface-protocol').val();
        body['content'] = $('#interface-content').val();
        body['notes'] = $('#interface-notes').summernote('code');
        body['references'] = $('#interface-references').summernote('code');

        // Invoke function to add the new interface in backend
        ajaxCall('/rest/api/interfaces/interface', 'POST', body, editor.successAddInterface, editor.errorAddInterface);

    }

    successAddInterface(response) {
        editor.closeInterfaceEditorPanel();
        editor.configFlowChart = formatResponse(response)[0];
        editor.invokeDisplayFocusedConfiguration(editor.focusedEntityId);
    }

    errorAddInterface(response) {
        console.error('Unable to add the requested interface');
        console.error(response);
    }

    updateInterface() {

        // Retrieve the scenario identifier
        var url = new URL(window.location);
        var idScenario = url.searchParams.get('id');

        // Retrieve the interface main properties and store in the body request
        var body = {};
        body['idScenario'] = idScenario;
        body['id'] = $('#interface-id').val();
        body['name'] = $('#interface-name').val();
        body['elements'] = $('#satellite-units').val();
        body['source'] = $('#service-source-select').val();
        body['target'] = $('#service-target-select').val();
        body['description'] = $('#interface-description').val();
        body['protocol'] = $('#interface-protocol').val();
        body['content'] = $('#interface-content').val();
        body['notes'] = $('#interface-notes').summernote('code');
        body['references'] = $('#interface-references').summernote('code');

        // Persist modifications
        ajaxCall('/rest/api/interfaces/interface', 'PUT', body, editor.successUpdateInterface, editor.errorUpdateInterface);
    }

    successUpdateInterface(response) {
        editor.closeInterfaceEditorPanel();
        editor.configFlowChart = formatResponse(response)[0];
        editor.invokeDisplayFocusedConfiguration(editor.focusedEntityId);
    }

    errorUpdateInterface(response) {
        console.error('Unable to update the selected interface');
        console.error(response);
    }

    saveEntityPicture() {

        // Retrieve the scenario and the entity identifier
        var url = new URL(window.location);
        var config_id = url.searchParams.get('id');
        var entity_id = url.searchParams.get('focusOn');

        // Check input consistency - otherwise return
        if (!config_id && !entity_id) return ;

        // Fix problem with the visualization of jtk-connector elements of JS Plumb.
        // html2canvas does not work well with SVG elements, positioned as "absolute".
        // To solve the issue, it is suggested to wrap connectors within "span" elements,
        // assigning them the "absolute" position.
        // References:
        // 1. https://github.com/niklasvh/html2canvas/issues/1179
        // 2. http://eatandcode.es/2017/08/12/Soluciones-a-la-captura-de-svg-con-html2canvas/
        editor.adjustConnectorsInCanvas();

        // Take snapshot and send the image to the backend
        var sx = $('#idDrawArea').offset().left;
        var sy = $('#idDrawArea').offset().top;
        html2canvas(document.body).then(function(canvas) {
            var ctx = canvas.getContext('2d');
            var data = ctx.getImageData(0, 0, canvas.width, canvas.height);
            var compositeOperation = ctx.globalCompositeOperation;
            ctx.globalCompositeOperation = "destination-over";
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(0,0,canvas.width,canvas.height);
            var tempCanvas = document.createElement("canvas"),
                tCtx = tempCanvas.getContext("2d");
            tempCanvas.width = 900;
            tempCanvas.height = 750;
            tCtx.drawImage(canvas,-sx,-sy);

            // The following line is kept just for testing purposes
            // window.open(tempCanvas.toDataURL("image/png"));

            // Invoke function to send the picture to the backend
            var body = {'data_url': tempCanvas.toDataURL("image/png")}
            ajaxCall('/rest/api/interfaces/document/upload/' + config_id + '/' + entity_id, 'POST', body,
                    editor.successSavePicture, editor.errorSavePicture);
        });
    }

    adjustConnectorsInCanvas() {
        $(document).find('.jtk-connector').each(function () {
            var left = parseInt(this.style.left, 10) + 'px';
            var top = parseInt(this.style.top, 10) + 'px';
            this.removeAttribute('style');
            this.removeAttribute('position');
            this.setAttribute('width', parseInt(this.getAttribute('width'), 10)  + 'px');
            this.setAttribute('height', parseInt(this.getAttribute('height'), 10) + 'px');
            this.setAttribute('preserveAspectRatio', 'xMidYMid meet');
            this.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
            // this.children[0] is the path for connection line
            // this.children[1] is the path for connection arrow shape
            this.children[0].setAttribute('xmlns', 'http://www.w3.org/2000/svg');
            this.children[1].setAttribute('xmlns', 'http://www.w3.org/2000/svg');
            this.setAttribute('viewbox', '0 0 ' + parseInt(this.getAttribute('width'), 10) + ' ' + parseInt(this.getAttribute('height'), 10));
            this.children[0].setAttribute('stroke-width', '4px');
            this.children[0].setAttribute('stroke', '#61B7CF');
            this.children[1].setAttribute('fill', '#61B7CF');
            this.children[1].setAttribute('stroke', '#61B7CF');
            $(document).find(this).wrap('<span style="position: absolute; left: ' + left + '; top: ' + top + ';"></span>');
        });
    }

    successSavePicture(response) {
        console.info('Entity configuration successfully saved');
    }

    errorSavePicture(response) {
        console.error('Unable to save entity configuration', response);
    }

    showReferencesInfoPopup() {
        var infoPopup = document.getElementById("referencesInfoPopup");
        if (infoPopup.style.display === 'none' || infoPopup.style.display === '') {
            infoPopup.style.display = 'block';
        } else {
            infoPopup.style.display = 'none';
        }
    }

    deleteInterface(idInterface) {

        // Retrieve the scenario identifier
        var url = new URL(window.location);
        var idScenario = url.searchParams.get('id');

        // Retrieve the interface main properties and store in the body request
        var body = {};
        body['idScenario'] = idScenario;
        body['idInterface'] = idInterface;

        // Invoke function to add the new interface in backend
        ajaxCall('/rest/api/interfaces/interface', 'DELETE', body, editor.successDeleteInterface, editor.errorDeleteInterface);

    }

    successDeleteInterface(response) {
        editor.configFlowChart = formatResponse(response)[0];
        editor.focusOn(editor.focusedEntityId);
    }

    errorDeleteInterface(response) {
        console.error('Unable to delete the selected interface');
        console.error(response);
    }

    refreshTagField() {
        $('#tag-commit').attr("readonly",
            !document.getElementById('tag-commit-checkbox').checked);
    }

    commit() {
        var url = new URL(window.location);
        var idScenario = url.searchParams.get('id');
        var comment = $('#commit-description').val();
        var tag = $('#tag-commit').val();
        var json = {};
        json.idScenario = idScenario;
        json.comment = comment;
        json.tag = tag;
        ajaxCall('/rest/api/interfaces/commit', 'POST', json, this.successCommit, this.errorCommit);
        return;
    }

    successCommit(response) {

        // Display a popup message
        var content = {};
        content.title = 'Commit result';
        content.message = 'Commit successfully executed.';
        content.icon = 'fa fa-bell';
        content.url = '';
        content.target = '_blank';

        // Message visualization
        var placementFrom = "bottom";
        var placementAlign = "right";
        var state = "success";
        var style = "withicon";

        $.notify(content,{
            type: state,
            placement: {
                from: placementFrom,
                align: placementAlign
            },
            time: 1000,
            delay: 0,
        });
    }

    errorCommit(response) {

        // Log the failure of the commit in the browser console
        console.error('Unable to commit the current configuration');
        console.error(response);

        // Display a popup message
        var content = {};
        content.title = 'Commit result';
        content.message = 'Unable to commit the current configuration';
        content.icon = 'fa fa-bell';
        content.url = '';
        content.target = '_blank';

        // Message visualization
        var placementFrom = "bottom";
        var placementAlign = "right";
        var state = "danger";
        var style = "withicon";

        $.notify(content,{
            type: state,
            placement: {
                from: placementFrom,
                align: placementAlign
            },
            time: 1000,
            delay: 0,
        });
    }

}

let editor = new InterfacesEditor();