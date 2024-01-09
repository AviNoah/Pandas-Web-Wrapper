from flask import Flask, render_template, request, redirect, url_for, jsonify
from urllib.parse import quote
from functools import wraps
import os
import shutil
import tempfile

app = Flask(__name__, static_folder="static", template_folder="templates")

UPLOAD_FOLDER: str = tempfile.mkdtemp()
ALLOWED_EXTENSIONS: set = {".xlsx", ".csv"}

app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER


# Helper methods


def alert_user_and_redirect():
    # Decorate a app.route decorated method with this to alert a user and redirect
    # once it finishes. place this under the app.route decorator
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            redir, msg = func(*args, **kwargs)  # Must return redirect and message
            return redirect(redir + "?notification=" + quote(msg))

        return wrapper

    return decorator


def is_allowed_file(filename) -> bool:
    _, ext = os.path.splitext(filename)
    return ext.lower() in ALLOWED_EXTENSIONS


# App methods


@app.route("/")
def home():
    return render_template("home.html")


@app.route("/upload", methods=["POST"])
@alert_user_and_redirect()
def upload_file() -> tuple[str, str]:
    home_page = url_for("home")

    if "file" not in request.files:
        return home_page, "No file in request"

    file = request.files["file"]

    if not file or file.filename == "":
        return home_page, "No file selected"

    if not is_allowed_file(file.filename):
        return home_page, "Invalid file type"

    file_path = os.path.join(app.config["UPLOAD_FOLDER"], file.filename)
    file.save(file_path)
    return home_page, "Uploaded file successfully"


@app.route("/process_files")
def show_files():
    # Show the files

    # Get files
    files = os.listdir(app.config["UPLOAD_FOLDER"])

    # Add a logo to each one
    file_data: list[dict] = [
        {"name": file, "icon": "excel_logo_closed.webp"} for file in files
    ]
    file_data_json = jsonify(file_data).json

    return render_template("files.html", files_json=file_data_json)


@app.route("/discard_files")
@alert_user_and_redirect()
def discard_session() -> tuple[str, str]:
    global UPLOAD_FOLDER
    home_page = url_for("home")

    # Remove all files from temp folder, start new session
    shutil.rmtree(app.config["UPLOAD_FOLDER"])
    UPLOAD_FOLDER = tempfile.mkdtemp()
    app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

    return home_page, "Session dropped, files removed from temporary folder"


if __name__ == "__main__":
    port = 5000
    app.run(debug=True, port=port)
