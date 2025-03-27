#!/usr/bin/env python
""" Configuration Tool

The Configuration Tool is a software program produced for the European Space
Agency.

The purpose of this tool is to keep under configuration.py control the changes
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

from jira import JIRA

from apps.config import Configuration

class JiraClient:

    def __init__(self, basic_auth=None, options=None):
        self.__client = None
        if basic_auth is None:
            jira_config = Configuration().get_object("jira_omcs_config")
            user_email = jira_config['user_email']
            token = jira_config['token']
            basic_auth = (user_email, token)
        if options is None:
            jira_config = Configuration().get_object("jira_omcs_config")
            host = jira_config['host']
            options = {
                "server": host,
                "headers": {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                }
            }
        self.init(basic_auth, options)
        return

    def init(self, basic_auth, options):
        self.__client = JIRA(basic_auth=basic_auth, options=options)
        return

    def get_connection(self):
        return self.__client

    def get_issue(self, issue):
        return self.__client.issue(issue)

    def search(self, jql, start_at=0, max_results=50):
        res = self.__client.search_issues(jql, startAt=start_at, maxResults=max_results)
        return res

    def search_all(self, jql):
        total = []
        all_value = 1
        start_at = 0
        while start_at < all_value:
            res = self.__client.search_issues(jql, startAt=start_at, maxResults=10000)
            if res is None or len(res) == 0:
                return total
            all_value = res.total
            start_at += res.maxResults
            total += res.iterable

        return total

    def search_issue_by_project(self, project, start_at=0, max_results=50):
        res = self.search('project=' + project, start_at=start_at, max_results=max_results)
        return res

    def collect_tickets(self, jql):
        res = self.search_all(jql)
        return res
