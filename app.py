from flask import *
from urllib.parse import quote
import os
import tempfile
import pandas as pd

app = Flask(__name__, static_folder="static", template_folder="templates")

UPLOAD_FOLDER: str = tempfile.mkdtemp()
readers = {
    ".csv": pd.read_csv,
    ".xlsx": pd.read_excel,
}
ALLOWED_EXTENSIONS: set = set(readers.keys())

app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER


# Helper methods
def is_valid_ext(filename: str) -> bool:
    global ALLOWED_EXTENSIONS
    _, ext = os.path.splitext(os.path.basename(filename))  # discard name
    if not ext:
        return False  # No extension isn't valid.

    return ext in ALLOWED_EXTENSIONS


def save_file(file) -> str:
    # Store the file in UPLOAD_FOLDER under a directory of the same as its name.
    # Return path, if failed exception must be handled in caller.
    parent = app.config["UPLOAD_FOLDER"]
    folder_name, _ = os.path.splitext(file.filename)  # discard extension

    # TODO: Handle folders with the same name later
    path = os.path.join(parent, folder_name)
    os.makedirs(path, exist_ok=True)  # Make sure folder structure exists

    file_path = os.path.join(path, file.filename)

    file.save(file_path)
    return file_path


def get_directory(filename) -> str | None:
    global ALLOWED_EXTENSIONS
    filename: str = os.path.basename(filename)
    name_part, ext = os.path.splitext(filename)

    directory = os.path.join(app.config["UPLOAD_FOLDER"], name_part)

    if not os.path.exists(directory):
        return None  # Doesn't exist

    if not ext in ALLOWED_EXTENSIONS:
        return None  # Invalid extension

    return directory


def get_file_path(filename) -> str | None:
    directory = get_directory(filename)
    if not directory:
        return None

    file_path = os.path.join(directory, os.path.basename(filename))

    if not os.path.exists(file_path):
        raise Exception(f"Excel file doesn't exist at {file_path}")

    return file_path


def get_file_filters(filename) -> list[dict]:
    # Read filters JSON
    directory = get_directory(filename)
    if not directory:
        return []  # Empty filters data

    json_path = os.path.join(directory, "filters.json")

    if not os.path.exists(json_path):
        return []  # No filters exists for this file.

    try:
        with open(json_path, "r") as file:
            json_data: list[dict] = json.load(file)
    except json.JSONDecodeError as e:
        raise Exception(f"Failed decoding JSON from {json_path}: {e}")

    # json_data is a list of filters, each filter contains these keys: column, method, input.
    return json_data


def get_file_df(filename) -> pd.DataFrame | None:
    # Return a pandas data frame of the filename stored in the UPLOAD FOLDER
    # run all the filters saved in its folder on it before returning.
    # If filename doesn't exist in UPLOAD FOLDER return None.
    file_path = get_file_path(filename)
    if not file_path:
        return None

    _, ext = os.path.splitext(filename)

    try:
        # Fetch correct reader for this type
        df: pd.DataFrame = readers[ext](file_path)
    except IOError as e:
        raise Exception(f"Failed reading from {file_path}: {e}")

    file_filters: list[dict] = get_file_filters(filename)

    # json_data is a list of filters, each filter contains these keys: column, method, input.
    for filter in file_filters:
        column, method, inp = filter["column"], filter["method"], filter["input"]
        # TODO: filter DF using given parameters
        ...


# Landing page
@app.route("/")
def index():
    return render_template("index.html")


@app.route("/select_file/show")
def show_select_file():
    return render_template("select_file.html")


@app.route("/spreadsheet/show")
def show_spreadsheet():
    return render_template("spreadsheet_view.html")


@app.route("/selected_file", methods=["POST", "GET"])
def selected_file():
    # A method to get data of or update a selected file.

    json_data = request.get_json()
    if not json_data or "filename" in json_data:
        return jsonify({"error": "JSON data doesn't contain file name"}), 500

    selected_file_name = json_data["filename"]

    if request.method == "POST":
        # Update selected file, will be sent from select_file.html
        # TODO: add update_file method, which will rename the file
        return jsonify({"message": "Selected file updated successfully"}), 200
    elif request.method == "GET":
        # Get selected file
        df = get_file_df(selected_file_name)
        if df:
            return send_file(df.to_excel(), as_attachment=True), 200
        else:
            return jsonify({"error": "Selected file not found"}), 404

    else:
        return jsonify("Unsupported method"), 500


@app.route("/select_file/upload_file", methods=["POST"])
def upload_file():
    # Save file given into upload folder.
    files = request.files.values()
    if not files:
        return jsonify({"message": "No files to add were supplied"}), 200

    files = filter(lambda file: is_valid_ext(file.filename), files)

    try:
        for file in files:
            save_file(file)

        return jsonify({"message": "Files saved successfully"}), 200
    except Exception:
        return jsonify({"error": "File saving was unsuccessful"}), 500


@app.route("/spreadsheet/filter", methods=["POST", "GET"])
def filters():
    # Either GET or UPDATE the filters of the given file.

    json_data = request.get_json()
    if not json_data or "filename" in json_data:
        return jsonify({"error": "JSON data doesn't contain file name"}), 500

    selected_file_name = json_data["filename"]

    if request.method == "POST":
        # TODO: implement a set_file_filters method
        ...
    elif request.method == "GET":
        file_filters: list[dict] = get_file_filters(selected_file_name)
        return (
            jsonify({"message": "Filters read successfully", "filters": file_filters}),
            200,
        )
    else:
        jsonify({"error": "Unsupported method"}), 500


@app.route("/spreadsheet/filter/popup", methods=["GET"])
def show_spreadsheet_filter_popup():
    render_template("filter_popup.html")


@app.route("/spreadsheet/upload/test_file")
def test_file():
    try:
        df = pd.read_excel("test_file/test.xlsx")
        return send_file(df.to_excel(), as_attachment=True), 200
    except Exception as e:
        return jsonify({"error": f"Unable to retrieve test file: {e}"}), 500


if __name__ == "__main__":
    port = 5000
    app.run(debug=True, port=port)
