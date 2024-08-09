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

from datetime import datetime

from apps import db
from apps.utils.db_utils import generate_uuid


class Scenario(db.Model):
    __tablename__ = 'scenario'

    id = db.Column(db.String(64), primary_key=True)
    idUser = db.Column(db.String(64))
    name = db.Column(db.String(255))
    description = db.Column(db.String(9000))
    startDate = db.Column(db.DateTime)
    endDate = db.Column(db.DateTime)
    increaseTime = db.Column(db.Integer)
    createDate = db.Column(db.DateTime)
    locked = db.Column(db.Boolean)
    modifyDate = db.Column(db.DateTime)

    def __init__(self, **kwargs):
        for property, value in kwargs.items():
            if hasattr(value, '__iter__') and not isinstance(value, str):
                value = value[0]

            setattr(self, property, value)


def get_scenarios():
    """
    :param id:
    :type id:
    :return:
    :rtype:
    """
    return Scenario.query.all()


def get_scenario(scenario_id):
    """
    :param scenario_id:
    :type scenario_id:
    :return:
    :rtype:
    """
    return Scenario.query.filter_by(id=scenario_id).first()


def get_scenarios_by_user_id(user_id):
    """
    :param userId:
    :type userId:
    :return:
    :rtype:
    """
    q = Scenario.query.filter_by(idUser=user_id).order_by(Scenario.modifyDate.desc()).all()
    return q


def get_scenario_by_user_id_and_scenario_id(user_id, scenario_id):
    """
    :param userId:
    :type userId:
    :param idScenario:
    :type idScenario:
    :return:
    :rtype:
    """
    return Scenario.query.filter_by(idUser=user_id, id=scenario_id).first()


def save_scenario(user_id, name, description, start_date, end_date, time_step=365, locked=False):
    """
    :param user_id:
    :type user_id:
    :param name:
    :type name:
    :param description:
    :type description:
    :param start_date:
    :type start_date:
    :param end_date:
    :type end_date:
    :param time_step:
    :type time_step:
    :param locked:
    :type locked:
    :return:
    :rtype:
    """
    uuid = str(generate_uuid())
    createDate = datetime.now()
    modifyDate = datetime.now()
    try:
        scenario = Scenario(id=uuid, idUser=user_id, name=name, description=description, startDate=start_date,
                            endDate=end_date, increaseTime=time_step, createDate=createDate, locked=locked,
                            modifyDate=modifyDate)
        db.session.add(scenario)
        db.session.commit()
    except Exception as ex:
        uuid = None
    return uuid


def save_scenario_with_id(uuid, user_id, name, description, start_date, end_date, time_step=365, locked=False):
    """
    :param uuid:
    :type uuid:
    :param user_id:
    :type user_id:
    :param name:
    :type name:
    :param description:
    :type description:
    :param start_date:
    :type start_date:
    :param end_date:
    :type end_date:
    :param time_step:
    :type time_step:
    :param locked:
    :type locked:
    :return:
    :rtype:
    """
    createDate = datetime.now()
    modifyDate = datetime.now()
    try:
        scenario = Scenario(id=uuid, idUser=user_id, name=name, description=description, startDate=start_date,
                            endDate=end_date, increaseTime=time_step, createDate=createDate, locked=locked,
                            modifyDate=modifyDate)
        db.session.add(scenario)
        db.session.commit()
    except Exception as ex:
        uuid = None
    return uuid


def update_scenario(uuid, name, description, start_date, end_date, time_step=365, locked=False):
    """
    :param uuid:
    :type uuid:
    :param name:
    :type name:
    :param description:
    :type description:
    :param start_date:
    :type start_date:
    :param end_date:
    :type end_date:
    :param time_step:
    :type time_step:
    :param locked:
    :type locked:
    :return:
    :rtype:
    """
    modifyDate = datetime.now()
    try:
        Scenario.query.filter_by(id=uuid).update(dict(name=name, description=description, startDate=start_date,
                                                      endDate=end_date, increaseTime=time_step, locked=locked,
                                                      modifyDate=modifyDate))
        db.session.commit()
    except Exception as ex:
        uuid = None
    return uuid


def delete_scenario(scenario_id):
    """
    :param scenario_id:
    :type scenario_id:
    :return:
    :rtype:
    """
    try:
        db.session.query(
            Scenario
        ).filter(
            Scenario.id == scenario_id,
        ).delete()

        db.session.commit()
    except Exception as ex:
        pass
    return
