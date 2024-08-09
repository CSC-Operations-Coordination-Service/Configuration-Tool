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

from apps.connector.MongoConnector import MongoConnector
import pymongo
import apps.utils.auth_utils as utils
import json
import datetime


class BaseDocument:

    def __init__(self):
        import os
        self.MONGO_DB_NAME = os.getenv('MONGO_DB_NAME', 'configuration_tool_db')
        self.COLLECTION_NAME = type(self).__name__
        self.COLLECTION_NAME_VERSION_CONTROL = self.COLLECTION_NAME + '_version_control'
        return

    def find(self, query=None):
        cursor = None
        if query is not None:
            cursor = MongoConnector().get_connection()[self.MONGO_DB_NAME][self.COLLECTION_NAME].find(query)
        else:
            cursor = MongoConnector().get_connection()[self.MONGO_DB_NAME][self.COLLECTION_NAME].find()

        list_obj = list()
        for x in cursor:
            list_obj.append(dict(x))
        return list_obj

    def insert(self, document):
        ret = None
        if isinstance(document, list):
            ret = self.insert_many(document)
        else:
            ret = self.insert_one(document)
        return ret

    def insert_one(self, document):
        if not isinstance(document, dict):
            document = document.__dict__
        document['last_modify'] = datetime.datetime.utcnow()
        cursor = MongoConnector().get_connection()[self.MONGO_DB_NAME][self.COLLECTION_NAME].insert_one(document)
        return cursor

    def insert_many(self, documents):
        to_insert = list()
        if isinstance(documents, list):
            for document in documents:
                if not isinstance(document, dict):
                    document = document.__dict__
                    document['last_modify'] = datetime.datetime.utcnow()
                    to_insert.append(json.dumps(document, cls=utils.AlchemyEncoder))
                else:
                    document['last_modify'] = datetime.datetime.utcnow()
                    to_insert.append(document)
        cursor = MongoConnector().get_connection()[self.MONGO_DB_NAME][self.COLLECTION_NAME].insert_many(to_insert)
        return cursor

    def delete_one(self, query):
        cursor = MongoConnector().get_connection()[self.MONGO_DB_NAME][self.COLLECTION_NAME].delete_one(query)
        return cursor

    def delete_many(self, query):
        cursor = MongoConnector().get_connection()[self.MONGO_DB_NAME][self.COLLECTION_NAME].delete_many(query)
        return cursor

    def update_one(self, query, newvalue):
        if not isinstance(newvalue, dict):
            newvalue = json.dumps(newvalue.__dict__, cls=utils.AlchemyEncoder)
        newvalue['last_modify'] = datetime.datetime.utcnow()
        newvalue = {"$set": newvalue}
        cursor = MongoConnector().get_connection()[self.MONGO_DB_NAME][self.COLLECTION_NAME].update_one(query, newvalue)
        return cursor

    def update_many(self, query, newvalue):
        if not isinstance(newvalue, dict):
            newvalue = json.dumps(newvalue.__dict__, cls=utils.AlchemyEncoder)
        newvalue['last_modify'] = datetime.datetime.utcnow()
        newvalue = {"$set": newvalue}
        cursor = MongoConnector().get_connection()[self.MONGO_DB_NAME][self.COLLECTION_NAME].update_many(query,
                                                                                                         newvalue)
        return cursor

    def versioning(self, idScenario, tag, message):
        try:
            if idScenario is None or len(idScenario) == 0:
                return None

            if tag is None:
                tag = ''
            else:
                tag = tag.upper()

            if message is None:
                message = ''

            query = {'id': idScenario}
            sort = [('n_ver', pymongo.DESCENDING)]
            n_ver = -1
            cursor = MongoConnector().get_connection()[self.MONGO_DB_NAME][self.COLLECTION_NAME_VERSION_CONTROL].find(
                query).sort(sort).limit(1)
            record_versioned = None
            for x in cursor:
                record_versioned = x
                break
            if record_versioned is None or len(record_versioned) == 0:
                n_ver = 1
            else:
                n_ver = int(record_versioned['n_ver']) + 1

            query = {'id': idScenario}
            sort = [('last_modify', pymongo.DESCENDING)]
            cursor = MongoConnector().get_connection()[self.MONGO_DB_NAME][self.COLLECTION_NAME].find(query).sort(
                sort).limit(1)
            record = None
            for x in cursor:
                record = x
                break
            if record is None:
                return None

            del record['_id']
            record['n_ver'] = n_ver
            record['tag'] = tag
            record['comment'] = message
            record['last_modify'] = datetime.datetime.utcnow()

            if not isinstance(record, dict):
                record = record.__dict__

            cursor = MongoConnector().get_connection()[self.MONGO_DB_NAME][
                self.COLLECTION_NAME_VERSION_CONTROL].insert_one(record)
        except Exception as ex:
            return None
        return cursor

    def history_find(self, query=None, sort=None):
        cursor = None
        if query is not None:
            cursor = MongoConnector().get_connection()[self.MONGO_DB_NAME][self.COLLECTION_NAME_VERSION_CONTROL].find(
                query)
            if sort is not None:
                cursor = cursor.sort(sort)
        else:
            cursor = MongoConnector().get_connection()[self.MONGO_DB_NAME][self.COLLECTION_NAME_VERSION_CONTROL].find()

        list_obj = list()
        for x in cursor:
            list_obj.append(dict(x))
        return list_obj
