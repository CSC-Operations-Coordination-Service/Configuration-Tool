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
from apps.models.sql.ChartView import ChartView
from apps.utils.db_utils import generate_uuid
from datetime import datetime


class Chart(db.Model):
    __tablename__ = 'chart'

    id = db.Column(db.String(64), primary_key=True)
    idJsonVariables = db.Column(db.String(9999))
    size = db.Column(db.String(64))
    type = db.Column(db.String(999))
    name = db.Column(db.String(999))
    idChartView = db.Column(db.String(64))
    isComparative = db.Column(db.Boolean)
    modifyDate = db.Column(db.DateTime)

    def __init__(self, **kwargs):
        for property, value in kwargs.items():
            if hasattr(value, '__iter__') and not isinstance(value, str):
                value = value[0]

            setattr(self, property, value)


def get_chart(chart_id):
    """
    :param chart_id:
    :param id_chart:
    :type id_chart:
    :return:
    :rtype:
    """
    return Chart.query.filter_by(id=chart_id).first()


def get_charts_by_chart_view_id(chart_view_id):
    """
    :param chart_view_id:
    :type chart_view_id:
    :return:
    :rtype:
    """
    return Chart.query.filter_by(idChartView=chart_view_id).order_by(Chart.modifyDate.asc()).all()


def get_charts_by_scenario_id_and_view_name(scenario_id, view_name):
    """
    :param scenario_id:
    :type scenario_id:
    :param view_name:
    :type view_name:
    :return:
    :rtype:
    """
    q = db.session.query(
        Chart, ChartView,
    ).filter(
        Chart.idChartView == ChartView.id,
    ).filter(
        ChartView.idScenario == scenario_id,
        ChartView.name == view_name
    ).order_by(Chart.modifyDate.asc()).all()

    list = []
    for var in q:
        if len(var) > 0:
            list.append(var[0])

    return list


def save_chart(id_json_variables, size, type, name, id_chart_view, is_comparative, modify_date=datetime.now()):
    """
    :param id_json_variables:
    :type id_json_variables:
    :param size:
    :type size:
    :param type:
    :type type:
    :param name:
    :type name:
    :param id_chart_view:
    :type id_chart_view:
    :param is_comparative:
    :type is_comparative:
    :param modify_date:
    :type modify_date:
    :return:
    :rtype:
    """
    try:
        id = str(generate_uuid())
        chart = Chart(id=id, idJsonVariables=id_json_variables, size=size, type=type, name=name,
                      idChartView=id_chart_view, isComparative=is_comparative, modifyDate=modify_date)
        db.session.add(chart)
        db.session.commit()
    except Exception as ex:
        pass
    return None


def update_chart(chart_id, id_json_variables, size, type, name, id_chart_view, is_comparative,
                 modify_date=datetime.now()):
    """
    :param chart_id:
    :type chart_id:
    :param id_json_variables:
    :type id_json_variables:
    :param size:
    :type size:
    :param type:
    :type type:
    :param name:
    :type name:
    :param id_chart_view:
    :type id_chart_view:
    :param is_comparative:
    :type is_comparative:
    :param modify_date:
    :type modify_date:
    :return:
    :rtype:
    """
    try:
        chart = Chart(id=chart_id, idJsonVariables=id_json_variables, size=size, type=type, name=name,
                      idChartView=id_chart_view, isComparative=is_comparative, modifyDate=modify_date)
        db.session.add(chart)
        db.session.commit()
    except Exception as ex:
        return None
    return chart


def delete_chart(chart_id):
    """
    :param chart_id:
    :type chart_id:
    :return:
    :rtype:
    """
    try:
        db.session.query(
            Chart
        ).filter(
            Chart.id == chart_id,
        ).delete()

        db.session.commit()
    except Exception as ex:
        pass
    return
