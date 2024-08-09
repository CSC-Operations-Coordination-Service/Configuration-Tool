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

from apps import db
from apps.utils.db_utils import generate_uuid


class Endpoint(db.Model):
    __tablename__ = 'endpoint'

    id = db.Column(db.String(64), primary_key=True)
    idFragment = db.Column(db.String(64), db.ForeignKey('fragment.id'))
    idEndpoint = db.Column(db.String(64), db.ForeignKey('endpoint.id'))
    name = db.Column(db.String(255))
    content = db.Column(db.String(9000))
    modifyDate = db.Column(db.DateTime)

    def __init__(self, **kwargs):
        for property, value in kwargs.items():
            if hasattr(value, '__iter__') and not isinstance(value, str):
                value = value[0]

            setattr(self, property, value)


def get_endpoint(endpoint_id):
    """
    :param endpoint_id:
    :type endpoint_id:
    :return:
    :rtype:
    """
    return Endpoint.query.filter_by(id=endpoint_id).first()


def get_endpoints_by_fragment_id(fragment_id):
    """
    :param fragment_id:
    :type dFragment:
    :return:
    :rtype:
    """
    return Endpoint.query.filter_by(idFragment=fragment_id).all()


def get_endpoints():
    endpoint = []
    try:
        endpoint = Endpoint.query.all()
    except Exception as ex:
        endpoint = []
    return endpoint


def save_endpoint(fragment_id, name, content, modify_date):
    """
    :param idScenario:
    :type idScenario:
    :param idFragmentParent:
    :type idFragmentParent:
    :param name:
    :type name:
    :param content:
    :type content:
    :param description:
    :type description:
    :param startDate:
    :type startDate:
    :param endDate:
    :type endDate:
    :return:
    :rtype:
    """
    uuid = str(generate_uuid())
    try:
        endpoint = Endpoint(id=uuid, idFragment=fragment_id, name=name,
                            content=content, modifyDate=modify_date)
        db.session.add(endpoint)
        db.session.commit()
    except Exception as ex:
        uuid = None
    return uuid


def save_endpoint_with_endpoint_id(uuid, fragment_id, name, content, modify_date):
    """
    :param uuid:
    :type uuid:
    :param idScenario:
    :type idScenario:
    :param idFragmentParent:
    :type idFragmentParent:
    :param name:
    :type name:
    :param content:
    :type content:
    :param description:
    :type description:
    :param startDate:
    :type startDate:
    :param endDate:
    :type endDate:
    :type increaseTime:
    :return:
    :rtype:
    """
    try:
        endpoint = Endpoint(id=uuid, idFragment=fragment_id, name=name,
                            content=content, modifyDate=modify_date)
        db.session.add(endpoint)
        db.session.commit()
    except Exception as ex:
        uuid = None
    return uuid


def update_endpoint(uuid, fragment_id, name, content, modify_date):
    """
    :param uuid:
    :type uuid:
    :param idScenario:
    :type idScenario:
    :param name:
    :type name:
    :param content:
    :type content:
    :param description:
    :type description:
    :param startDate:
    :type startDate:
    :param endDate:
    :type endDate:
    :return:
    :rtype:
    """
    try:
        Endpoint.query.filter_by(id=uuid).update(
            dict(idFragment=fragment_id, name=name, content=content, modifyDate=modify_date))
        db.session.commit()
    except Exception as ex:
        uuid = None
    return uuid


def delete_endpoint(endpoint_id):
    """
    :param id_fragment:
    :type id_fragment:
    :return:
    :rtype:
    """
    try:
        db.session.query(
            Endpoint
        ).filter(
            Endpoint.id == endpoint_id,
        ).delete()

        db.session.commit()
    except Exception as ex:
        return None
    return endpoint_id
