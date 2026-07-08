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
from datetime import datetime, timezone


from flask import Response, current_app
from flask import request
from flask_login import login_required
from flask.typing import ResponseReturnValue
from typing import Callable, TypeVar

import apps.utils.auth_utils as auth_utils
import apps.utils.db_utils as db_utils

from apps.models.nosql.Graph import Graph
from apps.routes.rest.dataflow import blueprint
from apps.utils.word_document_generator import CURRENT_DATAFLOW_DOC_VERSION
#testing dataflow doc generation
from apps.utils.dataflow_doc_generator import generate_dataflow_document

DEFAULT_DATAFLOW_CONFIG_ID = "627ad268_ce8c_11ef_8a52_514642c42857"

FlaskRoute = TypeVar('FlaskRoute', bound=Callable[..., ResponseReturnValue])
def triggers_dataflow_doc_creation(f: FlaskRoute):
    """
    Trigger Dataflow Document creation on successful Response returned from
    wrapped function. Reads request's data/body and assigns config_id to
    DataflowDocCreator Singleton
    """
    import functools
    from flask import current_app

    @functools.wraps(f)
    def decorated(*args, **kwargs):
        response = f(*args, **kwargs)
        if response.status_code < 300:
            try:
                try:
                    request_data = json.loads(request.data.decode('utf-8'))
                except json.decoder.JSONDecodeError:
                    request_data = {}
                config_id = request_data.get('config_id', DEFAULT_DATAFLOW_CONFIG_ID)

                current_app.dataflow_doc_creator.config_id = config_id
                current_app.dataflow_doc_creator.trigger()

            except Exception as err:
                current_app.logger.error(f"Can not create new document: {err}")
        return response

    return decorated

def _json_response(payload, status=200):
    return Response(
        json.dumps(payload, cls=db_utils.AlchemyEncoder),
        mimetype="application/json",
        status=status
    )


def _load_graph_document(config_id):
    graph = Graph()
    scen_graph = graph.find({'id': config_id})
    if not scen_graph:
        raise ValueError(f"Configuration not found: {config_id}")

    scen_graph = scen_graph[0]
    json_data = json.loads(scen_graph.get('graph', '{}')) if isinstance(scen_graph.get('graph'), str) else scen_graph.get('graph')

    if not isinstance(json_data, dict):
        json_data = {}

    if 'footnotes' not in json_data or not isinstance(json_data['footnotes'], list):
        json_data['footnotes'] = []

    return graph, scen_graph, json_data


def _save_graph_document(graph, scen_graph, json_data):
    scen_graph['graph'] = json.dumps(json_data)
    return graph.update_one({'id': scen_graph['id']}, scen_graph)


def _utcnow():
    return datetime.now(timezone.utc).isoformat()


def _normalize_footnote_payload(body):
    """
    Backend-safe normalization.
    This keeps the format flexible for now:
      - matching_condition can be any JSON object
      - column_selector can be any JSON object or string
      - target_type can be 'cell' or 'header'
    """
    if not isinstance(body, dict):
        raise ValueError("Body must be a JSON object")

    target_type = body.get('target_type')
    if target_type not in ('cell', 'header'):
        raise ValueError("target_type must be 'cell' or 'header'")

    text = body.get('text', '').strip()
    if not text:
        raise ValueError("text is required")

    matching_condition = body.get('matching_condition', {})
    if not isinstance(matching_condition, dict):
        raise ValueError("matching_condition must be an object")

    column_selector = body.get('column_selector', {})
    if not isinstance(column_selector, (dict, str)):
        raise ValueError("column_selector must be an object or string")

    group = body.get('group', '')
    if group and not isinstance(group, str):
        raise ValueError("group must be a string")

    footnote = {
        'id': body.get('id') or db_utils.generate_uuid(),
        'target_type': target_type,
        'group': group,
        'column_selector': column_selector,
        'matching_condition': matching_condition,
        'text': text,
        'created_at': body.get('created_at') or _utcnow(),
        'updated_at': body.get('updated_at') or _utcnow()
    }

    return footnote


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
        "ESA-EOPG-EOPGC-TN-58 - CSC- ESA Operations Framework - Data Flow "
        "Configuration - v{}_{}.docx".format(
            CURRENT_DATAFLOW_DOC_VERSION,
            datetime.now().strftime("%d/%m/%Y")
        )
    )

    return doc_name


