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

from apps.collectors.jira.client import JiraClient
from apps.config import Configuration
from apps.models.nosql.Graph import Graph
from apps.utils import db_utils


class IPFCollector:

    def __init__(self):
        self.__client = JiraClient()
        return

    def collect_ipf_tickets(self):

        # Retrieve JQL query string for IPF tickets
        jira_config = Configuration().get_object("jira_omcs_config")
        jql = jira_config['ipf_tickets_jql']

        # Collect SOA Tickets of Type IPF created in the last 24 hours
        res = self.__client.collect_tickets(jql)

        # Parse tickets
        tickets = []
        for record in res:
            ticket = {
                'key': record.key,
                'impacted_satellites': [],
                'impacted_ipfs': [],
                'target_ipf_version': record.fields.customfield_10117,
                'target_processing_baseline': record.fields.customfield_10125,
                'changes_introduced': record.fields.customfield_10144,
                'summary': record.fields.summary,
                'description': record.fields.description,
                'estimated_delivery_date': '',
                'estimated_tto_date': ''
            }
            if record.fields.customfield_10119 is not None:
                ticket['estimated_delivery_date'] = datetime.strptime(record.fields.customfield_10119,
                                                                      '%Y-%m-%d').strftime('%d/%m/%Y')
            if record.fields.customfield_10120 is not None:
                ticket['estimated_tto_date'] = datetime.strptime(record.fields.customfield_10120,
                                                                      '%Y-%m-%d').strftime('%d/%m/%Y')
            else:
                ticket['estimated_tto_date'] = ticket['estimated_delivery_date']
            for i, ipf in enumerate(record.fields.customfield_10126):
                ticket['impacted_ipfs'].append(ipf.value)
            for i, sat in enumerate(record.fields.customfield_10130):
                ticket['impacted_satellites'].append(sat.value)
            tickets.append(ticket)

        # Compare the already saved processor releases with the collected tickets: the comparison is done on the basis
        # of the mission, estimated delivery date (release date) and TTO date (validity start date). If no processor
        # release exists, with the three above properties, the ticket is converted into a processor releases, that
        # in turn is ingested in the processor releases configuration
        graph = Graph()
        config_id = Configuration().get_object("configurations")['processors']
        scen_graph = graph.find({'id': config_id})
        scen_graph = scen_graph[0]
        json_data = json.loads(scen_graph['graph'])
        processor_releases = json_data['processors_releases']
        for ticket in tickets:
            found = False
            mission = ticket['impacted_satellites'][0][:2]
            estimated_delivery_date = ticket['estimated_delivery_date']
            for release in processor_releases:
                release_date = release['release_date']
                if mission == release['mission'] and estimated_delivery_date == release_date:
                    found = True
                    break
            if not found:
                target_ipfs = []
                for i, ipf in enumerate(ticket['impacted_ipfs']):
                    target_ipfs.append(':'.join(filter(None, (ipf, ticket['target_ipf_version']))))
                processor_releases.append({
                    'id': db_utils.generate_uuid(),
                    'mission': mission,
                    'satellite_units': ', '.join(sat for sat in ticket['impacted_satellites']),
                    'target_ipfs': target_ipfs,
                    'processing_baseline': ticket['target_processing_baseline'],
                    'release_date': ticket['estimated_delivery_date'],
                    'validity_start_date': ticket['estimated_tto_date'],
                    'validity_end_date': '',
                    'release_notes': ticket['description']
                })
                updated_graph_string = json.dumps(json_data)
                scen_graph['graph'] = updated_graph_string
                result = graph.update_one({'id': config_id}, scen_graph)
        return tickets
