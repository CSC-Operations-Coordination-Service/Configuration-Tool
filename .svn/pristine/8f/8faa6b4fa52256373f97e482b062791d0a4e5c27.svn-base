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


class UserRole(db.Model):
    __tablename__ = 'userRole'

    name = db.Column(db.String(64), primary_key=True)

    def __init__(self, **kwargs):
        for property, value in kwargs.items():
            if hasattr(value, '__iter__') and not isinstance(value, str):
                value = value[0]

            setattr(self, property, value)


def get_roles():
    """
    :return:
    :rtype:
    """
    try:
        return UserRole.query.all()
    except Exception as ex:
        return []


def save_role(name):
    """
    :param name:
    :type name:
    :return:
    :rtype:
    """
    try:
        role = UserRole(name=name)
        db.session.add(role)
        db.session.commit()
        return role
    except Exception as ex:
        db.session.rollback()
    return None


def update_role(name, new_name):
    """
    :param username:
    :type username:
    :param email:
    :type email:
    :param password:
    :type password:
    :return:
    :rtype:
    """
    try:
        UserRole.query.filter_by(name=name).update(dict(name=new_name))
        db.session.commit()
    except Exception as ex:
        name = None
    return name


def delete_role(name):
    """
    :param name:
    :type name:
    :return:
    :rtype:
    """
    try:
        UserRole.query.filter_by(name=name).delete()
        db.session.commit()
    except Exception as ex:
        db.session.rollback()
    return None