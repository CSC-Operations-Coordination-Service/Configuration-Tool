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

class Dashboard {

    constructor() {

        // Declaration of the start / end dates of the displayed data
        this.start_date = null;
        this.end_date = null;

        // Declaration of the scenario start / end dates
        this.scenario_start_date = null;
        this.scenario_end_date = null;

        // Declaration of the time step of the current scenario
        this.increaseTime = 1;

        // Declaration of cache for multi tab variables in pop up
        this.comparativeChartIndexArray = new Array();
    }

    init() {

        // Retrieve scenario id
        var url = new URL(window.location);
        var idScenario = url.searchParams.get('id');

        // Update the sidebar, by adding the additional paths for scenario
        this.updateSidebar(idScenario);

        // Retrieve the scenario with the given id, and initialize the dashboard properties
        ajaxCall('/rest/scenario/'+idScenario, 'GET', {}, this.successLoadScenarioStartEndDate,
                this.errorLoadScenarioStartEndDate);

        // Retrieve scenario views
        asyncAjaxCall('/rest/get_chart_views_by_id_scenario/'+idScenario, 'GET', {}, this.successLoadDashboardViews,
                this.errorLoadDashboardViews);

        return;
    }

    updateSidebar(idScenario) {
        let path = window.location.href;
        let activeEditor = path.toUpperCase().includes('EDITOR') ? ' active ' : '';
        let activeDashboard = path.toUpperCase().includes('DASHBOARD') ? ' active ' : '';
        let active = path.toUpperCase().includes('SCENARIO') || path.toUpperCase().includes('EDITOR')
              || path.toUpperCase().includes('DASHBOARD') ? ' active ' : '';
        let show = path.toUpperCase().includes('SCENARIO') || path.toUpperCase().includes('EDITOR')
              || path.toUpperCase().includes('DASHBOARD') ? ' show ' : '';
        $('#custom-scenario-paths').remove();
        $('#sidebar-navigation-menu').append(
              '<li class="nav-item' + active + '" id="custom-scenario-paths">' +
                  '<a data-toggle="collapse" href="#scenario">' +
                      '<i class="fas fa-cubes"></i>' +
                      '<p>Configuration</p>' +
                      '<span class="caret"></span>' +
                  '</a>' +
                  '<div class="collapse' + show + '" id="scenario">' +
                      '<ul class="nav nav-collapse">' +
                          '<li class="' + activeEditor + '">' +
                              '<a href="/scenario-editor.html?id=' + idScenario + '">' +
                                  '<span class="sub-item">Editor</span>' +
                              '</a>' +
                          '</li>' +
                          '<li class="' + activeDashboard + '">' +
                              '<a href="/dashboard.html?id=' + idScenario + '">' +
                                  '<span class="sub-item">Dashboard</span>' +
                              '</a>' +
                          '</li>' +
                      '</ul>' +
                  '</div>' +
              '</li>');
    }

    successLoadScenarioStartEndDate(response){

        // If no response is retrieved, return
        if (response == null) { return; }

        // Fill the scenario label
        $('#dashboard-scenario-id').html('Scenario: ' + response.name);

        // Init the date ranges
        dashboard.scenario_start_date = convert_string_datetime_python_to_js(response.startDate);
        dashboard.scenario_end_date = convert_string_datetime_python_to_js(response.endDate);
        dashboard.start_date = dashboard.scenario_start_date;
        dashboard.end_date = dashboard.scenario_end_date;
        dashboard.increaseTime = response.increaseTime;

        // Initialize the date time range picker accordingly
        $(function() {
            $('input[name="chart-daterange"]').daterangepicker({
                timePicker: false,
                startDate: formatDate2(dashboard.start_date),
                endDate: formatDate2(dashboard.end_date),
                locale: {
                  format: 'DD/MM/YYYY'
                }},
                function(start, end) {
                    var url = new URL(window.location);
                    var idScenario = url.searchParams.get('id');
                    dashboard.start_date = start.toDate();
                    dashboard.end_date = end.toDate();
                    console.info('Modified date range')
                    asyncAjaxCall('/rest/get_charts_by_id_scenario/'+idScenario+'/'+$('#dashboard-view-select').val(),
                            'GET', {}, dashboard.successLoadChartElements, dashboard.successLoadChartElements);
                });
        });

        return;
    }

