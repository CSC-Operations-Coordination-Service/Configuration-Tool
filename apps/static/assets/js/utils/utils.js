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

function ajaxCall(url, method, dictData, callbackSuccess, callbackError){
    if(dictData != null){
        $.ajax({
          url: url,
          type: method,
          contentType: "application/json; charset=utf-8",
          dataType: "json",
          data: JSON.stringify(dictData),
          success: function(response) {
            if ($('#loaderDiv').length){
                $("#loaderDiv").hide();
                $("body *").enable();

            }
            callbackSuccess(response);
          },
          error: function(xhr) {
            if ($('#loaderDiv').length){
                $("#loaderDiv").hide();
                $("body *").enable();
            }
            callbackError(xhr);
          },
          beforeSend: function() {
            if ($('#loaderDiv').length){
                $("#loaderDiv").show();
                $("body *").disable();
            }
          }
        });
    }else{
        $.ajax({
          url: url,
          type: method,
          contentType: "application/json; charset=utf-8",
          dataType: "json",
          success: function(response) {
            if ($('#loaderDiv').length){
                $("#loaderDiv").hide();
                $("body *").enable();

            }
            callbackSuccess(response);
          },
          error: function(xhr) {
            if ($('#loaderDiv').length){
                $("#loaderDiv").hide();
                $("body *").enable();
            }
            callbackError(xhr);
          },
          beforeSend: function() {
            if ($('#loaderDiv').length){
                $("#loaderDiv").show();
                $("body *").disable();
            }
          }
        });
    }
}

function asyncAjaxCall(url, method, dictData, callbackSuccess, callbackError){
    if(dictData != null){
        $.ajax({
          url: url,
          type: method,
          contentType: "application/json; charset=utf-8",
          dataType: "json",
          data: JSON.stringify(dictData),
          async: true,
          success: function(response) {
            if ($('#loaderDiv').length){
                $("#loaderDiv").hide();
                $("body *").enable();
            }
            callbackSuccess(response);
          },
          error: function(xhr) {
            if ($('#loaderDiv').length){
                $("#loaderDiv").hide();
                $("body *").enable();
            }
            callbackError(xhr);
          },
          beforeSend: function() {
            if ($('#loaderDiv').length){
                $("#loaderDiv").show();
                $("body *").disable();
            }
          }
        });
    }else{
       $.ajax({
          url: url,
          type: method,
          contentType: "application/json; charset=utf-8",
          dataType: "json",
          async: true,
          success: function(response) {
            if ($('#loaderDiv').length){
                $("#loaderDiv").hide();
                $("body *").enable();
            }
            callbackSuccess(response);
          },
          error: function(xhr) {
            if ($('#loaderDiv').length){
                $("#loaderDiv").hide();
                $("body *").enable();
            }
            callbackError(xhr);
          },
          beforeSend: function() {
            if ($('#loaderDiv').length){
                $("#loaderDiv").show();
                $("body *").disable();
            }
          }
        });
    }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function convert_string_datetime_python_to_js(date_string){
    var date = date_string.split('/');
    return new Date(date[1]+'/'+date[0]+'/'+date[2]);
}

function formatResponse(response) {
    var rows = response;
    if(!Array.isArray(rows)){
        var arr = [];
        arr.push(rows);
        rows = arr;
    }
    return rows;
}

function formatDate(date) {
    var month = '' + (date.getMonth() + 1);
    var day = '' + date.getDate();
    var year = date.getFullYear();

    if (month.length < 2)
        month = '0' + month;
    if (day.length < 2)
        day = '0' + day;

    return [day, month, year].join('-');
}

function formatDate2(date) {
    month = '' + (date.getMonth() + 1),
    day = '' + date.getDate(),
    year = date.getFullYear();

    if (month.length < 2)
        month = '0' + month;
    if (day.length < 2)
        day = '0' + day;
    return [day, month, year].join('/');
}

function formatDateTime(date) {
    var month = '' + (date.getMonth() + 1);
    var day = '' + date.getDate();
    var year = date.getFullYear();

    if (month.length < 2)
        month = '0' + month;
    if (day.length < 2)
        day = '0' + day;
    var hour = ('' + date.getHours()).padStart(2, '0')
    var minutes = ('' + date.getMinutes()).padStart(2, '0')
    var seconds = ('' + date.getSeconds()).padStart(2, '0')
    dateStr = [day, month, year].join('-');
    timeStr = [hour, minutes, seconds].join(':')
    return dateStr+"T"+timeStr;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

$.fn.disable = function() {
    return this.each(function() {
        if (typeof this.disabled != "undefined") this.disabled = true;
    });
}

$.fn.enable = function() {
    return this.each(function() {
        if (typeof this.disabled != "undefined") this.disabled = false;
    });
}

function uuid() {
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
}

function format_response(response){
    var rows = response;
    if(!Array.isArray(rows)){
      var arr = [];
      arr.push(rows);
      rows = arr;
    }
    return rows;
}

function disableComponentById(id) {
    var comp = document.getElementById(id);
    if (comp != null) {
        comp.readOnly= true;
        comp.disabled = true;
        return true;
    } else {
        return false;
    }
    return true;
}

function disableComponentByName(name) {
    var comp = document.getElementsByName(name);
    if(comp != null){
        comp.forEach((e) => {
            e.readOnly = true;
        });
        return true;
    } else {
        return false;
    }
    return true;
}

function removeComponentById(name) {
    $('#' + name).remove();
}

function removeComponentByName(name) {
    for (var i = 0; i < document.getElementsByName(name).len; i++) {
        parentNode = document.getElementsByName(name)[i].parentNode;
        parentNode.removeChild(document.getElementsByName(name)[i]);
        i--;
    }
}
