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

        this.groups = ['Products', 'AUX Data', 'MP and FOS files', 'OLQC Reports', 'Removed Products', 'Removed AUX Data', 'Removed MP and FOS files'];

        this.noteGroups = ['Products', 'AUX Data', 'MP and FOS files', 'OLQC Reports'];

        this.entities = ['ADG', 'DA', 'E2E', 'EDRS', 'EUM', 'EXT', 'FOS', 'LTA', 'MP', 'MPC', 'POD', 'PR', 'RS', 'X-Band'];

        this.noteColumns = {
            'S1': {
                'Products': [
                    { key: 'name', label: 'Product Type' },
                    { key: 'payload', label: 'Payload' },
                    { key: 'level', label: 'Level' },
                    { key: 'sensor-mode', label: 'Mode' },
                    { key: 'type', label: 'Type' },
                    { key: 'PR', label: 'PR' },
                    { key: 'FOS', label: 'FOS' },
                    { key: 'MPC', label: 'MPC' },
                    { key: 'LTA', label: 'LTA' },
                    { key: 'DA', label: 'DA' },
                    { key: 'POD', label: 'POD' }
                ],
                'AUX Data': [
                    { key: 'name', label: 'Product Type' },
                    { key: 'PR', label: 'PR' },
                    { key: 'FOS', label: 'FOS' },
                    { key: 'MP', label: 'MP' },
                    { key: 'ADG', label: 'ADG' },
                    { key: 'MPC', label: 'MPC' },
                    { key: 'LTA', label: 'LTA' },
                    { key: 'DA', label: 'DA' },
                    { key: 'POD', label: 'POD' },
                    { key: 'X-Band', label: 'X-Band' }
                ],
                'MP and FOS files': [
                    { key: 'name', label: 'Product Type' },
                    { key: 'PR', label: 'PR' },
                    { key: 'FOS', label: 'FOS' },
                    { key: 'MP', label: 'MP' },
                    { key: 'ADG', label: 'ADG' },
                    { key: 'MPC', label: 'MPC' },
                    { key: 'DA', label: 'DA' },
                    { key: 'POD', label: 'POD' },
                    { key: 'EDRS', label: 'EDRS' },
                    { key: 'X-Band', label: 'X-Band' }
                ],
                'OLQC Reports': [
                    { key: 'name', label: 'Product Type' },
                    { key: 'PR', label: 'PR' },
                    { key: 'E2E', label: 'E2E' },
                    { key: 'MPC', label: 'MPC' },
                    { key: 'LTA', label: 'LTA' },
                    { key: 'DA', label: 'DA' }
                ]
            },
            'S2': {
                'Products': [
                    { key: 'name', label: 'Product Type' },
                    { key: 'payload', label: 'Payload' },
                    { key: 'level', label: 'Level' },
                    { key: 'PR', label: 'PR' },
                    { key: 'FOS', label: 'FOS' },
                    { key: 'MPC', label: 'MPC' },
                    { key: 'LTA', label: 'LTA' },
                    { key: 'DA', label: 'DA' },
                    { key: 'POD', label: 'POD' }
                ],
                'AUX Data': [
                    { key: 'name', label: 'Product Type' },
                    { key: 'PR', label: 'PR' },
                    { key: 'FOS', label: 'FOS' },
                    { key: 'MP', label: 'MP' },
                    { key: 'ADG', label: 'ADG' },
                    { key: 'MPC', label: 'MPC' },
                    { key: 'LTA', label: 'LTA' },
                    { key: 'DA', label: 'DA' },
                    { key: 'POD', label: 'POD' },
                    { key: 'X-Band', label: 'X-Band' }
                ],
                'MP and FOS files': [
                    { key: 'name', label: 'Product Type' },
                    { key: 'PR', label: 'PR' },
                    { key: 'FOS', label: 'FOS' },
                    { key: 'MP', label: 'MP' },
                    { key: 'ADG', label: 'ADG' },
                    { key: 'MPC', label: 'MPC' },
                    { key: 'DA', label: 'DA' },
                    { key: 'POD', label: 'POD' }
                ],
                'OLQC Reports': [
                    { key: 'name', label: 'Product Type' },
                    { key: 'PR', label: 'PR' },
                    { key: 'E2E', label: 'E2E' },
                    { key: 'MPC', label: 'MPC' },
                    { key: 'LTA', label: 'LTA' },
                    { key: 'DA', label: 'DA' }
                ]
            },
            'S3': {
                'Products': [
                    { key: 'name', label: 'Product Type' },
                    { key: 'payload', label: 'Payload' },
                    { key: 'level', label: 'Level' },
                    { key: 'sensor-mode', label: 'Mode' },
                    { key: 'type', label: 'Type' },
                    { key: 'PR', label: 'PR' },
                    { key: 'FOS', label: 'FOS' },
                    { key: 'MPC', label: 'MPC' },
                    { key: 'LTA', label: 'LTA' },
                    { key: 'DA', label: 'DA' },
                    { key: 'POD', label: 'POD' }
                ],
                'AUX Data': [
                    { key: 'name', label: 'Product Type' },
                    { key: 'PR', label: 'PR' },
                    { key: 'FOS', label: 'FOS' },
                    { key: 'MP', label: 'MP' },
                    { key: 'ADG', label: 'ADG' },
                    { key: 'MPC', label: 'MPC' },
                    { key: 'LTA', label: 'LTA' },
                    { key: 'DA', label: 'DA' },
                    { key: 'POD', label: 'POD' },
                    { key: 'X-Band', label: 'X-Band' }
                ],
                'MP and FOS files': [
                    { key: 'name', label: 'Product Type' },
                    { key: 'PR', label: 'PR' },
                    { key: 'FOS', label: 'FOS' },
                    { key: 'MP', label: 'MP' },
                    { key: 'ADG', label: 'ADG' },
                    { key: 'MPC', label: 'MPC' },
                    { key: 'DA', label: 'DA' },
                    { key: 'POD', label: 'POD' },
                    { key: 'EDRS', label: 'EDRS' },
                    { key: 'X-Band', label: 'X-Band' }
                ],
                'OLQC Reports': [
                    { key: 'name', label: 'Product Type' },
                    { key: 'PR', label: 'PR' },
                    { key: 'E2E', label: 'E2E' },
                    { key: 'MPC', label: 'MPC' },
                    { key: 'LTA', label: 'LTA' },
                    { key: 'DA', label: 'DA' }
                ]
            },
            'S5P': {
                'Products': [
                    { key: 'name', label: 'Product Type' },
                    { key: 'payload', label: 'Payload' },
                    { key: 'level', label: 'Level' },
                    { key: 'type', label: 'Type' },
                    { key: 'PR', label: 'PR' },
                    { key: 'FOS', label: 'FOS' },
                    { key: 'MPC', label: 'MPC' },
                    { key: 'LTA', label: 'LTA' },
                    { key: 'DA', label: 'DA' },
                    { key: 'POD', label: 'POD' }
                ],
                'AUX Data': [
                    { key: 'name', label: 'Product Type' },
                    { key: 'PR', label: 'PR' },
                    { key: 'FOS', label: 'FOS' },
                    { key: 'MP', label: 'MP' },
                    { key: 'ADG', label: 'ADG' },
                    { key: 'MPC', label: 'MPC' },
                    { key: 'LTA', label: 'LTA' },
                    { key: 'DA', label: 'DA' },
                    { key: 'POD', label: 'POD' },
                    { key: 'X-Band', label: 'X-Band' }
                ],
                'MP and FOS files': [
                    { key: 'name', label: 'Product Type' },
                    { key: 'PR', label: 'PR' },
                    { key: 'FOS', label: 'FOS' },
                    { key: 'MP', label: 'MP' },
                    { key: 'ADG', label: 'ADG' },
                    { key: 'MPC', label: 'MPC' },
                    { key: 'DA', label: 'DA' },
                    { key: 'POD', label: 'POD' },
                    { key: 'EDRS', label: 'EDRS' },
                    { key: 'X-Band', label: 'X-Band' }
                ],
                'OLQC Reports': [
                    { key: 'name', label: 'Product Type' },
                    { key: 'PR', label: 'PR' },
                    { key: 'E2E', label: 'E2E' },
                    { key: 'MPC', label: 'MPC' },
                    { key: 'LTA', label: 'LTA' },
                    { key: 'DA', label: 'DA' }
                ]
            },
            'S6': {
                'Products': [
                    { key: 'name', label: 'Product Type' },
                    { key: 'payload', label: 'Payload' },
                    { key: 'level', label: 'Level' },
                    { key: 'type', label: 'Type' },
                    { key: 'PR', label: 'PR' },
                    { key: 'FOS', label: 'FOS' },
                    { key: 'MPC', label: 'MPC' },
                    { key: 'LTA', label: 'LTA' },
                    { key: 'DA', label: 'DA' },
                    { key: 'POD', label: 'POD' }
                ],
                'AUX Data': [
                    { key: 'name', label: 'Product Type' },
                    { key: 'PR', label: 'PR' },
                    { key: 'FOS', label: 'FOS' },
                    { key: 'MP', label: 'MP' },
                    { key: 'ADG', label: 'ADG' },
                    { key: 'MPC', label: 'MPC' },
                    { key: 'LTA', label: 'LTA' },
                    { key: 'DA', label: 'DA' },
                    { key: 'POD', label: 'POD' },
                    { key: 'X-Band', label: 'X-Band' }
                ],
                'MP and FOS files': [
                    { key: 'name', label: 'Product Type' },
                    { key: 'PR', label: 'PR' },
                    { key: 'FOS', label: 'FOS' },
                    { key: 'MP', label: 'MP' },
                    { key: 'ADG', label: 'ADG' },
                    { key: 'MPC', label: 'MPC' },
                    { key: 'DA', label: 'DA' },
                    { key: 'POD', label: 'POD' },
                    { key: 'EDRS', label: 'EDRS' },
                    { key: 'X-Band', label: 'X-Band' }
                ],
                'OLQC Reports': [
                    { key: 'name', label: 'Product Type' },
                    { key: 'PR', label: 'PR' },
                    { key: 'E2E', label: 'E2E' },
                    { key: 'MPC', label: 'MPC' },
                    { key: 'LTA', label: 'LTA' },
                    { key: 'DA', label: 'DA' }
                ]
            }
        };

        this.defaultNoteColumns = [
            { key: 'name', label: 'Product Type' },
            { key: 'payload', label: 'Payload' },
            { key: 'level', label: 'Level' },
            { key: 'sensor-mode', label: 'Mode' },
            { key: 'type', label: 'Type' }
        ].concat(this.entities.map(entity => ({ key: entity, label: entity })));

        this.productTypes = [];
        this.notes = [];

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

        // Init the Notes panel and actions
        this.initNotesPanel();

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
                rowId: function(data) {
                    var id = 'id_' + data[0];
                    const text = data[1].toString();
                    for (var i = 0; i < text.length; i++) {
                        id = id + text.charCodeAt(i).toString();
                    }
                    return id;
                },
                columnDefs: [
                {
                    targets: -1,
                    data: null,
                    render: function (data, type, full, meta) {
                        if (type === 'display') {
                            var id = 'id_' + data[0];
                            const text = data[1].toString();
                            for (var i = 0; i < text.length; i++) {
                                id = id + text.charCodeAt(i).toString();
                            }
                            let actions =
                                '<div class="form-button-action">' +
                                    '<button name="delete-relation" type="button" title="" class="btn btn-link btn-danger" ' +
                                          'onclick="dataflowEditor.deleteEntityRelation(\'#' + id + '\');"><i class="fas fa-trash"></i>' +
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

    initNotesPanel() {
        $('#dataflow-add-note-btn').on('click', function () {
            dataflowEditor.openNoteEditor();
        });

        
        $('#dataflow-note-save-btn').on('click', function () {
            dataflowEditor.saveNote();
        });

        $('#dataflow-note-cancel-btn').on('click', function () {
            dataflowEditor.closeNoteEditor();
        });

        $('#dataflow-note-target-type').on('change', function () {
            dataflowEditor.toggleNoteTargetType($(this).val());
            dataflowEditor.updateNoteColumns();
            dataflowEditor.updateNoteValueControl();
        });

        $('#dataflow-note-group').on('change', function () {
            dataflowEditor.updateNoteColumns();
            dataflowEditor.updateNoteValueControl();
        });

        $('#dataflow-note-column-selector, #dataflow-note-header').on('change', function () {
            dataflowEditor.updateNoteValueControl();
        });

        $('#dataflow-note-matching-mission').on('change', function () {
            dataflowEditor.updateNoteMissionFields($(this).val());
            dataflowEditor.updateNoteColumns();
            dataflowEditor.updateNoteValueControl();
        });
    }

    openNoteEditor(note) {
        var matchingCondition = note ? (note.matching_condition || {}) : {};
        var missionValue = this.getMissionLabel(matchingCondition.mission || 'S1');
        var selectedGroup = note && note.group ? note.group : 'Products';
        var selectedColumn = '';
        var selectedValue = '';
        var isEditing = !!note;

        if (note) {
            $('#dataflow-note-id').val(note.id);
            $('#dataflow-note-target-type').val(note.target_type);
            $('#dataflow-note-matching-product-type').val(matchingCondition.product_type || '');
            $('#dataflow-note-matching-mission').val(missionValue);
            $('#dataflow-note-group').val(selectedGroup);
            $('#dataflow-note-text').val(note.text || '');

            if (note.column_selector && typeof note.column_selector === 'object') {
                selectedColumn = note.column_selector.column || '';
                selectedValue = note.column_selector.value || '';
            } else {
                selectedColumn = note.column_selector || '';
            }
        } else {
            $('#dataflow-note-id').val('');
            $('#dataflow-note-target-type').val('cell');
            $('#dataflow-note-matching-product-type').val('');
            $('#dataflow-note-matching-mission').val('Sentinel-1');
            $('#dataflow-note-group').val('Products');
            $('#dataflow-note-text').val('');
        }

        this.toggleNoteTargetType($('#dataflow-note-target-type').val());
        this.updateNoteMissionFields($('#dataflow-note-matching-mission').val());
        this.updateNoteColumns();
        $('#dataflow-note-header').val(selectedColumn);
        $('#dataflow-note-column-selector').val(selectedColumn);
        this.updateNoteValueControl(selectedValue);
        $('#dataflow-note-matching-level').val(matchingCondition.level || '');
        $('#dataflow-note-matching-instrument').val(matchingCondition.instrument || '');

        $('#dataflow-note-matching-mission').prop('disabled', isEditing);
        $('#dataflow-note-target-type').prop('disabled', isEditing);
        $('#dataflow-note-group').prop('disabled', isEditing);
        $('#dataflow-note-header').prop('disabled', isEditing);
        $('#dataflow-note-column-selector').prop('disabled', isEditing);
        $('#dataflow-note-value').prop('disabled', isEditing);
        $('#dataflow-note-value-select').prop('disabled', isEditing);
        $('#dataflow-note-matching-product-type').prop('disabled', isEditing);
        $('#dataflow-note-matching-level').prop('disabled', isEditing);
        $('#dataflow-note-matching-instrument').prop('disabled', isEditing);
        $('#dataflow-note-text').prop('disabled', false);

        $('#dataflow-note-form').show();
    }

    closeNoteEditor() {
        $('#dataflow-note-form').hide();
        $('#dataflow-note-id').val('');
        $('#dataflow-note-matching-mission').prop('disabled', false);
        $('#dataflow-note-target-type').prop('disabled', false);
        $('#dataflow-note-group').prop('disabled', false);
        $('#dataflow-note-header').prop('disabled', false);
        $('#dataflow-note-column-selector').prop('disabled', false);
        $('#dataflow-note-value').prop('disabled', false);
        $('#dataflow-note-value-select').prop('disabled', false);
        $('#dataflow-note-matching-product-type').prop('disabled', false);
        $('#dataflow-note-matching-level').prop('disabled', false);
        $('#dataflow-note-matching-instrument').prop('disabled', false);
        $('#dataflow-note-text').prop('disabled', false);
    }

    getCurrentConfigId() {
        var url = new URL(window.location);
        return url.searchParams.get('id');
    }

    buildNotePayload() {
        var targetType = $('#dataflow-note-target-type').val();
        var selectedColumn = targetType === 'header'
            ? $('#dataflow-note-header').val()?.trim()
            : $('#dataflow-note-column-selector').val()?.trim();
        var selectedValue = targetType === 'header'
            ? ''
            : ($('#dataflow-note-value-select').is(':visible')
                ? $('#dataflow-note-value-select').val()?.trim()
                : $('#dataflow-note-value').val()?.trim());

        return {
            id: $('#dataflow-note-id').val() || undefined,
            target_type: targetType,
            group: $('#dataflow-note-group').val(),
            column_selector: targetType === 'header'
                ? selectedColumn
                : {
                    column: selectedColumn,
                    value: selectedValue
                },
            matching_condition: {
                mission: $('#dataflow-note-matching-mission').val()?.trim() || ''
            },
            text: $('#dataflow-note-text').val()?.trim() || ''
        };
    }


    toggleNoteTargetType(targetType) {
        if (targetType === 'header') {
            $('#dataflow-note-header-container').removeClass('d-none');
            $('#dataflow-note-column-selector-container').addClass('d-none');
        } else {
            $('#dataflow-note-header-container').addClass('d-none');
            $('#dataflow-note-column-selector-container').removeClass('d-none');
        }
    }

    getMissionKeyFromName(name) {
        if (!name) {
            return null;
        }

        // Accept either the mission key (S1) or the full mission label.
        if (this.missionNames.hasOwnProperty(name)) {
            return name;
        }

        for (var missionKey in this.missionNames) {
            if (this.missionNames[missionKey] === name) {
                return missionKey;
            }
        }
        return null;
    }

    getMissionLabel(nameOrKey) {
        if (!nameOrKey) {
            return this.missionNames['S1'];
        }
        if (this.missionNames.hasOwnProperty(nameOrKey)) {
            return this.missionNames[nameOrKey];
        }
        for (var missionKey in this.missionNames) {
            if (this.missionNames[missionKey] === nameOrKey) {
                return nameOrKey;
            }
        }
        return this.missionNames['S1'];
    }

    getNoteColumns(missionKey, group) {
        if (this.noteColumns.hasOwnProperty(missionKey) && this.noteColumns[missionKey].hasOwnProperty(group)) {
            return this.noteColumns[missionKey][group];
        }
        return this.defaultNoteColumns;
    }

    getNoteColumnLabel(column) {
        switch (column) {
            case 'name': return 'Product type';
            case 'payload': return 'Payload';
            case 'level': return 'Level';
            case 'sensor-mode': return 'Mode';
            case 'type': return 'Type';
            default: return column;
        }
    }

    getNoteValueOptions(missionKey, column) {
        if (column === 'payload') {
            return this.payloadsTree[missionKey] || [];
        }
        if (column === 'level') {
            return this.levelsTree[missionKey] || [];
        }
        return [];
    }

    updateNoteColumns() {
        var missionKey = this.getMissionKeyFromName($('#dataflow-note-matching-mission').val()) || 'S1';
        var group = $('#dataflow-note-group').val() || 'Products';
        var columns = this.getNoteColumns(missionKey, group);
        var selectedColumn = $('#dataflow-note-target-type').val() === 'header'
            ? $('#dataflow-note-header').val()
            : $('#dataflow-note-column-selector').val();

        var updateOptions = function (selectElement) {
            selectElement.find('option').remove().end();
            selectElement.append($('<option>', { value: '', text: 'Select column' }));
            columns.forEach(function (item) {
                selectElement.append($('<option>', { value: item.key, text: item.label }));
            });
            if (selectedColumn) {
                selectElement.val(selectedColumn);
            }
        };

        updateOptions($('#dataflow-note-header'));
        updateOptions($('#dataflow-note-column-selector'));
    }

    updateNoteValueControl(existingValue) {
        var targetType = $('#dataflow-note-target-type').val();
        if (targetType === 'header') {
            $('#dataflow-note-value-container').hide();
            $('#dataflow-note-value').val('');
            $('#dataflow-note-value-select').hide().empty();
            return;
        }

        var selectedColumn = $('#dataflow-note-column-selector').val();
        var valueContainer = $('#dataflow-note-value-container');

        if (!selectedColumn) {
            valueContainer.hide();
            $('#dataflow-note-value').val('');
            $('#dataflow-note-value-select').hide().empty();
            return;
        }

        var missionKey = this.getMissionKeyFromName($('#dataflow-note-matching-mission').val()) || 'S1';
        var options = this.getNoteValueOptions(missionKey, selectedColumn);
        var label = this.getNoteColumnLabel(selectedColumn);
        $('#dataflow-note-value-label').text(label);

        if (options.length > 0) {
            var valueSelect = $('#dataflow-note-value-select');
            valueSelect.find('option').remove().end();
            valueSelect.append($('<option>', { value: '', text: 'Select ' + label }));
            options.forEach(function (optionValue) {
                valueSelect.append($('<option>', { value: optionValue, text: optionValue }));
            });
            if (existingValue) {
                valueSelect.val(existingValue);
            }
            $('#dataflow-note-value').hide().val('');
            valueSelect.show();
        } else {
            $('#dataflow-note-value-select').hide().empty();
            $('#dataflow-note-value').show().val(existingValue || '');
        }

        valueContainer.show();
    }

    updateNoteMissionFields(missionName) {
        var missionKey = this.getMissionKeyFromName(missionName) || 'S1';
        var instrumentSelect = $('#dataflow-note-matching-instrument');
        var levelSelect = $('#dataflow-note-matching-level');

        instrumentSelect.find('option').remove().end();
        instrumentSelect.append($('<option>', { value: '', text: 'Any' }));
        (this.payloadsTree[missionKey] || []).forEach(function (instrument) {
            instrumentSelect.append($('<option>', { value: instrument, text: instrument }));
        });

        levelSelect.find('option').remove().end();
        levelSelect.append($('<option>', { value: '', text: 'Any' }));
        (this.levelsTree[missionKey] || []).forEach(function (level) {
            levelSelect.append($('<option>', { value: level, text: level }));
        });
    }

    saveNote() {
        var note = this.buildNotePayload();
        var configId = this.getCurrentConfigId();

        if (!note.text) {
            alert('Note text is required.');
            return;
        }
        if (!note.group) {
            alert('Note group is required.');
            return;
        }
        if (!note.column_selector || (typeof note.column_selector === 'object' && !note.column_selector.column) || (typeof note.column_selector === 'string' && note.column_selector.trim() === '')) {
            alert('A column/header selection is required.');
            return;
        }
        if (note.target_type !== 'header' && (!note.column_selector.value || note.column_selector.value.trim() === '')) {
            alert('A value is required for the selected column.');
            return;
        }

        var url = '/rest/api/dataflow/' + configId + '/footnotes';
        var method = 'POST';
        if ($('#dataflow-note-id').val()) {
            url += '/' + $('#dataflow-note-id').val();
            method = 'PUT';
        }

        ajaxCall(url, method, note, function (response) {
            dataflowEditor.closeNoteEditor();
            dataflowEditor.loadFootnotes();
        }, function (response) {
            console.error('Unable to save note', response);
            alert('Unable to save note.');
        });
    }

    deleteNote(noteId) {
        if (!confirm('Are you sure you want to delete this note?')) {
            return;
        }
        var configId = this.getCurrentConfigId();
        var url = '/rest/api/dataflow/' + configId + '/footnotes/' + noteId;
        ajaxCall(url, 'DELETE', {}, function (response) {
            dataflowEditor.loadFootnotes();
        }, function (response) {
            console.error('Unable to delete note', response);
            alert('Unable to delete note.');
        });
    }

    editNote(noteId) {
        var note = null;
        dataflowEditor.notes.forEach(function (existing) {
            if (existing.id === noteId) {
                note = existing;
            }
        });
        if (note) {
            dataflowEditor.openNoteEditor(note);
        }
    }

    renderNotes() {
        var tbody = $('#dataflow-notes-tbody');
        tbody.empty();

        if (!this.notes || this.notes.length === 0) {
            tbody.append('<tr id="dataflow-note-empty-row"><td colspan="4" class="text-center text-muted py-4">No notes added yet</td></tr>');
            $('#dataflow-note-count').text('0');
            return;
        }

        this.notes.forEach(function (note, index) {
            var targetLabel = note.target_type === 'header' ? 'Header' : 'Cell';
            var targetColumnKey = '—';
            var targetValue = '';
            if (note.column_selector) {
                if (typeof note.column_selector === 'string') {
                    targetColumnKey = note.column_selector;
                } else if (typeof note.column_selector === 'object' && note.column_selector.column) {
                    targetColumnKey = note.column_selector.column;
                    targetValue = note.column_selector.value || '';
                }
            }
            var targetColumn = targetColumnKey === '—' ? '—' : dataflowEditor.getNoteColumnLabel(targetColumnKey);
            var target = targetLabel + ' / ' + targetColumn;
            if (note.target_type !== 'header' && targetValue) {
                target += ' / ' + targetValue;
            }
            var match = [];
            if (note.matching_condition) {
                if (note.matching_condition.product_type) match.push(note.matching_condition.product_type);
                if (note.matching_condition.mission) match.push(note.matching_condition.mission);
                if (note.matching_condition.level) match.push(note.matching_condition.level);
                if (note.matching_condition.instrument) match.push(note.matching_condition.instrument);
            }
            var matchingText = match.length ? match.join(' | ') : 'All';
            var row = '<tr>' +
                '<td>' + (index + 1) + '</td>' +
                '<td><strong>' + target + '</strong><br><small>' + matchingText + '</small></td>' +
                '<td>' + note.text + '</td>' +
                '<td><div class="form-button-action">' +
                    '<button name="edit-note" type="button" title="" class="btn btn-link" onclick="dataflowEditor.editNote(\'' + note.id + '\');">' +
                        '<i class="fa fa-edit"></i>' +
                    '</button>' +
                    '<button name="delete-note" type="button" title="" class="btn btn-link btn-danger" onclick="dataflowEditor.deleteNote(\'' + note.id + '\');">' +
                        '<i class="fas fa-trash"></i>' +
                    '</button>' +
                '</div>' +
                '</td>' +
            '</tr>';
            tbody.append(row);
        });
        $('#dataflow-note-count').text(this.notes.length.toString());
    }

    loadFootnotes() {
        var configId = this.getCurrentConfigId();
        var url = '/rest/api/dataflow/' + configId + '/footnotes';
        ajaxCall(url, 'GET', {}, function (response) {
            dataflowEditor.notes = response || [];
            dataflowEditor.renderNotes();
        }, function (response) {
            console.error('Unable to load notes', response);
            dataflowEditor.notes = [];
            dataflowEditor.renderNotes();
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

        // Load the table notes for this configuration
        dataflowEditor.loadFootnotes();
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
