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

class ServicesViewer {

    constructor() {

        // The set of satellites
        this.satellites = ['S1A', 'S2A', 'S2B', 'S3A', 'S3B', 'S5P'];

        // Define different colors identifier on the basis of the service type
        this.colorsMap = {'Acquisition': 1, 'EDRS': 2, 'Production': 3, 'LTA': 4, 'ADGS': 5,
            'CDSE - Data Access': 6, 'CDSE - Traceability': 7, 'MPC': 8, 'POD': 9, 'MP': 10,
            'Monitoring': 11, 'Reference System - Processor Publication': 12,
            'Reference System - Sample Production': 13};

        // The complete list of services
        this.services = null;

        // The complete list of interfaces
        this.interfaces = null;

        // Focused entity identifier
        this.selectedService = null;

        // Selected satellite
        this.selectedSatellite = null;

    }

    init() {

        // Init the WYSISWYG Editors
        this.initWYSIWYGEditors();

        // Init the checkbox to display future interfaces
        this.initFutureInterfacesCheckbox();

        // Init the satellite selector
        this.initSatelliteSelector();

        // Init the version selector panel
        this.initVersionSelector();

        // Load the specified Services Configuration
        this.loadServicesConfiguration();

    }

    initFutureInterfacesCheckbox() {
        $('#display-future-interfaces').attr("checked", false);
        $('#display-future-interfaces').change(function() {
            var sat = $('#service-satellite-select').val();
            servicesViewer.invokeDisplayServicesDiagram(sat);
        })
    }

    initWYSIWYGEditors() {
        $('#service-operational-ipfs-viewer').summernote({
            minHeight: 100
        });
        $('#service-operational-ipfs-viewer').summernote('disable');
        $('#service-references-viewer').summernote({
            minHeight: 100
        });
        $('#service-references-viewer').summernote('disable');
    }

    initSatelliteSelector() {

        // Reset satellite select options
        $('#service-satellite-select').find('option').remove().end();
        servicesViewer.satellites.forEach(sat => {
            $('#service-satellite-select').append($('<option>', {
                value: sat,
                text : sat
            }));
        });

        // Trigger the reload of the D3.js visualization diagram
        $('#service-satellite-select').on('change', function (e) {
            var sat = $('#service-satellite-select').val();
            servicesViewer.invokeDisplayServicesDiagram(sat);
            servicesViewer.closeServiceViewerPanel();
        });

        // Check if the satSelected parameter is already present in the URL
        // If so, display the corresponding diagram
        var url = new URL(window.location);
        if (url.searchParams.get('selectedSat')) {
            $('#service-satellite-select').val(url.searchParams.get('selectedSat'));
        }
    }

    initVersionSelector() {
        var url = new URL(window.location);
        var configId = url.searchParams.get('id');
        ajaxCall('/rest/api/services/commit/' + configId, 'GET', {}, this.successLoadCommits, this.errorLoadCommits);
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
        $('#services-config-calendar').MEC({
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

    loadServicesConfiguration() {
        var url = new URL(window.location);
        var configId = url.searchParams.get('id');
        var version = url.searchParams.get('version');
        var ajaxCallURL = '/rest/api/services/' + configId;
        if (version) ajaxCallURL = '/rest/api/services/commit/' + configId + '/' + version;
        ajaxCall(ajaxCallURL, 'GET', {}, this.successLoadConfiguration, this.errorLoadConfiguration);
    }

    successLoadConfiguration(response) {

        // Store the Interface Configuration as a class member
        console.info("Services configuration loaded.");
        servicesViewer.services = JSON.parse(formatResponse(response)[0]['graph'])['services'];
        servicesViewer.interfaces = JSON.parse(formatResponse(response)[0]['graph'])['interfaces'];

        // Modify the internal interfaces properties so to be suitable for visualization in D3.js
        servicesViewer.services.forEach(node => {
            node['name'] = node['type'] + ' - ' + node['provider'];
        });
        servicesViewer.interfaces.forEach(iff => {
            iff['source'] = iff['source_service_id'];
            iff['target'] = iff['target_service_id'];
        });

        // Display the Services Configuration
        servicesViewer.displayServicesDiagram();
    }

    displayServicesDiagram() {

        // Reset the SVG container.
        var svg = d3.select("svg");
        svg.selectAll("*").remove();

        // Auxiliary variable declaration
        var data = {nodes: servicesViewer.services, links: servicesViewer.interfaces};

        // Select connections and nodes (entities) on the basis of the selected satellite
        var url = new URL(window.location);
        servicesViewer.selectedSatellite = url.searchParams.get('selectedSat') != null ?
            url.searchParams.get('selectedSat') : 'S1A';

        // Retrieve the future interfaces checkbox value
        var displayFutureIF = document.getElementById('display-future-interfaces').checked;

        // Use D3.js to draw the services diagram
        // Specify the dimensions of the chart.
        const width = 800;
        const height = 800;
        svg.attr("width", width);
        svg.attr("height", height);
        svg.attr("viewBox", [-width / 2, -height / 2, width, height]);
        svg.attr("style", "max-width: 100%; height: auto; height: intrinsic;")

        // Specify the color scale
        const color = d3.scaleOrdinal(d3.schemeCategory10);

        // Filter services and nodes on the basis of the selected satellite
        data.nodes = data.nodes.filter(function(node) {
            return (node['satellite_units'].toUpperCase().includes(servicesViewer.selectedSatellite.toUpperCase())
                    || node['satellite_units'].toUpperCase().includes(servicesViewer.selectedSatellite.toUpperCase().substring(0,2)));
        });
        data.links = data.links.filter(function(link) {
            var hasSource = false, hasTarget = false;
            for (const node of data.nodes) {
                if (link['source'] === node['id']) hasSource = true;
                if (link['target'] === node['id']) hasTarget = true;
            }
            return (hasSource && hasTarget && (link['status'] === 'Operational' || displayFutureIF));
        });
        data.nodes = data.nodes.filter(function(node) {
            let found = false;
            for (var link of data.links) {
                if (node['id'] === link['source'] || node['id'] === link['target'] ) {
                    found = true;
                }
            }
            return found;
        });

        // The force simulation mutates links and nodes, so create a copy
        // so that re-evaluating this cell produces the same result.
        const links = data.links.map(d => ({...d}));
        const nodes = data.nodes.map(d => ({...d}));

        // Create a simulation with several forces.
        const simulation = d3.forceSimulation(nodes)
          .force("link", d3.forceLink(links).id(d => d.id).strength(0.01))
          .force("charge", d3.forceManyBody().strength(-30))
          .force("center", d3.forceCenter(-width / 5, -height / 8))
          .on("tick", ticked);

        // Add a line for each link, and a circle for each node.
        const link = svg.append("g")
          .selectAll()
          .data(links)
          .join("line")
          .attr("stroke", d => d.status === "Operational" ? "#35e75f" : "#0000ff")
          .attr("stroke-opacity", 0.8)
          .attr("stroke-width", d => Math.sqrt(d.value));

        const node = svg.append("g")
            .selectAll(".node")
            .data(nodes)
            .join("g")
            .attr('class', 'node');

        node.append('circle')
            .attr("r", 15)
            .attr("fill", d => color(d.type));

        node.append("text")
            .text(d => d.name)
            .style('fill', '#4e555c')
            .style('font-size', '12px')
            .attr('x', 6)
            .attr('y', 3);

        node.on("click", function(node) {
            servicesViewer.openServiceViewerPanel(node.target.__data__);
        });

        // Add a drag behavior
        node.call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));

        // Set the position attributes of links and nodes each time the simulation ticks.
        function ticked() {
            link
                .attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);

            node
                .attr("transform", d => `translate(${d.x}, ${d.y})`);
        }

        // Reheat the simulation when drag starts, and fix the subject position.
        function dragstarted(event) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            event.subject.fx = event.subject.x;
            event.subject.fy = event.subject.y;
        }

