from flask import jsonify, request
from msal import oauth2cli

def validate_id_token(idToken):
    try:
        decodedToken = oauth2cli.oidc.decode_id_token(
            idToken,
            client_id="d935431d-2930-40af-a7c5-50dda0002850",
            issuer="https://login.microsoftonline.com/83918960-2218-4cd3-81fe-302a8e771da9/v2.0"
        )
        #kwargs["id_token_preferred_username"]=decodedToken["preferred_username"]
    except Exception as e:
        if not idToken:
            return "ID Token not provided"
        else:
            return "ID Token not valid"
    return None

# Authorization decorator function
def authorize(api_route):
    def authorized_api_route(*args, **kwargs):
        result = validate_id_token(request.json['IdToken'])
        if result is not None:
            return api_error(f"Failed to validate ID token: {result}")
        return api_route(*args, **kwargs)
    
    authorized_api_route.__name__ = api_route.__name__
    return authorized_api_route

#Response wrappers
def api_error(message):
    return jsonify({
        "error": message
    }), 400

def api_success(message):
    return jsonify({
        "success": message
    }), 200
    
def api_arg_error(arg):
    return api_error(f"Argument {arg} not included in request")

def api_id_error(id, table):
    return api_error(f"{table} table has no record with id {id}")

def api_construct_error(table):
    return api_error(f"Unable to construct a record in the {table} table with the provided arguments.")

def api_confirm_delete(id, table):
    return api_success(f"Deleted record with id {id} from the {table} table.")