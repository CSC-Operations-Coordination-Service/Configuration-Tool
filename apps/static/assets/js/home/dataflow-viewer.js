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

const exportDocument = function(button, isOfficial) {
    console.log('exportDocument called with args: ', button, isOfficial)
    const configId = new URL(window.location).searchParams.get('id');

    button.disable();
    // button.html('<i class="icon-docs"></i><span>&nbsp;&nbsp;Generating... 0%</span>');
    // button.text = `Generating...`;

    let progress = 0;
    const totalTime = 53000;
    const interval = 500;
    const increment = 100 / (totalTime / interval);

    const progressTimer = setInterval(function() {
        progress = Math.min(progress + increment, 99);
        button.html(`<i class="icon-docs"></i><span>&nbsp;&nbsp;Generating... ${Math.round(progress)}%</span>`);
    }, interval);

    $.ajax({
        url: `/rest/api/dataflow/document`,
        method: 'GET',
        data: { id: configId, official: isOfficial ? 'true' : 'false' },
        xhrFields: { responseType: 'blob' },
        async: true,
        success: function(blob, status, xhr) {
            button.html('<i class="icon-docs"></i><span>&nbsp;&nbsp;Generating... 100%</span>');
            const disposition = xhr.getResponseHeader('Content-Disposition');
            const filename = disposition.match(/filename="?([^"]+)"?/)[1];
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
        },
        error: function(xhr, status, error) {
            console.error('Failed to download document:', error);
        },
        complete: function() {
            clearInterval(progressTimer);
            button.enable();
            button.html('<i class="icon-docs"></i><span>&nbsp;&nbsp;Export to Document</span>');
        }
    });
};

class DataflowViewer {

    constructor() {

        this.missions = ['S1', 'S2', 'S3', 'S5P', 'S6'];

        this.missionNames = {
                'S1': 'Sentinel-1',
                'S2': 'Sentinel-2',
                'S3': 'Sentinel-3',
                'S5P': 'Sentinel-5P',
                'S6': 'Sentinel-6'};

        this.groups = ['Products', 'AUX Data', 'MP and FOS files', 'OLQC Reports', 'Removed Products', 'Removed AUX Data', 'Removed MP and FOS files'];

        this.entities = ['PR', 'FOS', 'MP', 'ADG', 'E2E', 'MPC', 'LTA', 'DA', 'EUM', 'EXT', 'RS', 'POD', 'EDRS', 'X-Band'];

        this.columnIndexByKey = {
            'name': 1,
            'payload': 2,
            'level': 3,
            'sensor-mode': 4,
            'type': 5,
            'description': 6,
            'PR': 7,
            'FOS': 8,
            'MP': 9,
            'ADG': 10,
            'E2E': 11,
            'MPC': 12,
            'LTA': 13,
            'DA': 14,
            'EUM': 15,
            'EXT': 16,
            'RS': 17,
            'POD': 18,
            'EDRS': 19,
            'X-Band': 20
        };

        this.columnHeaderByIndex = {
            1: 'Product Type',
            2: 'Payload',
            3: 'Level',
            4: 'Mode',
            5: 'Type',
            6: 'Description',
            7: 'PR',
            8: 'FOS',
            9: 'MP',
            10: 'ADG',
            11: 'E2E',
            12: 'MPC',
            13: 'LTA',
            14: 'DA',
            15: 'EUM',
            16: 'EXT',
            17: 'RS',
            18: 'POD',
            19: 'EDRS',
            20: 'X-Band'
        };

        this.regexDictionary = {
            rangeSyntax: /\[(\d+)\.\.(\d+)\]/g,
            wildcardMany: /\\\*/g,
            wildcardSingle: /\\\?/g
        };

        this.matcherCache = new Map();
        this.notes = [];

        this.productTypes = [];

    }

