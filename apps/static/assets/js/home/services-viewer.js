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
        this.satellites = ['S1A', 'S1B', 'S1C', 'S2A', 'S2B', 'S2C', 'S3A', 'S3B', 'S5P'];

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

        // Init the version selector panel
        initVersionSelector();

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

        // Append the empty selection option as the first option
        $('#service-satellite-select').append($('<option>', {
            value: "",
            text : "Select a satellite unit..."
        }));

        // Set the satellite units
        servicesViewer.satellites.forEach(sat => {
            $('#service-satellite-select').append($('<option>', {
                value : sat,
                text  : sat
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

        // Auxiliary variable declaration
        var data = {nodes: servicesViewer.services, links: servicesViewer.interfaces};

        // Select connections and nodes (entities) on the basis of the selected satellite
        var url = new URL(window.location);
        var selectedSat = url.searchParams.get('selectedSat');
        if (selectedSat == null) {
            servicesViewer.selectedSatellite = null;
        } else {
            servicesViewer.selectedSatellite = url.searchParams.get('selectedSat');
        }

        // Retrieve the future interfaces checkbox value
        var displayFutureIF = document.getElementById('display-future-interfaces').checked;

        // Use D3.js to draw the services diagram
        // Specify the dimensions of the chart.
        const margin = {
            top: 300,
            right: 0,
            bottom: 0,
            left: 300
        };
        const width = 720;
        const height = 720;

        // Reset the SVG container
        var svgDOM = d3.select("svg");
        svgDOM.selectAll("*").remove();
        svgDOM.attr('class','matrixdiagram');
        svgDOM.attr("width", width + margin.left + margin.right);
        svgDOM.attr("height", height + margin.top + margin.bottom);
        var svg = svgDOM.append('g');
        svg.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

        // Specify the color scale
        const color = d3.scaleOrdinal(d3.schemeCategory10).domain(d3.range(13));

        // Filter services nodes on the basis of the selected satellite
        if (servicesViewer.selectedSatellite) {
            data.nodes = data.nodes.filter(function(node) {
                return (node['satellite_units'].toUpperCase().includes(servicesViewer.selectedSatellite.toUpperCase())
                        || node['satellite_units'].toUpperCase().includes(servicesViewer.selectedSatellite.toUpperCase().substring(0,2)));
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
        }

        // Filter interfaces on the basis of the selected nodes
        data.links = data.links.filter(function(link) {
            var hasSource = false, hasTarget = false;
            for (const node of data.nodes) {
                if (link['source'] === node['id']) hasSource = true;
                if (link['target'] === node['id']) hasTarget = true;
            }
            return (hasSource && hasTarget && (link['status'] === 'Operational' || displayFutureIF));
        });

        // The force simulation mutates links and nodes, so create a copy
        // so that re-evaluating this cell produces the same result.
        const links = data.links.map(d => ({...d}));
        const nodes = data.nodes.map(d => ({...d}));

        // Sort nodes
        nodes.sort((a,b) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0));

        // After filtering and sorting, set the proper index to every node
        for (let i = 0; i < nodes.length; ++i) {
            nodes[i].index = i;
        }

        // After filtering, update the links with the indexes of the relevant source / target nodes
        for (let i = 0; i < links.length; ++i) {
            for (let j = 0; j < nodes.length; ++j) {
                if (links[i].source_service_id === nodes[j].id) {
                    links[i].source_service_name = nodes[j].name;
                    links[i].source_service_index = nodes[j].index;
                }
                if (links[i].target_service_id === nodes[j].id) {
                    links[i].target_service_name = nodes[j].name;
                    links[i].target_service_index = nodes[j].index;
                }
            }
        }

        // New part for matrix diagram
        var graph = {'links': links, 'nodes': nodes};
        var x = d3.scaleBand().rangeRound([0, width]).paddingInner(0.1).align(0);
        x.domain(d3.range(graph.nodes.length));
        var matrix = graph.nodes.map(function (outer, i) {
            outer.index = i;
            return graph.nodes.map(function (inner, j) {
                return {i: i, j: j};
            });
        });
        graph.links.forEach(function (l) {
            matrix[l.source_service_index][l.target_service_index].link = l;
        });

        // Build rows and columns
        var row = svg.selectAll('g.row')
            .data(matrix)
            .enter().append('g')
            .attr('class', 'row')
            .attr('transform', function (d, i) { return 'translate(0,' + x(i) + ')'; })
            .each(makeRow);
        row.append('text')
            .attr('class', 'label')
            .attr('x', -4)
            .attr('y', x.bandwidth() / 2)
            .attr('dy', '0.32em')
            .text(function (d, i) { return graph.nodes[i].name; });

        var column = svg.selectAll('g.column')
            .data(matrix)
            .enter().append('g')
            .attr('class', 'column')
            .attr('transform', function(d, i) { return 'translate(' + x(i) + ', 0)rotate(-90)'; })
            .append('text')
            .attr('class', 'label')
            .attr('x', 4)
            .attr('y', x.bandwidth() / 2)
            .attr('dy', '0.32em')
            .text(function (d, i) { return graph.nodes[i].name; });

        function makeRow(rowData) {
            var cell = d3.select(this).selectAll('rect')
                .data(rowData)
                .enter().append('rect')
                .attr('class', 'rect')
                .attr('x', function (d, i) { return x(i); })
                .attr('width', x.bandwidth())
                .attr('height', x.bandwidth())
                .style('fill', function (d) {
                    if (!d.link) {
                         return 'white';
                    } else if (d.link.status.toLowerCase() === 'undef') {
                        return 'white';
                    } else if (d.link.status.toLowerCase() === 'operational') {
                        if (d.link.name) {
                            return '#00f800';
                        } else {
                            return '#BAF8BA';
                        }
                    } else {
                        return 'blue';
                    }
                })
                .on('mouseover', function (d) {
                    row.filter(function (_, i) { return d.target.__data__.i === i; })
                        .selectAll('text')
                        .style('fill', '#d62333')
                        .style('font-weight', 'bold');
                    column.filter(function (_, j) { return d.target.__data__.j === j; })
                        .style('fill', '#d62333')
                        .style('font-weight', 'bold');
                })
                .on('mouseout', function () {
                    row.selectAll('text')
                        .style('fill', null)
                        .style('font-weight', null);
                    column
                        .style('fill', null)
                        .style('font-weight', null);
                });
            cell.append('title').text(function (d) {
                if (!d.link) {
                    return '';
                } else {
                    let text = '';
                    if (d.link.name) {
                        text += 'Name: ' + d.link.name + '\n';
                    }
                    text += 'Source: ' + d.link.source_service_name + '\n';
                    text += 'Target: ' + d.link.target_service_name + '\n';
                    text += 'Satellite Units: ' + d.link.satellite_units + '\n';
                    text += 'Status: ' + d.link.status;
                    if (d.link.whitelisted_clients) {
                        text += '\n' + 'Whitelisted Client(s): ' + d.link.whitelisted_clients.replace(/<[^>]+>/g, '');
                    }
                    return  text;
                }
            });
        }

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

        // Update the URL, by adding the "selectedSat" parameter, if set
        if (sat.trim().length != 0) {
            updatedUrl = new URL(updatedUrl.toString() + '&selectedSat=' + sat);
        }

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
        $('#service-satellite-units').val(service['satellite_units']);
        $('#interface-point').val(service['interface_point']);
        $('#rolling-period').val(service['rolling_period']);
        $('#cloud-provider').val(service['cloud_provider']);
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
        $('#satellite-units').val('');
        $('#interface-point').val('');
        $('#rolling_period').val('');
        $('#cloud-provider').val('');
        $('#service-operational-ipfs-viewer').summernote('code', '');
        $('#service-references-viewer').summernote('code', '');
    }

    refreshTagField() {
        $('#id_commit_tag_block').attr("readonly",
            !document.getElementById('tag_commit_checkbox').checked);
    }

}

let servicesViewer = new ServicesViewer();