@blueprint.route('/rest/api/dataflow/document', methods=['GET'])
@login_required
def get_dataflow_doc():
    """
    Create a dataflow document.

    Query Parameters:
        official (str): Whether to create the official document. One of:
        'true', or 'false'. Defaults to 'false'.
        id (str): Configuration ID, used by direct-generation fallback.
    """
    import io
    from flask import send_file
    from apps import s3_client

    get_official_doc = request.args.get('official', 'false').lower() == 'true'
    config_id = request.args.get('id') or DEFAULT_DATAFLOW_CONFIG_ID

    # Prefer cached S3 document for fast export.
    try:
        if s3_client is None:
            raise RuntimeError("S3 client is not available")

        buffer = io.BytesIO()
        s3_client.download_fileobj(
            Bucket=current_app.config['S3_BUCKET'],
            Key=current_app.config["S3_DATAFLOW_DOC_OFFICIAL_KEY" if get_official_doc else "S3_DATAFLOW_DOC_UNOFFICIAL_KEY"],
            Fileobj=buffer
        )
        buffer.seek(0)

        return send_file(
            buffer,
            as_attachment=True,
            download_name=_generate_dataflow_doc_name(),
            mimetype='application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        )

    except Exception as err:
        current_app.logger.warning(f"S3 export failed, falling back to direct generation: {err}")

    # Fallback: generate document directly when S3 is unavailable.
    try:
        buffer = generate_dataflow_document(config_id, get_official_doc)
        return send_file(
            buffer,
            as_attachment=True,
            download_name=_generate_dataflow_doc_name(),
            mimetype='application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        )
    except Exception as err:
        current_app.logger.error(f"Dataflow export fallback failed: {err}")
        return Response(
            json.dumps({'error': '500', 'message': str(err)}),
            mimetype="application/json",
            status=500
        )

#testing dataflow doc generation (remove?)
@blueprint.route('/rest/api/dataflow/document/direct', methods=['GET'])
@login_required
def get_dataflow_doc_direct():
    """Generate and download dataflow document (no S3 dependency). Debug/dev only."""
    from flask import send_file
    config_id = request.args.get('id')
    official = request.args.get('official', 'false').lower() == 'true'
    buffer = generate_dataflow_document(config_id, official)
    return send_file(buffer, as_attachment=True, download_name=_generate_dataflow_doc_name(), mimetype='application/vnd.openxmlformats-officedocument.wordprocessingml.document')


@blueprint.route('/rest/api/dataflow', methods=['POST'])
@triggers_dataflow_doc_creation
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
@triggers_dataflow_doc_creation
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
@triggers_dataflow_doc_creation
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


    
@blueprint.route('/rest/api/dataflow/<config_id>/footnotes', methods=['GET'])
@login_required
def get_footnotes(config_id):
    try:
        graph, scen_graph, json_data = _load_graph_document(config_id)
        return _json_response(json_data.get('footnotes', []), status=200)
    except Exception as ex:
        return _json_response({'error': '500', 'message': str(ex)}, status=500)
    

@blueprint.route('/rest/api/dataflow/<config_id>/footnotes', methods=['POST'])
@login_required
def add_footnote(config_id):
    try:
        if not auth_utils.is_user_authorized(['admin']):
            return _json_response("Not authorized", status=401)

        body = request.get_json(silent=True) or {}
        footnote = _normalize_footnote_payload(body)

        graph, scen_graph, json_data = _load_graph_document(config_id)
        json_data['footnotes'].append(footnote)

        result = _save_graph_document(graph, scen_graph, json_data)
        if result is None:
            return _json_response({'error': '500'}, status=500)

        return _json_response(footnote, status=201)

    except Exception as ex:
        return _json_response({'error': '500', 'message': str(ex)}, status=500)
    

@blueprint.route('/rest/api/dataflow/<config_id>/footnotes/<footnote_id>', methods=['PUT'])
@login_required
def update_footnote(config_id, footnote_id):
    try:
        if not auth_utils.is_user_authorized(['admin']):
            return _json_response("Not authorized", status=401)

        body = request.get_json(silent=True) or {}
        footnote = _normalize_footnote_payload(body)
        footnote['id'] = footnote_id

        graph, scen_graph, json_data = _load_graph_document(config_id)

        updated = False
        for idx, existing in enumerate(json_data.get('footnotes', [])):
            if existing.get('id') == footnote_id:
                json_data['footnotes'][idx] = footnote
                updated = True
                break

        if not updated:
            return _json_response({'error': '404', 'message': 'Footnote not found'}, status=404)

        result = _save_graph_document(graph, scen_graph, json_data)
        if result is None:
            return _json_response({'error': '500'}, status=500)

        return _json_response(footnote, status=200)

    except Exception as ex:
        return _json_response({'error': '500', 'message': str(ex)}, status=500)
    

@blueprint.route('/rest/api/dataflow/<config_id>/footnotes/<footnote_id>', methods=['DELETE'])
@login_required
def delete_footnote(config_id, footnote_id):
    try:
        if not auth_utils.is_user_authorized(['admin']):
            return _json_response("Not authorized", status=401)

        graph, scen_graph, json_data = _load_graph_document(config_id)

        original_count = len(json_data.get('footnotes', []))
        json_data['footnotes'] = [
            item for item in json_data.get('footnotes', [])
            if item.get('id') != footnote_id
        ]

        if len(json_data['footnotes']) == original_count:
            return _json_response({'error': '404', 'message': 'Footnote not found'}, status=404)

        result = _save_graph_document(graph, scen_graph, json_data)
        if result is None:
            return _json_response({'error': '500'}, status=500)

        return _json_response({'deleted': True, 'id': footnote_id}, status=200)

    except Exception as ex:
        return _json_response({'error': '500', 'message': str(ex)}, status=500)