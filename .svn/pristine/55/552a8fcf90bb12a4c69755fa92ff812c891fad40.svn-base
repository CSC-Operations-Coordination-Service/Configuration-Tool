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

import binascii
import hashlib
import json
import os
import uuid
from datetime import datetime
from functools import reduce
from sqlalchemy.ext.declarative import DeclarativeMeta
from urllib.parse import urlparse, parse_qs

import apps.utils.excel_document_generator as excelGenerator


def generate_uuid():
    """
    :return:
    :rtype:
    """
    return str(uuid.uuid1()).replace('-', '_')


class AlchemyEncoder(json.JSONEncoder):

    def default(self, obj):
        if isinstance(obj, list):
            list_obj = []
            for o in obj:
                list_obj.append(self.cast(o))
            return list_obj
        else:
            return self.cast(obj)
        return json.JSONEncoder.default(self, obj)

    def cast(self, obj):
        if isinstance(obj.__class__, DeclarativeMeta):
            fields = {}
            for field in [x for x in dir(obj) if not x.startswith('_') and x != 'metadata']:
                data = obj.__getattribute__(field)
                try:
                    if isinstance(data, datetime):
                        format_data = "%d/%m/%Y %H:%M:%S"
                        data = data.strftime(format_data)
                    else:
                        json.dumps(data)
                    fields[field] = data
                except TypeError:
                    fields[field] = None
            return fields
