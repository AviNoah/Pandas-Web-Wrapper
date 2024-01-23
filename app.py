from flask import *
from urllib.parse import quote
import requests

from io import BytesIO

import os
import tempfile
import pandas as pd

app = Flask(__name__, static_folder="static", template_folder="templates")

UPLOAD_FOLDER: str = tempfile.mkdtemp()
readers = {
    ".csv": pd.read_csv,
    ".xlsx": pd.read_excel,
    ".ods": pd.read_excel,
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
        # df = ...
        ...

    return df


def send_df(
    df: pd.DataFrame, filename: str, sheet_name: str = "Sheet1", error: str = ""
) -> Response:
    try:
        # Save the DataFrame to BytesIO using openpyxl as the engine
        output = BytesIO()
        df.to_excel(output, engine="openpyxl", sheet_name=sheet_name, index=False)
        output.seek(0)  # Move to beginning of file

        filename = os.path.basename(filename)

        response = send_file(
            output,
            as_attachment=False,
            download_name=filename,
            mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )

        return response
    except Exception as e:
        return jsonify({f"{error}": str(e)}), 500


# Landing page
@app.route("/")
def index():
    return render_template("index.html")


@app.route("/select_file/show")
def show_select_file():
    return render_template("select_file/select_file.html")


@app.route("/spreadsheet/show")
def show_spreadsheet():
    return render_template("spreadsheet/spreadsheet_view.html")


@app.route("/file/get", methods=["GET"])
def file_get():
    # A method to get data of or update a selected file.

    if request.method != "GET":
        return jsonify("Unsupported method"), 405

    json_data = request.get_json()
    if not json_data or not "filename" in json_data:
        return jsonify({"error": "JSON data doesn't contain file name"}), 500

    selected_file_name = json_data["filename"]

    # Get selected file
    df = get_file_df(selected_file_name)
    response = send_df(df, selected_file_name, error="Selected file not found")
    return response


@app.route("/file/update", methods=["POST"])
def file_update():
    # A Method to update a file's data

    if request.method != "POST":
        return jsonify("Unsupported method"), 405

    json_data = request.get_json()
    if not json_data or not "filename" in json_data:
        return jsonify({"error": "JSON data doesn't contain file name"}), 500

    selected_file_name = json_data["filename"]

    # TODO: Allow renaming file and updating {excel file's contents} <- check if needing the ability to edit is needed
    return jsonify({"message": "Selected file updated successfully"}), 200


@app.route("/file/upload", methods=["POST"])
def file_upload():
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


@app.route("/filter/get", methods=["GET"])
def filter_get():
    # Get the filters of the selected file.

    if request.method != "GET":
        return jsonify({"error": "Unsupported method"}), 500

    json_data = request.get_json()
    if not json_data or not "filename" in json_data:
        return jsonify({"error": "JSON data doesn't contain file name"}), 500

    selected_file_name = json_data["filename"]
    file_filters: list[dict] = get_file_filters(selected_file_name)
    return (
        jsonify({"message": "Filters read successfully", "filters": file_filters}),
        200,
    )


@app.route("/filter/update", methods=["POST"])
def filter_update():
    # Update the filters of the selected file
    if request.method != "POST":
        return jsonify({"error": "Unsupported method"}), 500

    json_data = request.get_json()
    if not json_data or not "filename" in json_data:
        return jsonify({"error": "JSON data doesn't contain file name"}), 500

    selected_file_name = json_data["filename"]
    # TODO: Add update filter method

    return jsonify({"error": "Method not implemented"}), 500


@app.route("/resources/<path:path>")
def get_resource(path):
    # Serve static files from back-end
    return send_from_directory("static", path)


@app.route("/templates/<path:template>")
def get_template(template):
    # Serve template files from back-end
    return render_template(template)


@app.route("/spreadsheet/upload/test_file")
def test_file():
    try:
        files = ["test.ods", "test.xlsx", "test.csv"]
        file_name = files[2]
        files = {"file": open(f"test_file/{file_name}", "rb")}
        upload_url = "http://127.0.0.1:5000" + url_for("file_upload")
        upload_response = requests.post(upload_url, files=files)
        if not upload_response.ok:
            raise Exception("Saving file failed")

        get_file_url = "http://127.0.0.1:5000" + url_for("file_get")
        data = {"filename": file_name}
        fetch_response = requests.get(get_file_url, json=data)
        if not fetch_response.ok:
            raise Exception("Fetching file failed")

        final_response = Response(fetch_response)
        final_response.headers.add_header("File-Name", file_name)

        return final_response
    except Exception as e:
        return jsonify({"error": f"Failed to load test file: {e}"})


if __name__ == "__main__":
    port = 5000
    app.run(debug=True, port=port)
