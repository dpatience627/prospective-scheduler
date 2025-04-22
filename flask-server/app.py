import os
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from routes.routeutils import authorize, api_arg_error, api_id_error, api_construct_error, api_confirm_delete, api_error, api_success

scriptdir = os.path.abspath(os.path.dirname(__file__))

#Note: config.json is not tracked by git (contains sensitive info), and must be added manually.
with open('config.json') as fin:
    config = json.load(fin)
db_config = config['db_config']
app_config = config['app_config']

#Setup the app according to the config file
app = Flask(__name__)

CORS(app, resources={r"/api/*": {"origins": app_config['cors_origins']}})

app.config['SQLALCHEMY_DATABASE_URI'] = f"mysql+pymysql://{db_config['user']}:{db_config['password']}@{db_config['address']}/{db_config['database']}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = 'uploads'
# Getting the database object handle from the app
db = SQLAlchemy(app)

#Setting up scheduler for reoccurring background tasks
import atexit
from apscheduler.schedulers.background import BackgroundScheduler
scheduler = BackgroundScheduler()
scheduler.start()
atexit.register(lambda: scheduler.shutdown())

#Setting up graph api client
from graph import GraphClient, GraphConfig
graph_client : GraphClient = GraphClient(GraphConfig(config['graph_config']))

#Schedule graph api client to get a new access token every so often
scheduler.add_job(graph_client.refresh_client_access, trigger="interval", minutes=30)

###########################################################
#                        API ROUTES                       #
###########################################################

import utils.emailutils
from tables.classes import Class
from tables.visit import Visit
from tables.student import Student
from tables.major import Major
from tables.faculty import Faculty

import routes.visits
import routes.majors
import routes.departments
import routes.users
import routes.classes
import routes.students
import routes.faculty
import loadDB
import schedule

#Load emails at startup
utils.emailutils.load_gcc_emails()

@app.post("/api/v1/gcc/emails/")
@authorize
def get_gcc_emails():
    return jsonify(utils.emailutils.valid_gcc_emails)

# ROUTE FOR CHECKING ID TOKEN VALIDITY. SHOULD NOT BE @AUTHORIZED!
from routes.routeutils import validate_id_token
@app.post("/api/v1/validate-id-token/")
def post_validate_id_token():
    if validate_id_token(request.json['IdToken']) is not None:
        return api_error("ID token is invalid")
    return api_success("ID token is valid")

#### HELPER METHODS ###
@app.errorhandler(404)
def on_404(error):
    return jsonify({"error": 404}), 404