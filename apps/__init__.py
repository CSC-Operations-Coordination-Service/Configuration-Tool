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
import boto3
import botocore.client
from flask import Flask
from flask_login import LoginManager
from flask_sqlalchemy import SQLAlchemy
from importlib import import_module
from typing import Optional

from apps.collectors.jira.ipf_collector import IPFCollector

db = SQLAlchemy()
login_manager = LoginManager()
s3_client: Optional[botocore.client.BaseClient] = None

def register_extensions(app):
    db.init_app(app)
    login_manager.init_app(app)


def register_blueprints(app):
    for module_name in ('auth', 'home', 'rest', 'rest.interfaces', 'rest.processors', 'rest.services', 'rest.dataflow',
                        'rest.documents'):
        module = import_module('apps.routes.{}.routes'.format(module_name))
        app.register_blueprint(module.blueprint)


def configure_database(app):

    with app.app_context():
        # def initialize_database():
        db.create_all()

    @app.teardown_request
    def shutdown_session(exception=None):
        db.session.remove()

def configure_s3_client(app):

    with app.app_context():
        global s3_client
        s3_client = boto3.client(
            's3',
            endpoint_url=app.config['S3_ENDPOINT_URL'],
            aws_access_key_id=app.config['S3_ACCESS_KEY'],
            aws_secret_access_key=app.config['S3_SECRET_KEY'],
            region_name=app.config['S3_REGION']
        )

def initialise_dataflow_doc_generator(app):
    from apps.utils.word_document_generator import DataflowDocCreator
    
    app.dataflow_doc_creator = DataflowDocCreator(app)
    # FIXME: Following is hard-coded value of config_id (acts as default)
    app.dataflow_doc_creator.config_id = "627ad268_ce8c_11ef_8a52_514642c42857"

def start_scheduler(app):
    def schedule_process():
        import schedule

        ################################################################################################################
        ##                                                                                                            ##
        ##  Wrapping functions, used to invoke the ingestion of new Jira tickets.                                     ##
        ##                                                                                                            ##
        ################################################################################################################

        def omcs_jira_ipf_tickets_collector():
            with app.app_context():
                IPFCollector().collect_ipf_tickets()

        ################################################################################################################
        ##                                                                                                            ##
        ##  This is the main backend orchestrator: it is meant to schedule the execution of all listed jobs.           ##
        ##                                                                                                            ##
        ################################################################################################################
        '''
        '''
        ################################################################################################################

        # Ingest Jira Tickets
        schedule.every().hour.at(":00").do(omcs_jira_ipf_tickets_collector)

        ################################################################################################################

    def check_schedule():
        import time
        import schedule
        app.logger.info("[BEG] Scheduler - RUN ALL tasks")
        try:
            schedule.run_all(10)
        except Exception as ex:
            app.logger.error("[ERR] Scheduler - Error running schedule tasks: %s", ex)
        app.logger.info("[END] Scheduler - RUN ALL tasks")

        while True:
            app.logger.debug("[BEG] Scheduler - RUN pending tasks")
            try:
                schedule.run_pending()
                time.sleep(10)
            except Exception as ex:
                app.logger.error("[ERR] Loop Scheduler - Error running loop schedule tasks: %s", ex)
                app.logger.error("[ERR] Loop Scheduler - Traceback of error ", exc_info = 1)
            app.logger.debug("[END] Scheduler - RUN pending tasks")

    import _thread
    # if not app.debug:
    with app.app_context():
        app.logger.info("Configuring and starting scheduler...")
        schedule_process()
        app.logger.info("Jobs scheduled")
        _thread.start_new_thread(check_schedule, ())
        app.logger.info("Scheduler thread started")


def create_app(configuration):
    print("Configuration Tool starting up...")
    app = Flask(__name__)
    print("Configuring application...")
    app.config.from_object(configuration)
    print("Registering extensions...")
    register_extensions(app)
    print("Registering endpoints...")
    register_blueprints(app)
    print("Configuring database...")
    configure_database(app)
    print("Configuring S3 client...")
    configure_s3_client(app)
    print("Starting Scheduler ...")
    initialise_dataflow_doc_generator(app)
    print("Initialising Dataflow Document Generator ...")
    start_scheduler(app)
    print("Configuration Tool successfully started")
    return app
