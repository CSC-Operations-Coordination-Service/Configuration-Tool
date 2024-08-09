#!/usr/bin/env python
""" Configuration Tool

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
"""

__author__ = "Coordination Desk Development Team"
__contact__ = "coordination_desk@telespazio.com"
__copyright__ = "Copyright 2024, Telespazio S.p.A."
__license__ = "GPLv3"
__status__ = "Production"
__version__ = "1.0.0"

import json
from datetime import datetime

from flask import Response
from flask import request
from flask_login import login_required
from sqlalchemy import JSON, false

from apps.routes.rest import blueprint
from apps.models.nosql.Graph import Graph
import apps.utils.auth_utils as auth_utils
import apps.utils.db_utils as db_utils
from flask_login import current_user
import apps.models.sql.Fragment as Fragment
import apps.models.sql.Scenario as Scenario
import apps.models.sql.Users as Users
import apps.models.sql.UserRole as UserRole
import pymongo


@blueprint.route('/rest/api/configurations', methods=['GET'])
@login_required
def get_configurations():
    """
    :return:
    :rtype:
    """
    try:

        # Retrieve the available configurations from the Postgres DB, given the user id
        scenarios = Scenario.get_scenarios()

        # Loop over each home, and retrieve from Mongo DB the information about last modifications and versioning
        for i, scenario in enumerate(scenarios):
            id = scenario.id

            # Retrieve the graph
            graph = Graph()
            scen_graph = graph.find({'id': id})
            scen_graph = scen_graph[0]
            scen_graph['last_modify'].strftime("%d/%m/%Y, %H:%M:%S")

            # Add description to Processors configuration
            if scenario.name == 'Interfaces':
                scenario.description = 'The CSC Ground Segment interfaces configuration'
                Scenario.update_scenario(scenario.id, scenario.name, scenario.description, scenario.startDate,
                                         scenario.endDate, scenario.increaseTime, scenario.locked)
            if scenario.name == 'Processors':
                scenario.description = ('The historical and the up-to-date configuration of the releases of the '
                                        'Copernicus Sentinels processors')
                Scenario.update_scenario(scenario.id, scenario.name, scenario.description, scenario.startDate,
                                         scenario.endDate, scenario.increaseTime, scenario.locked)

            # Retrieve versioning history
            ver_graphs = graph.history_find({'id': id},
                                            [('n_ver', pymongo.DESCENDING)])
            tagged_ver = {}
            for i, version in enumerate(ver_graphs):
                if 'tag' in version and version['tag']:
                    tagged_ver = version
                    break

            # Enrich the home object with the additional information about versioning
            scenario.last_modify = scen_graph['last_modify'].strftime("%d/%m/%Y, %H:%M:%S")
            if ver_graphs is not None and len(ver_graphs) > 0:
                scenario.last_commit = ver_graphs[0]['last_modify'].strftime("%d/%m/%Y, %H:%M:%S")
                scenario.comment = ver_graphs[0]['comment']
            if tagged_ver is not None and 'tag' in tagged_ver:
                scenario.last_tag = tagged_ver['tag']

        return Response(json.dumps(scenarios, cls=db_utils.AlchemyEncoder), mimetype="application/json", status=200)

    except Exception as ex:
        return Response(json.dumps({'error': '500'}), mimetype="application/json", status=500)


@blueprint.route('/rest/api/configurations', methods=['POST'])
@login_required
def save_configuration():
    """
    :return:
    :rtype:
    """
    try:
        if not auth_utils.is_user_authorized(['admin']):
            return Response(json.dumps("Not authorized", cls=db_utils.AlchemyEncoder), mimetype="application/json",
                            status=401)
        if request.data != b'':

            # Save the configuration
            body = json.loads(request.data.decode('utf-8'))
            time_step = 1
            start_date = datetime.strptime('01/01/2000 00:00:00', '%d/%m/%Y %H:%M:%S')
            end_date = datetime.strptime('31/12/2099 23:59:59', '%d/%m/%Y %H:%M:%S')
            uuid = Scenario.save_scenario(current_user.id, body['name'], body['description'], start_date,
                                          end_date, time_step)

            # Create a configuration document
            # The ID of the document shall match the configuration UUID
            graph = Graph()
            graph.insert_one({'id': uuid, 'graph':'{}'})

            return Response(json.dumps({'id': uuid}), mimetype="application/json", status=200)
        return Response(json.dumps({'error': '500'}), mimetype="application/json", status=500)

    except Exception as ex:
        return Response(json.dumps({'error': '500'}), mimetype="application/json", status=500)
