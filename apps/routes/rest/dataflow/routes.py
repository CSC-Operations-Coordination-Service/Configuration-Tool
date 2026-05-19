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

from flask import Response
from flask import request
from flask_login import login_required

import apps.utils.auth_utils as auth_utils
import apps.utils.db_utils as db_utils

from apps.models.nosql.Graph import Graph
from apps.routes.rest.dataflow import blueprint
from apps.utils.word_document_generator import (
    write_products_to_empty_dataflow_doc, CURRENT_DATAFLOW_DOC_VERSION, WordGenerator
)


@blueprint.route('/rest/api/dataflow/<config_id>', methods=['GET'])
@login_required
def get_dataflow(config_id):
    try:
        graph = Graph()
        scen_graph = graph.find({'id': config_id})
        scen_graph = scen_graph[0]
        return Response(json.dumps(scen_graph, cls=db_utils.AlchemyEncoder), mimetype="application/json", status=200)
    except Exception as ex:
        return Response(json.dumps({'error': '500'}), mimetype="application/json", status=500)


def _generate_dataflow_doc_name():
    """Generate Dataflow document name"""
    from datetime import datetime

    doc_name = (
        "ESA-EOPG-EOPGC-TN-58 - CSC– ESA Operations Framework – Data Flow "
        "Configuration - v{}_{}.docx".format(
            CURRENT_DATAFLOW_DOC_VERSION,
            datetime.now().strftime("%d/%m/%Y")
        )
    )

    return doc_name

@blueprint.route('/rest/api/dataflow/document/<config_id>', methods=['GET'])
@login_required
def create_dataflow_doc(config_id):
    import io
    from flask import send_file

    try:
        graph = Graph()
        scen_graph = graph.find({'id': config_id})
        json_objs = json.loads(scen_graph[0]['graph'])['product_types']

        doc = write_products_to_empty_dataflow_doc(json_objs)

        # save to in-memory buffer (no temp file needed)
        buffer = io.BytesIO()
        doc.document.save(buffer)
        buffer.seek(0)

        return send_file(
            buffer,
            as_attachment=True,
            download_name=_generate_dataflow_doc_name(),
            mimetype='application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        )
    except Exception as err:
        return Response(json.dumps({'error': '500', 'message': err}), mimetype="application/json", status=500)


@blueprint.route('/rest/api/dataflow', methods=['POST'])
@login_required
def add_product_type():
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

        if 'product_types' not in json_data:
            json_data['product_types'] = []

        json_data['product_types'].append({
            'id': db_utils.generate_uuid(),
            'mission': body['mission'],
            'group': body['group'],
            'name': body['name'],
            'payload': body['payload'],
            'level': body['level'],
            'sensor-mode': body['sensor-mode'],
            'type': body['type'],
            'description': body['description'],
            'entities_relations': body['entities_relations']
        })

        updated_graph_string = json.dumps(json_data)
        scen_graph['graph'] = updated_graph_string
        result = graph.update_one({'id': body['config_id']}, scen_graph)

        if result is None:
            return Response(json.dumps({'error': '500'}), mimetype="application/json", status=500)

        return Response(json.dumps(scen_graph, cls=db_utils.AlchemyEncoder), mimetype="application/json", status=200)

    except Exception as ex:
        return Response(json.dumps({'error': '500'}), mimetype="application/json", status=500)


@blueprint.route('/rest/api/dataflow', methods=['PUT'])
@login_required
def update_product_type():
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

        for index, product_type in enumerate(json_data['product_types']):
            if product_type['id'] == body['id']:
                product_type['mission'] = body['mission']
                product_type['group'] = body['group']
                product_type['name'] = body['name']
                product_type['payload'] = body['payload']
                product_type['level'] = body['level']
                product_type['sensor-mode'] = body['sensor-mode']
                product_type['type'] = body['type']
                product_type['description'] = body['description']
                product_type['entities_relations'] = body['entities_relations']

        updated_graph_string = json.dumps(json_data)
        scen_graph['graph'] = updated_graph_string
        result = graph.update_one({'id': body['config_id']}, scen_graph)

        if result is None:
            return Response(json.dumps({'error': '500'}), mimetype="application/json", status=500)

        return Response(json.dumps(scen_graph, cls=db_utils.AlchemyEncoder), mimetype="application/json", status=200)

    except Exception as ex:
        return Response(json.dumps({'error': '500'}), mimetype="application/json", status=500)


@blueprint.route('/rest/api/dataflow', methods=['DELETE'])
@login_required
def delete_product_type():
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

        for index, product_type in enumerate(json_data['product_types']):
            if product_type['id'] == body['product_type_id']:
                json_data['product_types'].remove(product_type)

        updated_graph_string = json.dumps(json_data)
        scen_graph['graph'] = updated_graph_string
        result = graph.update_one({'id': body['config_id']}, scen_graph)

        if result is None:
            return Response(json.dumps({'error': '500'}), mimetype="application/json", status=500)

        return Response(json.dumps(result, cls=db_utils.AlchemyEncoder), mimetype="application/json", status=200)

    except Exception as ex:
        return Response(json.dumps({'error': '500'}), mimetype="application/json", status=500)