    init() {
        // Init the version selector panel
        initVersionSelector();

        // Link up the dataflow doc official/unofficial buttons to the exportDocument function above
        this.initDocumentExportButtons();

        // Init the dropdown menus permitting to select the Dataflow configuration
        this.initDataflowConfigurationSelectors();

        // Init the Dataflow table
        this.initDataflowTable();

        // Init hover tooltip for note markers
        this.initNoteTooltip();

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
                    },
                ],
                columnDefs: [
                {
                    targets: [0, 1],
                    visible: false
                }]
            });

            // Customize Excel export button
            this.dataflowTable.buttons().container().appendTo( $('#action-toolbar'));

            let nButtons = this.dataflowTable.buttons().length;
            for (let idx = 0; idx < nButtons; idx++) {
                var expBtn = $('.dt-button').eq(idx);
                expBtn.addClass('btn btn-primary animate-up-2 float-right mr-2');
            }

        } catch(err) {
            console.info('Initializing Dataflow Configuration table class - skipping table creation...')
        }
    }

    initNoteTooltip() {
        if ($('#dataflow-note-tooltip').length === 0) {
            $('body').append('<div id="dataflow-note-tooltip" class="dataflow-note-tooltip" style="display:none;"></div>');
        }

        $(document).off('.dataflowNoteTooltip');

        $(document).on('mouseover.dataflowNoteTooltip mousemove.dataflowNoteTooltip', '.dataflow-note-marker', function (event) {
            var clientX = event.clientX;
            var clientY = event.clientY;
            if ((clientX === undefined || clientY === undefined) && event.originalEvent) {
                clientX = event.originalEvent.clientX;
                clientY = event.originalEvent.clientY;
            }
            dataflowViewer.showNoteTooltip($(this), clientX, clientY);
        });

        $(document).on('click.dataflowNoteTooltip', '.dataflow-note-marker', function (event) {
            event.preventDefault();
            event.stopPropagation();
            dataflowViewer.showNoteTooltip($(this), event.clientX, event.clientY);
        });

        $(document).on('mouseleave.dataflowNoteTooltip', '.dataflow-note-marker', function () {
            dataflowViewer.hideNoteTooltip();
        });

        $(document).on('click.dataflowNoteTooltip', function () {
            dataflowViewer.hideNoteTooltip();
        });
    }

    showNoteTooltip(markerElement, clientX, clientY) {
        var tooltip = $('#dataflow-note-tooltip');
        var notesRaw = markerElement.attr('data-notes') || '';
        var notes = notesRaw ? notesRaw.split('||') : [];

        if (!notes.length) {
            tooltip.hide();
            return;
        }

        var title = notes.length > 1 ? 'Notes' : 'Note';
        var content = '<div class="dataflow-note-tooltip-title">' + title + '</div>';
        if (notes.length > 1) {
            content += '<ul>';
            notes.forEach(function (text) {
                content += '<li>' + dataflowViewer.escapeHtml(text) + '</li>';
            });
            content += '</ul>';
        } else {
            content += '<div>' + this.escapeHtml(notes[0]) + '</div>';
        }

        tooltip.html(content).show();

        var margin = 14;
        var viewportX = typeof clientX === 'number' ? clientX : (markerElement.offset().left - $(window).scrollLeft());
        var viewportY = typeof clientY === 'number' ? clientY : (markerElement.offset().top - $(window).scrollTop());

        var tooltipWidth = tooltip.outerWidth();
        var tooltipHeight = tooltip.outerHeight();
        var windowWidth = $(window).width();
        var windowHeight = $(window).height();

        var left = viewportX + 12;
        var top = viewportY + 14;

        var maxLeft = windowWidth - tooltipWidth - margin;
        var maxTop = windowHeight - tooltipHeight - margin;

        if (left > maxLeft) {
            left = maxLeft;
        }

        // If there is not enough space below the cursor, place the tooltip above it.
        if (top > maxTop) {
            top = viewportY - tooltipHeight - 14;
        }

        tooltip.css({ left: Math.max(margin, left), top: Math.max(margin, top) });
    }

    hideNoteTooltip() {
        $('#dataflow-note-tooltip').hide();
    }

    escapeHtml(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    getMissionKeyFromValue(missionValue) {
        if (!missionValue) {
            return null;
        }
        if (this.missionNames.hasOwnProperty(missionValue)) {
            return missionValue;
        }
        for (var missionKey in this.missionNames) {
            if (this.missionNames[missionKey] === missionValue) {
                return missionKey;
            }
        }
        return null;
    }

    compileMatcher(rawPattern) {
        var pattern = String(rawPattern || '').trim();
        if (!pattern) {
            return function () { return false; };
        }

        if (this.matcherCache.has(pattern)) {
            return this.matcherCache.get(pattern);
        }

        var matcher;
        var regexLiteral = pattern.match(/^\/(.*)\/([gimsuy]*)$/);

        if (regexLiteral) {
            try {
                var compiledLiteral = new RegExp(regexLiteral[1], regexLiteral[2] || 'i');
                matcher = function (candidate) {
                    return compiledLiteral.test(String(candidate || '').trim());
                };
            } catch (err) {
                matcher = function (candidate) {
                    return String(candidate || '').trim() === pattern;
                };
            }
        } else {
            var translated = pattern
                .replace(this.regexDictionary.rangeSyntax, '__RANGE__$1__$2__')
                .replace(/[.+^${}()|[\]\\]/g, '\\$&')
                .replace(this.regexDictionary.wildcardMany, '.*')
                .replace(this.regexDictionary.wildcardSingle, '.')
                .replace(/__RANGE__(\d+)__(\d+)__/g, '[$1-$2]');

            var compiled = new RegExp('^' + translated + '$', 'i');
            matcher = function (candidate) {
                return compiled.test(String(candidate || '').trim());
            };
        }

        this.matcherCache.set(pattern, matcher);
        return matcher;
    }

    isValueMatch(pattern, candidate) {
        var candidateString = String(candidate || '').trim();
        if (!candidateString) {
            return false;
        }

        var patternString = String(pattern || '').trim();
        if (!patternString) {
            return false;
        }

        if (candidateString.toLowerCase() === patternString.toLowerCase()) {
            return true;
        }

        var matcher = this.compileMatcher(patternString);
        return matcher(candidateString);
    }

    isContextMatch(note, selectedMission, selectedConfiguration) {
        if (!note) {
            return false;
        }

        if (note.group && note.group !== selectedConfiguration) {
            return false;
        }

        var matchingCondition = note.matching_condition || {};
        if (!matchingCondition.mission) {
            return true;
        }

        var noteMissionKey = this.getMissionKeyFromValue(matchingCondition.mission);
        return noteMissionKey ? noteMissionKey === selectedMission : matchingCondition.mission === selectedMission;
    }

    isRowMatch(note, productType) {
        var matchingCondition = note.matching_condition || {};

        if (matchingCondition.product_type && !this.isValueMatch(matchingCondition.product_type, productType['name'])) {
            return false;
        }

        if (matchingCondition.level && !this.isValueMatch(matchingCondition.level, productType['level'])) {
            return false;
        }

        if (matchingCondition.instrument && !this.isValueMatch(matchingCondition.instrument, productType['payload'])) {
            return false;
        }

        return true;
    }

    getColumnSelector(note) {
        if (!note || !note.column_selector) {
            return null;
        }

        if (typeof note.column_selector === 'string') {
            return { column: note.column_selector, value: '' };
        }

        if (typeof note.column_selector === 'object') {
            return {
                column: note.column_selector.column || '',
                value: note.column_selector.value || ''
            };
        }

        return null;
    }

    getRelationValue(productType, entityKey) {
        var relationships = productType['entities_relations'] || [];
        var relationValue = '';
        relationships.forEach(function (relation) {
            var relationEntity = relation.split(':')[0];
            if (relationEntity === entityKey) {
                relationValue = relation.split(':')[1] || '';
            }
        });
        return relationValue;
    }

    getColumnRawValue(productType, columnKey) {
        if (columnKey === 'name') return productType['name'];
        if (columnKey === 'payload') return productType['payload'];
        if (columnKey === 'level') return productType['level'];
        if (columnKey === 'sensor-mode') return productType['sensor-mode'];
        if (columnKey === 'type') return productType['type'];
        if (columnKey === 'description') return productType['description'];

        if (this.entities.indexOf(columnKey) >= 0) {
            return this.getRelationValue(productType, columnKey);
        }

        return '';
    }

    getCellNotes(productType, columnKey, selectedMission, selectedConfiguration) {
        var notes = [];
        this.notes.forEach((note) => {
            if (!this.isContextMatch(note, selectedMission, selectedConfiguration)) {
                return;
            }

            if (!this.isRowMatch(note, productType)) {
                return;
            }

            if (note.target_type !== 'cell') {
                return;
            }

            var selector = this.getColumnSelector(note);
            if (!selector || selector.column !== columnKey) {
                return;
            }

            var columnValue = this.getColumnRawValue(productType, columnKey);
            if (!selector.value || this.isValueMatch(selector.value, columnValue)) {
                notes.push(note.text || '');
            }
        });
        return notes.filter(function (text) { return text && text.trim(); });
    }

    getHeaderNotes(columnKey, selectedMission, selectedConfiguration) {
        var notes = [];
        this.notes.forEach((note) => {
            if (!this.isContextMatch(note, selectedMission, selectedConfiguration)) {
                return;
            }

            if (note.target_type !== 'header') {
                return;
            }

            var selector = this.getColumnSelector(note);
            if (selector && selector.column === columnKey && note.text) {
                notes.push(note.text);
            }
        });
        return notes;
    }

    buildMarker(notes) {
        if (!notes || notes.length === 0) {
            return '';
        }

        var symbol = notes.length === 1 ? '*' : '**';
        return '<sup class="dataflow-note-marker" data-notes="' + this.escapeHtml(notes.join('||')) + '">' + symbol + '</sup>';
    }

    applyHeaderNotes(selectedMission, selectedConfiguration) {
        Object.keys(this.columnHeaderByIndex).forEach((columnIndex) => {
            var index = parseInt(columnIndex);
            if (this.dataflowTable.column(index).visible()) {
                var th = this.dataflowTable.column(index).header();
                $(th).text(this.columnHeaderByIndex[index]);
            }
        });

        Object.keys(this.columnIndexByKey).forEach((columnKey) => {
            var index = this.columnIndexByKey[columnKey];
            if (this.dataflowTable.column(index).visible()) {
                var notes = this.getHeaderNotes(columnKey, selectedMission, selectedConfiguration);
                if (notes.length > 0) {
                    var th = this.dataflowTable.column(index).header();
                    $(th).append(this.buildMarker(notes));
                }
            }
        });
    }

    initDocumentExportButtons() {
        const $button = $('#export-dataflow-doc-button');
        $('#export-official').on('click', (e) => {
            e.preventDefault();
            exportDocument($button, true);
        });

        $('#export-unofficial').on('click', (e) => {
            e.preventDefault();
            exportDocument($button, false);
        });
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
        dataflowViewer.notes = graph['footnotes'] != null ? graph['footnotes'] : [];

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
                row.push(this.escapeHtml(pt['name']) + this.buildMarker(this.getCellNotes(pt, 'name', selectedMission, selectedConfiguration)));
                row.push(this.escapeHtml(pt['payload']) + this.buildMarker(this.getCellNotes(pt, 'payload', selectedMission, selectedConfiguration)));
                row.push(this.escapeHtml(pt['level']) + this.buildMarker(this.getCellNotes(pt, 'level', selectedMission, selectedConfiguration)));

                // Add the sensor mode and sensor type for S1 Products dataflow configuration
                if (selectedMission === 'S1' && selectedConfiguration === 'Products') {
                    row.push(this.escapeHtml(pt['sensor-mode']) + this.buildMarker(this.getCellNotes(pt, 'sensor-mode', selectedMission, selectedConfiguration)));
                    row.push(this.escapeHtml(pt['type']) + this.buildMarker(this.getCellNotes(pt, 'type', selectedMission, selectedConfiguration)));
                } else {
                    row.push(' ');
                    row.push(' ');
                }

                // Append the description
                row.push((pt['description'] || '') + this.buildMarker(this.getCellNotes(pt, 'description', selectedMission, selectedConfiguration)));

                // Loop over all GS entities, and set the corresponding relation
                var relations = pt['entities_relations'];
                dataflowViewer.entities.forEach(entity => {
                    var found = false;
                    relations.forEach(relation => {
                        var relationEntity = relation.split(':')[0];
                        var relationship = relation.split(':')[1];
                        if (entity === relationEntity) {
                            var html = relationship.replace(';', '<br>').replace('/', '<br>').trim();
                            html += dataflowViewer.buildMarker(dataflowViewer.getCellNotes(pt, entity, selectedMission, selectedConfiguration));
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

        dataflowViewer.applyHeaderNotes(selectedMission, selectedConfiguration);
    }
}

let dataflowViewer = new DataflowViewer();
