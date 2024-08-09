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
from datetime import datetime


class ChartView(db.Model):
    __tablename__ = 'chartView'

    id = db.Column(db.String(64), primary_key=True)
    idScenario = db.Column(db.String(64))
    name = db.Column(db.String(255))
    description = db.Column(db.String(255))
    modifyDate = db.Column(db.DateTime)

    def __init__(self, **kwargs):
        for property, value in kwargs.items():
            if hasattr(value, '__iter__') and not isinstance(value, str):
                value = value[0]

            setattr(self, property, value)


def get_chart_view(chart_view_id):
    """
    :param chart_view_id:
    :type chart_view_id:
    :return:
    :rtype:
    """
    return ChartView.query.filter_by(id=chart_view_id).first()


def get_chart_views_by_scenario_id(scenario_id):
    """
    :param scenario_id:
    :type scenario_id:
    :return:
    :rtype:
    """
    return ChartView.query.filter_by(idScenario=scenario_id).order_by(ChartView.modifyDate.asc()).all()


def get_chart_view_by_scenario_id_and_name(scenario_id, name):
    """
    :param scenario_id:
    :type scenario_id:
    :param name:
    :type name:
    :return:
    :rtype:
    """
    return ChartView.query.filter_by(idScenario=scenario_id, name=name).first()


def save_chart_view(scenario_id, name, description):
    """
    :param scenario_id:
    :type scenario_id:
    :param name:
    :type name:
    :param description:
    :type description:
    :return:
    :rtype:
    """
    uuid = str(generate_uuid())
    try:

        if get_chart_view_by_scenario_id_and_name(scenario_id, name) is not None:
            return None

        modify_date = datetime.now()
        chart_view = ChartView(id=uuid, idScenario=scenario_id, name=name, description=description,
                               modifyDate=modify_date)
        db.session.add(chart_view)
        db.session.commit()
    except Exception as ex:
        pass
    return uuid


def update_chart_view_with_scenario_id(uuid, scenario_id, name, description):
    """
    :param uuid:
    :type uuid:
    :param scenario_id:
    :type scenario_id:
    :param name:
    :type name:
    :param description:
    :type description:
    :return:
    :rtype:
    """
    try:

        if get_chart_view_by_scenario_id_and_name(scenario_id, name) is not None:
            return None

        modify_date = datetime.now()
        chart_view = ChartView(id=uuid, idScenario=scenario_id, name=name, description=description,
                               modifyDate=modify_date)
        db.session.add(chart_view)
        db.session.commit()
    except Exception as ex:
        pass
    return uuid


def update_chart_view(uuid, name, description):
    """
    :param uuid:
    :type uuid:
    :param name:
    :type name:
    :param description:
    :type description:
    :return:
    :rtype:
    """
    modify_date = datetime.now()
    try:
        ChartView.query.filter_by(id=uuid).update(dict(name=name, description=description, modifyDate=modify_date))
        db.session.commit()
    except Exception as ex:
        pass
    return uuid


def delete_chart_view(chart_view_id):
    """
    :param chart_view_id:
    :type chart_view_id:
    :return:
    :rtype:
    """
    try:
        db.session.query(
            ChartView
        ).filter(
            ChartView.id == chart_view_id,
        ).delete()

        db.session.commit()
    except Exception as ex:
        pass
    return chart_view_id
