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

from flask_login import UserMixin

from apps import db, login_manager
from apps.utils.auth_utils import hash_pass
from apps.utils.db_utils import generate_uuid

from datetime import datetime


class Users(db.Model, UserMixin):
    __tablename__ = 'Users'

    id = db.Column(db.String(64), primary_key=True)
    username = db.Column(db.String(64), unique=True)
    email = db.Column(db.String(64), unique=True)
    password = db.Column(db.LargeBinary)
    role = db.Column(db.String(64))
    modifyDate = db.Column(db.DateTime)

    def __init__(self, **kwargs):
        for property, value in kwargs.items():
            if hasattr(value, '__iter__') and not isinstance(value, str):
                value = value[0]

            if property == 'password':
                value = hash_pass(value)  # we need bytes here (not plain str)

            setattr(self, property, value)

    def __repr__(self):
        return str(self.username)


@login_manager.user_loader
def user_loader(user_id):
    """
    :param user_id:
    :type user_id:
    :return:
    :rtype:
    """
    return Users.query.filter_by(id=user_id).first()


@login_manager.request_loader
def request_loader(request):
    """
    :param request:
    :type request:
    :return:
    :rtype:
    """
    username = request.form.get('username')
    user = Users.query.filter_by(username=username).first()
    return user if user else None


def get_users():
    """
    :param id:
    :type id:
    :return:
    :rtype:
    """
    return Users.query.with_entities(Users.id, Users.username, Users.email, Users.role).all()


def get_user_by_username(username):
    """
    :param id:
    :type id:
    :return:
    :rtype:
    """
    return Users.query.filter_by(username=username).first()


def save(username, email, password, role):
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
    uuid = str(generate_uuid())
    modifyDate = datetime.now()
    try:
        user = Users(id=uuid, username=username, email=email, password=str(password), role=role, modifyDate=modifyDate)
        db.session.add(user)
        db.session.commit()
    except Exception as ex:
        uuid = None
    return uuid


def update(id, username, email, role, password=None):
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
    modifyDate = datetime.now()
    try:
        if password is None or len(password) == 0:
            Users.query.filter_by(id=id).update(dict(username=username, email=email, role=role,
                                                            modifyDate=modifyDate))
        else:
            Users.query.filter_by(id=id).update(dict(username=username, email=email,
                                                            password=hash_pass(str(password)), role=role,
                                                            modifyDate=modifyDate))
        db.session.commit()
    except Exception as ex:
        id = None
    return id


def delete_user(id):
    try:
        user = Users.query.filter_by(id=id).delete()
        db.session.commit()
    except Exception as ex:
        db.session.rollback()
    return None