        // Update the subject (dragged node) position during drag.
        function dragged(event) {
            event.subject.fx = event.x;
            event.subject.fy = event.y;
        }

        // Restore the target alpha so the simulation cools after dragging ends.
        // Unfix the subject position now that it’s no longer being dragged.
        function dragended(event) {
            if (!event.active) simulation.alphaTarget(0);
            event.subject.fx = null;
            event.subject.fy = null;
        }

        // When this cell is re-run, stop the previous simulation. (This doesn’t
        // really matter since the target alpha is zero and the simulation will
        // stop naturally, but it’s a good practice.)
        // invalidation.then(() => simulation.stop());

        return svg.node();
    }

    errorLoadConfiguration(response) {
        console.error('Unable to retrieve the Services Configuration');
        console.error(response);
        return;
    }

    invokeDisplayServicesDiagram(sat) {

        // Auxiliary variable declaration
        var url = new URL(window.location);
        var updatedUrl = new URL(url.toString());

        // Check if the URL already has the "sat" parameter, and if yes, remove it
        updatedUrl.searchParams.delete('selectedSat');

        // Update the URL, by adding the "selectedSat" parameter
        updatedUrl = new URL(updatedUrl.toString() + '&selectedSat=' + sat);

        // Update the browser address bar with the updated URL
        window.history.pushState({}, '', updatedUrl);
        servicesViewer.displayServicesDiagram();
    }

    openVersionSelectionPanel() {
        $('#version-selector-panel').fadeIn();
    }

    closeVersionSelectionPanel() {
        $('#version-selector-panel').fadeOut();
    }

    openServiceViewerPanel(service) {

        // Fill the interface properties panel
        $('#service-id').val(service['id']);
        $('#service-type').val(service['type']);
        $('#service-provider').val(service['provider']);
        $('#interface-point').val(service['interface_point']);
        $('#service-satellite-units').val(service['satellite_units']);
        $('#cloud-provider').val(service['cloud_provider']);
        $('#rolling-period').val(service['rolling_period']);
        $('#service-operational-ipfs-viewer').summernote('code', service['operational_ipfs']);
        $('#service-references-viewer').summernote('code', service['references']);

        // Open the service properties panel
        $('#service-viewer-panel').fadeIn();
    }

    closeServiceViewerPanel() {

        // Hide the service properties panel
        $('#service-viewer-panel').fadeOut();

        // Cleanup the service editing panel
        $('#service-id').val('');
        $('#service-type').val('');
        $('#service-provider').val('');
        $('#interface-point').val('');
        $('#satellite-units').val('');
        $('#cloud-provider').val('');
        $('#rolling_period').val('');
        $('#service-operational-ipfs-viewer').summernote('code', '');
        $('#service-references-viewer').summernote('code', '');
    }

    refreshTagField() {
        $('#id_commit_tag_block').attr("readonly",
            !document.getElementById('tag_commit_checkbox').checked);
    }

}

let servicesViewer = new ServicesViewer();