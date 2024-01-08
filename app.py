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

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=["POST"])
def upload_file():
    if 'file' not in request.files:
        return 'No file in request'
    
    file = request.files['file']
    
    if not file or file.filename == "":
        return "No file selected"
    
    if not is_allowed_file(file):
        return "Invalid file type"
    
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
    file.save(file_path)
    return "Uploaded file successfully"