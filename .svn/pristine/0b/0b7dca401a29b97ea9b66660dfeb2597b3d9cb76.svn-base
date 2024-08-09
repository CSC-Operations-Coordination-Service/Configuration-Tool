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

from pymongo import MongoClient


class MongoConnectorSingleton(object):

    def __new__(cls):
        if not hasattr(cls, 'instance'):
            cls.instance = super(MongoConnectorSingleton, cls).__new__(cls)
        return cls.instance

    def connect(self, hostname, port, username, password):
        if not isinstance(port, int):
            port = int(port)
        self.hostname = hostname
        self.port = port
        self.username = username
        self.password = password
        self.connection = None
        return self.reconnect()

    def reconnect(self):
        if self.connection is not None and self.connection.options.connect:
            self.connection.close()
            self.connection = None
        self.connection = MongoClient(self.hostname, self.port, username=self.username, password=self.password)
        return self.connection

    def get_connection(self):
        if self.connection is None or not self.connection.options.connect:
            self.connection = self.reconnect()
        return self.connection

    def __del__(self):
        if self.connection is not None:
            self.connection.close()
            self.connection = None
        return


class MongoConnector(MongoConnectorSingleton):
    pass
