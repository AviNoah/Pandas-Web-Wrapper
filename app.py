from flask import Flask, render_template, request
import os
import shutil
import tempfile

app = Flask(__name__)

UPLOAD_FOLDER: str = tempfile.mkdtemp()
ALLOWED_EXTENSIONS: set = {'.xlsx', '.csv'}

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

def is_allowed_file(filename) -> bool:
    _, ext = os.path.splitext(filename)
    return ext in ALLOWED_EXTENSIONS