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


class Fragment(db.Model):
    __tablename__ = 'fragment'

    id = db.Column(db.String(64), primary_key=True)
    idFragmentParent = db.Column(db.String(64))
    idScenario = db.Column(db.String(64))
    name = db.Column(db.String(255))
    content = db.Column(db.String(9000))
    description = db.Column(db.String(255))
    startDate = db.Column(db.DateTime)
    endDate = db.Column(db.DateTime)

    def __init__(self, **kwargs):
        for property, value in kwargs.items():
            if hasattr(value, '__iter__') and not isinstance(value, str):
                value = value[0]

            setattr(self, property, value)


def get_fragment(fragment_id):
    """
    :param fragment_id:
    :type fragment_id:
    :return:
    :rtype:
    """
    return Fragment.query.filter_by(id=fragment_id).first()


def get_fragments_by_scenario_id(scenario_id):
    """
    :param scenario_id:
    :type scenario_id:
    :return:
    :rtype:
    """
    return Fragment.query.filter_by(idScenario=scenario_id).all()


def get_fragments_by_parent_fragment_id(parent_fragment_id):
    """
    :param parent_fragment_id:
    :type parent_fragment_id:
    :return:
    :rtype:
    """
    return Fragment.query.filter_by(idFragmentParent=parent_fragment_id).all()


def get_fragment_by_scenario_id_and_fragment_id(scenario_id, fragment_id):
    """
    :param scenario_id:
    :type scenario_id:
    :param fragment_id:
    :type fragment_id:
    :return:
    :rtype:
    """
    return Fragment.query.filter_by(id=fragment_id, idScenario=scenario_id).first()


def get_fragments():
    fragments = []
    try:
        fragments = Fragment.query.all()
    except Exception as ex:
        fragments = []
    return fragments


def save_fragment(scenario_id, parent_fragment_id, name, content, description, start_date, end_date):
    """
    :param scenario_id:
    :type scenario_id:
    :param parent_fragment_id:
    :type parent_fragment_id:
    :param name:
    :type name:
    :param content:
    :type content:
    :param description:
    :type description:
    :param start_date:
    :type start_date:
    :param end_date:
    :type end_date:
    :return:
    :rtype:
    """
    uuid = str(generate_uuid())
    try:
        fragment = Fragment(id=uuid, idScenario=scenario_id, idFragmentParent=parent_fragment_id, name=name,
                            content=content, description=description, startDate=start_date, endDate=end_date)
        db.session.add(fragment)
        db.session.commit()
    except Exception as ex:
        uuid = None
    return uuid


def save_fragment_with_id(uuid, scenario_id, parent_fragment_id, name, content, description, start_date, end_date,
                          time_step):
    """
    :param uuid:
    :type uuid:
    :param scenario_id:
    :type scenario_id:
    :param parent_fragment_id:
    :type parent_fragment_id:
    :param name:
    :type name:
    :param content:
    :type content:
    :param description:
    :type description:
    :param start_date:
    :type start_date:
    :param end_date:
    :type end_date:
    :type time_step:
    :return:
    :rtype:
    """
    try:
        fragment = Fragment(id=uuid, idScenario=scenario_id, idFragmentParent=parent_fragment_id, name=name,
                            content=content, description=description, startDate=start_date, endDate=end_date,
                            increaseTime=time_step)
        db.session.add(fragment)
        db.session.commit()
    except Exception as ex:
        uuid = None
    return uuid


def update_fragment(uuid, scenario_id, name, content, description, start_date, end_date):
    """
    :param uuid:
    :type uuid:
    :param scenario_id:
    :type scenario_id:
    :param name:
    :type name:
    :param content:
    :type content:
    :param description:
    :type description:
    :param start_date:
    :type start_date:
    :param end_date:
    :type end_date:
    :return:
    :rtype:
    """
    try:
        Fragment.query.filter_by(id=uuid).update(dict(idScenario=scenario_id, name=name, content=content,
                                                      description=description, startDate=start_date, endDate=end_date))
        db.session.commit()
    except Exception as ex:
        uuid = None
    return uuid


def delete_fragment(fragment_id):
    """
    :param fragment_id:
    :type fragment_id:
    :return:
    :rtype:
    """
    try:
        db.session.query(
            Fragment
        ).filter(
            Fragment.id == fragment_id,
        ).delete()

        db.session.commit()
    except Exception as ex:
        return None
    return fragment_id