    errorLoadScenarioStartEndDate(response){
        console.error('Unable to load scenario properties');
    }

    successLoadDashboardViews(response) {

        // Empty the dashboard view drop-down menus
        // and the views table in the Views configuration panel
        $('#dashboard-view-select').empty();
        $('#dashboard_element_view_select').empty();

        // Collect the dashboard views
        var rows = response;
        if(!Array.isArray(rows)){
          var arr = [];
          arr.push(rows);
          rows = arr;
        }

        // Iterate over the views in the response, and add them
        // to each widget in the Dashboard page
        var tableRows = new Array();
        for (var i = 0 ; i < rows.length ; i++) {
          dashboard.appendView(rows[i]);
          var tableRow = new Array();
          tableRow.push(rows[i]['id']);
          tableRow.push(rows[i]['name']);
          tableRows.push(tableRow);
        }

        // Create the Dashboard view configuration table
        if (dashboard.viewTable == null) {
            dashboard.viewTable = $('#datatables-view').DataTable({
            "language": {
              "emptyTable": "Retrieving views..."
            },
            "sDom": "rtp",
            "createdRow": function(row, data, dataIndex) {
                    $(row).find('td').eq(0).height(28);
                    $(row).find('td').eq(1).height(28);
                    $(row).find('td').eq(2).height(28);
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
                            var status = '';
                            var id = full[0];
                            let actions =
                                '<div class="form-button-action">' +
                                    '<button '+status+' type="button" title="" class="btn btn-link"'+
                                        'onclick="dashboard.updateDashboardView(\''+id+'\');"><i class="fa fa-edit"></i>'+
                                    '</button>'+
                                    '<button '+status+' type="button" title="" class="btn btn-link btn-danger"'+
                                        'onclick="dashboard.deleteDashboardView(\''+id+'\');"><i class="fas fa-trash"></i>'+
                                    '</button>'+
                                '</div>'
                            return actions;
                        } else {
                            return data;
                        }
                    }
                }]
            });
        }

        // Append the views in the Views config popup panel
        dashboard.viewTable.clear().rows.add(tableRows).draw();
        dashboard.viewTable.columns.adjust().draw();

        // Invoke the retrieval of the charts in the first view - if available
        if (tableRows[0] != null) {
            var url = new URL(window.location);
            var idScenario = url.searchParams.get('id');
            asyncAjaxCall('/rest/get_charts_by_id_scenario/' + idScenario + '/' + tableRows[0][1], 'GET', {},
                    dashboard.successLoadChartElements, dashboard.successLoadChartElements);
        }
    }

    errorLoadDashboardViews(response) {
        console.error('Unable to load the Dashboard views');
    }

    successLoadChartElements(response) {

        // Remove any previously displayed chart
        $('#dashboard-canvas').empty();

        // Add the new charts
        for (var i = 0 ; i < response.charts.length ; ++i){

            // Retrieve charts from response
            var chart = response.charts[i].chart;

            // Set the chart type and the size
            var size = chart.size;
            var type = chart.type;
            var name = chart.name;
            var isComparative = chart.isComparative;
            var uid = chart.id; //Date.now().toString(36) + Math.random().toString(36).substring(2);

            // Set the size of the new chart, expressed in the form of number of columns
            // small: 1 col; medium: 2 cols; large: 3 cols.
            let small = 'col-12 col-xl-4 mb-4';
            let medium = 'col-12 col-xl-8 mb-4';
            let large = 'col-12 mb-4';

            if (size.includes('small')) size = small;
            else if (size.includes('medium')) size = medium;
            else size = large;

            // Collect the series to be displayed
            var var_series = new Array(response.charts[i].variables.length);
            var name_series = new Array(response.charts[i].variables.length);
            var units_series = new Array(response.charts[i].variables.length);
            for (var k= 0 ; k < response.charts[i].variables.length ; ++k){
                var_series[k] = (response.charts[i].variables[k].result).replace('[', '').replace(']', '').split(',').map(Number);
                name_series[k] = response.charts[i].variables[k].name;
                units_series[k] = response.charts[i].variables[k].units;
            }

            // Add the retrieved chart
            dashboard.appendChart(uid, name, size, type, var_series, name_series, units_series, isComparative);

        }

        return;
    }

    errorLoadChartElements(response) {
        console.error('Unable to load chart elements');
    }

    appendChart(uid, name, size, type, var_series, name_series, units_series, isComparative) {

        // Global chart options
        let chartHeight = 460;

        // Set the chart timeline, according to the time range selected
        // in the top-header date range picker
        var chart_time = [];
        var end = new Date(dashboard.end_date.getTime());
        var begin = new Date(dashboard.start_date.getTime());

        // Build an array of dates for X-axis values
        var startIndex = 0;
        for(; begin.getTime() <= end.getTime(); begin.setDate(begin.getDate() + dashboard.increaseTime)) {
            if (begin.getTime() < dashboard.start_date.getTime()) {

                // Skip dates, until the current date is greater than the beginning of the selected time range
                startIndex += 1;

            } else {

                // Append the date labels (until the current date is smaller than the selected time range end date
                chart_time.push(begin.getDate()+"/"+(begin.getMonth()+1)+"/"+begin.getFullYear());
            }
        }

        // Slice variables, so to select only values falling within the selected time range
        var var_series_slice = new Array(var_series.length);
        for (var i= 0 ; i < var_series.length; ++i){
            var_series_slice[i] = var_series[i].slice(startIndex + 1, startIndex + chart_time.length + 1);
        }

        // Sub-sample data
        var index_step = Math.floor((chart_time.length + 9) / 10);
        console.info("Sampled data size: " + index_step);

        // Add the new chart to the Dashboard div, with id "ct-custom-chart",
        // followed by uid
        $('#dashboard-canvas').append(
            '<div id="'+uid+'" class="' + size + '">'+
                '<div class="col-12 px-0">'+
                    '<div class="card border-0 shadow">'+
                        '<div class="card-header d-flex flex-row align-items-center flex-0 border-bottom">'+
                            '<div class="d-block">'+
                                '<div class="h6 fw-normal text-gray mb-2">'+type+' Chart</div>'+
                                '<h2 class="h3 fw-extrabold">'+name+'</h2>'+
                                '<div class="small mt-2">'+
                                    '<span class="text-success fw-bold">'+units_series[0]+'</span>'+
                                '</div>'+
                            '</div>'+
                            '<div class="d-block ms-auto ml-3">'+
                                '<div class="input-group-append">' +
                                    '<button type="button" class="btn btn-primary btn-border dropdown-toggle" data-toggle="dropdown" aria-expanded="false"">' +
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-three-dots-vertical" viewBox="0 0 16 16">' +
                                            '<path d="M9.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/>' +
                                        '</svg>' +
                                    '</button>' +
                                    '<div class="dropdown-menu">' +
                                        '<a class="dropdown-item rounded-top" href="#" onclick="dashboard.downloadChartElement(\''+uid+'\', '+isComparative+');">' +
                                            '<img class="navbar-brand-light" src="/static/assets/img/icons/download.png" alt="Volt logo" />' +
                                            'Download data table'+
                                        '</a>' +
                                        '<a class="dropdown-item rounded-top" href="#" onclick="dashboard.downloadReport(\''+uid+'\', '+isComparative+')">' +
                                            '<img class="navbar-brand-light" src="/static/assets/img/icons/document-signed.svg" alt="Volt logo" />' +
                                            'Download report'+
                                        '</a>' +
                                        '<a class="dropdown-item rounded-top" href="#" onclick="dashboard.modifyChart(\''+uid+'\', '+isComparative+')">' +
                                            '<img class="navbar-brand-light" src="/static/assets/img/icons/settings_black_24dp.svg" alt="Volt logo" />' +
                                            'Edit chart'+
                                        '</a>' +
                                        '<a class="dropdown-item rounded-top" href="#" onclick="dashboard.deleteChartElement(\''+uid+'\', '+isComparative+');">' +
                                            '<img class="navbar-brand-light" src="/static/assets/img/icons/delete_black_24dp.svg" alt="Volt logo" />' +
                                            'Delete chart'+
                                        '</a>' +
                                    '</div>' +
                                '</div>' +
                                '<div class="ct-legend"></div>'+
                            '</div>' +
                        '</div>'+
                        '<div class="card-body p-2">'+
                            '<div class="ct-chart ct-custom-chart-'+uid+'">'+
                            '</div>'+
                        '</div>'+
                    '</div>'+
                '</div>'+
                '<div class="col-12 px-0">'+
                    '<div class="card border-0 shadow">'+
                    '</div>'+
                '<div class="col-12 px-0">'+
            '</div>'+
        '</div>');

        // Create a new chart, with the specified characteristics.
        if (type.includes('Line')) {

            // Draw a standard line chart
            new Chartist.Line('.ct-custom-chart-'+uid, {
              labels: chart_time,
              series: var_series_slice
            }, {
                height: chartHeight,
                showArea: true,
                fullWidth: true,
                chartPadding: {
                    right: 40
                },
                axisY: {
                    offset: 80
                },
                axisX: {
                    labelInterpolationFnc(value, index) {
                    return index % index_step === 0 ? value : null;
                    }
                },
                plugins: [
                    Chartist.plugins.legend({
                        legendNames: name_series,
                    })
                ]
            });
        } else if(type.includes('Bar')) {

            // Draw a bar chart
            new Chartist.Bar('.ct-custom-chart-'+uid, {
              labels: chart_time,
              series: var_series_slice
            }, {
                height: chartHeight,
                axisY: {
                    offset: 80
                },
                axisX: {
                    labelInterpolationFnc(value, index) {
                    return index % index_step === 0 ? value : null;
                    }
                },
                plugins: [
                    Chartist.plugins.legend({
                        legendNames: name_series,
                    })
                ]
            });
        } else if(type.includes('Stacked bar')) {

            // Draw a stacked bar chart
            new Chartist.Bar('.ct-custom-chart-'+uid, {
              labels: chart_time,
              series: var_series_slice
            }, {
                stackBars: true,
                height: chartHeight,
                axisY: {
                    offset: 80
                },
                axisX: {
                    labelInterpolationFnc(value, index) {
                    return index % index_step === 0 ? value : null;
                    }
                },
                plugins: [
                    Chartist.plugins.legend({
                        legendNames: name_series,
                    })
                ]
            });
        } else {

            // Draw a badge
            $('.ct-custom-chart-'+uid).append(
                 '<div class="d-none d-sm-block mb-3"> <h2 class="h5" style="text-align: center">' + var_series[0][0] + '</h2>' +
                 '</div>');
        }

        // Close modal dialog
        $("#add-new-chart-modal").modal('hide');

        return
    }

    changeView(selectedObject) {

        // Retrieve scenario id
        var url = new URL(window.location);
        var idScenario = url.searchParams.get('id');

        // Get the currently selected value
        var selectedView = selectedObject.value;

        // Log an acknowledgement message
        console.info('Switching view to: ' + selectedView);

        // Retrieve scenario charts
        asyncAjaxCall('/rest/get_charts_by_id_scenario/'+idScenario+'/'+selectedView, 'GET', {}, this.successLoadChartElements,
                this.errorLoadChartElements);
    }

    saveDashboardView() {

        // Retrieve scenario Id from URL
        var url = new URL(window.location);
        var idScenario = url.searchParams.get('id');

        // Build POST message body
        var body = {};
        body['idScenario'] = idScenario;
        body['id'] = $('#view_editor').data('id');
        body['name'] = $('#view_name_input').val();
        body['description'] = '';
        ajaxCall('/rest/save_chart_view', 'POST', body, this.successSaveDashboardView, this.errorSaveDashboardView);
        return
    }

    successSaveDashboardView(response) {

        // Cleanup dashboard view editing fields
        $('#view_editor').data('id','');
        $('#view_name_input').val('');

        // If the parameter already exists, update the existing
        // row with the updated values in the param table
        // Views Table
        if ($('#'+response.id).length) {
            $('#'+response.id+' td:eq(0)').text(response.name);
            return ;
        }

        // Update the dropdown menus as well
        if ($('#'+response.id+'-dropdown1').length) {
            $('#'+response.id+'-dropdown1'+' td:eq(0)').text(response.name);
            return ;
        }
        if ($('#'+response.id+'-dropdown2').length) {
            $('#'+response.id+'-dropdown2'+' td:eq(0)').text(response.name);
            return ;
        }

        // Otherwise, append the new row to the parameter table and to the dropdown menus
        dashboard.appendView(response);
        dashboard.reloadDashboardViews();
    }

    errorSaveDashboardView(response) {
        console.error('Unable to save the specified Dashboard view');
    }

    updateDashboardView(idView) {

        // Retrieve the current value of the dashboard to edit from table row
        var name = $('#'+idView+' td:eq(0)').text();

        // Populate parameter editing fields
        $('#view_editor').data('id', idView);
        $('#view_name_input').val(name);
    }

    deleteDashboardView(idView) {
    console.info('Removing view...');
        ajaxCall('/rest/delete_chart_view_by_id/'+idView, 'DELETE', {}, this.successDeleteDashboardView,
                this.errorDeleteDashboardView);
    }

    successDeleteDashboardView(response) {

        // Remove the view from the Views config table
        $('#'+response.id).remove();

        // Remove the view from the dropdown menus
        $('#'+response.id+'-dropdown1').remove();
        $('#'+response.id+'-dropdown2').remove();

        // Force reloading of dashboard views
        dashboard.reloadDashboardViews();
    }

    errorDeleteDashboardView(response) {
        console.error('Unable to delete the selected Dashboard view');
    }

    reloadDashboardViews() {

        // Retrieve scenario id
        var url = new URL(window.location);
        var idScenario = url.searchParams.get('id');

        // Retrieve scenario views
        asyncAjaxCall('/rest/get_chart_views_by_id_scenario/'+idScenario, 'GET', {}, this.successLoadDashboardViews,
                this.errorLoadDashboardViews);
    }

    appendView(response) {

        // Auxiliary variable declaration
        var id = response.id;
        var name = response.name;
        var status = ((response.name == 'Default') ? 'disabled' : '');

        // Append the views in the drop-down menus. To have a unique identifier,
        // the suffix "-dropdown1" and "-dropdown2" were appended to the id
        $('#dashboard-view-select').append('<option id="'+id+'-dropdown1'+'" value="'+name+'">'+name+'</option>');
        $('#dashboard_element_view_select').append('<option id="'+id+'-dropdown2'+'" value="'+name+'">'+name+'</option>');
    }

    downloadAllChart() {
        var element = document.getElementById("dashboard-view-select");
        var idElement = $('#dashboard-view-select :selected').attr('id').replace('-dropdown1','');
        window.location.href = '/rest/download_export_all_data_chart/'+idElement+'/'+formatDate(dashboard.start_date)+'/'+formatDate(dashboard.end_date);
        return;
    }

    loadDashboardVariables(isComparative) {

        // Cleanup any previous selected option
        $('#dashboard_element_chart_scalar_units').val('');
        $('#dashboard_element_chart_scalar').val('');
        $('#dashboard_variable_button_save').html('Add chart');
        $('#chart_name_input').val('');
        $('#dashboard_element_chart_id').val('')

        // Initialize the dashboard variables table
        if (dashboard.variablesTable == null) {
            dashboard.variablesTable = $('#datatables-dashboard-variables').DataTable({
            "language": {
              "emptyTable": "Retrieving variables..."
            },
            "sDom": "frtp",
            "createdRow": function(row, data, dataIndex) {
                    $(row).find('td').eq(0).height(30);
                    $(row).find('td').eq(1).height(30);
                    $(row).find('td').eq(3).height(30);
            },
            columnDefs: [
                {
                    targets: 0,
                    visible: false
                },
                {
                    targets: 1,
                    data: null,
                    render: function (data, type, full, meta) {
                        if (type === 'display') {
                            var status = '';
                            var id = full[0];
                            let actions =
                                '<div class="form-button-action">' +
                                    '<input type="checkbox" onclick="dashboard.checkComparativeChartIndexArray(\'' + id + '\');" id="' + id + '" value="' + id +'"/></td>' +
                                '</div>'
                            return actions;
                        } else {
                            return data;
                        }
                    }
                }]
            });
        }

        // Retrieve scenario id
        var url = new URL(window.location);
        var idScenario = url.searchParams.get('id');
        document.getElementById("dashboard_element_chart_is_comparative").value = isComparative;

        if (isComparative) {

            // Retrieve the variable list in the all user's scenario
            ajaxCall('/rest/variable_updated', 'GET', {}, this.successShowDashboardVariablesPanel,
                    this.errorShowDashboardVariablesPanel);

        } else {

            // Retrieve the variable list in the scenario
            ajaxCall('/rest/variable_updated/'+idScenario, 'GET', {}, this.successShowDashboardVariablesPanel,
                    this.errorShowDashboardVariablesPanel);

        }
        return;
    }

    successShowDashboardVariablesPanel(response) {

        // Fill the variables table
        var rows = response;
        if(!Array.isArray(rows)){
            var arr = [];
            arr.push(rows);
            rows = arr;
        }

        // Build the variables rows
        var tableRows = new Array();
        for (var i = 0; i < rows.length; ++i) {
            var tableRow = new Array();
            tableRow.push(rows[i]['id']);
            tableRow.push(rows[i]['id']);
            tableRow.push(rows[i]['name']);
            tableRows.push(tableRow);
        }

        // Append the variables in the variables table
        dashboard.variablesTable.clear().rows.add(tableRows).draw();
        dashboard.variablesTable.columns.adjust().draw();
        return;
    }

    errorShowDashboardVariablesPanel(response) {
        console.error('Unable to load the scenario variables');
    }

    addNewChartElement() {
        var selected = new Array();
        $('#datatables-dashboard-variables input[type="checkbox"]:checked').each(function() {
            selected.push($(this).attr('id'));
        });

        if (dashboard.comparativeChartIndexArray.length == 0){
            return;
        }

        //Retry the ids from cache
        var length = dashboard.comparativeChartIndexArray.length;
        var ids = new Array(length);
        for (var i = 0; i < length; ++i){
            ids[i] = dashboard.comparativeChartIndexArray[i];
        }
        dashboard.comparativeChartIndexArray = new Array();

        var isComparative = document.getElementById('dashboard_element_chart_is_comparative').value;
        ajaxCall('/rest/get_variable_by_ids', 'POST', {'ids': ids, 'isComparative': isComparative},
                this.successAddNewChartElement, this.errorAddNewChartElement);
        return;
    }

    successAddNewChartElement(response) {

        // Set the chart name, type and the size
        var name = $('#chart_name_input').val();
        var size = $('#dashboard_element_size').find(":selected").val();
        var type = $('#dashboard_element_type').find(":selected").val();
        var view = $('#dashboard_element_view_select').find(":selected").val();
        var uid = $('#dashboard_element_chart_id').val();
        var scalar = $('#dashboard_element_chart_scalar').val();
        var units = $('#dashboard_element_chart_scalar_units').val();
        var isComparative = $('#dashboard_element_chart_is_comparative').val();

        if(uid != null && uid.length > 0){
            $('#'+uid).remove();
        }

        $('#dashboard_element_chart_id').val('');
        if (scalar == null || scalar.length == 0 || isNaN(parseFloat(scalar))) {
            scalar = 1.;
        } else {
            scalar = parseFloat(scalar);
        }

        if (units == null || units.length == 0) {
            units = null;
        }

        // Reset the text input of chart name and close window
        $('#chart_name_input').val('');

        var url = new URL(window.location);
        var idScenario = url.searchParams.get('id');
        var ids = new Array(response.length)
        for (var i= 0 ; i < response.length ; ++i) {
            ids[i] = response[i].id;
        }

        // Log an acknowledgement message
        console.info('Adding chart: ' + name + '; size: ' + view + '; type: ' + type + '; view: ' + view);

        // Assign random id to chart
        if(uid == null || uid.length == 0){uid = Date.now().toString(36) + Math.random().toString(36).substring(2);}

        asyncAjaxCall('/rest/save_charts_by_id_scenario', 'POST', {'idScenario': idScenario, 'ids': ids, 'size':size,
            'type':type, 'uid':uid, 'name':name, 'nameChartView':view, 'isComparative':isComparative },
            dashboard.successAddChartElement, dashboard.errorAddChartElement);

        // Set the size of the new chart, expressed in the form of number of columns
        // small: 1 col; medium: 2 cols; large: 3 cols.
        let small = 'col-12 col-xl-4 mb-4';
        let medium = 'col-12 col-xl-8 mb-4';
        let large = 'col-12 mb-4';

        if (size.includes('small')) size = small;
        else if (size.includes('medium')) size = medium;
        else size = large;

        // Collect the series to be displayed
        var var_series = new Array(response.length);
        var name_series = new Array(response.length);
        var units_series = new Array(response.length);
        for (var i= 0 ; i < response.length ; ++i) {
            var_series[i] = (response[i].result).replace('[', '').replace(']', '').split(',').map(Number);
            name_series[i] = response[i].name;
            units_series[i] = units != null ? units : response[i].units;
            for (var j=0 ; j < var_series[i].length ; ++j) {
                var_series[i][j] *= scalar;
            }
        }

        // Add the new chart, if the currently selected view matches the one
        // chosen for the new chart
        var currentView = $('#dashboard-view-select').find(":selected").val();
        if (view == currentView) {
          dashboard.appendChart(uid, name, size, type, var_series, name_series, units_series, isComparative);
        }
    }

    errorAddNewChartElement(response) {
        console.error('Unable to add new chart element');
    }

    successAddChartElement() {
        console.info('Chart successfully added');
    }

    errorAddChartElement() {
        console.info('Unable to add new chart');
    }

    deleteChartElement(idElement) {
        asyncAjaxCall('/rest/delete_charts_by_id_scenario/'+idElement, 'DELETE', null, this.successDeleteChartElement,
                this.errorDeleteChartElement);
        return;
    }

    successDeleteChartElement(response){
        $('#'+response.id).remove();
        return;
    }

    errorDeleteChartElement(response){
        console.error('Unable to delete the specified chart element');
    }

    downloadChartElement(idElement, isComparative){
        window.location.href = '/rest/download_export_data_chart/'+idElement+'/'+formatDate(dashboard.start_date)+'/'+formatDate(dashboard.end_date)+'/'+isComparative;
        return;
    }

    downloadReport(id, isComparative) {

        // Retrieve scenario id
        var url = new URL(window.location);
        var scenario_id = url.searchParams.get('id');

        // Build the URL to download the report
        var delta = document.getElementById('chart-daterange').value;
        const date = delta.split(' - ');
        const start_date = date[0].replaceAll('/', '-');
        const end_date = date[1].replaceAll('/', '-');
        window.location.href = '/rest/download_table_chart/'+scenario_id+'/'+id+'/'+start_date+'/'+end_date+'/'+isComparative;
        return;
    }

    modifyChart(id, isComparative){
        dashboard.loadDashboardVariables(isComparative);
        sleep(2000).then(() => { ajaxCall('/rest/get_chart_by_id/'+id, 'GET', null, this.successModifyChartElement,
                this.errorModifyChartElement); });
        return;
    }

    successModifyChartElement(response) {

        $('#dashboard_element_chart_id').val(response.id);
        $('#chart_name_input').val(response.name);
        $('#dashboard_variable_button_save').html('Save');
        document.getElementById("dashboard_element_size_"+response.size.replaceAll(' ','_')).selected = true;
        document.getElementById("dashboard_element_type_"+response.type.replaceAll(' ','_')).selected = true;
        document.getElementById(response.idChartView+'-dropdown2').selected = true;
        document.getElementById('dashboard_element_chart_is_comparative').value=response.isComparative;
        var idJsonVariables = response.idJsonVariables.split(',');
        for (var i = 0 ; i < idJsonVariables.length ; ++i){

            //TODO: set selected variables in table
        }
        $("#add-new-chart-modal").modal('show');
        return;
    }

    errorModifyChartElement(response) {
        console.error('Unable to modify the selected chart');
    }

    checkComparativeChartIndexArray(id) {
        var length = dashboard.comparativeChartIndexArray.length;
        for (var i = 0;i < length; ++i){
            //Check if the i th element is id
            if(dashboard.comparativeChartIndexArray[i] == id){
                //Remove the id from array
                dashboard.comparativeChartIndexArray = dashboard.comparativeChartIndexArray.slice(i);
                return;
            }
        }
        //Add the id from array
        dashboard.comparativeChartIndexArray.push(id);
        return
    }
}

let dashboard = new Dashboard();