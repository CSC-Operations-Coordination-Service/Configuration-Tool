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

import pymongo
from bson import ObjectId
from flask import Response
from flask import request
from flask_login import current_user
from flask_login import login_required

import apps.models.sql.Scenario as Scenario
import apps.utils.auth_utils as auth_utils
import apps.utils.db_utils as db_utils
from apps.models.nosql.Graph import Graph
from apps.routes.rest import blueprint


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

            # Retrieve the graph
            id = scenario.id
            graph = Graph()
            scen_graph = graph.find({'id': id})
            scen_graph = scen_graph[0]
            scen_graph['last_modify'].strftime("%d/%m/%Y, %H:%M:%S")

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

    # Check the profile authorizations
    if not auth_utils.is_user_authorized(['admin']):
        return Response(json.dumps("Not authorized", cls=db_utils.AlchemyEncoder), mimetype="application/json",
                        status=401)

    try:

        # Check if the payload body can be parsed; if so, save the provided configuration
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
            graph.insert_one({'id': uuid, 'graph': '{}'})
            return Response(json.dumps({'id': uuid}), mimetype="application/json", status=200)

        # In the event that the payload body cannot be parsed, return a generic server error
        return Response(json.dumps({'error': '500'}), mimetype="application/json", status=500)

    except Exception as ex:
        return Response(json.dumps({'error': '500'}), mimetype="application/json", status=500)


@blueprint.route('/rest/api/configurations', methods=['DELETE'])
@login_required
def delete_configuration():
    """
    :return:
    :rtype:
    """
    try:

        # Check the profile authorizations
        if not auth_utils.is_user_authorized(['admin']):
            return Response(json.dumps("Not authorized", cls=db_utils.AlchemyEncoder), mimetype="application/json",
                            status=401)

        # Check if the payload body can be parsed; if so, save the provided configuration
        if request.data != b'':

            # Delete the configuration and the related versions
            body = json.loads(request.data.decode('utf-8'))
            config_id = body['configId']
            graph = Graph()
            graph.delete_many({'id': config_id})
            Scenario.delete_scenario(config_id)
            return Response(json.dumps({'status': '200'}), mimetype="application/json", status=200)

        # In the event that the payload body cannot be parsed, return a generic server error
        return Response(json.dumps({'error': '500'}), mimetype="application/json", status=500)

    except Exception as ex:
        return Response(json.dumps({'error': '500'}), mimetype="application/json", status=500)


@blueprint.route('/rest/api/configurations/commit/<config_id>', methods=['GET'])
@login_required
def commit_by_config_id(config_id):
    """
    :return:
    :rtype:
    """

    try:

        # Retrieve the configuration versions
        graph = Graph()
        ver_graphs = graph.history_find({'id': config_id},
                                        [('last_modify', pymongo.DESCENDING), ('tag', pymongo.ASCENDING),
                                         ('n_ver', pymongo.ASCENDING)])

        if ver_graphs is None:
            return Response(json.dumps([], cls=db_utils.AlchemyEncoder), mimetype="application/json", status=200)
        elif len(ver_graphs) == 0:
            return Response(json.dumps(ver_graphs, cls=db_utils.AlchemyEncoder), mimetype="application/json", status=200)

        for i, version in enumerate(ver_graphs):
            version['last_modify'] = version['last_modify'].strftime("%d/%m/%Y, %H:%M:%S")
        return Response(json.dumps(ver_graphs, cls=db_utils.AlchemyEncoder), mimetype="application/json", status=200)

    except Exception as ex:
        return Response(json.dumps({'error': '500'}), mimetype="application/json", status=500)


