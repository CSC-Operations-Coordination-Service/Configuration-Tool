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

import os
from apps.connector.MongoConnector import MongoConnector


class Config(object):
    SESSION_COOKIE_HTTPONLY = True
    REMEMBER_COOKIE_HTTPONLY = True
    REMEMBER_COOKIE_DURATION = 3600

    basedir = os.path.abspath(os.path.dirname(__file__))

    # Set up the App SECRET_KEY
    # SECRET_KEY = config('SECRET_KEY'  , default='S#perS3crEt_007')
    SECRET_KEY = os.getenv('SECRET_KEY', 'S#perS3crEt_007')

    # This will create a file in <app> FOLDER
    # SQLALCHEMY_DATABASE_URI = 'sqlite:///' + os.path.join(basedir, 'db.sqlite3')
    # SQLALCHEMY_TRACK_MODIFICATIONS = False

    # PostgreSQL database
    POSTGRES_DB_ENGINE = os.getenv('POSTGRES_DB_ENGINE', 'postgresql')
    POSTGRES_HOST = os.getenv('POSTGRES_HOST', '10.150.140.57')
    POSTGRES_PORT = os.getenv('POSTGRES_PORT', 5433)
    POSTGRES_DB_NAME = os.getenv('POSTGRES_DB_NAME', 'configuration_tool_db')
    POSTGRES_DB_USERNAME = os.getenv('POSTGRES_DB_USERNAME', 'configuration_tool')
    POSTGRES_DB_PASSWORD = os.getenv('POSTGRES_DB_PASSWORD', '4sMUk7XCc8eSDhPCPfWPB2CMWBXc3SyT')

    SQLALCHEMY_DATABASE_URI = '{}://{}:{}@{}:{}/{}'.format(
        os.getenv('DB_ENGINE'   , POSTGRES_DB_ENGINE),
        os.getenv('DB_USERNAME' , POSTGRES_DB_USERNAME),
        os.getenv('DB_PASS'     , POSTGRES_DB_PASSWORD),
        os.getenv('DB_HOST'     , POSTGRES_HOST),
        os.getenv('DB_PORT'     , POSTGRES_PORT),
        os.getenv('DB_NAME'     , POSTGRES_DB_NAME)
    )

    # MongoDB database
    MONGO_HOST = os.getenv('MONGO_HOST', '10.150.140.57')
    MONGO_PORT = os.getenv('MONGO_PORT', 27017)
    MONGO_DB_NAME = os.getenv('MONGO_DB_NAME', 'configuration_tool_db')
    MONGO_DB_USERNAME = os.getenv('MONGO_DB_USERNAME', 'configuration_tool')
    MONGO_DB_PASSWORD = os.getenv('MONGO_DB_PASSWORD', '3sMUk6XCc9eSDhPCPfWPB2CMWBXc4SyZ')

    mongo = MongoConnector()
    mongo.connect(MONGO_HOST, MONGO_PORT, MONGO_DB_USERNAME, MONGO_DB_PASSWORD)
    dbs = mongo.get_connection().list_database_names()
    if MONGO_DB_NAME not in dbs:
        db = mongo.get_connection()[MONGO_DB_NAME]
        collection = db.customers
        document = {"user_id": 1, "user": "test"}
        collection.insert_one(document)

    # Assets Management
    ASSETS_ROOT = os.getenv('ASSETS_ROOT', '/static/assets')    


class ProductionConfig(Config):
    DEBUG = False

    # Security
    SESSION_COOKIE_HTTPONLY = True
    REMEMBER_COOKIE_HTTPONLY = True
    REMEMBER_COOKIE_DURATION = 3600

    # PostgreSQL database
    POSTGRES_DB_ENGINE = os.getenv('POSTGRES_DB_ENGINE', 'postgresql')
    POSTGRES_HOST = os.getenv('POSTGRES_HOST', '10.150.140.57')
    POSTGRES_PORT = os.getenv('POSTGRES_PORT', 5433)
    POSTGRES_DB_NAME = os.getenv('POSTGRES_DB_NAME', 'configuration_tool_db')
    POSTGRES_DB_USERNAME = os.getenv('POSTGRES_DB_USERNAME', 'configuration_tool')
    POSTGRES_DB_PASSWORD = os.getenv('POSTGRES_DB_PASSWORD', '4sMUk7XCc8eSDhPCPfWPB2CMWBXc3SyT')

    SQLALCHEMY_DATABASE_URI = '{}://{}:{}@{}:{}/{}'.format(
        os.getenv('DB_ENGINE'   , POSTGRES_DB_ENGINE),
        os.getenv('DB_USERNAME' , POSTGRES_DB_USERNAME),
        os.getenv('DB_PASS'     , POSTGRES_DB_PASSWORD),
        os.getenv('DB_HOST'     , POSTGRES_HOST),
        os.getenv('DB_PORT'     , POSTGRES_PORT),
        os.getenv('DB_NAME'     , POSTGRES_DB_NAME)
    )

    # MongoDB database
    MONGO_HOST = os.getenv('MONGO_HOST', '10.150.140.57')
    MONGO_PORT = os.getenv('MONGO_PORT', 27017)
    MONGO_DB_NAME = os.getenv('MONGO_DB_NAME', 'configuration_tool_db')
    MONGO_DB_USERNAME = os.getenv('MONGO_DB_USERNAME', 'configuration_tool')
    MONGO_DB_PASSWORD = os.getenv('MONGO_DB_PASSWORD', '3sMUk6XCc9eSDhPCPfWPB2CMWBXc4SyZ')

    mongo = MongoConnector()
    mongo.connect(MONGO_HOST, MONGO_PORT, MONGO_DB_USERNAME, MONGO_DB_PASSWORD)

    # Assets Management
    ASSETS_ROOT = os.getenv('ASSETS_ROOT', '/static/assets')


class DebugConfig(Config):
    DEBUG = True


# Load all possible configurations
config_dict = {
    'Production': ProductionConfig,
    'Debug'     : DebugConfig
}
