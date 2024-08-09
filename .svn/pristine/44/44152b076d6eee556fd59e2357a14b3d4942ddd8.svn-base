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
import time

import pymongo
from flask import Response
from flask import request
from flask_login import login_required

import apps.utils.auth_utils as auth_utils
import apps.utils.db_utils as db_utils
from apps.models.nosql.Graph import Graph
from apps.routes.rest.processors import blueprint


@blueprint.route('/rest/api/processors-releases/<config_id>', methods=['GET'])
@login_required
def get_processors_releases(config_id):
    try:
        graph = Graph()
        scen_graph = graph.find({'id': config_id})
        scen_graph = scen_graph[0]
        return Response(json.dumps(scen_graph, cls=db_utils.AlchemyEncoder), mimetype="application/json", status=200)
    except Exception as ex:
        return Response(json.dumps({'error': '500'}), mimetype="application/json", status=500)


@blueprint.route('/rest/api/processors-releases', methods=['POST'])
@login_required
def add_processor_release():
    """
    :return:
    :rtype:
    """
    try:
        if not auth_utils.is_user_authorized(['admin']):
            return Response(json.dumps("Not authorized", cls=db_utils.AlchemyEncoder), mimetype="application/json",
                            status=401)
        body = None
        if request.data != b'':
            body = json.loads(request.data.decode('utf-8'))
        else:
            return Response(json.dumps({'error': '500'}), mimetype="application/json", status=500)

        if body is None or len(body) == 0:
            return Response(json.dumps({'error': '500'}), mimetype="application/json", status=500)

        graph = Graph()
        scen_graph = graph.find({'id': body['config_id']})
        scen_graph = scen_graph[0]

        json_data = json.loads(scen_graph['graph'])

        if 'processors_releases' not in json_data:
            json_data['processors_releases'] = []

        json_data['processors_releases'].append({
            'id': db_utils.generate_uuid(),
            'mission': body['mission'],
            'satellite_units': body['satellite_units'],
            'target_ipfs': body['target_ipfs'],
            'processing_baseline': body['processing_baseline'],
            'release_date': body['release_date'],
            'validity_start_date': body['validity_start_date'],
            'validity_end_date': body['validity_end_date'],
            'release_notes': body['release_notes']
        })

        updated_graph_string = json.dumps(json_data)
        scen_graph['graph'] = updated_graph_string
        result = graph.update_one({'id': body['config_id']}, scen_graph)

        if result is None:
            return Response(json.dumps({'error': '500'}), mimetype="application/json", status=500)

        return Response(json.dumps(scen_graph, cls=db_utils.AlchemyEncoder), mimetype="application/json", status=200)

    except Exception as ex:
        return Response(json.dumps({'error': '500'}), mimetype="application/json", status=500)


@blueprint.route('/rest/api/processors-releases', methods=['PUT'])
@login_required
def update_processor_release():
    """
    :return:
    :rtype:
    """
    try:
        if not auth_utils.is_user_authorized(['admin']):
            return Response(json.dumps("Not authorized", cls=db_utils.AlchemyEncoder), mimetype="application/json",
                            status=401)
        body = None
        if request.data != b'':
            body = json.loads(request.data.decode('utf-8'))
        else:
            return Response(json.dumps({'error': '500'}), mimetype="application/json", status=500)

        if body is None or len(body) == 0:
            return Response(json.dumps({'error': '500'}), mimetype="application/json", status=500)

        graph = Graph()
        scen_graph = graph.find({'id': body['config_id']})
        scen_graph = scen_graph[0]

        json_data = json.loads(scen_graph['graph'])

        for index, processor in enumerate(json_data['processors_releases']):
            if processor['id'] == body['id']:
                processor['mission'] = body['mission']
                processor['satellite_units'] = body['satellite_units']
                processor['target_ipfs'] = body['target_ipfs']
                processor['processing_baseline'] = body['processing_baseline']
                processor['release_date'] = body['release_date']
                processor['validity_start_date'] = body['validity_start_date']
                processor['validity_end_date'] = body['validity_end_date']
                processor['release_notes'] = body['release_notes']

        updated_graph_string = json.dumps(json_data)
        scen_graph['graph'] = updated_graph_string
        result = graph.update_one({'id': body['config_id']}, scen_graph)

        if result is None:
            return Response(json.dumps({'error': '500'}), mimetype="application/json", status=500)

        return Response(json.dumps(scen_graph, cls=db_utils.AlchemyEncoder), mimetype="application/json", status=200)

    except Exception as ex:
        return Response(json.dumps({'error': '500'}), mimetype="application/json", status=500)


@blueprint.route('/rest/api/processors-releases', methods=['DELETE'])
@login_required
def delete_processor_release():
    """
    :return:
    :rtype:
    """
    try:
        if not auth_utils.is_user_authorized(['admin']):
            return Response(json.dumps("Not authorized", cls=db_utils.AlchemyEncoder), mimetype="application/json",
                            status=401)
        body = None
        if request.data != b'':
            body = json.loads(request.data.decode('utf-8'))
        else:
            return Response(json.dumps({'error': '500'}), mimetype="application/json", status=500)

        if body is None or len(body) == 0:
            return Response(json.dumps({'error': '500'}), mimetype="application/json", status=500)

        graph = Graph()
        scen_graph = graph.find({'id': body['config_id']})
        scen_graph = scen_graph[0]

        json_data = json.loads(scen_graph['graph'])

        for index, processor in enumerate(json_data['processors_releases']):
            if processor['id'] == body['processor_release_id']:
                json_data['processors_releases'].remove(processor);

        updated_graph_string = json.dumps(json_data)
        scen_graph['graph'] = updated_graph_string
        result = graph.update_one({'id': body['config_id']}, scen_graph)

        if result is None:
            return Response(json.dumps({'error': '500'}), mimetype="application/json", status=500)

        return Response(json.dumps(result, cls=db_utils.AlchemyEncoder), mimetype="application/json", status=200)

    except Exception as ex:
        return Response(json.dumps({'error': '500'}), mimetype="application/json", status=500)