@blueprint.route('/rest/api/configurations/commit/<config_id>/<n_ver>', methods=['GET'])
@login_required
def commit_by_config_id_and_n_ver(config_id, n_ver):
    """
    :return:
    :rtype:
    """

    try:

        # Retrieve the specified configuration version
        graph = Graph()
        n_ver = int(n_ver)
        ver_graphs = graph.history_find({'$and': [{'id': config_id}, {'n_ver': n_ver}]},
                                        [('last_modify', pymongo.DESCENDING), ('n_ver', pymongo.ASCENDING)])

        if ver_graphs is None:
            return Response(json.dumps([], cls=db_utils.AlchemyEncoder), mimetype="application/json", status=200)
        elif len(ver_graphs) == 0:
            return Response(json.dumps(ver_graphs, cls=db_utils.AlchemyEncoder), mimetype="application/json", status=200)

        for i, version in enumerate(ver_graphs):
            version['last_modify'] = version['last_modify'].strftime("%d/%m/%Y, %H:%M:%S")
        return Response(json.dumps(ver_graphs, cls=db_utils.AlchemyEncoder), mimetype="application/json", status=200)

    except Exception as ex:
        return Response(json.dumps({'error': '500'}), mimetype="application/json", status=500)


@blueprint.route('/rest/api/configurations/commit/<config_id>/<tag>', methods=['GET'])
@login_required
def commit_by_config_id_and_tag(config_id, tag):
    """
    :return:
    :rtype:
    """

    try:

        # Retrieve the specified tag
        graph = Graph()
        ver_graphs = graph.history_find({'$and': [{'id': config_id}, {'tag': tag.upper()}]},
                                        [('last_modify', pymongo.DESCENDING), ('n_ver', pymongo.ASCENDING)])

        if ver_graphs is None:
            return Response(json.dumps([], cls=db_utils.AlchemyEncoder), mimetype="application/json", status=200)
        elif len(ver_graphs) == 0:
            return Response(json.dumps(ver_graphs, cls=db_utils.AlchemyEncoder), mimetype="application/json", status=200)

        for i, version in enumerate(ver_graphs):
            version['last_modify'] = version['last_modify'].strftime("%d/%m/%Y, %H:%M:%S")
        return Response(json.dumps(ver_graphs, cls=db_utils.AlchemyEncoder), mimetype="application/json", status=200)

    except Exception as ex:
        return Response(json.dumps({'error': '500'}), mimetype="application/json", status=500)


@blueprint.route('/rest/api/configurations/commit', methods=['POST'])
@login_required
def commit_configuration():

    # Check the profile authorizations
    if not auth_utils.is_user_authorized(['admin']):
        return Response(json.dumps("Not authorized", cls=db_utils.AlchemyEncoder), mimetype="application/json",
                        status=401)

    try:

        # Check if the body payload can be parsed; if not return a generic server error
        body = None
        if request.data != b'':
            body = json.loads(request.data.decode('utf-8'))
        else:
            return Response(json.dumps({'error': '500'}), mimetype="application/json", status=500)

        if body is None or len(body) == 0:
            return Response(json.dumps({'error': '500'}), mimetype="application/json", status=500)

        # Commit the provided configuration
        graph = Graph()
        versioned_obj = graph.versioning(body['idScenario'], body['tag'], body.get('comment', ''))
        if versioned_obj is None:
            return Response(json.dumps({'error': '500'}), mimetype="application/json", status=500)
        return Response(json.dumps(versioned_obj, cls=db_utils.AlchemyEncoder), mimetype="application/json", status=200)

    except Exception as ex:
        return Response(json.dumps({'error': '500'}), mimetype="application/json", status=500)


@blueprint.route('/rest/api/configurations/commit', methods=['DELETE'])
@login_required
def delete_commit_by_config_id_and_n_ver():
    """
    :return:
    :rtype:
    """

    # Check the profile authorizations
    if not auth_utils.is_user_authorized(['admin']):
        return Response(json.dumps("Not authorized", cls=db_utils.AlchemyEncoder), mimetype="application/json",
                        status=401)

    try:

        # Check if the payload body can be parsed; if so, delete the specified version
        if request.data != b'':

            # Delete the specified configuration version
            body = json.loads(request.data.decode('utf-8'))
            n_ver = int(body['revId'])
            config_id = body['configId']
            graph = Graph()
            result = graph.history_delete_one({"$and": [{"id": config_id}, {"n_ver": n_ver}]})
            return Response(json.dumps(result, cls=db_utils.AlchemyEncoder), mimetype="application/json", status=200)

        # In the event that the payload body cannot be parsed, return a generic server error
        return Response(json.dumps({'error': '500'}), mimetype="application/json", status=500)

    except Exception as ex:
        return Response(json.dumps({'error': '500'}), mimetype="application/json", status=500)